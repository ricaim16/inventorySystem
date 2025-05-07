import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getAllMedicines, deleteMedicine } from "../../../api/medicineApi";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import {
  HiEye,
  HiPencil,
  HiTrash,
  HiSearch,
  HiChevronLeft,
  HiChevronRight,
  HiExclamationCircle,
  HiX,
} from "react-icons/hi";
import MedicineForm from "./MedicineForm";

const MedicineList = () => {
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [medicineToView, setMedicineToView] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [medicineIdToDelete, setMedicineIdToDelete] = useState(null);
  const itemsPerPage = 10;
  const { user } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();

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
        now.getUTCMinutes()
      )
    );
    const etOffset = 3 * 60 * 60 * 1000;
    return new Date(utcDate.getTime() + etOffset);
  };

  const getExpiryStatus = (expireDate) => {
    const now = getCurrentEAT();
    const expiry = new Date(expireDate);
    const monthsDiff = (expiry - now) / (1000 * 60 * 60 * 24 * 30);
    if (monthsDiff <= 3) return "red";
    if (monthsDiff <= 6) return "yellow";
    return "green";
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const data = await getAllMedicines();
      const sanitizedData = data.map((med, index) => ({
        ...med,
        id: med.id ?? `fallback-${index}`,
      }));
      setMedicines(sanitizedData);
      setError(null);
    } catch (err) {
      setError(
        "Failed to fetch medicines: " +
          (err.response?.data?.error?.message || err.message)
      );
    }
  };

  // Handle medicine selection from Navbar
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const medicineId = params.get("medicineId");
    const search = params.get("search");
    if (medicineId) {
      const medicine = medicines.find((med) => med.id === medicineId);
      if (medicine) {
        setMedicineToView(medicine);
        setIsViewOpen(true);
      }
    }
    if (search) {
      setSearchTerm(decodeURIComponent(search));
      setCurrentPage(1);
    }
  }, [location, medicines]);

  const handleEdit = (medicine) => {
    setSelectedMedicine(medicine);
    setIsFormOpen(true);
    setIsViewOpen(false);
  };

  const handleView = (medicine) => {
    setMedicineToView(medicine);
    setIsViewOpen(true);
    setIsFormOpen(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteMedicine(id);
      fetchMedicines();
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

  const openDeleteModal = (id) => {
    setMedicineIdToDelete(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setMedicineIdToDelete(null);
  };

  const handleSave = (newMedicine) => {
    setMedicines((prev) =>
      selectedMedicine
        ? prev.map((med) => (med.id === newMedicine.id ? newMedicine : med))
        : [...prev, newMedicine]
    );
    setIsFormOpen(false);
    setSelectedMedicine(null);
    fetchMedicines();
  };

  const filteredMedicines = medicines.filter((med) =>
    [med.medicine_name, med.invoice_number, med.brand_name]
      .filter(Boolean)
      .some((field) =>
        field.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

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

  const actionButtonClass = `p-2 rounded-md transition-colors duration-200 ${
    theme === "dark"
      ? "text-gray-300 hover:bg-[#4B5563]"
      : "text-gray-600 hover:bg-[#f7f7f7]"
  }`;

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
        Medicines
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

      {isFormOpen && (
        <MedicineForm
          medicine={selectedMedicine}
          onSave={handleSave}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedMedicine(null);
          }}
        />
      )}

      {isViewOpen && medicineToView && (
        <div
          className={`mb-8 p-6 sm:p-8 md:p-10 rounded-2xl shadow-xl relative max-w-6xl mx-auto transition-all duration-300 border-2 ${
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
                    {medicineToView.invoice_number}
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
                    {medicineToView.medicine_name}
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
                    {medicineToView.category.name}
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
                    {medicineToView.dosage_form.name}
                  </span>
                </div>
              </div>
            </div>
            <div className="border-b-2 border-gray-300 pb-8">
              <h4
                className={`text-lg sm:text-xl font-semibold mb-6`}
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
                    {medicineToView.unit_price}
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
                    {medicineToView.total_price}
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
                    {medicineToView.quantity}
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
                className={`text-lg sm:text-xl font-semibold mb-6`}
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
                    {medicineToView.supplier.supplier_name}
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
                    {medicineToView.payment_method}
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
                        {medicineToView.createdBy.username}
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
                        Apr 27, 2025
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
                        Apr 27, 2025
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

      {!isFormOpen && !isViewOpen && (
        <>
          <div className="mb-8 flex justify-start w-full max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search by Medicine, Invoice, or Brand..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full p-3 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base transition-all duration-200 ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400"
                    : "bg-white border-gray-200 text-gray-800 placeholder-gray-400"
                }`}
              />
              <HiSearch
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
                size={18}
              />
            </div>
          </div>

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
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    No.
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Medicine Name
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden sm:table-cell ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Batch Number
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden md:table-cell ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Medicine Brand
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden lg:table-cell ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Category
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden xl:table-cell ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Dosage Form
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden sm:table-cell ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Quantity
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden lg:table-cell ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Supplier
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden md:table-cell ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Unit Price
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden md:table-cell ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Sell Price
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden sm:table-cell ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Expiry
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentMedicines.length > 0 ? (
                  currentMedicines.map((med, index) => {
                    const rowNumber = startIndex + index + 1;
                    return (
                      <tr
                        key={med.id || `row-${index}`}
                        className={`${
                          index % 2 === 0
                            ? theme === "dark"
                              ? "bg-gray-900"
                              : "bg-gray-50"
                            : theme === "dark"
                            ? "bg-gray-800"
                            : "bg-white"
                        } transition-colors duration-200 ${
                          theme === "dark"
                            ? "hover:bg-[#4B5563]"
                            : "hover:bg-[#f7f7f7]"
                        }`}
                        data-row={rowNumber}
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
                          {med.medicine_name}
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
                          {med.brand_name || "N/A"}
                        </td>
                        <td
                          className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden lg:table-cell ${
                            theme === "dark"
                              ? "text-gray-300 border-gray-700"
                              : "text-gray-700 border-gray-200"
                          }`}
                        >
                          {med.category.name}
                        </td>
                        <td
                          className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden xl:table-cell ${
                            theme === "dark"
                              ? "text-gray-300 border-gray-700"
                              : "text-gray-700 border-gray-200"
                          }`}
                        >
                          {med.dosage_form.name}
                        </td>
                        <td
                          className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden sm:table-cell ${
                            theme === "dark"
                              ? "text-gray-300 border-gray-700"
                              : "text-gray-700 border-gray-200"
                          }`}
                        >
                          {med.quantity}
                        </td>
                        <td
                          className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden lg:table-cell ${
                            theme === "dark"
                              ? "text-gray-300 border-gray-700"
                              : "text-gray-700 border-gray-200"
                          }`}
                        >
                          {med.supplier.supplier_name}
                        </td>
                        <td
                          className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden md:table-cell ${
                            theme === "dark"
                              ? "text-gray-300 border-gray-700"
                              : "text-gray-700 border-gray-200"
                          }`}
                        >
                          {med.unit_price}
                        </td>
                        <td
                          className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden md:table-cell ${
                            theme === "dark"
                              ? "text-gray-300 border-gray-700"
                              : "text-gray-700 border-gray-200"
                          }`}
                        >
                          {med.sell_price || "N/A"}
                        </td>
                        <td
                          className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden sm:table-cell ${
                            theme === "dark"
                              ? "text-gray-300 border-gray-700"
                              : "text-gray-700 border-gray-200"
                          }`}
                        >
                          {formatEAT(med.expire_date)}
                        </td>
                        <td
                          className={`border-b border-gray-300 px-4 py-3 flex flex-wrap gap-2 items-center justify-start ${
                            theme === "dark"
                              ? "border-gray-700"
                              : "border-gray-200"
                          }`}
                        >
                          <button
                            key={`view-${med.id || index}`}
                            onClick={() => handleView(med)}
                            className={actionButtonClass}
                            title="View"
                            aria-label={`View medicine ${med.medicine_name}`}
                          >
                            <HiEye size={18} />
                          </button>
                          {user?.role === "MANAGER" && (
                            <>
                              <button
                                key={`edit-${med.id || index}`}
                                onClick={() => handleEdit(med)}
                                className={actionButtonClass}
                                title="Edit"
                                aria-label={`Edit medicine ${med.medicine_name}`}
                              >
                                <HiPencil size={18} />
                              </button>
                              <button
                                key={`delete-${med.id || index}`}
                                onClick={() => openDeleteModal(med.id)}
                                className={actionButtonClass}
                                title="Delete"
                                aria-label={`Delete medicine ${med.medicine_name}`}
                              >
                                <HiTrash size={18} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="12"
                      className={`border-b border-gray-300 px-4 py-3 text-center text-sm sm:text-base ${
                        theme === "dark"
                          ? "text-gray-300 border-gray-700 bg-gray-900"
                          : "text-gray-600 border-gray-200 bg-white"
                      }`}
                    >
                      No medicines found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-md transition-colors duration-200 ${
                theme === "dark"
                  ? "bg-gray-800 text-teal-400 hover:bg-[#4B5563]"
                  : "bg-gray-100 text-teal-600 hover:bg-[#f7f7f7]"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <HiChevronLeft size={20} />
            </button>
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(page)}
                className={`px-3 sm:px-4 py-2 rounded-md font-medium text-sm sm:text-base transition-colors duration-200 ${
                  currentPage === page
                    ? "bg-teal-600 text-white"
                    : theme === "dark"
                    ? "bg-gray-800 text-teal-400 hover:bg-[#4B5563]"
                    : "bg-gray-100 text-teal-600 hover:bg-[#f7f7f7]"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md transition-colors duration-200 ${
                theme === "dark"
                  ? "bg-gray-800 text-teal-400 hover:bg-[#4B5563]"
                  : "bg-gray-100 text-teal-600 hover:bg-[#f7f7f7]"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <HiChevronRight size={20} />
            </button>
          </div>
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

export default MedicineList;
