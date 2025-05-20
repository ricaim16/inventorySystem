import { useState, useEffect } from "react";
import { generateSalesReport } from "../../api/salesApi";
import { getAllCustomers } from "../../api/customerApi";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { ArchiveBoxIcon, ChartBarIcon } from "@heroicons/react/24/outline";

const SalesReport = () => {
  const [report, setReport] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    customer_id: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const { user } = useAuth();
  const { theme } = useTheme();

  const formatEAT = (date) => {
    try {
      return new Date(date).toLocaleString("en-US", {
        timeZone: "Africa/Addis_Ababa",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (err) {
      return "Invalid Date";
    }
  };

  useEffect(() => {
    if (!user) {
      setError("Please log in to view reports.");
      return;
    }
    fetchCustomers();
  }, [user]);

  const fetchCustomers = async () => {
    try {
      const data = await getAllCustomers();
      setCustomers(data || []);
    } catch (err) {
      setError("Failed to load customers: " + (err.message || "Unknown error"));
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    try {
      const cleanedFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== "")
      );
      if (cleanedFilters.start_date && cleanedFilters.end_date) {
        const startDate = new Date(cleanedFilters.start_date);
        const endDate = new Date(cleanedFilters.end_date);
        if (startDate > endDate) {
          throw new Error("Start date cannot be after end date.");
        }
        endDate.setHours(23, 59, 59, 999);
        cleanedFilters.end_date = endDate.toISOString();
        cleanedFilters.start_date = startDate.toISOString();
      }
      console.log("Filters sent to API:", cleanedFilters);
      const data = await generateSalesReport(cleanedFilters);
      console.log("API Response:", data);
      if (!data || !data.summary || !Array.isArray(data.sales)) {
        throw new Error("Invalid report data structure");
      }
      if (data.sales.length === 0) {
        setError("No sales found for the selected date range.");
        setReport(null);
        setShowReport(false);
        return false;
      }
      setReport(data);
      setShowReport(true);
      return true;
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch report: " + err.message
      );
      setReport(null);
      setShowReport(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = async (e) => {
    e.preventDefault();
    await fetchReport();
  };

  const downloadReport = () => {
    if (!report || !Array.isArray(report.sales)) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 10;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Sales Report", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const customerName = filters.customer_id
      ? customers.find((c) => c.id === filters.customer_id)?.name || "Unknown"
      : "All Customers";
    const dateRange =
      filters.start_date && filters.end_date
        ? `${filters.start_date} to ${filters.end_date}`
        : "All Dates";
    const subtitle = `Customer: ${customerName} | Date Range: ${dateRange} | Generated: ${formatEAT(
      new Date()
    )}`;
    doc.text(subtitle, pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Sales Summary", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Sales Count: ${report.summary.salesCount || 0}`, 14, y);
    y += 6;
    doc.text(`Total Sales: ${report.summary.totalSales || 0} ETB`, 14, y);
    y += 6;
    doc.text(`Total Quantity: ${report.summary.totalQuantity || 0}`, 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Sales Details", 14, y);
    y += 8;

    const tableHeaders = [
      "No.",
      "Customer",
      "Medicine",
      "Dosage Form",
      "Quantity",
      "Price",
      "Total",
      "Payment",
      "Prescription",
      "Product Name",
      "Batch No",
      "Sale Date",
      "Updated At",
    ];
    if (user?.role.toUpperCase() === "MANAGER") {
      tableHeaders.push("Created By", "Updated By");
    }

    const tableData = report.sales.map((sale, index) => {
      const row = [
        (index + 1).toString(),
        sale.customer?.name || "N/A",
        sale.medicine?.medicine_name || "Unknown",
        sale.dosage_form?.name || "N/A",
        sale.quantity?.toString() || "0",
        sale.price?.toString() || "0",
        sale.total_amount?.toString() || "0",
        sale.payment_method || "N/A",
        sale.prescription ? "Yes" : "No",
        sale.product_name || "N/A",
        sale.product_batch_number || "N/A",
        formatEAT(sale.sealed_date),
        formatEAT(sale.updated_at),
      ];
      if (user?.role.toUpperCase() === "MANAGER") {
        row.push(sale.createdBy?.username || "N/A");
        row.push(sale.updatedBy?.username || "N/A");
      }
      return row;
    });

    autoTable(doc, {
      startY: y,
      head: [tableHeaders],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [0, 128, 128],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 2,
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 15 },
        4: { cellWidth: 12 },
        5: { cellWidth: 12 },
        6: { cellWidth: 12 },
        7: { cellWidth: 15 },
        8: { cellWidth: 15 },
        9: { cellWidth: 20 },
        10: { cellWidth: 15 },
        11: { cellWidth: 15 },
        12: { cellWidth: 15 },
        13: { cellWidth: 15 },
        14: { cellWidth: 15 },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(8);
        doc.text(
          `Page ${currentPage} of ${pageCount}`,
          pageWidth - 20,
          doc.internal.pageSize.getHeight() - 10,
          { align: "right" }
        );
      },
    });

    doc.save(
      `Sales_Report_${formatEAT(new Date()).replace(/[:,\s]/g, "_")}.pdf`
    );
  };

  const totalPages = report?.sales
    ? Math.ceil(report.sales.length / itemsPerPage)
    : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSales = report?.sales
    ? report.sales.slice(startIndex, startIndex + itemsPerPage)
    : [];

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
    if (report?.sales?.length === 0) {
      setCurrentPage(1);
    }
  }, [report, totalPages, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (totalPages === 0) {
      return [1];
    }

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const getSaleStatus = (sale) => {
    if (sale.quantity <= 0) return "Out of Stock";
    const saleDate = new Date(sale.sealed_date);
    const now = new Date();
    const daysSinceSale = Math.floor((now - saleDate) / (1000 * 60 * 60 * 24));
    if (daysSinceSale > 30) return "Old Sale";
    return "Recent Sale";
  };

  const getSaleStatusColor = (sale) => {
    const status = getSaleStatus(sale);
    if (status === "Out of Stock") {
      return theme === "dark" ? "bg-red-800" : "bg-red-100";
    } else if (status === "Old Sale") {
      return theme === "dark" ? "bg-yellow-800" : "bg-yellow-100";
    } else {
      return theme === "dark" ? "bg-gray-800" : "bg-white";
    }
  };

  return (
    <div
      className={`p-4 sm:p-6 max-w-full mx-auto ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-[#F7F7F7] text-black"
      } min-h-screen overflow-x-auto`}
    >
      <h2
        className={`text-2xl sm:text-3xl font-semibold font-sans mb-4 ${
          theme === "dark" ? "text-gray-100" : "text-gray-900"
        }`}
      >
        Sales Report
      </h2>

      {loading && (
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div
          className={`border px-4 py-3 rounded mb-4 flex flex-col sm:flex-row items-center justify-between ${
            theme === "dark"
              ? "bg-red-900 border-red-700 text-red-200"
              : "bg-red-100 border-red-400 text-red-700"
          }`}
        >
          <span className="text-center sm:text-left">{error}</span>
          <button
            onClick={fetchReport}
            className={`mt-2 sm:mt-0 px-3 py-1 rounded text-white text-sm ${
              theme === "dark"
                ? "bg-blue-700 hover:bg-blue-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            Retry
          </button>
        </div>
      )}

      <form
        onSubmit={handleFilterSubmit}
        className={`mb-6 p-4 rounded-lg shadow ${
          theme === "dark" ? "bg-gray-800" : "bg-[#F7F7F7]"
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0">
            Generate Sales Report
          </h3>
          <button
            type="submit"
            className={`bg-[#10B981] text-white px-4 py-2 rounded hover:bg-[#0E8C6A] disabled:bg-[#A52A2A] disabled:opacity-50 text-base sm:text-lg ${
              loading ? "opacity-50" : ""
            } w-full sm:w-auto`}
            disabled={loading}
          >
            Apply Filters
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            >
              Start Date
            </label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className={`w-full p-2 border rounded text-sm ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                  : "bg-[#F7F7F7] text-black border-gray-300 hover:bg-[#F7F7F7]"
              }`}
              disabled={loading}
            />
          </div>
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            >
              End Date
            </label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className={`w-full p-2 border rounded text-sm ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                  : "bg-[#F7F7F7] text-black border-gray-300 hover:bg-[#F7F7F7]"
              }`}
              disabled={loading}
            />
          </div>
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            >
              Customer
            </label>
            <select
              name="customer_id"
              value={filters.customer_id}
              onChange={handleFilterChange}
              className={`w-full p-2 border rounded text-sm ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                  : "bg-[#F7F7F7] text-black border-gray-300 hover:bg-[#F7F7F7]"
              }`}
              disabled={loading}
            >
              <option value="">All Customers</option>
              {customers.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {!loading && !error && !showReport && (
        <div className="text-center mb-4 text-sm sm:text-base">
          No sales report generated yet. Please click "Apply Filters".
        </div>
      )}

      {showReport && report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-orange-900" : "bg-orange-200"
              }`}
              style={{
                backgroundColor: theme === "dark" ? "#18a8a9" : "#18a8a9",
              }}
            >
              <div className="flex items-center mb-2">
                <span className="h-6 w-6 text-white mr-3 text-xl">💵</span>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  Total Sales
                </h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {report.summary.totalSales || 0} ETB
              </p>
            </div>
            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-blue-900" : "bg-blue-200"
              }`}
              style={{
                backgroundColor: theme === "dark" ? "#1E3A8A" : "#93C5FD",
              }}
            >
              <div className="flex items-center mb-2">
                <ArchiveBoxIcon className="h-6 w-6 text-white mr-3" />
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  Total Quantity
                </h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {report.summary.totalQuantity || 0}
              </p>
            </div>
            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-green-900" : "bg-green-200"
              }`}
              style={{
                backgroundColor: theme === "dark" ? "#064e3b" : "#10B981",
              }}
            >
              <div className="flex items-center mb-2">
                <ChartBarIcon className="h-6 w-6 text-white mr-3" />
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  Sales Count
                </h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {report.summary.salesCount || 0}
              </p>
            </div>
          </div>

          {currentSales.length > 0 ? (
            <div
              className={`mb-6 p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-gray-900" : "bg-[#F7F7F7]"
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <h3
                  className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-0"
                  style={{ color: "#10B981" }}
                >
                  Sales List
                </h3>
                <button
                  onClick={downloadReport}
                  className={`bg-[#10B981] text-white px-4 py-2 rounded hover:bg-[#0E8C6A] disabled:bg-[#A52A2A] disabled:opacity-50 text-base sm:text-lg ${
                    loading ? "opacity-50" : ""
                  } w-full sm:w-auto`}
                  disabled={!report || report.sales.length === 0 || loading}
                >
                  Download Report
                </button>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#5DB5B5] text-white">
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5]">
                        No.
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5] max-w-[120px] sm:max-w-[150px]">
                        Customer
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5] max-w-[120px] sm:max-w-[150px]">
                        Medicine
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5]">
                        Dosage Form
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5]">
                        Quantity
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5]">
                        Price
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5]">
                        Total Amount
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5]">
                        Payment
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5]">
                        Prescription
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5] max-w-[120px] sm:max-w-[150px]">
                        Product Name
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5] hidden sm:table-cell">
                        Batch No
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5]">
                        Sale Date
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5]">
                        Updated At
                      </th>
                      {user?.role.toUpperCase() === "MANAGER" && (
                        <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5] hidden sm:table-cell">
                          Created By
                        </th>
                      )}
                      {user?.role.toUpperCase() === "MANAGER" && (
                        <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5] hidden sm:table-cell">
                          Updated By
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {currentSales.map((sale, index) => (
                      <tr
                        key={sale.id}
                        className={`border-b ${getSaleStatusColor(sale)}`}
                      >
                        <td
                          className={`border p-2 whitespace-normal ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {startIndex + index + 1}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal max-w-[120px] sm:max-w-[150px] truncate ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {sale.customer?.name || "N/A"}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal max-w-[120px] sm:max-w-[150px] truncate ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {sale.medicine?.medicine_name || "Unknown"}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {sale.dosage_form?.name || "N/A"}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {sale.quantity || 0}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {sale.price || 0}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {sale.total_amount || 0}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {sale.payment_method || "N/A"}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {sale.prescription ? "Yes" : "No"}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal max-w-[120px] sm:max-w-[150px] truncate ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {sale.product_name || "N/A"}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal hidden sm:table-cell ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {sale.product_batch_number || "N/A"}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {formatEAT(sale.sealed_date)}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {formatEAT(sale.updated_at)}
                        </td>
                        {user?.role.toUpperCase() === "MANAGER" && (
                          <td
                            className={`border p-2 whitespace-normal hidden sm:table-cell ${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-600"
                            }`}
                          >
                            {sale.createdBy?.username || "N/A"}
                          </td>
                        )}
                        {user?.role.toUpperCase() === "MANAGER" && (
                          <td
                            className={`border p-2 whitespace-normal hidden sm:table-cell ${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-600"
                            }`}
                          >
                            {sale.updatedBy?.username || "N/A"}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 0 && (
                <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-1.5 rounded-md transition-colors duration-200 text-sm sm:text-base ${
                      theme === "dark"
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => handlePageChange(page)}
                      className={`px-2 sm:px-3 py-1 rounded-md font-medium text-sm sm:text-base transition-colors duration-200 ${
                        currentPage === page
                          ? "bg-teal-600 text-white"
                          : theme === "dark"
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-1.5 rounded-md transition-colors duration-200 text-sm sm:text-base ${
                      theme === "dark"
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center mb-4 text-sm sm:text-base">
              {report.message || "No sales found"}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SalesReport;
