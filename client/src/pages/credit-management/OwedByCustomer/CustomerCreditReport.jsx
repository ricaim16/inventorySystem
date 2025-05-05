import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAllCustomers, getCreditReport } from "../../../api/customerApi";
import { jwtDecode } from "jwt-decode";
import { useTheme } from "../../../context/ThemeContext";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const CustomerCreditReport = ({ showToast = (msg) => console.log(msg) }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const customerIdFromUrl = queryParams.get("customerId");

  const [credits, setCredits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    customerIdFromUrl || ""
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [report, setReport] = useState(null);
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    customer_id: customerIdFromUrl || "",
    limit: 10,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const formatEAT = useCallback((date) => {
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
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found. Please log in.");
      navigate("/login");
      return;
    }
    try {
      const decoded = jwtDecode(token);
      setUserRole(decoded.role.toUpperCase());
    } catch (err) {
      setError("Invalid token format. Please log in again.");
      navigate("/login");
      return;
    }
    fetchCustomers();
  }, [navigate]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllCustomers();
      setCustomers(data || []);
    } catch (err) {
      setError("Failed to fetch customers: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditReport = async () => {
    setLoading(true);
    setError("");
    setCurrentPage(1);
    try {
      const cleanedFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== "")
      );
      const reportData = await getCreditReport({
        ...cleanedFilters,
        customer_id: selectedCustomerId || undefined,
        offset: (currentPage - 1) * filters.limit,
        limit: filters.limit,
      });
      if (!reportData.credits || !Array.isArray(reportData.credits)) {
        throw new Error("Invalid report data structure");
      }
      // Sort credits by credit_date in descending order
      const sortedCredits = [...reportData.credits].sort(
        (a, b) => new Date(b.credit_date) - new Date(a.credit_date)
      );
      setReport(reportData);
      setCredits(sortedCredits);
      setShowReport(true);
      showToast("Credit report generated successfully!");
      return true;
    } catch (err) {
      console.error(
        "Credit report error:",
        err.response?.data,
        err.response?.status,
        err.message
      );
      setError(
        `Failed to fetch credit report: ${
          err.response?.data?.message || err.message
        }`
      );
      setReport(null);
      setCredits([]);
      setShowReport(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    setSelectedCustomerId(customerId);
    setFilters((prev) => ({
      ...prev,
      customer_id: customerId,
    }));
    setReport(null);
    setCredits([]);
    setShowReport(false);
  };

  const handleFilterSubmit = async (e) => {
    e.preventDefault();
    await fetchCreditReport();
  };

  const handleDownloadPDF = () => {
    if (!report || !Array.isArray(credits)) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 10;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Customer Credit Report", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const customerName = selectedCustomerId
      ? customers.find((c) => c.id === selectedCustomerId)?.name || "Unknown"
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
    doc.text("Credit Summary", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Credit Count: ${credits.length || 0}`, 14, y);
    y += 6;
    doc.text(`Total Credit: ETB ${totalCreditAmount.toFixed(2) || 0}`, 14, y);
    y += 6;
    doc.text(`Total Paid: ETB ${totalPaidAmount.toFixed(2) || 0}`, 14, y);
    y += 6;
    doc.text(`Total Unpaid: ETB ${totalUnpaidAmount.toFixed(2) || 0}`, 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Credit Details", 14, y);
    y += 8;

    const tableHeaders = [
      "No.",
      "Customer",
      "Credit Amount",
      "Paid Amount",
      "Unpaid Amount",
      "Medicine",
      "Payment Method",
      "Description",
      "Status",
      "Date",
      ...(userRole === "MANAGER" ? ["Created By", "Updated By"] : []),
    ];

    // Sort credits again for PDF (in case state changes)
    const sortedCredits = [...credits].sort(
      (a, b) => new Date(b.credit_date) - new Date(a.credit_date)
    );

    const tableData = sortedCredits.map((cred, index) => [
      (index + 1).toString(),
      cred.customer?.name || "N/A",
      parseFloat(cred.credit_amount || 0).toFixed(2),
      parseFloat(cred.paid_amount || 0).toFixed(2),
      parseFloat(cred.unpaid_amount || 0).toFixed(2),
      cred.medicine_name || "N/A",
      cred.payment_method || "N/A",
      cred.description || "N/A",
      cred.status || "N/A",
      formatEAT(cred.credit_date),
      ...(userRole === "MANAGER"
        ? [cred.createdBy?.username || "N/A", cred.updatedBy?.username || "N/A"]
        : []),
    ]);

    // Calculate total columns and adjust widths dynamically
    const totalColumns = tableHeaders.length;
    const pageWidthForTable = pageWidth - 28; // 14mm margin on each side
    const baseWidth = pageWidthForTable / totalColumns;

    const columnStyles = {};
    tableHeaders.forEach((_, index) => {
      if (index === 0)
        columnStyles[index] = { cellWidth: baseWidth * 0.5 }; // No.
      else if (index === 1)
        columnStyles[index] = { cellWidth: baseWidth * 1.2 }; // Customer
      else if (index === 2)
        columnStyles[index] = { cellWidth: baseWidth * 0.8 }; // Credit Amount
      else if (index === 3)
        columnStyles[index] = { cellWidth: baseWidth * 0.8 }; // Paid Amount
      else if (index === 4)
        columnStyles[index] = { cellWidth: baseWidth * 0.8 }; // Unpaid Amount
      else if (index === 5)
        columnStyles[index] = { cellWidth: baseWidth * 1.0 }; // Medicine
      else if (index === 6)
        columnStyles[index] = { cellWidth: baseWidth * 1.0 }; // Payment Method
      else if (index === 7)
        columnStyles[index] = { cellWidth: baseWidth * 1.2 }; // Description
      else if (index === 8)
        columnStyles[index] = { cellWidth: baseWidth * 0.7 }; // Status
      else if (index === 9)
        columnStyles[index] = { cellWidth: baseWidth * 1.0 }; // Date
      else if (index === 10)
        columnStyles[index] = { cellWidth: baseWidth * 0.9 }; // Created By
      else if (index === 11)
        columnStyles[index] = { cellWidth: baseWidth * 0.9 }; // Updated By
    });

    autoTable(doc, {
      startY: y,
      head: [tableHeaders],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [0, 128, 128],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [0, 0, 0],
        overflow: "linebreak", // Wrap text if too long
      },
      columnStyles: columnStyles,
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
      `Customer_Credit_Report_${formatEAT(new Date()).replace(
        /[:,\s]/g,
        "_"
      )}.pdf`
    );
    showToast("Credit report downloaded successfully!");
  };

  const totalCreditAmount = credits.reduce(
    (sum, cred) => sum + (parseFloat(cred.credit_amount) || 0),
    0
  );
  const totalPaidAmount = credits.reduce(
    (sum, cred) => sum + (parseFloat(cred.paid_amount) || 0),
    0
  );
  const totalUnpaidAmount = credits.reduce(
    (sum, cred) => sum + (parseFloat(cred.unpaid_amount) || 0),
    0
  );

  const filteredCustomers = customers.filter((customer) =>
    customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = report?.summary?.totalRecords
    ? Math.ceil(report.summary.totalRecords / filters.limit)
    : 0;
  const startIndex = (currentPage - 1) * filters.limit;
  const currentCredits = credits.slice(startIndex, startIndex + filters.limit);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
    if (credits.length === 0) {
      setCurrentPage(1);
    }
  }, [credits, totalPages, currentPage]);

  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div
      className={`p-4 sm:p-6 max-w-full mx-auto ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-[#F7F7F7] text-black"
      } min-h-screen`}
    >
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">
        Customer Credit Report
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
          <span className="text-center sm:text-left text-sm">{error}</span>
          <button
            onClick={fetchCreditReport}
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
            Generate Credit Report
          </h3>
          <button
            type="submit"
            className={`bg-[#10B981] text-white px-4 py-2 rounded hover:bg-[#0ea271] disabled:bg-[#0ea271] disabled:opacity-50 ${
              loading ? "opacity-50" : ""
            } w-full sm:w-auto`}
            disabled={loading}
          >
            Apply Filters
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            >
              Customer
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers..."
              className={`w-full p-2 border rounded text-sm ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                  : "bg-[#F7F7F7] text-black border-gray-300 hover:bg-[#F7F7F7]"
              }`}
              disabled={loading}
            />
            <select
              value={selectedCustomerId}
              onChange={handleCustomerChange}
              className={`mt-2 w-full p-2 border rounded text-sm ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                  : "bg-[#F7F7F7] text-black border-gray-300 hover:bg-[#F7F7F7]"
              }`}
              disabled={loading || customers.length === 0}
            >
              <option value="">All Customers</option>
              {filteredCustomers.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name}
                </option>
              ))}
            </select>
          </div>
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
        </div>
      </form>

      {!loading && !error && !showReport && (
        <div className="text-center mb-4 text-sm sm:text-base">
          No credit report generated yet. Please select filters and click "Apply
          Filters".
        </div>
      )}

      {showReport && report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-yellow-900" : "bg-yellow-200"
              }`}
            >
              <div className="flex items-center mb-2">
                <span className="text-yellow-500 mr-3">⚠️</span>
                <h3
                  className={`text-base sm:text-lg font-semibold ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                >
                  Credit Count
                </h3>
              </div>
              <p
                className={`text-xl sm:text-2xl font-bold ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                {credits.length || 0}
              </p>
            </div>
            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-blue-900" : "bg-blue-200"
              }`}
            >
              <div className="flex items-center mb-2">
                <span className="text-blue-500 mr-3 text-xl">💵</span>
                <h3
                  className={`text-base sm:text-lg font-semibold ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                >
                  Total Credit
                </h3>
              </div>
              <p
                className={`text-xl sm:text-2xl font-bold ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                ETB {totalCreditAmount.toFixed(2) || 0}
              </p>
            </div>
            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-red-900" : "bg-red-200"
              }`}
            >
              <div className="flex items-center mb-2">
                <span className="text-red-500 mr-3 text-xl">⚠️</span>
                <h3
                  className={`text-base sm:text-lg font-semibold ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                >
                  Total Unpaid
                </h3>
              </div>
              <p
                className={`text-xl sm:text-2xl font-bold ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                ETB {totalUnpaidAmount.toFixed(2) || 0}
              </p>
            </div>
          </div>

          {currentCredits.length > 0 ? (
            <div
              className={`mb-6 p-4 rounded-lg ${
                theme === "dark" ? "bg-gray-900" : "bg-[#F7F7F7]"
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <h3
                  className={`text-lg sm:text-xl font-semibold mb-2 sm:mb-0 ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                >
                  Credit List
                </h3>
                <button
                  onClick={handleDownloadPDF}
                  className={`bg-[#10B981] text-white px-4 py-2 rounded hover:bg-[#0ea271] disabled:bg-[#0ea271] disabled:opacity-50 ${
                    loading ? "opacity-50" : ""
                  } w-full sm:w-auto`}
                  disabled={!report || credits.length === 0 || loading}
                >
                  Download Report
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[0.65rem] sm:text-xs md:text-sm min-w-fit">
                  <thead>
                    <tr
                      className={`${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-200 border-gray-300"
                      }`}
                    >
                      <th
                        className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        No.
                      </th>
                      <th
                        className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Customer
                      </th>
                      <th
                        className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Credit Amount
                      </th>
                      <th
                        className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Paid Amount
                      </th>
                      <th
                        className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Unpaid Amount
                      </th>
                      <th
                        className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Medicine
                      </th>
                      <th
                        className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Payment Method
                      </th>
                      <th
                        className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Description
                      </th>
                      <th
                        className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Status
                      </th>
                      <th
                        className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Date
                      </th>
                      {userRole === "MANAGER" && (
                        <th
                          className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                            theme === "dark" ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          Created By
                        </th>
                      )}
                      {userRole === "MANAGER" && (
                        <th
                          className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                            theme === "dark" ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          Updated By
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {currentCredits.map((cred, index) => (
                      <tr
                        key={cred.id}
                        className={`border-b ${
                          theme === "dark"
                            ? "border-gray-600"
                            : "border-gray-300"
                        } hover:bg-gray-100`}
                      >
                        <td
                          className={`border p-1 sm:p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {startIndex + index + 1}
                        </td>
                        <td
                          className={`border p-1 sm:p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {cred.customer?.name || "N/A"}
                        </td>
                        <td
                          className={`border p-1 sm:p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {parseFloat(cred.credit_amount || 0).toFixed(2)}
                        </td>
                        <td
                          className={`border p-1 sm:p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {parseFloat(cred.paid_amount || 0).toFixed(2)}
                        </td>
                        <td
                          className={`border p-1 sm:p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {parseFloat(cred.unpaid_amount || 0).toFixed(2)}
                        </td>
                        <td
                          className={`border p-1 sm:p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {cred.medicine_name || "N/A"}
                        </td>
                        <td
                          className={`border p-1 sm:p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {cred.payment_method || "N/A"}
                        </td>
                        <td
                          className={`border p-1 sm:p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {cred.description || "N/A"}
                        </td>
                        <td
                          className={`border p-1 sm:p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          } ${
                            cred.status === "UNPAID"
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {cred.status || "N/A"}
                        </td>
                        <td
                          className={`border p-1 sm:p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {formatEAT(cred.credit_date)}
                        </td>
                        {userRole === "MANAGER" && (
                          <td
                            className={`border p-1 sm:p-2 ${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-600"
                            }`}
                          >
                            {cred.createdBy?.username || "N/A"}
                          </td>
                        )}
                        {userRole === "MANAGER" && (
                          <td
                            className={`border p-1 sm:p-2 ${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-600"
                            }`}
                          >
                            {cred.updatedBy?.username || "N/A"}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 0 && (
                <div className="mt-4 flex justify-center items-center space-x-1 flex-wrap gap-1">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`px-2 py-1 border rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm ${
                      theme === "dark" ? "bg-gray-800" : "bg-white"
                    }`}
                  >
                    <FiChevronLeft size={14} />
                  </button>
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded text-xs sm:text-sm ${
                        currentPage === page
                          ? "bg-[#8B1E1E] text-white"
                          : theme === "dark"
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`px-2 py-1 border rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm ${
                      theme === "dark" ? "bg-gray-800" : "bg-white"
                    }`}
                  >
                    <FiChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center mb-4 text-sm sm:text-base">
              No credits found for the selected filters.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomerCreditReport;
