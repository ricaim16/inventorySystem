import { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  getAllSuppliers,
  getSupplierCredits,
  deleteSupplierCredit,
} from "../../../api/supplierApi";
import SupplierCreditForm from "./SupplierCreditForm";
import { jwtDecode } from "jwt-decode";
import { FiChevronLeft, FiChevronRight, FiAlertCircle } from "react-icons/fi";
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
      setSuppliers(supplierList);
      if (supplierList.length > 0) {
        const initialSupplierId =
          defaultSupplierId &&
          supplierList.find((supp) => supp.id === defaultSupplierId)
            ? defaultSupplierId
            : supplierList[0].id;
        setSelectedSupplierId(initialSupplierId);
        fetchCredits(initialSupplierId);
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
    try {
      await deleteSupplierCredit(id);
      fetchCredits(selectedSupplierId);
      setError(null);
    } catch (err) {
      setError("Failed to delete credit: " + (err.message || "Unknown error"));
    }
    setShowDeleteModal(false);
    setCreditIdToDelete(null);
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

  const handleSupplierChange = (e) => {
    const supplierId = e.target.value;
    setSelectedSupplierId(supplierId);
    if (supplierId) fetchCredits(supplierId);
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

  // Pagination logic
  const totalPages = Math.ceil(credits.length / itemsPerPage);
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
        theme === "dark" ? "bg-gray-900" : "bg-[#F7F7F7]"
      }`}
    >
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2
          className={`text-xl sm:text-2xl md:text-3xl font-bold text-center ${
            theme === "dark" ? "text-gray-100" : "text-gray-800"
          }`}
        >
          Supplier Credits
        </h2>
      </div>

      {loading && (
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F7F7F7]"></div>
        </div>
      )}

      {error && (
        <div
          className={`mb-4 flex flex-col sm:flex-row items-center justify-between p-3 rounded ${
            theme === "dark"
              ? "bg-red-900 text-red-200 border border-red-700"
              : "bg-red-100 text-red-700 border border-red-400"
          }`}
        >
          <span className="text-xs sm:text-sm">{error}</span>
          <button
            onClick={() => fetchSuppliers(selectedSupplierId)}
            className={`mt-2 sm:mt-0 px-4 py-1 rounded text-white text-xs sm:text-sm ${
              theme === "dark"
                ? "bg-blue-700 hover:bg-blue-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            Retry
          </button>
        </div>
      )}

      <div className="mb-6 space-y-4">
        <label
          className={`block text-sm font-medium ${
            theme === "dark" ? "text-gray-300" : "text-gray-600"
          } mb-2`}
        >
          Search Supplier by Name
        </label>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search suppliers..."
            className={`w-full sm:w-64 p-2 border rounded focus:outline-none text-sm font-semibold ${
              theme === "dark"
                ? "bg-gray-800 border-gray-600 text-gray-200 hover:border-gray-400 focus:border-gray-400"
                : "bg-[#F7F7F7] border-gray-300 text-gray-600 hover:border-gray-500 focus:border-gray-500"
            }`}
            disabled={loading || suppliers.length === 0}
          />
          <select
            value={selectedSupplierId}
            onChange={handleSupplierChange}
            className={`w-full sm:w-64 p-2 border rounded focus:outline-none text-sm font-semibold ${
              theme === "dark"
                ? "bg-gray-800 border-gray-600 text-gray-200 hover:border-gray-400 focus:border-gray-400"
                : "bg-[#F7F7F7] border-gray-300 text-gray-600 hover:border-gray-500 focus:border-gray-500"
            }`}
            disabled={loading || suppliers.length === 0}
          >
            <option value="">Select a supplier</option>
            {filteredSuppliers.map((supp) => (
              <option key={supp.id} value={supp.id}>
                {supp.supplier_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedSupplierId ? (
        <>
          <button
            onClick={handleAddCreditClick}
            className={`bg-[#10B981] text-white px-3 py-1.5 rounded mb-4 sm:mb-6 hover:bg-[#0ea271] transition duration-300 text-xs sm:text-sm md:text-base ${
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
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
              <div
                className={`p-4 sm:p-6 rounded-lg shadow-lg w-11/12 max-w-sm ${
                  theme === "dark"
                    ? "bg-gray-800 text-gray-200"
                    : "bg-[#F7F7F7] text-gray-800"
                }`}
              >
                <h3
                  className={`text-lg font-bold mb-4 text-center ${
                    theme === "dark" ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  Credit Details
                </h3>
                <div className="space-y-2 text-sm">
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
                    {viewCredit.payment_status || "N/A"}
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
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setIsViewOpen(false)}
                    className={`py-2 px-4 rounded text-white text-sm font-semibold ${
                      theme === "dark"
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-500 hover:bg-gray-600"
                    }`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {showDeleteModal && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
              <div
                className={`p-4 sm:p-6 rounded-lg shadow-lg w-11/12 max-w-sm ${
                  theme === "dark"
                    ? "bg-gray-800 text-gray-200"
                    : "bg-[#E8D7A5] text-gray-800"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="mb-3">
                    <FiAlertCircle
                      size={24}
                      className={`${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    />
                  </div>
                  <p
                    className={`text-sm sm:text-base mb-4 text-center font-semibold ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    Are you sure you want to delete this credit?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
                    <button
                      onClick={() => handleDelete(creditIdToDelete)}
                      className={`py-2 px-4 rounded text-white text-sm sm:text-base font-semibold ${
                        theme === "dark"
                          ? "bg-red-700 hover:bg-red-600"
                          : "bg-red-500 hover:bg-red-600"
                      }`}
                    >
                      Yes, I'm sure
                    </button>
                    <button
                      onClick={closeDeleteModal}
                      className={`py-2 px-4 font-semibold text-sm sm:text-base ${
                        theme === "dark"
                          ? "text-gray-200 hover:text-gray-100"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      No, cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table
              className={`w-full border-collapse text-[0.65rem] sm:text-xs md:text-sm ${
                theme === "dark" ? "border-gray-600" : "border-gray-300"
              }`}
            >
              <thead>
                <tr
                  className={`${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                  }`}
                >
                  <th
                    className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[60px]`}
                  >
                    No.
                  </th>
                  <th
                    className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[150px]`}
                  >
                    Supplier
                  </th>
                  <th
                    className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[100px]`}
                  >
                    Credit
                  </th>
                  <th
                    className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[100px]`}
                  >
                    Paid
                  </th>
                  <th
                    className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[100px]`}
                  >
                    Unpaid
                  </th>
                  <th
                    className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[150px]`}
                  >
                    Medicine
                  </th>
                  <th
                    className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[100px]`}
                  >
                    Method
                  </th>
                  <th
                    className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[150px]`}
                  >
                    Description
                  </th>
                  <th
                    className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[100px]`}
                  >
                    Status
                  </th>
                  <th
                    className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[100px]`}
                  >
                    File
                  </th>
                  <th
                    className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[150px]`}
                  >
                    Credit Date
                  </th>
                  <th
                    className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[150px]`}
                  >
                    Updated
                  </th>
                  {userRole === "MANAGER" && (
                    <th
                      className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                        theme === "dark" ? "text-gray-200" : "text-gray-800"
                      } w-[100px]`}
                    >
                      Created By
                    </th>
                  )}
                  {userRole === "MANAGER" && (
                    <th
                      className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                        theme === "dark" ? "text-gray-200" : "text-gray-800"
                      } w-[100px]`}
                    >
                      Updated By
                    </th>
                  )}
                  <th
                    className={`border p-1 sm:p-2 text-left font-bold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[150px]`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentCredits.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={userRole === "MANAGER" ? 15 : 13}
                      className={`border p-1 sm:p-2 text-center ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      No credits found.
                    </td>
                  </tr>
                ) : (
                  currentCredits.map((cred, index) => (
                    <tr
                      key={cred.id}
                      className={`border-b ${
                        cred.payment_status === "UNPAID" &&
                        isOverdueByTwoMonths(cred.credit_date)
                          ? theme === "dark"
                            ? "bg-red-900"
                            : "bg-red-100"
                          : theme === "dark"
                          ? "border-gray-600 hover:bg-gray-700"
                          : "border-gray-300 hover:bg-[#eaeaea]"
                      }`}
                    >
                      <td
                        className={`border p-1 sm:p-2 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {startIndex + index + 1}
                      </td>
                      <td
                        className={`border p-1 sm:p-2 truncate ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {cred.supplier?.supplier_name || "N/A"}
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
                        className={`border p-1 sm:p-2 truncate ${
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
                        className={`border p-1 sm:p-2 truncate ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {cred.description || "N/A"}
                      </td>
                      <td
                        className={`border p-1 sm:p-2 ${
                          cred.payment_status === "UNPAID"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {cred.payment_status || "N/A"}
                      </td>
                      <td
                        className={`border p-1 sm:p-2 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
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
                        className={`border p-1 sm:p-2 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {cred.credit_date ? formatEAT(cred.credit_date) : "N/A"}
                      </td>
                      <td
                        className={`border p-1 sm:p-2 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {cred.updated_at ? formatEAT(cred.updated_at) : "N/A"}
                      </td>
                      {userRole === "MANAGER" && (
                        <td
                          className={`border p-1 sm:p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {cred.createdBy?.username || "N/A"}
                        </td>
                      )}
                      {userRole === "MANAGER" && (
                        <td
                          className={`border p-1 sm:p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {cred.updatedBy?.username || "N/A"}
                        </td>
                      )}
                      <td className="border p-1 sm:p-2 flex flex-wrap gap-1 sm:gap-2">
                        <button
                          onClick={() => handleView(cred)}
                          className={`p-1 sm:px-2 sm:py-1 rounded text-white text-[0.65rem] sm:text-xs md:text-sm ${
                            theme === "dark"
                              ? "bg-blue-700 hover:bg-blue-600"
                              : "bg-blue-500 hover:bg-blue-600"
                          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={loading}
                          title="View"
                          aria-label={`View credit for ${
                            cred.supplier?.supplier_name || "N/A"
                          }`}
                        >
                          View
                        </button>
                        {userRole === "MANAGER" && (
                          <>
                            <button
                              onClick={() => handleEdit(cred)}
                              className={`p-1 sm:px-2 sm:py-1 rounded text-white text-[0.65rem] sm:text-xs md:text-sm ${
                                theme === "dark"
                                  ? "bg-yellow-700 hover:bg-yellow-600"
                                  : "bg-yellow-500 hover:bg-yellow-600"
                              } ${
                                loading ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              disabled={loading}
                              title="Edit"
                              aria-label={`Edit credit for ${
                                cred.supplier?.supplier_name || "N/A"
                              }`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteModal(cred.id)}
                              className={`p-1 sm:px-2 sm:py-1 rounded text-white text-[0.65rem] sm:text-xs md:text-sm ${
                                theme === "dark"
                                  ? "bg-red-700 hover:bg-red-600"
                                  : "bg-red-500 hover:bg-red-600"
                              } ${
                                loading ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              disabled={loading}
                              title="Delete"
                              aria-label={`Delete credit for ${
                                cred.supplier?.supplier_name || "N/A"
                              }`}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr
                  className={`font-bold ${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <td
                    className={`border p-1 sm:p-2 ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    Total
                  </td>
                  <td
                    className={`border p-1 sm:p-2 ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    }`}
                  ></td>
                  <td
                    className={`border p-1 sm:p-2 ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    {totalCreditAmount.toFixed(2)}
                  </td>
                  <td
                    className={`border p-1 sm:p-2 ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    {totalPaidAmount.toFixed(2)}
                  </td>
                  <td
                    className={`border p-1 sm:p-2 ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    {totalUnpaidAmount.toFixed(2)}
                  </td>
                  <td
                    colSpan={userRole === "MANAGER" ? 10 : 8}
                    className={`border p-1 sm:p-2 ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    }`}
                  ></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center space-x-1 flex-wrap gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-2 py-1 border rounded text-xs sm:text-sm ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <FiChevronLeft size={14} />
              </button>
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 border rounded text-xs sm:text-sm ${
                    currentPage === page
                      ? "bg-[#8B1E1E] text-white"
                      : theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                      : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-2 py-1 border rounded text-xs sm:text-sm ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <FiChevronRight size={14} />
              </button>
            </div>
          )}

          {overdueCredits.length > 0 && (
            <div
              className={`mt-4 p-4 rounded ${
                theme === "dark"
                  ? "bg-red-900 border border-red-700"
                  : "bg-red-100 border border-red-400"
              }`}
            >
              <h3
                className={`text-lg font-semibold ${
                  theme === "dark" ? "text-red-200" : "text-red-800"
                }`}
              >
                Overdue Credits Alert (2+ Months)
              </h3>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-red-300" : "text-red-700"
                }`}
              >
                The following credits are unpaid for 2 months or more:
              </p>
              <ul className="list-disc pl-5 text-sm">
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
            className={`p-3 rounded text-sm ${
              theme === "dark"
                ? "bg-yellow-900 text-yellow-200 border border-yellow-700"
                : "bg-yellow-100 text-yellow-700 border border-yellow-400"
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
