import { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  getAllCustomers,
  getCustomerCredits,
  deleteCustomerCredit,
} from "../../../api/customerApi";
import CustomerCreditForm from "./CustomerCreditForm";
import { jwtDecode } from "jwt-decode";
import {
  HiChevronLeft,
  HiChevronRight,
  HiExclamationCircle,
  HiEye,
  HiPencil,
  HiTrash,
  HiSearch,
} from "react-icons/hi";
import { useTheme } from "../../../context/ThemeContext";

const CustomerCreditList = () => {
  const { theme } = useTheme();
  const [credits, setCredits] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editCredit, setEditCredit] = useState(null);
  const [viewCredit, setViewCredit] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [overdueCredits, setOverdueCredits] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customers, setCustomers] = useState([]);
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
    const customerIdFromUrl = params.get("customerId");
    fetchCustomers(customerIdFromUrl);
  }, [location.search]);

  const fetchCustomers = async (defaultCustomerId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllCustomers();
      const customerList = Array.isArray(data) ? data : [];
      setCustomers(customerList.sort((a, b) => a.name.localeCompare(b.name)));
      if (customerList.length > 0) {
        const initialCustomerId =
          defaultCustomerId &&
          customerList.find((cust) => cust.id === defaultCustomerId)
            ? defaultCustomerId
            : customerList[0].id;
        setSelectedCustomerId(initialCustomerId);
        fetchCredits(initialCustomerId);
      } else {
        setError("No customers available. Please add a customer first.");
        setSelectedCustomerId("");
      }
    } catch (err) {
      setError(
        "Failed to fetch customers: " + (err.message || "Unknown error")
      );
      setSelectedCustomerId("");
    } finally {
      setLoading(false);
    }
  };

  const fetchCredits = async (customerId) => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomerCredits(customerId);
      const sortedCredits = (
        Array.isArray(data.credits) ? data.credits : []
      ).sort(
        (a, b) => new Date(b.credit_date || 0) - new Date(a.credit_date || 0)
      );
      setCredits(sortedCredits);
      setOverdueCredits(
        sortedCredits.filter(
          (cred) =>
            cred.status === "UNPAID" && isOverdueByTwoMonths(cred.credit_date)
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
      await deleteCustomerCredit(id);
      fetchCredits(selectedCustomerId);
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
    fetchCredits(selectedCustomerId);
    setError(null);
  }, [selectedCustomerId]);

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditCredit(null);
  };

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    setSelectedCustomerId(customerId);
    if (customerId) fetchCredits(customerId);
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

  const filteredCustomers = customers.filter((customer) =>
    customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
          Customer Credits
        </h2>
        <Link
          to="/credit-management/owed-by-customer/report"
          className={`px-4 py-2 rounded-lg text-white text-sm sm:text-base font-semibold bg-teal-600 hover:bg-teal-700 transition duration-300`}
        >
          Generate Credit Report
        </Link>
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
            onClick={() => fetchCustomers(selectedCustomerId)}
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
          <input
            type="text"
            placeholder="Search by Customer Name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full p-2 pl-10 border rounded text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              theme === "dark"
                ? "bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-600 placeholder-gray-500"
            }`}
            disabled={loading || customers.length === 0}
          />
          <HiSearch
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          />
        </div>
        <select
          value={selectedCustomerId}
          onChange={handleCustomerChange}
          className={`w-full sm:w-64 p-2 border rounded text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-teal-500 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600 text-gray-200"
              : "bg-white border-gray-300 text-gray-600"
          }`}
          disabled={loading || customers.length === 0}
        >
          <option value="">Select a customer</option>
          {filteredCustomers.map((cust) => (
            <option key={cust.id} value={cust.id}>
              {cust.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCustomerId ? (
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
            <CustomerCreditForm
              customerId={selectedCustomerId}
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
                    <strong>Customer:</strong>{" "}
                    {viewCredit.customer?.name || "N/A"}
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
                        viewCredit.status === "UNPAID"
                          ? theme === "dark"
                            ? "text-red-400"
                            : "text-red-500"
                          : theme === "dark"
                          ? "text-green-400"
                          : "text-green-500"
                      }
                    >
                      {viewCredit.status || "N/A"}
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
                    <Hidrav
                      Circle
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
                    Customer
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
                    Description
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
                    Credit Date
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 immorality-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Updated
                  </th>
                  {userRole === "MANAGER" && (
                    <th
                      className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                        theme === "dark" ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      Created By
                    </th>
                  )}
                  {userRole === "MANAGER" && (
                    <th
                      className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                        theme === "dark" ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      Updated By
                    </th>
                  )}
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
                      colSpan={userRole === "MANAGER" ? 15 : 13}
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
                        cred.status === "UNPAID" &&
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
                        {cred.customer?.name || "N/A"}
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
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base truncate ${
                          theme === "dark"
                            ? "text-gray-300 border-gray-700"
                            : "text-gray-700 border-gray-200"
                        }`}
                      >
                        {cred.description || "N/A"}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                          cred.status === "UNPAID"
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
                        {cred.status || "N/A"}
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
                        {cred.credit_date ? formatEAT(cred.credit_date) : "N/A"}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                          theme === "dark"
                            ? "text-gray-300 border-gray-700"
                            : "text-gray-700 border-gray-200"
                        }`}
                      >
                        {cred.updated_at ? formatEAT(cred.updated_at) : "N/A"}
                      </td>
                      {userRole === "MANAGER" && (
                        <td
                          className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                            theme === "dark"
                              ? "text-gray-300 border-gray-700"
                              : "text-gray-700 border-gray-200"
                          }`}
                        >
                          {cred.createdBy?.username || "N/A"}
                        </td>
                      )}
                      {userRole === "MANAGER" && (
                        <td
                          className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                            theme === "dark"
                              ? "text-gray-300 border-gray-700"
                              : "text-gray-700 border-gray-200"
                          }`}
                        >
                          {cred.updatedBy?.username || "N/A"}
                        </td>
                      )}
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
                              cred.customer?.name || "N/A"
                            }`}
                            disabled={loading}
                          >
                            <HiEye size={18} />
                          </button>
                          {userRole === "MANAGER" && (
                            <>
                              <button
                                onClick={() => handleEdit(cred)}
                                className={actionButtonClass}
                                title="Edit"
                                aria-label={`Edit credit for ${
                                  cred.customer?.name || "N/A"
                                }`}
                                disabled={loading}
                              >
                                <HiPencil size={18} />
                              </button>
                              <button
                                onClick={() => openDeleteModal(cred.id)}
                                className={actionButtonClass}
                                title="Delete"
                                aria-label={`Delete credit for ${
                                  cred.customer?.name || "N/A"
                                }`}
                                disabled={loading}
                              >
                                <HiTrash size={18} />
                              </button>
                            </>
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
                    colSpan={userRole === "MANAGER" ? 10 : 8}
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
            Please select a customer to view their credits.
          </div>
        )
      )}
    </div>
  );
};

export default CustomerCreditList;
