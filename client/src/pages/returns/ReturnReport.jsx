import React, { useState, useEffect } from "react";
import returnsApi from "../../api/returnsApi";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const ReturnReport = ({ showToast }) => {
  const [report, setReport] = useState(null);
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    medicine_id: "",
  });
  const [medicines, setMedicines] = useState([]);
  const [error, setError] = useState("");
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
    fetchMedicines();
  }, [user]);

  const fetchMedicines = async () => {
    try {
      const { getAllMedicines } = await import("../../api/medicineApi");
      const data = await getAllMedicines();
      setMedicines(data || []);
    } catch (err) {
      setError("Failed to load medicines: " + (err.message || "Unknown error"));
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    setCurrentPage(1);
    try {
      const cleanedFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== "")
      );
      // Validate and adjust dates
      if (cleanedFilters.start_date && cleanedFilters.end_date) {
        const startDate = new Date(cleanedFilters.start_date);
        const endDate = new Date(cleanedFilters.end_date);
        if (startDate > endDate) {
          throw new Error("Start date cannot be after end date.");
        }
        // Extend end_date to end of day
        endDate.setHours(23, 59, 59, 999);
        cleanedFilters.end_date = endDate.toISOString();
        cleanedFilters.start_date = startDate.toISOString();
      }
      console.log("Filters sent to API:", cleanedFilters);
      const data = await returnsApi.getAllReturns(cleanedFilters);
      if (!Array.isArray(data)) {
        throw new Error("Invalid report data structure");
      }
      if (data.length === 0) {
        setError("No returns found for the selected date range.");
        setReport(null);
        setShowReport(false);
        return false;
      }
      const summary = {
        returnCount: data.length,
        totalQuantity: data.reduce((sum, r) => sum + (r.quantity || 0), 0),
      };
      setReport({ summary, returns: data });
      setShowReport(true);
      showToast("Returns report generated successfully!");
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
    if (!report || !Array.isArray(report.returns)) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 10;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Returns Report", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const medicineName = filters.medicine_id
      ? medicines.find((m) => m.id === filters.medicine_id)?.medicine_name ||
        "Unknown"
      : "All Medicines";
    const dateRange =
      filters.start_date && filters.end_date
        ? `${filters.start_date} to ${filters.end_date}`
        : "All Dates";
    const subtitle = `Medicine: ${medicineName} | Date Range: ${dateRange} | Generated: ${formatEAT(
      new Date()
    )}`;
    doc.text(subtitle, pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Returns Summary", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Return Count: ${report.summary.returnCount || 0}`, 14, y);
    y += 6;
    doc.text(`Total Quantity: ${report.summary.totalQuantity || 0}`, 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Returns Details", 14, y);
    y += 8;

    const tableHeaders = [
      "No.",
      "Product Name",
      "Batch Number",
      "Medicine",
      "Dosage Form",
      "Quantity",
      "Reason",
      "Return Date",
    ];
    const tableData = report.returns.map((returnItem, index) => [
      (index + 1).toString(),
      returnItem.product_name || "N/A",
      returnItem.product_batch_number || "N/A",
      returnItem.medicine?.medicine_name || "N/A",
      returnItem.dosage_form?.name || "N/A",
      returnItem.quantity?.toString() || "0",
      returnItem.reason_for_return || "N/A",
      formatEAT(returnItem.return_date),
    ]);

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
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 15 },
        6: { cellWidth: 30 },
        7: { cellWidth: 20 },
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
      `Returns_Report_${formatEAT(new Date()).replace(/[:,\s]/g, "_")}.pdf`
    );
    showToast("Returns report downloaded successfully!");
  };

  const totalPages = report?.returns
    ? Math.ceil(report.returns.length / itemsPerPage)
    : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReturns = report?.returns
    ? report.returns.slice(startIndex, startIndex + itemsPerPage)
    : [];

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
    if (report?.returns?.length === 0) {
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

  const getReturnStatus = (returnItem) => {
    if (returnItem.quantity <= 0) return "No Quantity";
    const returnDate = new Date(returnItem.return_date);
    const now = new Date();
    const daysSinceReturn = Math.floor(
      (now - returnDate) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceReturn > 30) return "Old Return";
    return "Recent Return";
  };

  const getReturnStatusColor = (returnItem) => {
    const status = getReturnStatus(returnItem);
    if (status === "No Quantity") {
      return theme === "dark" ? "bg-red-800" : "bg-red-100";
    } else if (status === "Old Return") {
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
        Returns Report
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
            Generate Returns Report
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
              placeholder="mm/dd/yyyy"
              className={`w-full p-2 border rounded text-sm placeholder-gray-400 ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                  : "bg-[#F7F7F7] text-black border-gray-300 hover:bg-[#F7F7F7]"
              }`}
              disabled={loading}
              onFocus={(e) => (e.target.placeholder = "")}
              onBlur={(e) => (e.target.placeholder = "mm/dd/yyyy")}
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
              placeholder="mm/dd/yyyy"
              className={`w-full p-2 border rounded text-sm placeholder-gray-400 ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                  : "bg-[#F7F7F7] text-black border-gray-300 hover:bg-[#F7F7F7]"
              }`}
              disabled={loading}
              onFocus={(e) => (e.target.placeholder = "")}
              onBlur={(e) => (e.target.placeholder = "mm/dd/yyyy")}
            />
          </div>
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            >
              Medicine
            </label>
            <select
              name="medicine_id"
              value={filters.medicine_id}
              onChange={handleFilterChange}
              className={`w-full p-2 border rounded text-sm ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                  : "bg-[#F7F7F7] text-black border-gray-300 hover:bg-[#F7F7F7]"
              }`}
              disabled={loading}
            >
              <option value="">All Medicines</option>
              {medicines.map((med) => (
                <option key={med.id} value={med.id}>
                  {med.medicine_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {!loading && !error && !showReport && (
        <div className="text-center mb-4 text-sm sm:text-base">
          No returns report generated yet. Please click "Apply Filters".
        </div>
      )}

      {showReport && report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-orange-900" : "bg-orange-200"
              }`}
              style={{
                backgroundColor: theme === "dark" ? "#DD6B20" : "#FBD38D",
              }}
            >
              <div className="flex items-center mb-2">
                <span className="text-blue-500 mr-3 text-xl">⏰</span>
                <h3 className="text-base sm:text-lg font-semibold">
                  Return Count
                </h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold">
                {report.summary.returnCount || 0}
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
                <span className="text-blue-500 mr-3 text-xl">💵</span>
                <h3 className="text-base sm:text-lg font-semibold">
                  Total Quantity
                </h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold">
                {report.summary.totalQuantity || 0}
              </p>
            </div>
          </div>

          {currentReturns.length > 0 ? (
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
                  Returns List
                </h3>
                <button
                  onClick={downloadReport}
                  className={`bg-[#10B981] text-white px-4 py-2 rounded hover:bg-[#0E8C6A] disabled:bg-[#A52A2A] disabled:opacity-50 text-base sm:text-lg ${
                    loading ? "opacity-50" : ""
                  } w-full sm:w-auto`}
                  disabled={!report || report.returns.length === 0 || loading}
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
                        Product Name
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5] hidden sm:table-cell">
                        Batch Number
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
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5] max-w-[120px] sm:max-w-[150px]">
                        Reason
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5]">
                        Return Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentReturns.map((returnItem, index) => (
                      <tr
                        key={returnItem.id}
                        className={`border-b ${getReturnStatusColor(
                          returnItem
                        )}`}
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
                          {returnItem.product_name || "N/A"}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal hidden sm:table-cell ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {returnItem.product_batch_number || "N/A"}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal max-w-[120px] sm:max-w-[150px] truncate ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {returnItem.medicine?.medicine_name || "N/A"}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {returnItem.dosage_form?.name || "N/A"}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {returnItem.quantity || 0}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal max-w-[120px] sm:max-w-[150px] truncate ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {returnItem.reason_for_return || "N/A"}
                        </td>
                        <td
                          className={`border p-2 whitespace-normal ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {formatEAT(returnItem.return_date)}
                        </td>
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
              {report.message || "No returns found"}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReturnReport;
