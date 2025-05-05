import { useState, useEffect } from "react";
import {
  getExpirationAlerts,
  getAllMedicines,
  deleteMedicine,
} from "../../api/medicineApi";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { HiX, HiExclamationCircle, HiEye, HiTrash } from "react-icons/hi";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const ExpireAlert = ({ onSelectMedicine }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [expiringMedicines, setExpiringMedicines] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [medicineToView, setMedicineToView] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [medicineIdToDelete, setMedicineIdToDelete] = useState(null);
  const itemsPerPage = 10;

  const formatEAT = (date) => {
    const options = {
      timeZone: "Africa/Addis_Ababa",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(date).toLocaleString("en-US", options);
  };

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

  const getDaysRemaining = (expireDate) => {
    const now = getCurrentEAT();
    const expiry = new Date(expireDate);
    const timeDiff = expiry - now;
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    return days < 0 ? `Expired (${Math.abs(days)} days ago)` : days;
  };

  const getStatus = (daysRemaining) => {
    const days = typeof daysRemaining === "string" ? -1 : daysRemaining;
    if (days === -1) return "Expired";
    if (days <= 90) return "Expiring Soon";
    return "Valid";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Valid":
        return "#065f46"; // Dark green
      case "Expiring Soon":
        return "#b45309"; // Dark yellow
      case "Expired":
        return "#b91c1c"; // Red
      default:
        return theme === "dark" ? "#D1D5DB" : "#4B5563";
    }
  };

  const getRowBackground = (status) => {
    switch (status) {
      case "Valid":
        return theme === "dark"
          ? "bg-green-800/50 border-gray-600 hover:bg-green-700/50"
          : "bg-green-100/50 border-gray-300 hover:bg-green-200/50";
      case "Expiring Soon":
        return theme === "dark"
          ? "bg-yellow-800/50 border-gray-600 hover:bg-yellow-700/50"
          : "bg-yellow-100/50 border-gray-300 hover:bg-yellow-200/50";
      case "Expired":
        return theme === "dark"
          ? "bg-red-800/50 border-gray-600 hover:bg-red-700/50"
          : "bg-red-100/50 border-gray-300 hover:bg-red-200/50";
      default:
        return theme === "dark"
          ? "bg-gray-800 border-gray-600 hover:bg-gray-700"
          : "bg-[#F7F7F7] border-gray-300 hover:bg-gray-100";
    }
  };

  const truncateDetails = (text) => {
    if (!text) return ["N/A"];
    const words = text.trim().split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += 5) {
      const chunk = words.slice(i, i + 5).join(" ");
      chunks.push(chunk);
    }
    return chunks.length ? chunks : ["N/A"];
  };

  useEffect(() => {
    fetchExpirationAlerts();
  }, []);

  const fetchExpirationAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await getExpirationAlerts();
      console.log("Data from /api/expire/alerts:", data);
      if (!data || data.length === 0) {
        console.warn(
          "No data from /api/expire/alerts, falling back to /api/medicines"
        );
        data = await getAllMedicines();
        console.log("Data from /api/medicines:", data);
      }
      const now = getCurrentEAT();
      const expiring = data.filter((med) => {
        const expiry = new Date(med.expire_date);
        const monthsDiff = (expiry - now) / (1000 * 60 * 60 * 24 * 30);
        console.log(
          `Medicine: ${med.medicine_name}, Expire Date: ${med.expire_date}, Months Left: ${monthsDiff}`
        );
        return monthsDiff <= 6;
      });
      console.log("Filtered Expiring Medicines:", expiring);
      setExpiringMedicines(expiring);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "Expiration alerts endpoint not found on server. Please check the backend."
          : `Failed to fetch expiration alerts: ${
              err.response?.data?.error?.message || err.message
            }`
      );
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id) => {
    setMedicineIdToDelete(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setMedicineIdToDelete(null);
  };

  const handleDelete = async (id) => {
    try {
      await deleteMedicine(id);
      setExpiringMedicines(expiringMedicines.filter((med) => med.id !== id));
      setError(null);
    } catch (err) {
      setError(
        "Failed to delete medicine: " +
          (err.response?.data?.error?.message || err.message)
      );
    }
    setShowDeleteModal(false);
    setMedicineIdToDelete(null);
  };

  const handleView = (medicine) => {
    setMedicineToView(medicine);
    setIsViewOpen(true);
  };

  const totalPages = Math.ceil(expiringMedicines.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMedicines = expiringMedicines.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    if (expiringMedicines.length === 0) {
      setCurrentPage(1);
    }
  }, [expiringMedicines, totalPages, currentPage]);

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

  return (
    <div
      className={`p-3 sm:p-4 md:p-6 rounded-lg shadow-lg w-full max-w-[100vw] mx-auto ${
        theme === "dark" ? "bg-gray-800" : "bg-[#F7F7F7]"
      }`}
    >
      <h2
        className={`text-xl sm:text-2xl md:text-3xl font-semibold mb-6 ${
          theme === "dark" ? "text-gray-100" : "text-gray-900"
        }`}
        style={{ color: "#10B981" }}
      >
        Expiration Alerts
      </h2>

      {error && (
        <div
          className={`mb-4 flex flex-col sm:flex-row items-center justify-between p-3 rounded ${
            theme === "dark"
              ? "bg-red-900 text-red-200 border border-red-700"
              : "bg-red-100 text-red-700 border border-red-400"
          }`}
        >
          <span className="text-sm sm:text-base">{error}</span>
          <button
            onClick={fetchExpirationAlerts}
            className={`mt-2 sm:mt-0 px-4 py-1 rounded text-white text-sm sm:text-base ${
              theme === "dark"
                ? "bg-blue-700 hover:bg-blue-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            Retry
          </button>
        </div>
      )}

      {isViewOpen && medicineToView && (
        <div
          className={`mb-8 p-4 sm:p-6 md:p-8 rounded-2xl shadow-xl relative max-w-6xl mx-auto transition-all duration-300 border-2 ${
            theme === "dark"
              ? "bg-gray-800 border-teal-600/50"
              : "bg-white border-teal-200/50"
          }`}
        >
          <button
            onClick={() => {
              setIsViewOpen(false);
              setMedicineToView(null);
            }}
            className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-md transition-all duration-300 transform hover:scale-105 ${
              theme === "dark"
                ? "text-gray-300 bg-gray-700/50 hover:bg-red-600/80 hover:text-white"
                : "text-gray-600 bg-gray-100/50 hover:bg-red-500 hover:text-white"
            }`}
            aria-label="Close medicine details"
          >
            <HiX size={20} />
          </button>
          <h3
            className={`text-xl sm:text-2xl md:text-3xl font-semibold mb-6 text-left ${
              theme === "dark" ? "text-gray-100" : "text-gray-900"
            }`}
            style={{ color: "#10B981" }}
          >
            Medicine Details
          </h3>
          <div className="space-y-8">
            {/* General Information */}
            <div className="border-b-2 border-gray-300 pb-6">
              <h4
                className={`text-base sm:text-lg md:text-xl font-semibold mb-4`}
                style={{ color: "#5DB5B5" }}
              >
                General Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Invoice Number
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {medicineToView.invoice_number || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Medicine Name
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {medicineToView.medicine_name || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Brand
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {medicineToView.brand_name || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Batch Number
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {medicineToView.batch_number || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Category
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {medicineToView.category?.name || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Dosage Form
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {medicineToView.dosage_form?.name || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing and Expiry */}
            <div className="border-b-2 border-gray-300 pb-6">
              <h4
                className={`text-base sm:text-lg md:text-xl font-semibold mb-4`}
                style={{ color: "#5DB5B5" }}
              >
                Pricing and Expiry
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Unit Price
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {medicineToView.unit_price || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Sell Price
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {medicineToView.sell_price || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Total Price
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {medicineToView.total_price || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Expire Date
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {formatEAT(medicineToView.expire_date)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Quantity
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {medicineToView.quantity || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Weight
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {medicineToView.medicine_weight || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="pb-6">
              <h4
                className={`text-base sm:text-lg md:text-xl font-semibold mb-4`}
                style={{ color: "#5DB5B5" }}
              >
                Additional Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Supplier
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {medicineToView.supplier?.supplier_name || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Requires Prescription
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {medicineToView.required_prescription ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Payment Method
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {medicineToView.payment_method || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Payment File
                  </span>
                  {medicineToView.Payment_file ? (
                    <a
                      href={`http://localhost:8080/${medicineToView.Payment_file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm sm:text-base text-teal-500 hover:underline transition-colors duration-200 ${
                        theme === "dark" ? "hover:text-teal-400" : ""
                      }`}
                    >
                      View File
                    </a>
                  ) : (
                    <span
                      className={`text-sm sm:text-base ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      N/A
                    </span>
                  )}
                </div>
                {user?.role === "MANAGER" && (
                  <>
                    <div className="flex flex-col">
                      <span
                        className={`font-semibold text-sm sm:text-base ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Created By
                      </span>
                      <span
                        className={`text-sm sm:text-base ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {medicineToView.createdBy?.username || "N/A"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`font-semibold text-sm sm:text-base ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Created At
                      </span>
                      <span
                        className={`text-sm sm:text-base ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {medicineToView.created_at
                          ? formatEAT(medicineToView.created_at)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`font-semibold text-sm sm:text-base ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Updated At
                      </span>
                      <span
                        className={`text-sm sm:text-base ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {medicineToView.updated_at
                          ? formatEAT(medicineToView.updated_at)
                          : "N/A"}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex flex-col col-span-2">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Details
                  </span>
                  <span
                    className={`text-sm sm:text-base break-words ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {truncateDetails(medicineToView.details).map(
                      (chunk, index) => (
                        <span key={index}>
                          {chunk}
                          <br />
                        </span>
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isViewOpen && (
        <>
          {loading && (
            <div
              className={`mt-4 text-center text-sm sm:text-base ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Loading expiration alerts...
            </div>
          )}
          {!loading && expiringMedicines.length === 0 && !error && (
            <p
              className={`text-center text-sm sm:text-base ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              No medicines are nearing expiration within the next 6 months.
            </p>
          )}

          {!loading && expiringMedicines.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                  <thead>
                    <tr
                      className={`h-[2.5rem] ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-200 border-gray-300"
                      }`}
                    >
                      <th
                        className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-left font-bold uppercase tracking-wider text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        No.
                      </th>
                      <th
                        className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-left font-bold uppercase tracking-wider text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Medicine Name
                      </th>
                      <th
                        className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-left font-bold uppercase tracking-wider text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Batch No.
                      </th>
                      <th
                        className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-left font-bold uppercase tracking-wider text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Expire Date
                      </th>
                      <th
                        className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-left font-bold uppercase tracking-wider text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Quantity
                      </th>
                      <th
                        className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-left font-bold uppercase tracking-wider text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Category
                      </th>
                      <th
                        className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-left font-bold uppercase tracking-wider text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Supplier
                      </th>
                      <th
                        className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-left font-bold uppercase tracking-wider text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Days Remaining
                      </th>
                      <th
                        className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-left font-bold uppercase tracking-wider text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Status
                      </th>
                      <th
                        className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-left font-bold uppercase tracking-wider text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMedicines.map((med, index) => {
                      const daysRemaining = getDaysRemaining(med.expire_date);
                      const status = getStatus(daysRemaining);
                      const rowNumber = startIndex + index + 1;
                      return (
                        <tr
                          key={med.id}
                          className={`border-b h-[2.5rem] ${getRowBackground(
                            status
                          )}`}
                        >
                          <td
                            className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-600"
                                : "text-gray-600 border-gray-300"
                            }`}
                          >
                            {rowNumber}
                          </td>
                          <td
                            className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-600"
                                : "text-gray-600 border-gray-300"
                            }`}
                          >
                            {med.medicine_name || "N/A"}
                          </td>
                          <td
                            className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-600"
                                : "text-gray-600 border-gray-300"
                            }`}
                          >
                            {med.batch_number || "N/A"}
                          </td>
                          <td
                            className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-600"
                                : "text-gray-600 border-gray-300"
                            }`}
                          >
                            {formatEAT(med.expire_date)}
                          </td>
                          <td
                            className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-600"
                                : "text-gray-600 border-gray-300"
                            }`}
                          >
                            {med.quantity || 0}
                          </td>
                          <td
                            className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-600"
                                : "text-gray-600 border-gray-300"
                            }`}
                          >
                            {med.category?.name || "N/A"}
                          </td>
                          <td
                            className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-600"
                                : "text-gray-600 border-gray-300"
                            }`}
                          >
                            {med.supplier?.supplier_name || "N/A"}
                          </td>
                          <td
                            className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-600"
                                : "text-gray-600 border-gray-300"
                            }`}
                          >
                            {daysRemaining}
                          </td>
                          <td
                            className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                              theme === "dark"
                                ? "border-gray-600"
                                : "border-gray-300"
                            }`}
                            style={{ color: getStatusColor(status) }}
                          >
                            {status}
                          </td>
                          <td
                            className={`border p-1 sm:p-1.5 md:p-2 min-w-[3rem] text-[0.75rem] sm:text-sm md:text-[0.9rem] ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-600"
                                : "text-gray-600 border-gray-300"
                            }`}
                          >
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleView(med)}
                                className="transition-colors duration-200 hover:text-teal-500"
                                title="View"
                                aria-label={`View medicine ${med.medicine_name}`}
                              >
                                <HiEye className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] md:w-[18px] md:h-[18px]" />
                              </button>
                              {user?.role === "MANAGER" && (
                                <button
                                  onClick={() => openDeleteModal(med.id)}
                                  className="transition-colors duration-200 hover:text-teal-500"
                                  title="Delete"
                                  aria-label={`Delete medicine ${med.medicine_name}`}
                                >
                                  <HiTrash className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] md:w-[18px] md:h-[18px]" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

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
            </>
          )}
        </>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div
            className={`p-4 sm:p-6 rounded-xl shadow-lg w-11/12 max-w-sm ${
              theme === "dark"
                ? "bg-gray-900 text-gray-200 border-gray-700"
                : "bg-white text-gray-800 border-gray-200"
            } border transition-all duration-300`}
          >
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <HiExclamationCircle
                  size={32}
                  className={theme === "dark" ? "text-red-400" : "text-red-500"}
                />
              </div>
              <p
                className={`text-sm sm:text-base mb-4 text-center font-medium ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Are you sure you want to delete this medicine?
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center w-full">
                <button
                  onClick={() => handleDelete(medicineIdToDelete)}
                  className={`py-1.5 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 text-sm sm:text-base font-medium w-full sm:w-auto`}
                >
                  Delete
                </button>
                <button
                  onClick={closeDeleteModal}
                  className={`py-1.5 px-4 rounded-md font-medium text-sm sm:text-base transition-colors duration-200 w-full sm:w-auto ${
                    theme === "dark"
                      ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpireAlert;
