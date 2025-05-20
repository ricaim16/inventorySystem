import { useState, useEffect } from "react";
import {
  getExpirationAlerts,
  getAllMedicines,
  deleteMedicine,
} from "../../api/medicineApi";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  HiChevronLeft,
  HiChevronRight,
  HiExclamationCircle,
  HiEye,
  HiTrash,
  HiX,
} from "react-icons/hi";

const ExpireAlert = ({ onSelectMedicine, showToast }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [expiringMedicines, setExpiringMedicines] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [medicineToView, setMedicineToView] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [medicineIdToDelete, setMedicineIdToDelete] = useState(null);
  const itemsPerPage = 10;

  const formatEAT = (date) => {
    if (!date || isNaN(new Date(date).getTime())) return "N/A";
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
    return days;
  };

  const getStatus = (daysRemaining) => {
    if (daysRemaining <= 90) return "Expiring Soon";
    return "";
  };

  const getStatusColor = (daysRemaining) => {
    if (daysRemaining <= 90) return "#F59E0B";
    return "#000000";
  };

  const getRowBackground = (status) => {
    if (status === "Expiring Soon") {
      return theme === "dark"
        ? "bg-amber-900/20 hover:bg-amber-800/30"
        : "bg-amber-50 hover:bg-amber-100";
    }
    return theme === "dark"
      ? "bg-gray-900 hover:bg-[#4B5563]"
      : "bg-white hover:bg-[#f7f7f7]";
  };

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

  useEffect(() => {
    fetchExpirationAlerts();
  }, []);

  const fetchExpirationAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await getExpirationAlerts();
      if (!data || data.length === 0) {
        data = await getAllMedicines();
        const now = getCurrentEAT();
        const ninetyDaysFromNow = new Date(
          now.getTime() + 90 * 24 * 60 * 60 * 1000
        );
        data = data.filter((med) => {
          const expiry = new Date(med.expire_date);
          return expiry > now && expiry <= ninetyDaysFromNow;
        });
      } else {
        const now = getCurrentEAT();
        const ninetyDaysFromNow = new Date(
          now.getTime() + 90 * 24 * 60 * 60 * 1000
        );
        data = data.filter((med) => {
          const expiry = new Date(med.expire_date);
          return expiry > now && expiry <= ninetyDaysFromNow;
        });
      }
      setExpiringMedicines(
        data.sort((a, b) => new Date(a.expire_date) - new Date(b.expire_date))
      );
      setLoading(false);
    } catch (err) {
      const errorMessage =
        err.response?.status === 404
          ? "Expiration alerts endpoint not found."
          : `Failed to fetch expiration alerts: ${
              err.response?.data?.error?.message || err.message
            }`;
      setError(errorMessage);
      setLoading(false);
      if (typeof showToast === "function") {
        showToast(errorMessage, "error");
      }
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
      if (typeof showToast === "function") {
        showToast("Medicine deleted successfully!");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error?.message || "Failed to delete medicine";
      setError(errorMessage);
      if (typeof showToast === "function") {
        showToast(errorMessage, "error");
      }
    }
    setShowDeleteModal(false);
    setMedicineIdToDelete(null);
  };

  const handleView = (medicine) => {
    setMedicineToView(medicine);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setMedicineToView(null);
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

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const actionButtonClass = `p-2 rounded-md transition-colors duration-200 ${
    theme === "dark"
      ? "text-gray-300 hover:bg-[#4B5563]"
      : "text-gray-600 hover:bg-[#f7f7f7]"
  }`;

  if (loading) {
    return (
      <div
        className={`text-sm sm:text-base text-center ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}
      >
        Loading expiration alerts...
      </div>
    );
  }

  return (
    <div
      className={`p-4 sm:p-6 md:p-8 rounded-xl shadow-lg w-full font-sans transition-all duration-300 ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
    >
      <h2
        className={`text-2xl sm:text-3xl font-semibold mb-6 ${
          theme === "dark" ? "text-gray-100" : "text-gray-900"
        }`}
        style={{ color: "#10B981" }}
      >
        Expiration Alerts
      </h2>

      {error && (
        <div
          className={`${
            theme === "dark"
              ? "text-red-400 bg-red-900/20"
              : "text-red-600 bg-red-100"
          } mb-6 flex items-center text-base p-4 rounded-lg`}
        >
          {error}
        </div>
      )}

      {showViewModal && medicineToView && (
        <div
          className={`mb-8 p-6 sm:p-8 md:p-10 rounded-2xl shadow-xl relative max-w-6xl mx-auto transition-all duration-300 border-2 ${
            theme === "dark"
              ? "bg-gray-800 border-teal-600/50"
              : "bg-white border-teal-200/50"
          }`}
        >
          <button
            onClick={closeViewModal}
            className={`absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300 transform hover:scale-105 ${
              theme === "dark"
                ? "text-gray-300 bg-gray-700/50 hover:bg-red-600/80 hover:text-white"
                : "text-gray-600 bg-gray-100/50 hover:bg-red-500 hover:text-white"
            }`}
            aria-label="Close medicine details"
          >
            <HiX size={24} />
          </button>
          <h3
            className={`text-2xl sm:text-3xl font-semibold mb-8 text-left ${
              theme === "dark" ? "text-gray-100" : "text-gray-900"
            }`}
            style={{ color: "#10B981" }}
          >
            Medicine Details
          </h3>
          <div className="space-y-10">
            <div className="border-b-2 border-gray-300 pb-8">
              <h4
                className={`text-lg sm:text-xl font-semibold mb-6`}
                style={{ color: "#5DB5B5" }}
              >
                General Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
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
            <div className="border-b-2 border-gray-300 pb-8">
              <h4
                className="text-lg sm:text-xl font-semibold mb-6"
                style={{ color: "#5DB5B5" }}
              >
                Pricing and Expiry
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
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
                    {formatEAT(medicineToView.expire_date) || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Initial Quantity
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {medicineToView.initial_quantity || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Current Quantity
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
            <div className="pb-8">
              <h4
                className="text-lg sm:text-xl font-semibold mb-6"
                style={{ color: "#5DB5B5" }}
              >
                Additional Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
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
                      No file uploaded
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
                        {formatEAT(medicineToView.createdAt) || "N/A"}
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
                        {formatEAT(medicineToView.updatedAt) || "N/A"}
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

      {!showViewModal && (
        <>
          {expiringMedicines.length === 0 && !error && (
            <div
              className={`text-sm sm:text-base text-center ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              No medicines are expiring within the next 90 days.
            </div>
          )}

          {expiringMedicines.length > 0 && (
            <>
              <div className="overflow-x-auto min-w-full rounded-lg shadow-sm border border-gray-200">
                <table
                  className={`w-full border-collapse text-sm sm:text-base font-sans table-auto ${
                    theme === "dark" ? "bg-gray-900" : "bg-white"
                  }`}
                >
                  <thead>
                    <tr
                      className={`${
                        theme === "dark" ? "bg-teal-700" : "bg-teal-600"
                      } text-white`}
                    >
                      <th
                        className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        No.
                      </th>
                      <th
                        className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        Medicine Name
                      </th>
                      <th
                        className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden sm:table-cell ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        Batch Number
                      </th>
                      <th
                        className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden md:table-cell ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        Expire Date
                      </th>
                      <th
                        className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden sm:table-cell ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        Quantity
                      </th>
                      <th
                        className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden lg:table-cell ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        Category
                      </th>
                      <th
                        className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden lg:table-cell ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        Supplier
                      </th>
                      <th
                        className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden md:table-cell ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        Days Remaining
                      </th>
                      <th
                        className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden sm:table-cell ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        Status
                      </th>
                      <th
                        className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        Actions
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
                          className={`${
                            index % 2 === 0
                              ? theme === "dark"
                                ? "bg-gray-900"
                                : "bg-gray-50"
                              : theme === "dark"
                              ? "bg-gray-800"
                              : "bg-white"
                          } transition-colors duration-200 ${getRowBackground(
                            status
                          )}`}
                        >
                          <td
                            className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base font-medium ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-700"
                                : "text-gray-700 border-gray-200"
                            }`}
                          >
                            {rowNumber}
                          </td>
                          <td
                            className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-700"
                                : "text-gray-700 border-gray-200"
                            }`}
                          >
                            {med.medicine_name || "N/A"}
                          </td>
                          <td
                            className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden sm:table-cell ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-700"
                                : "text-gray-700 border-gray-200"
                            }`}
                          >
                            {med.batch_number || "N/A"}
                          </td>
                          <td
                            className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden md:table-cell ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-700"
                                : "text-gray-700 border-gray-200"
                            }`}
                          >
                            {formatEAT(med.expire_date)}
                          </td>
                          <td
                            className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden sm:table-cell ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-700"
                                : "text-gray-700 border-gray-200"
                            }`}
                          >
                            {med.quantity || 0}
                          </td>
                          <td
                            className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden lg:table-cell ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-700"
                                : "text-gray-700 border-gray-200"
                            }`}
                          >
                            {med.category?.name || "N/A"}
                          </td>
                          <td
                            className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden lg:table-cell ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-700"
                                : "text-gray-700 border-gray-200"
                            }`}
                          >
                            {med.supplier?.supplier_name || "N/A"}
                          </td>
                          <td
                            className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden md:table-cell ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-700"
                                : "text-gray-700 border-gray-200"
                            }`}
                          >
                            {daysRemaining}
                          </td>
                          <td
                            className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden sm:table-cell ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-700"
                                : "text-gray-700 border-gray-200"
                            }`}
                            style={{ color: getStatusColor(daysRemaining) }}
                          >
                            {status}
                          </td>
                          <td
                            className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                              theme === "dark"
                                ? "text-gray-300 border-gray-700"
                                : "text-gray-700 border-gray-200"
                            }`}
                          >
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleView(med)}
                                className={actionButtonClass}
                                title="View"
                              >
                                <HiEye size={18} />
                              </button>
                              {user?.role === "MANAGER" && (
                                <button
                                  onClick={() => openDeleteModal(med.id)}
                                  className={actionButtonClass}
                                  title="Delete"
                                >
                                  <HiTrash size={18} />
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

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Showing {startIndex + 1} to{" "}
                    {Math.min(
                      startIndex + itemsPerPage,
                      expiringMedicines.length
                    )}{" "}
                    of {expiringMedicines.length} medicines
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-md ${
                        currentPage === 1
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-[#4B5563]"
                      } ${
                        theme === "dark"
                          ? "text-gray-300 bg-gray-800"
                          : "text-gray-600 bg-gray-100"
                      }`}
                    >
                      <HiChevronLeft size={18} />
                    </button>
                    {getPageNumbers().map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === page
                            ? "bg-teal-600 text-white"
                            : theme === "dark"
                            ? "text-gray-300 bg-gray-800 hover:bg-[#4B5563]"
                            : "text-gray-600 bg-gray-100 hover:bg-[#f7f7f7]"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-md ${
                        currentPage === totalPages
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-[#4B5563]"
                      } ${
                        theme === "dark"
                          ? "text-gray-300 bg-gray-800"
                          : "text-gray-600 bg-gray-100"
                      }`}
                    >
                      <HiChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-xl shadow-lg w-11/12 max-w-md ${
              theme === "dark"
                ? "bg-gray-800 text-gray-200 border-gray-700"
                : "bg-white text-gray-800 border-gray-200"
            } border transition-all duration-300`}
          >
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <HiExclamationCircle
                  size={36}
                  className={theme === "dark" ? "text-red-400" : "text-red-500"}
                />
              </div>
              <p
                className={`text-sm sm:text-base mb-6 text-center font-semibold ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Are you sure you want to delete this medicine?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                <button
                  onClick={() => handleDelete(medicineIdToDelete)}
                  className={`py-2 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300 text-sm sm:text-base font-semibold w-full sm:w-auto`}
                >
                  Yes, I'm sure
                </button>
                <button
                  onClick={closeDeleteModal}
                  className={`py-2 px-6 rounded-lg font-semibold text-sm sm:text-base transition-colors duration-200 w-full sm:w-auto ${
                    theme === "dark"
                      ? "bg-gray-700 text-gray-200 hover:bg-[#4B5563]"
                      : "bg-gray-200 text-gray-600 hover:bg-[#f7f7f7]"
                  }`}
                >
                  No, cancel
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
