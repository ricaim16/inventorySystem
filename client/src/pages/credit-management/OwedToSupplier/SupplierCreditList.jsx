import React, { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  getAllSuppliers,
  getSupplierCredits,
  deleteSupplierCredit,
} from "../../../api/supplierApi";
import SupplierCreditForm from "./SupplierCreditForm";
import { jwtDecode } from "jwt-decode";
import {
  HiChevronLeft,
  HiChevronRight,
  HiExclamationCircle,
  HiEye,
  HiPencil,
  HiTrash,
} from "react-icons/hi";
import { useTheme } from "../../../context/ThemeContext";

const SupplierCreditList = () => {
  const { theme } = useTheme();
  const [credits, setCredits] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editCredit, setEditCredit] = useState(null);
  const [viewCredit, setViewCredit] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [overdueCredits, setOverdueCredits] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [creditIdToDelete, setCreditIdToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const itemsPerPage = 10;
  const location = useLocation();

  const formatEAT = useCallback((date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      timeZone: "Africa/Addis_Ababa",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const isOverdueByTwoMonths = useCallback((creditDate) => {
    if (!creditDate) return false;
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    return new Date(creditDate) < twoMonthsAgo;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found. Please log in.");
      return;
    }
    try {
      const decoded = jwtDecode(token);
      setUserRole(decoded.role?.toUpperCase() || null);
    } catch (err) {
      setError("Invalid token format. Please log in again.");
      return;
    }
    const params = new URLSearchParams(location.search);
    const supplierIdFromUrl = params.get("supplierId");
    fetchSuppliers(supplierIdFromUrl);
  }, [location.search]);

  const fetchSuppliers = async (defaultSupplierId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSuppliers();
      const supplierList = Array.isArray(data) ? data : [];
      setSuppliers(
        supplierList.sort((a, b) =>
          a.supplier_name.localeCompare(b.supplier_name)
        )
      );
      if (supplierList.length > 0) {
        const initialSupplierId =
          defaultSupplierId &&
          supplierList.find((supp) => supp.id === defaultSupplierId)
            ? defaultSupplierId
            : "";
        setSelectedSupplierId(initialSupplierId);
        if (initialSupplierId) fetchCredits(initialSupplierId);
      } else {
        setError("No suppliers available. Please add a supplier first.");
        setSelectedSupplierId("");
      }
    } catch (err) {
      setError(
        "Failed to fetch suppliers: " + (err.message || "Unknown error")
      );
      setSelectedSupplierId("");
    } finally {
      setLoading(false);
    }
  };

  const fetchCredits = async (supplierId) => {
    if (!supplierId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSupplierCredits(supplierId);
      const sortedCredits = (
        Array.isArray(data.credits) ? data.credits : []
      ).sort(
        (a, b) => new Date(b.credit_date || 0) - new Date(a.credit_date || 0)
      );
      setCredits(sortedCredits);
      setOverdueCredits(
        sortedCredits.filter(
          (cred) =>
            cred.payment_status === "UNPAID" &&
            isOverdueByTwoMonths(cred.credit_date)
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to fetch credits: " + (err.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) {
      setError("No credit ID provided for deletion.");
      return;
    }
    try {
      await deleteSupplierCredit(id);
      setCredits(credits.filter((cred) => cred.id !== id));
      setOverdueCredits(overdueCredits.filter((cred) => cred.id !== id));
      setError(null);
    } catch (err) {
      setError("Failed to delete credit: " + (err.message || "Unknown error"));
      console.error("Delete error:", err);
    } finally {
      setShowDeleteModal(false);
      setCreditIdToDelete(null);
    }
  };

  const openDeleteModal = (id) => {
    setCreditIdToDelete(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCreditIdToDelete(null);
  };

  const handleSave = useCallback(() => {
    setIsFormOpen(false);
    setEditCredit(null);
    fetchCredits(selectedSupplierId);
    setError(null);
  }, [selectedSupplierId]);

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditCredit(null);
  };

  const handleSupplierChange = (id) => {
    setSelectedSupplierId(id);
    if (id) fetchCredits(id);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleEdit = (credit) => {
    setEditCredit(credit);
    setIsFormOpen(true);
  };

  const handleView = (credit) => {
    setViewCredit(credit);
    setIsViewOpen(true);
  };

  const handleAddCreditClick = () => {
    setEditCredit(null);
    setIsFormOpen(true);
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

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier?.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(credits.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCredits = credits.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    if (credits.length === 0) {
      setCurrentPage(1);
    }
  }, [credits, totalPages, currentPage]);

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
        Loading credits...
      </div>
    );
  }

  return (
    <div
      className={`p-4 sm:p-6 md:p-8 rounded-xl shadow-lg w-full font-sans transition-all duration-300 ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h2
          className={`text-2xl sm:text-3xl font-semibold ${
            theme === "dark" ? "text-gray-100" : "text-gray-900"
          }`}
          style={{ color: "#10B981" }}
        >
          Supplier Credits
        </h2>
      </div>

      {error && (
        <div
          className={`${
            theme === "dark"
              ? "text-red-400 bg-red-900/20"
              : "text-red-600 bg-red-100"
          } mb-6 flex items-center justify-between text-base p-4 rounded-lg`}
        >
          <span>{error}</span>
          <button
            onClick={() => fetchSuppliers(selectedSupplierId)}
            className={`px-4 py-1 rounded text-white text-sm sm:text-base ${
              theme === "dark"
                ? "bg-blue-700 hover:bg-blue-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative w-full sm:w-64">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full p-2 pl-3 pr-10 border rounded text-sm flex items-center justify-between ${
              theme === "dark"
                ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                : "bg-white text-black border-gray-300 hover:bg-gray-100"
            } ${loading || suppliers.length === 0 ? "opacity-50" : ""}`}
            disabled={loading || suppliers.length === 0}
          >
            <span>
              {selectedSupplierId
                ? suppliers.find((supp) => supp.id === selectedSupplierId)
                    ?.supplier_name || "Select a supplier"
                : "Select a supplier"}
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
                  placeholder="Search by Supplier Name..."
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
                  onClick={() => {
                    handleSupplierChange("");
                    setIsDropdownOpen(false);
                  }}
                >
                  Select a supplier
                </li>
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((supp) => (
                    <li
                      key={supp.id}
                      className={`px-4 py-2 text-sm cursor-pointer ${
                        theme === "dark"
                          ? "hover:bg-gray-700 text-white"
                          : "hover:bg-gray-100 text-black"
                      } ${selectedSupplierId === supp.id ? "font-bold" : ""}`}
                      onClick={() => {
                        handleSupplierChange(supp.id);
                        setIsDropdownOpen(false);
                      }}
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
                    No suppliers found
                  </li>
                ) : null}
              </ul>
            </div>
          )}
        </div>
      </div>

      {selectedSupplierId ? (
        <>
          <button
            onClick={handleAddCreditClick}
            className={`px-4 py-2 rounded-lg text-white text-sm sm:text-base font-semibold bg-teal-600 hover:bg-teal-700 transition duration-300 mb-6 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            Add Credit
          </button>

          {isFormOpen && (
            <SupplierCreditForm
              supplierId={selectedSupplierId}
              credit={editCredit}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}

          {isViewOpen && viewCredit && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div
                className={`p-6 rounded-xl shadow-lg w-11/12 max-w-md ${
                  theme === "dark"
                    ? "bg-gray-800 text-gray-200 border-gray-700"
                    : "bg-white text-gray-800 border-gray-200"
                } border transition-all duration-300`}
              >
                <h3
                  className={`text-lg font-bold mb-4 text-center ${
                    theme === "dark" ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  Credit Details
                </h3>
                <div className="space-y-2 text-sm sm:text-base">
                  <p>
                    <strong>Supplier:</strong>{" "}
                    {viewCredit.supplier?.supplier_name || "N/A"}
                  </p>
                  <p>
                    <strong>Credit Amount:</strong>{" "}
                    {parseFloat(viewCredit.credit_amount || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Paid Amount:</strong>{" "}
                    {parseFloat(viewCredit.paid_amount || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Unpaid Amount:</strong>{" "}
                    {parseFloat(viewCredit.unpaid_amount || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Medicine Name:</strong>{" "}
                    {viewCredit.medicine_name || "N/A"}
                  </p>
                  <p>
                    <strong>Payment Method:</strong>{" "}
                    {viewCredit.payment_method || "N/A"}
                  </p>
                  <p>
                    <strong>Description:</strong>{" "}
                    {viewCredit.description || "N/A"}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={
                        viewCredit.payment_status === "UNPAID"
                          ? theme === "dark"
                            ? "text-red-400"
                            : "text-red-500"
                          : theme === "dark"
                          ? "text-green-400"
                          : "text-green-500"
                      }
                    >
                      {viewCredit.payment_status || "N/A"}
                    </span>
                  </p>
                  {viewCredit.payment_file && (
                    <p>
                      <strong>Payment File:</strong>{" "}
                      <a
                        href={`http://localhost:8080/uploads/${viewCredit.payment_file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View File
                      </a>
                    </p>
                  )}
                  <p>
                    <strong>Credit Date:</strong>{" "}
                    {formatEAT(viewCredit.credit_date)}
                  </p>
                  <p>
                    <strong>Last Updated:</strong>{" "}
                    {formatEAT(viewCredit.updated_at)}
                  </p>
                  {userRole === "MANAGER" && (
                    <>
                      <p>
                        <strong>Created By:</strong>{" "}
                        {viewCredit.createdBy?.username || "N/A"}
                      </p>
                      <p>
                        <strong>Updated By:</strong>{" "}
                        {viewCredit.updatedBy?.username || "N/A"}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setIsViewOpen(false)}
                    className={`py-2 px-6 rounded-lg font-semibold text-sm sm:text-base transition-colors duration-200 ${
                      theme === "dark"
                        ? "bg-gray-700 text-gray-200 hover:bg-[#4B5563]"
                        : "bg-gray-200 text-gray-600 hover:bg-[#f7f7f7]"
                    }`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
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
                      className={
                        theme === "dark" ? "text-red-400" : "text-red-500"
                      }
                    />
                  </div>
                  <p
                    className={`text-sm sm:text-base mb-6 text-center font-semibold ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    Are you sure you want to delete this credit?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                    <button
                      onClick={() => handleDelete(creditIdToDelete)}
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
                    Supplier
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Credit
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Paid
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Unpaid
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Medicine
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Method
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Status
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    File
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
                {currentCredits.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base text-center ${
                        theme === "dark"
                          ? "text-gray-400 border-gray-700"
                          : "text-gray-600 border-gray-200"
                      }`}
                    >
                      No credits found.
                    </td>
                  </tr>
                ) : (
                  currentCredits.map((cred, index) => (
                    <tr
                      key={cred.id || `row-${index}`}
                      className={`${
                        index % 2 === 0
                          ? theme === "dark"
                            ? "bg-gray-900"
                            : "bg-gray-50"
                          : theme === "dark"
                          ? "bg-gray-800"
                          : "bg-white"
                      } transition-colors duration-200 ${
                        cred.payment_status === "UNPAID" &&
                        isOverdueByTwoMonths(cred.credit_date)
                          ? theme === "dark"
                            ? "bg-red-900/20"
                            : "bg-red-100"
                          : theme === "dark"
                          ? "hover:bg-[#4B5563]"
                          : "hover:bg-[#f7f7f7]"
                      }`}
                    >
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base font-medium ${
                          theme === "dark"
                            ? "text-gray-300 border-gray-700"
                            : "text-gray-700 border-gray-200"
                        }`}
                      >
                        {startIndex + index + 1}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base truncate ${
                          theme === "dark"
                            ? "text-gray-300 border-gray-700"
                            : "text-gray-700 border-gray-200"
                        }`}
                      >
                        {cred.supplier?.supplier_name || "N/A"}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                          theme === "dark"
                            ? "text-gray-300 border-gray-700"
                            : "text-gray-700 border-gray-200"
                        }`}
                      >
                        {parseFloat(cred.credit_amount || 0).toFixed(2)}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                          theme === "dark"
                            ? "text-gray-300 border-gray-700"
                            : "text-gray-700 border-gray-200"
                        }`}
                      >
                        {parseFloat(cred.paid_amount || 0).toFixed(2)}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                          theme === "dark"
                            ? "text-gray-300 border-gray-700"
                            : "text-gray-700 border-gray-200"
                        }`}
                      >
                        {parseFloat(cred.unpaid_amount || 0).toFixed(2)}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base truncate ${
                          theme === "dark"
                            ? "text-gray-300 border-gray-700"
                            : "text-gray-700 border-gray-200"
                        }`}
                      >
                        {cred.medicine_name || "N/A"}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                          theme === "dark"
                            ? "text-gray-300 border-gray-700"
                            : "text-gray-700 border-gray-200"
                        }`}
                      >
                        {cred.payment_method || "N/A"}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                          cred.payment_status === "UNPAID"
                            ? theme === "dark"
                              ? "text-red-400"
                              : "text-red-500"
                            : theme === "dark"
                            ? "text-green-400"
                            : "text-green-500"
                        } ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        {cred.payment_status || "N/A"}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                          theme === "dark"
                            ? "text-gray-300 border-gray-700"
                            : "text-gray-700 border-gray-200"
                        }`}
                      >
                        {cred.payment_file ? (
                          <a
                            href={`http://localhost:8080/uploads/${cred.payment_file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                          theme === "dark"
                            ? "text-gray-300 border-gray-700"
                            : "text-gray-700 border-gray-200"
                        }`}
                      >
                        <div className="flex space-x-2 flex-wrap gap-2">
                          <button
                            onClick={() => handleView(cred)}
                            className={actionButtonClass}
                            title="View"
                            aria-label={`View credit for ${
                              cred.supplier?.supplier_name || "N/A"
                            }`}
                            disabled={loading}
                          >
                            <HiEye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(cred)}
                            className={actionButtonClass}
                            title="Edit"
                            aria-label={`Edit credit for ${
                              cred.supplier?.supplier_name || "N/A"
                            }`}
                            disabled={loading}
                          >
                            <HiPencil size={18} />
                          </button>
                          {userRole === "MANAGER" && (
                            <button
                              onClick={() => openDeleteModal(cred.id)}
                              className={actionButtonClass}
                              title="Delete"
                              aria-label={`Delete credit for ${
                                cred.supplier?.supplier_name || "N/A"
                              }`}
                              disabled={loading}
                            >
                              <HiTrash size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr
                  className={`font-bold ${
                    theme === "dark" ? "bg-gray-800" : "bg-gray-100"
                  }`}
                >
                  <td
                    className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                      theme === "dark"
                        ? "text-gray-200 border-gray-700"
                        : "text-gray-800 border-gray-200"
                    }`}
                  >
                    Total
                  </td>
                  <td
                    className={`border-b border-gray-300 px-4 py-3 ${
                      theme === "dark"
                        ? "text-gray-200 border-gray-700"
                        : "text-gray-800 border-gray-200"
                    }`}
                  ></td>
                  <td
                    className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                      theme === "dark"
                        ? "text-gray-200 border-gray-700"
                        : "text-gray-800 border-gray-200"
                    }`}
                  >
                    {totalCreditAmount.toFixed(2)}
                  </td>
                  <td
                    className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                      theme === "dark"
                        ? "text-gray-200 border-gray-700"
                        : "text-gray-800 border-gray-200"
                    }`}
                  >
                    {totalPaidAmount.toFixed(2)}
                  </td>
                  <td
                    className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                      theme === "dark"
                        ? "text-gray-200 border-gray-700"
                        : "text-gray-800 border-gray-200"
                    }`}
                  >
                    {totalUnpaidAmount.toFixed(2)}
                  </td>
                  <td
                    colSpan={5}
                    className={`border-b border-gray-300 px-4 py-3 ${
                      theme === "dark"
                        ? "text-gray-200 border-gray-700"
                        : "text-gray-800 border-gray-200"
                    }`}
                  ></td>
                </tr>
              </tfoot>
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
                {Math.min(startIndex + itemsPerPage, credits.length)} of{" "}
                {credits.length} credits
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

          {overdueCredits.length > 0 && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                theme === "dark"
                  ? "text-red-400 bg-red-900/20"
                  : "text-red-600 bg-red-100"
              }`}
            >
              <h3
                className={`text-lg font-semibold ${
                  theme === "dark" ? "text-red-400" : "text-red-600"
                }`}
              >
                Overdue Credits Alert (2+ Months)
              </h3>
              <p
                className={`text-sm sm:text-base ${
                  theme === "dark" ? "text-red-400" : "text-red-600"
                }`}
              >
                The following credits are unpaid for 2 months or more:
              </p>
              <ul className="list-disc pl-5 text-sm sm:text-base">
                {overdueCredits.map((cred) => (
                  <li
                    key={cred.id}
                    className={`${
                      theme === "dark" ? "text-red-400" : "text-red-600"
                    }`}
                  >
                    {parseFloat(cred.credit_amount || 0).toFixed(2)} -{" "}
                    {cred.medicine_name || "N/A"} ({cred.description || "N/A"})
                    - Due since: {formatEAT(cred.credit_date)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        !error &&
        !loading && (
          <div
            className={`text-sm sm:text-base text-center ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Please select a supplier to view their credits.
          </div>
        )
      )}
    </div>
  );
};

export default SupplierCreditList;
