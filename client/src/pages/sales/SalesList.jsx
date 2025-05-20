import { useState, useEffect } from "react";
import { getAllSales, deleteSale } from "../../api/salesApi";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  HiSearch,
  HiChevronLeft,
  HiChevronRight,
  HiEye,
  HiPencil,
  HiTrash,
  HiX,
  HiExclamationCircle,
} from "react-icons/hi";
import SalesEntryForm from "./SalesEntryForm";

const SalesList = ({ showToast }) => {
  const [sales, setSales] = useState([]);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [saleToView, setSaleToView] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saleIdToDelete, setSaleIdToDelete] = useState(null);
  const itemsPerPage = 10;
  const { user } = useAuth();
  const { theme } = useTheme();

  const formatEAT = (date) => {
    const options = {
      timeZone: "Africa/Addis_Ababa",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(date).toLocaleString("en-US", options);
  };

  useEffect(() => {
    if (!user) {
      setError("Please log in to view sales.");
      return;
    }
    fetchSales();
  }, [user]);

  const fetchSales = async () => {
    try {
      const data = await getAllSales();
      setSales(
        data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      );
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch sales: " + err.message
      );
    }
  };

  const handleView = (sale) => {
    setSaleToView(sale);
    setIsViewOpen(true);
    setSelectedSale(null);
  };

  const handleEdit = (sale) => {
    setSelectedSale(sale);
    setIsViewOpen(false);
  };

  const handleDelete = (id) => {
    setSaleIdToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteSale(saleIdToDelete);
      setSales(sales.filter((sale) => sale.id !== saleIdToDelete));
      showToast("Sale deleted successfully!");
      setError(null);
      fetchSales();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete sale: " + err.message
      );
    }
    setShowDeleteModal(false);
    setSaleIdToDelete(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSaleIdToDelete(null);
  };

  const handleSave = (updatedSale) => {
    setSales((prevSales) =>
      prevSales.map((sale) =>
        sale.id === updatedSale.id ? { ...sale, ...updatedSale } : sale
      )
    );
    setSelectedSale(null);
    fetchSales();
    showToast("Sale updated successfully!");
  };

  const handleCancel = () => {
    setSelectedSale(null);
  };

  const months = [
    { value: "", label: "Select Month" },
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

  const years = [
    { value: "", label: "Select Year" },
    ...Array.from({ length: 10 }, (_, i) => {
      const year = new Date().getFullYear() - i;
      return { value: year.toString(), label: year.toString() };
    }),
  ];

  const filteredSales = sales.filter((sale) => {
    const matchesSearch = [
      sale.medicine?.medicine_name,
      sale.product_batch_number,
      formatEAT(sale.sealed_date),
    ]
      .filter(Boolean)
      .some((field) =>
        field.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (!matchesSearch) return false;

    const saleDate = new Date(sale.sealed_date);
    if (filterType === "Monthly" && filterMonth && filterYear) {
      return (
        saleDate.getMonth() === parseInt(filterMonth) &&
        saleDate.getFullYear() === parseInt(filterYear)
      );
    }
    if (filterType === "Yearly" && filterYear) {
      return saleDate.getFullYear() === parseInt(filterYear);
    }
    return true;
  });

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSales = filteredSales.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    if (filteredSales.length === 0) {
      setCurrentPage(1);
    }
  }, [filteredSales, totalPages, currentPage]);

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

  const actionButtonClass = `p-1 sm:p-2 rounded-md transition-colors duration-200 ${
    theme === "dark"
      ? "text-gray-200 hover:bg-gray-700"
      : "text-gray-900 hover:bg-gray-200"
  }`;

  return (
    <div
      className={`p-4 sm:p-6 md:p-8 rounded-xl shadow-lg w-full font-sans transition-all duration-300 ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
    >
      <h2
        className={`text-2xl sm:text-3xl font-semibold mb-6 text-[#10B981] ${
          theme === "dark" ? "text-gray-100" : "text-gray-900"
        }`}
      >
        Sales List
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
          <button
            onClick={fetchSales}
            className={`ml-4 py-1 px-4 rounded text-white text-sm ${
              theme === "dark"
                ? "bg-blue-700 hover:bg-blue-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            Retry
          </button>
        </div>
      )}

      {selectedSale && (
        <div className="mb-6">
          <SalesEntryForm
            sale={selectedSale}
            onSave={handleSave}
            onCancel={handleCancel}
            showToast={showToast}
          />
        </div>
      )}

      {isViewOpen && saleToView && !selectedSale && (
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
              setSaleToView(null);
            }}
            className={`absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300 transform hover:scale-105 ${
              theme === "dark"
                ? "text-gray-300 bg-gray-700/50 hover:bg-red-600/80 hover:text-white"
                : "text-gray-600 bg-gray-100/50 hover:bg-red-500 hover:text-white"
            }`}
            aria-label="Close sale details"
          >
            <HiX size={24} />
          </button>
          <h3
            className={`text-2xl sm:text-3xl font-semibold mb-8 text-left text-[#10B981] ${
              theme === "dark" ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Sale Details
          </h3>
          <div className="space-y-10">
            <div className="border-b-2 border-gray-300 pb-8">
              <h4
                className={`text-lg sm:text-xl font-semibold mb-6 text-[#5DB5B5]`}
              >
                Sale Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Customer
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {saleToView.customer?.name || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Medicine
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {saleToView.medicine?.medicine_name || "Unknown"}
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
                    {saleToView.dosage_form?.name || "N/A"}
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
                    {saleToView.quantity || 0}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Price
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {saleToView.price || 0}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Total Sale
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {(saleToView.price * saleToView.quantity).toFixed(2) || 0}
                  </span>
                </div>
              </div>
            </div>
            <div className="pb-8">
              <h4
                className={`text-lg sm:text-xl font-semibold mb-6 text-[#5DB5B5]`}
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
                    Payment Method
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {saleToView.payment_method || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Prescription
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {saleToView.prescription ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Product Name
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {saleToView.product_name || "N/A"}
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
                    {saleToView.product_batch_number || "Not Assigned"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Sale Date
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {formatEAT(saleToView.sealed_date)}
                  </span>
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
                        {saleToView.createdBy?.username || "N/A"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`font-semibold text-sm sm:text-base ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Updated By
                      </span>
                      <span
                        className={`text-sm sm:text-base ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {saleToView.updatedBy?.username || "Not Updated"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isViewOpen && !selectedSale && (
        <>
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-start w-full max-w-4xl gap-4">
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search by Medicine, Batch, or Date..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full p-2 pl-8 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition-all duration-200 min-w-[150px] ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                }`}
              />
              <HiSearch
                className={`absolute left-2 top-1/2 transform -translate-y-1/2 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
                size={16}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setFilterMonth("");
                  setFilterYear("");
                  setCurrentPage(1);
                }}
                className={`p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base transition-all duration-200 min-w-[150px] ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600 text-gray-200"
                    : "bg-white border-gray-200 text-gray-800"
                }`}
              >
                <option value="All">All Sales</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
              {filterType === "Monthly" && (
                <>
                  <select
                    value={filterMonth}
                    onChange={(e) => {
                      setFilterMonth(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base transition-all duration-200 min-w-[150px] ${
                      theme === "dark"
                        ? "bg-gray-800 border-gray-600 text-gray-200"
                        : "bg-white border-gray-200 text-gray-800"
                    }`}
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterYear}
                    onChange={(e) => {
                      setFilterYear(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base transition-all duration-200 min-w-[150px] ${
                      theme === "dark"
                        ? "bg-gray-800 border-gray-600 text-gray-200"
                        : "bg-white border-gray-200 text-gray-800"
                    }`}
                  >
                    {years.map((year) => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
              {filterType === "Yearly" && (
                <select
                  value={filterYear}
                  onChange={(e) => {
                    setFilterYear(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base transition-all duration-200 min-w-[150px] ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-600 text-gray-200"
                      : "bg-white border-gray-200 text-gray-800"
                  }`}
                >
                  {years.map((year) => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="overflow-x-auto min-w-full rounded-lg shadow-sm border border-gray-200">
            <table
              className={`w-full border-collapse text-sm md:text-base font-sans table-auto ${
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
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider min-w-[60px] ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    No.
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider min-w-[120px] ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Customer
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider min-w-[120px] ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Medicine
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden sm:table-cell min-w-[100px] ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Dosage Form
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider min-w-[80px] ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Quantity
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden md:table-cell min-w-[80px] ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                  Sell  Price
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden lg:table-cell min-w-[100px] ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Payment
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden md:table-cell min-w-[100px] ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Batch No
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden sm:table-cell min-w-[100px] ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Sale Date
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider min-w-[120px] ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentSales.length > 0 ? (
                  currentSales.map((sale, index) => {
                    const rowNumber = startIndex + index + 1;
                    return (
                      <tr
                        key={sale.id || `row-${index}`}
                        className={`transition-colors duration-200 ${
                          theme === "dark"
                            ? "hover:bg-gray-800"
                            : "hover:bg-gray-100"
                        }`}
                        data-row={rowNumber}
                      >
                        <td
                          className={`border-b border-gray-300 px-4 py-3 sm:px-6 sm:py-4 text-sm md:text-base truncate ${
                            theme === "dark"
                              ? "text-gray-200 border-gray-700"
                              : "text-gray-900 border-gray-200"
                          }`}
                        >
                          {rowNumber}
                        </td>
                        <td
                          className={`border-b border-gray-300 px-4 py-3 sm:px-6 sm:py-4 text-sm md:text-base truncate ${
                            theme === "dark"
                              ? "text-gray-200 border-gray-700"
                              : "text-gray-900 border-gray-200"
                          }`}
                        >
                          {sale.customer?.name || "N/A"}
                        </td>
                        <td
                          className={`border-b border-gray-300 px-4 py-3 sm:px-6 sm:py-4 text-sm md:text-base truncate ${
                            theme === "dark"
                              ? "text-gray-200 border-gray-700"
                              : "text-gray-900 border-gray-200"
                          }`}
                        >
                          {sale.medicine?.medicine_name || "Unknown"}
                        </td>
                        <td
                          className={`border-b border-gray-300 px-4 py-3 sm:px-6 sm:py-4 text-sm md:text-base hidden sm:table-cell truncate ${
                            theme === "dark"
                              ? "text-gray-200 border-gray-700"
                              : "text-gray-900 border-gray-200"
                          }`}
                        >
                          {sale.dosage_form?.name || "N/A"}
                        </td>
                        <td
                          className={`border-b border-gray-300 px-4 py-3 sm:px-6 sm:py-4 text-sm md:text-base truncate ${
                            theme === "dark"
                              ? "text-gray-200 border-gray-700"
                              : "text-gray-900 border-gray-200"
                          }`}
                        >
                          {sale.quantity || 0}
                        </td>
                        <td
                          className={`border-b border-gray-300 px-4 py-3 sm:px-6 sm:py-4 text-sm md:text-base hidden md:table-cell truncate ${
                            theme === "dark"
                              ? "text-gray-200 border-gray-700"
                              : "text-gray-900 border-gray-200"
                          }`}
                        >
                          {sale.price || 0}
                        </td>
                        <td
                          className={`border-b border-gray-300 px-4 py-3 sm:px-6 sm:py-4 text-sm md:text-base hidden lg:table-cell truncate ${
                            theme === "dark"
                              ? "text-gray-200 border-gray-700"
                              : "text-gray-900 border-gray-200"
                          }`}
                        >
                          {sale.payment_method || "N/A"}
                        </td>
                        <td
                          className={`border-b border-gray-300 px-4 py-3 sm:px-6 sm:py-4 text-sm md:text-base hidden md:table-cell truncate ${
                            theme === "dark"
                              ? "text-gray-200 border-gray-700"
                              : "text-gray-900 border-gray-200"
                          }`}
                        >
                          {sale.product_batch_number || "Not Assigned"}
                        </td>
                        <td
                          className={`border-b border-gray-300 px-4 py-3 sm:px-6 sm:py-4 text-sm md:text-base hidden sm:table-cell truncate whitespace-nowrap ${
                            theme === "dark"
                              ? "text-gray-200 border-gray-700"
                              : "text-gray-900 border-gray-200"
                          }`}
                        >
                          {formatEAT(sale.sealed_date)}
                        </td>
                        <td
                          className={`border-b border-gray-300 px-4 py-3 sm:px-6 sm:py-4 flex flex-nowrap space-x-2 items-center justify-start ${
                            theme === "dark"
                              ? "border-gray-700"
                              : "border-gray-200"
                          }`}
                        >
                          <button
                            key={`view-${sale.id || index}`}
                            onClick={() => handleView(sale)}
                            className={actionButtonClass}
                            title="View"
                            aria-label={`View sale ${sale.id}`}
                          >
                            <HiEye size={18} />
                          </button>
                          {["MANAGER", "EMPLOYEE"].includes(
                            user?.role.toUpperCase()
                          ) && (
                            <button
                              key={`edit-${sale.id || index}`}
                              onClick={() => handleEdit(sale)}
                              className={actionButtonClass}
                              title="Edit"
                              aria-label={`Edit sale ${sale.id}`}
                            >
                              <HiPencil size={18} />
                            </button>
                          )}
                          {user?.role.toUpperCase() === "MANAGER" && (
                            <button
                              key={`delete-${sale.id || index}`}
                              onClick={() => handleDelete(sale.id)}
                              className={actionButtonClass}
                              title="Delete"
                              aria-label={`Delete sale ${sale.id}`}
                            >
                              <HiTrash size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={
                        ["MANAGER", "EMPLOYEE"].includes(
                          user?.role.toUpperCase()
                        )
                          ? 10
                          : 9
                      }
                      className={`border-b border-gray-300 px-4 py-3 sm:px-6 sm:py-4 text-center text-sm md:text-base ${
                        theme === "dark"
                          ? "text-gray-200 border-gray-700 bg-gray-900"
                          : "text-gray-900 border-gray-200 bg-white"
                      }`}
                    >
                      No sales found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 0 && (
            <div className="mt-6 flex flex-wrap justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md transition-colors duration-200 min-w-[40px] min-h-[40px] ${
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
                  className={`px-3 sm:px-4 py-2 rounded-md font-medium text-sm md:text-base transition-colors duration-200 min-w-[40px] min-h-[40px] ${
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
                className={`p-2 rounded-md transition-colors duration-200 min-w-[40px] min-h-[40px] ${
                  theme === "dark"
                    ? "bg-gray-800 text-teal-400 hover:bg-[#4B5563]"
                    : "bg-gray-100 text-teal-600 hover:bg-[#f7f7f7]"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <HiChevronRight size={20} />
              </button>
            </div>
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
                Are you sure you want to delete this sale?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                <button
                  onClick={confirmDelete}
                  className={`py-2 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300 text-sm sm:text-base font-semibold w-full sm:w-auto`}
                  aria-label="Confirm delete sale"
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
                  aria-label="Cancel delete sale"
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

export default SalesList;
