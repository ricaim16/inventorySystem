import { useState, useEffect, useCallback } from "react";
import { generateExpirationReport } from "../../api/medicineApi";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext"; // Added to access user role
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Function to generate a random color
const generateRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Function to truncate details (copied from ExpireAlert)
const truncateDetails = (text) => {
  if (!text || typeof text !== "string") return ["N/A"];
  const words = text.trim().split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += 5) {
    const chunk = words.slice(i, i + 5).join(" ");
    chunks.push(chunk);
  }
  return chunks.length ? chunks : ["N/A"];
};

const ExpireReport = () => {
  const { theme } = useTheme();
  const { user } = useAuth(); // Added to access user role
  const [report, setReport] = useState(null);
  const [expiredMedicines, setExpiredMedicines] = useState([]);
  const [expiringSoonMedicines, setExpiringSoonMedicines] = useState([]);
  const [filteredExpiringSoonMedicines, setFilteredExpiringSoonMedicines] =
    useState([]);
  const [expiringLaterMedicines, setExpiringLaterMedicines] = useState([]);
  const [reportFilters, setReportFilters] = useState({
    time_period: "all",
    category: "",
    limit: 100,
    offset: 0,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Generate category list and colors dynamically
  const categoryCounts = [...expiredMedicines, ...expiringSoonMedicines].reduce(
    (acc, med) => {
      const category = med.category?.name || "Uncategorized";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {}
  );

  const categories = Object.keys(categoryCounts);
  const categoryColors = categories.reduce((acc, category) => {
    acc[category] = generateRandomColor();
    return acc;
  }, {});

  const formatEAT = useCallback((date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      timeZone: "Africa/Addis_Ababa",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const getCurrentEAT = () => {
    const now = new Date();
    const utcDate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds(),
        now.getUTCMilliseconds()
      )
    );
    const etOffset = 3 * 60 * 60 * 1000;
    return new Date(utcDate.getTime() + etOffset);
  };

  const parseDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      const [month, day, year] = dateStr.split(" ").map((part, index) => {
        if (index === 0) return part.replace(",", "");
        if (index === 1) return parseInt(part);
        if (index === 2) return parseInt(part);
        return part;
      });
      const monthIndex = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ].indexOf(month);
      if (monthIndex !== -1 && day && year) {
        return new Date(year, monthIndex, day);
      }
      console.error(`Invalid date format: ${dateStr}`);
      return null;
    }
    return date;
  };

  const getDaysUntilExpiry = (expireDate) => {
    const now = getCurrentEAT();
    const expiry = parseDate(expireDate);
    if (!expiry) return -Infinity;
    const timeDiff = expiry - now;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  };

  const getExpiringSoonDays = () => {
    switch (reportFilters.time_period) {
      case "30_days":
        return 30;
      case "90_days":
        return 90;
      case "180_days":
        return 180;
      case "1_year":
        return 365;
      case "all":
        return Infinity;
      default:
        return 90;
    }
  };

  const getStatus = (expireDate) => {
    const days = getDaysUntilExpiry(expireDate);
    const expiringSoonDays = getExpiringSoonDays();
    if (days <= 0) return "Expired";
    if (days <= expiringSoonDays) return "Expiring Soon";
    return "Valid";
  };

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateExpirationReport({
        time_period: reportFilters.time_period,
        category: reportFilters.category,
        limit: reportFilters.limit,
        offset: reportFilters.offset,
      });

      const expiringSoonDays = getExpiringSoonDays();

      const filteredExpiringSoon = (data.expiringSoonMedicines || []).filter(
        (med) => {
          const daysUntilExpiry = getDaysUntilExpiry(med.expire_date);
          return daysUntilExpiry <= expiringSoonDays && daysUntilExpiry > 0;
        }
      );

      setReport({
        ...data,
        expiringSoonCount: filteredExpiringSoon.length,
        expiredCount: data.expiredCount,
        expiringLaterCount: data.expiringLaterCount,
        totalValue: data.totalValue,
        expiringSoonDays,
        generatedAt: new Date(),
      });
      setExpiredMedicines(data.expiredMedicines || []);
      setExpiringSoonMedicines(data.expiringSoonMedicines || []);
      setFilteredExpiringSoonMedicines(filteredExpiringSoon);
      setExpiringLaterMedicines(data.expiringLaterMedicines || []);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "Expiration report endpoint not found on server."
          : `Failed to fetch report: ${
              err.response?.data?.error?.message || err.message
            }`
      );
      setReport(null);
      setExpiredMedicines([]);
      setExpiringSoonMedicines([]);
      setFilteredExpiringSoonMedicines([]);
      setExpiringLaterMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setReportFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitFilters = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setReportFilters((prev) => ({
      ...prev,
      offset: 0,
    }));
    fetchReport();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setReportFilters((prev) => ({
        ...prev,
        offset: (page - 1) * itemsPerPage,
      }));
    }
  };

  const downloadReport = () => {
    if (!report) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(16);
    doc.text("Expiration Report", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(12);
    doc.text(`Generated: ${formatEAT(report.generatedAt)}`, pageWidth / 2, y, {
      align: "center",
    });
    y += 15;

    doc.setFontSize(14);
    doc.text("Expired Medicines", 14, y);
    y += 10;
    autoTable(doc, {
      startY: y,
      head: [
        [
          "No.",
          "Medicine Name",
          "Batch No.",
          "Expiry Date",
          "Quantity",
          "Category",
          "Supplier",
          user?.role === "MANAGER" ? "Created By" : null, // Conditional header
          user?.role === "MANAGER" ? "Created At" : null,
          user?.role === "MANAGER" ? "Updated At" : null,
          user?.role === "MANAGER" ? "Details" : null,
          "Status",
        ].filter(Boolean), // Remove null values
      ],
      body: expiredMedicines.map((med, index) => {
        const row = [
          (index + 1).toString(),
          med.medicine_name || "N/A",
          med.batch_number || "N/A",
          formatEAT(med.expire_date),
          med.quantity.toString(),
          med.category?.name || "N/A",
          med.supplier?.supplier_name || "N/A",
        ];
        if (user?.role === "MANAGER") {
          row.push(
            med.createdBy?.username || "N/A",
            formatEAT(med.created_at) || "N/A",
            formatEAT(med.updated_at) || "N/A",
            truncateDetails(med.details)[0] || "N/A"
          );
        }
        row.push(getStatus(med.expire_date));
        return row;
      }),
      theme: "grid",
      headStyles: { fillColor: [0, 128, 128] },
    });

    y = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.text(
      `Expiring within ${
        report.expiringSoonDays === Infinity
          ? "All Time"
          : report.expiringSoonDays + " Days"
      }`,
      14,
      y
    );
    y += 10;
    autoTable(doc, {
      startY: y,
      head: [
        [
          "No.",
          "Medicine Name",
          "Batch No.",
          "Expiry Date",
          "Quantity",
          "Category",
          "Supplier",
          user?.role === "MANAGER" ? "Created By" : null,
          user?.role === "MANAGER" ? "Created At" : null,
          user?.role === "MANAGER" ? "Updated At" : null,
          user?.role === "MANAGER" ? "Details" : null,
          "Status",
        ].filter(Boolean),
      ],
      body: filteredExpiringSoonMedicines.map((med, index) => {
        const row = [
          (index + 1).toString(),
          med.medicine_name || "N/A",
          med.batch_number || "N/A",
          formatEAT(med.expire_date),
          med.quantity.toString(),
          med.category?.name || "N/A",
          med.supplier?.supplier_name || "N/A",
        ];
        if (user?.role === "MANAGER") {
          row.push(
            med.createdBy?.username || "N/A",
            formatEAT(med.created_at) || "N/A",
            formatEAT(med.updated_at) || "N/A",
            truncateDetails(med.details)[0] || "N/A"
          );
        }
        row.push(getStatus(med.expire_date));
        return row;
      }),
      theme: "grid",
      headStyles: { fillColor: [0, 128, 128] },
    });

    doc.save(
      `Expiration_Report_${formatEAT(new Date()).replace(/[:,\s]/g, "_")}.pdf`
    );
  };

  const pieData = {
    labels: categories,
    datasets: [
      {
        data: categories.map((category) => categoryCounts[category] || 0),
        backgroundColor: categories.map((category) => categoryColors[category]),
        hoverBackgroundColor: categories.map(
          (category) => categoryColors[category]
        ),
        borderWidth: 0,
      },
    ],
  };

  // Pagination for report list
  const allMedicines = [...expiredMedicines, ...expiringSoonMedicines];
  const filteredMedicines = reportFilters.category
    ? allMedicines.filter(
        (med) => med.category?.name === reportFilters.category
      )
    : allMedicines;

  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMedicines = filteredMedicines.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    if (filteredMedicines.length === 0) {
      setCurrentPage(1);
    }
  }, [filteredMedicines, totalPages, currentPage]);

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

  return (
    <div
      className={`p-4 sm:p-6 max-w-full mx-auto ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-[#F7F7F7] text-black"
      } min-h-screen`}
    >
      <h2
        className={`text-3xl font-semibold font-sans ${
          theme === "dark" ? "text-gray-100" : "text-gray-900"
        }`}
        style={{ color: "#10B981" }}
      >
        Expiration Report
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
        onSubmit={handleSubmitFilters}
        className={`mb-6 p-4 rounded-lg shadow ${
          theme === "dark" ? "bg-gray-800" : "bg-[#F7F7F7]"
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0">
            Generate Expiration Report
          </h3>
          <button
            type="submit"
            className={`bg-[#10B981] text-white px-4 py-2 rounded hover:bg-[#0E8C6A] disabled:bg-[#A52A2A] disabled:opacity-50 text-base ${
              loading ? "opacity-50" : ""
            } w-full sm:w-auto`}
            disabled={loading}
          >
            Apply Filters
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Time Period
            </label>
            <select
              name="time_period"
              value={reportFilters.time_period}
              onChange={handleFilterChange}
              className={`w-full p-2 border rounded text-sm ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                  : "bg-[#F7F7F7] text-black border-gray-300 hover:bg-[#F7F7F7]"
              }`}
              disabled={loading}
            >
              <option value="30_days">Within 30 Days</option>
              <option value="90_days">Within 90 Days</option>
              <option value="180_days">Within 180 Days</option>
              <option value="1_year">Within 1 Year</option>
              <option value="all">All</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              name="category"
              value={reportFilters.category}
              onChange={handleFilterChange}
              className={`w-full p-2 border rounded text-sm ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                  : "bg-[#F7F7F7] text-black border-gray-300 hover:bg-[#F7F7F7]"
              }`}
              disabled={loading}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {!loading && !error && !report && (
        <div className="text-center mb-4 text-sm sm:text-base">
          No expiration report generated yet. Please click "Apply Filters".
        </div>
      )}

      {report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-blue-900" : "bg-blue-200"
              }`}
            >
              <div className="flex items-center mb-2">
                <span className="text-blue-500 mr-3 text-xl">💵</span>
                <h3 className="text-base sm:text-lg font-semibold">
                  Total Value of Expired Items
                </h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold">
                {report.totalValue?.toFixed(2) || "0.00"} ETB
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
                <span className="text-green-500 mr-3">⚠️</span>
                <h3 className="text-base sm:text-lg font-semibold">
                  {report.expiringSoonDays === Infinity
                    ? "Expiring Eventually"
                    : `Expiring Soon in ${report.expiringSoonDays} Days`}
                </h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold">
                {report.expiringSoonCount || 0}
              </p>
            </div>
            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-red-900" : "bg-red-200"
              }`}
            >
              <div className="flex items-center mb-2">
                <span className="text-red-500 mr-3 text-xl">⏰</span>
                <h3 className="text-base sm:text-lg font-semibold">
                  Total No. of Expired Items
                </h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold">
                {report.expiredCount || 0}
              </p>
            </div>
          </div>

          <div
            className={`mb-6 p-4 rounded-lg shadow ${
              theme === "dark" ? "bg-gray-900" : "bg-[#F7F7F7]"
            }`}
          >
            <h3
              className="text-lg sm:text-xl font-semibold mb-6 text-left"
              style={{ color: "#10B981" }}
            >
              Categories
            </h3>
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
              <div className="flex justify-center w-full md:w-1/2">
                <div className="w-72 h-72 sm:w-80 sm:h-80">
                  <Pie
                    data={pieData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            color: theme === "dark" ? "white" : "black",
                            font: { size: 12 },
                          },
                        },
                        tooltip: { enabled: true },
                      },
                    }}
                  />
                </div>
              </div>
              <div
                className={`w-full md:w-1/2 p-2 rounded-lg shadow ${
                  theme === "dark" ? "bg-gray-800" : "bg-[#F7F7F7]"
                }`}
              >
                <h4
                  className="text-base sm:text-lg font-semibold mb-2 text-center"
                  style={{ color: "#10B981" }}
                >
                  {report.expiringSoonDays === Infinity
                    ? "Expiring Eventually"
                    : `Expiring within ${report.expiringSoonDays} Days`}
                </h4>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0">
                      <tr
                        className="bg-teal-600 text-white" // Updated to match pagination color
                      >
                        <th
                          className={`border p-2 text-left ${
                            theme === "dark" ? "text-gray-200" : "text-white"
                          }`}
                          style={{ color: "#ffffff" }}
                        >
                          No.
                        </th>
                        <th
                          className={`border p-2 text-left ${
                            theme === "dark" ? "text-gray-200" : "text-white"
                          }`}
                          style={{ color: "#ffffff" }}
                        >
                          Medicine
                        </th>
                        <th
                          className={`border p-2 text-left ${
                            theme === "dark" ? "text-gray-200" : "text-white"
                          }`}
                          style={{ color: "#ffffff" }}
                        >
                          Days Left
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpiringSoonMedicines.length === 0 ? (
                        <tr>
                          <td
                            colSpan="3"
                            className={`border p-2 text-center ${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-600"
                            }`}
                          >
                            {report.expiringSoonDays === Infinity
                              ? "No medicines expiring."
                              : `No medicines expiring within ${report.expiringSoonDays} days.`}
                          </td>
                        </tr>
                      ) : (
                        filteredExpiringSoonMedicines.map((med, index) => (
                          <tr
                            key={med.id}
                            className={`${
                              theme === "dark"
                                ? "hover:bg-gray-700"
                                : "hover:bg-[#E0E0E0]"
                            }`}
                          >
                            <td
                              className={`border p-2 ${
                                theme === "dark"
                                  ? "text-gray-300"
                                  : "text-gray-600"
                              }`}
                            >
                              {index + 1}
                            </td>
                            <td
                              className={`border p-2 ${
                                theme === "dark"
                                  ? "text-gray-300"
                                  : "text-gray-600"
                              }`}
                            >
                              {med.medicine_name || "N/A"}
                            </td>
                            <td
                              className={`border p-2 ${
                                theme === "dark"
                                  ? "text-gray-300"
                                  : "text-gray-600"
                              }`}
                            >
                              {getDaysUntilExpiry(med.expire_date)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {filteredMedicines.length > 0 && (
            <div
              className={`mb-6 p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-gray-900" : "bg-[#F7F7F7]"
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-0">
                  Medicines List
                </h3>
                <button
                  onClick={downloadReport}
                  className={`bg-[#5DB5B5] text-white px-4 py-2 rounded hover:bg-[#3e8888] disabled:bg-[#A52A2A] disabled:opacity-50 text-base ${
                    loading ? "opacity-50" : ""
                  } w-full sm:w-auto`}
                  disabled={loading}
                >
                  Download Reports
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm sm:text-base">
                  <thead>
                    <tr className="bg-teal-600 text-white">
                      <th className="border p-2 text-left font-bold uppercase tracking-wider">
                        No.
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider">
                        Medicine Name
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider">
                        Batch No.
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider">
                        Expiry Date
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider">
                        Category
                      </th>
                      <th className="border p-2 text-left font-bold uppercase tracking-wider">
                        Supplier
                      </th>
                      {user?.role === "MANAGER" && (
                        <>
                          <th className="border p-2 text-left font-bold uppercase tracking-wider hidden lg:table-cell">
                            Created By
                          </th>
                          <th className="border p-2 text-left font-bold uppercase tracking-wider hidden lg:table-cell">
                            Created At
                          </th>
                          <th className="border p-2 text-left font-bold uppercase tracking-wider hidden lg:table-cell">
                            Updated At
                          </th>
                          <th className="border p-2 text-left font-bold uppercase tracking-wider hidden lg:table-cell">
                            Details
                          </th>
                        </>
                      )}
                      <th className="border p-2 text-left font-bold uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMedicines.map((med, index) => {
                      const status = getStatus(med.expire_date);
                      const rowNumber = startIndex + index + 1;
                      return (
                        <tr
                          key={med.id}
                          className={`border-b ${
                            theme === "dark"
                              ? status === "Expired"
                                ? "bg-red-800 hover:bg-red-700"
                                : status === "Expiring Soon"
                                ? "bg-yellow-800 hover:bg-yellow-700"
                                : "bg-green-800 hover:bg-green-700"
                              : status === "Expired"
                              ? "bg-red-100 hover:bg-red-200"
                              : status === "Expiring Soon"
                              ? "bg-yellow-100 hover:bg-yellow-200"
                              : "bg-green-100 hover:bg-green-200"
                          }`}
                        >
                          <td className="border p-2">{rowNumber}</td>
                          <td className="border p-2">
                            {med.medicine_name || "N/A"}
                          </td>
                          <td className="border p-2">
                            {med.batch_number || "N/A"}
                          </td>
                          <td className="border p-2">
                            {formatEAT(med.expire_date)}
                          </td>
                          <td className="border p-2">{med.quantity || 0}</td>
                          <td className="border p-2">
                            {med.category?.name || "N/A"}
                          </td>
                          <td className="border p-2">
                            {med.supplier?.supplier_name || "N/A"}
                          </td>
                          {user?.role === "MANAGER" && (
                            <>
                              <td className="border p-2 hidden lg:table-cell">
                                {med.createdBy?.username || "N/A"}
                              </td>
                              <td className="border p-2 hidden lg:table-cell">
                                {formatEAT(med.created_at) || "N/A"}
                              </td>
                              <td className="border p-2 hidden lg:table-cell">
                                {formatEAT(med.updated_at) || "N/A"}
                              </td>
                              <td className="border p-2 hidden lg:table-cell">
                                {truncateDetails(med.details)[0] || "N/A"}
                              </td>
                            </>
                          )}
                          <td className="border p-2">{status}</td>
                        </tr>
                      );
                    })}
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
          )}
        </>
      )}
    </div>
  );
};

export default ExpireReport;
