import React, { useState, useEffect, useCallback } from "react";
import { getAllSuppliers, getCreditReport } from "../../api/supplierApi";
import { jwtDecode } from "jwt-decode";
import { useTheme } from "../../context/ThemeContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const SupplierReport = ({ showToast }) => {
  const { theme } = useTheme();
  const [credits, setCredits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [report, setReport] = useState(null);
  const [reportFilters, setReportFilters] = useState({
    start_date: "",
    end_date: "",
    limit: 100,
    offset: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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
      return;
    }
    try {
      const decoded = jwtDecode(token);
      setUserRole(decoded.role.toUpperCase());
    } catch (err) {
      setError("Invalid token format. Please log in again.");
      return;
    }
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSuppliers();
      setSuppliers(data || []);
    } catch (err) {
      setError("Failed to fetch suppliers: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditReport = async () => {
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    try {
      const cleanedFilters = Object.fromEntries(
        Object.entries(reportFilters).filter(([_, v]) => v !== "")
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
      cleanedFilters.supplier_id = selectedSupplierId || undefined;
      const reportData = await getCreditReport(cleanedFilters);
      if (!reportData.credits || !Array.isArray(reportData.credits)) {
        throw new Error("Invalid credit report data structure");
      }
      if (reportData.credits.length === 0) {
        setError("No credits found for the selected filters.");
        setReport(null);
        setCredits([]);
        return false;
      }
      const summary = {
        creditCount: reportData.credits.length,
        totalCreditAmount: reportData.credits.reduce(
          (sum, cred) => sum + (parseFloat(cred.credit_amount) || 0),
          0
        ),
        totalPaidAmount: reportData.credits.reduce(
          (sum, cred) => sum + (parseFloat(cred.paid_amount) || 0),
          0
        ),
        totalUnpaidAmount: reportData.credits.reduce(
          (sum, cred) => sum + (parseFloat(cred.unpaid_amount) || 0),
          0
        ),
      };
      setReport({
        summary,
        credits: reportData.credits,
        generatedAt: new Date(),
      });
      setCredits(reportData.credits);
      showToast("Credit report generated successfully!");
      return true;
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "Credit report endpoint not found on server."
          : err.response?.data?.message ||
              "Failed to fetch credit report: " + err.message
      );
      setReport(null);
      setCredits([]);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleReportFilterChange = (e) => {
    const { name, value } = e.target;
    setReportFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSupplierChange = (id) => {
    setSelectedSupplierId(id);
    setIsDropdownOpen(false);
  };

  const handleSubmitFilters = (e) => {
    e.preventDefault();
    fetchCreditReport();
  };

  const handleDownloadPDF = () => {
    if (!report || !report.credits) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 10;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Supplier Credit Report", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const supplierName = selectedSupplierId
      ? suppliers.find((s) => s.id === selectedSupplierId)?.supplier_name ||
        "Unknown"
      : "All Suppliers";
    const dateRange =
      reportFilters.start_date && reportFilters.end_date
        ? `${reportFilters.start_date} to ${reportFilters.end_date}`
        : "All Dates";
    const subtitle = `Supplier: ${supplierName} | Date Range: ${dateRange} | Generated: ${formatEAT(
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
    doc.text(`Credit Count: ${report.summary.creditCount || 0}`, 14, y);
    y += 6;
    doc.text(
      `Total Credit Amount: ETB ${
        report.summary.totalCreditAmount.toFixed(2) || 0
      }`,
      14,
      y
    );
    y += 6;
    doc.text(
      `Total Paid Amount: ETB ${
        report.summary.totalPaidAmount.toFixed(2) || 0
      }`,
      14,
      y
    );
    y += 6;
    doc.text(
      `Total Unpaid Amount: ETB ${
        report.summary.totalUnpaidAmount.toFixed(2) || 0
      }`,
      14,
      y
    );
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Credit Details", 14, y);
    y += 8;

    const tableHeaders = [
      "No.",
      "Supplier Name",
      "Total Credit",
      "Paid Amount",
      "Unpaid Amount",
      "Status",
      ...(userRole === "MANAGER" ? ["Created By", "Updated By"] : []),
    ];
    const tableData = report.credits.map((cred, index) => [
      (index + 1).toString(),
      cred.supplier?.supplier_name || "N/A",
      parseFloat(cred.credit_amount || 0).toFixed(2),
      parseFloat(cred.paid_amount || 0).toFixed(2),
      parseFloat(cred.unpaid_amount || 0).toFixed(2),
      cred.payment_status || "N/A",
      ...(userRole === "MANAGER"
        ? [cred.createdBy?.username || "N/A", cred.updatedBy?.username || "N/A"]
        : []),
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
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        ...(userRole === "MANAGER"
          ? { 6: { cellWidth: 20 }, 7: { cellWidth: 20 } }
          : {}),
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
      `Supplier_Credit_Report_${formatEAT(new Date()).replace(
        /[:,\s]/g,
        "_"
      )}.pdf`
    );
    showToast("Supplier credit report downloaded successfully!");
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier?.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = report?.credits
    ? Math.ceil(report.credits.length / itemsPerPage)
    : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCredits = report?.credits
    ? report.credits.slice(startIndex, startIndex + itemsPerPage)
    : [];

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
    if (report?.credits?.length === 0) {
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

  const getCreditStatusColor = (credit) => {
    if (credit.payment_status === "UNPAID") {
      return theme === "dark" ? "bg-red-800" : "bg-red-100";
    } else if (credit.payment_status === "PAID") {
      return theme === "dark" ? "bg-green-800" : "bg-green-100";
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
        style={{ color: "#10B981" }}
      >
        Supplier Credit Report
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
        onSubmit={handleSubmitFilters}
        className={`mb-6 p-4 rounded-lg shadow ${
          theme === "dark" ? "bg-gray-800" : "bg-[#F7F7F7]"
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <h3
            className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0"
            style={{ color: "#10B981" }}
          >
            Generate Credit Report
          </h3>
          <button
            type="submit"
            className={`bg-[#10B981] text-white px-4 py-2 rounded hover:bg-[#0E8C6A] disabled:bg-gray-500 disabled:opacity-50 text-base sm:text-lg ${
              loading ? "opacity-50" : ""
            } w-full sm:w-auto`}
            disabled={loading}
          >
            Apply Filters
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <label
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            >
              Supplier
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full p-2 pl-3 pr-10 border rounded text-sm flex items-center justify-between ${
                  theme === "dark"
                    ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                    : "bg-white text-black border-gray-300 hover:bg-gray-100"
                } ${loading ? "opacity-50" : ""}`}
                disabled={loading || suppliers.length === 0}
              >
                <span>
                  {selectedSupplierId
                    ? suppliers.find((s) => s.id === selectedSupplierId)
                        ?.supplier_name || "Select Supplier"
                    : "All Suppliers"}
                </span>
                <svg
                  className={`w-5 h-5 ml-2 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  } ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {isDropdownOpen && (
                <div
                  className={`absolute z-10 w-full mt-1 border rounded-md shadow-lg ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-black"
                  }`}
                >
                  <div className="p-2">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search suppliers..."
                      className={`w-full p-2 border rounded text-sm placeholder-gray-400 ${
                        theme === "dark"
                          ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                          : "bg-gray-100 text-black border-gray-300 placeholder-gray-500"
                      }`}
                      autoFocus
                    />
                  </div>
                  <ul className="max-h-40 overflow-y-auto">
                    <li
                      className={`px-4 py-2 text-sm cursor-pointer ${
                        theme === "dark"
                          ? "hover:bg-gray-700 text-white"
                          : "hover:bg-gray-100 text-black"
                      } ${!selectedSupplierId ? "font-bold" : ""}`}
                      onClick={() => handleSupplierChange("")}
                    >
                      All Suppliers
                    </li>
                    {filteredSuppliers.length > 0 ? (
                      filteredSuppliers.map((supp) => (
                        <li
                          key={supp.id}
                          className={`px-4 py-2 text-sm cursor-pointer ${
                            theme === "dark"
                              ? "hover:bg-gray-700 text-white"
                              : "hover:bg-gray-100 text-black"
                          } ${
                            selectedSupplierId === supp.id ? "font-bold" : ""
                          }`}
                          onClick={() => handleSupplierChange(supp.id)}
                        >
                          {supp.supplier_name}
                        </li>
                      ))
                    ) : searchTerm ? (
                      <li
                        className={`px-4 py-2 text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        No supplier starts with the name
                      </li>
                    ) : null}
                  </ul>
                </div>
              )}
            </div>
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
              value={reportFilters.start_date}
              onChange={handleReportFilterChange}
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
              value={reportFilters.end_date}
              onChange={handleReportFilterChange}
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
              Items per Page
            </label>
            <select
              name="limit"
              value={reportFilters.limit}
              onChange={handleReportFilterChange}
              className={`w-full p-2 border rounded text-sm ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                  : "bg-[#F7F7F7] text-black border-gray-300 hover:bg-[#F7F7F7]"
              }`}
              disabled={loading}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </form>

      {!loading && !error && credits.length === 0 && (
        <div className="text-center mb-4 text-sm sm:text-base">
          No credit report generated yet. Please select a supplier and click
          "Apply Filters".
        </div>
      )}

      {report && credits.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
                  Total Credit Amount
                </h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold">
                ETB {report.summary.totalCreditAmount.toFixed(2) || 0}
              </p>
            </div>
            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-green-900" : "bg-green-200"
              }`}
              style={{
                backgroundColor: theme === "dark" ? "#15803D" : "#A7F3D0",
              }}
            >
              <div className="flex items-center mb-2">
                <span className="text-green-500 mr-3 text-xl">✅</span>
                <h3 className="text-base sm:text-lg font-semibold">
                  Total Paid Amount
                </h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold">
                ETB {report.summary.totalPaidAmount.toFixed(2) || 0}
              </p>
            </div>
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
                  Credit Count
                </h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold">
                {report.summary.creditCount || 0}
              </p>
            </div>
          </div>

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
                Credit List
              </h3>
              <button
                onClick={handleDownloadPDF}
                className={`bg-[#10B981] text-white px-4 py-2 rounded hover:bg-[#0E8C6A] disabled:bg-gray-500 disabled:opacity-50 text-base sm:text-lg ${
                  loading ? "opacity-50" : ""
                } w-full sm:w-auto`}
                disabled={!report || report.credits.length === 0 || loading}
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
                      Supplier Name
                    </th>
                    <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5] hidden sm:table-cell">
                      Total Credit
                    </th>
                    <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5] hidden sm:table-cell">
                      Paid Amount
                    </th>
                    <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5]">
                      Unpaid Amount
                    </th>
                    <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5]">
                      Status
                    </th>
                    {userRole === "MANAGER" && (
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5] hidden sm:table-cell">
                        Created By
                      </th>
                    )}
                    {userRole === "MANAGER" && (
                      <th className="border p-2 text-left font-bold uppercase tracking-wider sticky top-0 z-10 bg-[#5DB5B5] hidden sm:table-cell">
                        Updated By
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentCredits.map((cred, index) => (
                    <tr
                      key={cred.id}
                      className={`border-b ${getCreditStatusColor(cred)}`}
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
                        {cred.supplier?.supplier_name || "N/A"}
                      </td>
                      <td
                        className={`border p-2 whitespace-normal hidden sm:table-cell ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {parseFloat(cred.credit_amount || 0).toFixed(2)}
                      </td>
                      <td
                        className={`border p-2 whitespace-normal hidden sm:table-cell ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {parseFloat(cred.paid_amount || 0).toFixed(2)}
                      </td>
                      <td
                        className={`border p-2 whitespace-normal ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {parseFloat(cred.unpaid_amount || 0).toFixed(2)}
                      </td>
                      <td
                        className={`border p-2 whitespace-normal ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {cred.payment_status || "N/A"}
                      </td>
                      {userRole === "MANAGER" && (
                        <td
                          className={`border p-2 whitespace-normal hidden sm:table-cell ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {cred.createdBy?.username || "N/A"}
                        </td>
                      )}
                      {userRole === "MANAGER" && (
                        <td
                          className={`border p-2 whitespace-normal hidden sm:table-cell ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {cred.updatedBy?.username || "N/A"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr
                    className={`font-bold ${
                      theme === "dark" ? "bg-gray-800" : "bg-gray-100"
                    }`}
                  >
                    <td className="border p-2">Total</td>
                    <td className="border p-2"></td>
                    <td className="border p-2 hidden sm:table-cell">
                      {report.summary.totalCreditAmount.toFixed(2)}
                    </td>
                    <td className="border p-2 hidden sm:table-cell">
                      {report.summary.totalPaidAmount.toFixed(2)}
                    </td>
                    <td className="border p-2">
                      {report.summary.totalUnpaidAmount.toFixed(2)}
                    </td>
                    <td
                      colSpan={userRole === "MANAGER" ? 3 : 1}
                      className="border p-2"
                    ></td>
                  </tr>
                </tfoot>
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
        </>
      )}
    </div>
  );
};

export default SupplierReport;
