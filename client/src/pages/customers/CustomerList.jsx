import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllCustomers, deleteCustomer } from "../../api/customerApi";
import { useTheme } from "../../context/ThemeContext";
import {
  HiChevronLeft,
  HiChevronRight,
  HiExclamationCircle,
  HiPencil,
  HiTrash,
  HiSearch,
} from "react-icons/hi";

const CustomerList = ({ showToast }) => {
  const { theme } = useTheme();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerIdToDelete, setCustomerIdToDelete] = useState(null);
  const navigate = useNavigate();
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await getAllCustomers();
      const customerArray = Array.isArray(data) ? data : [];
      setCustomers(customerArray.sort((a, b) => a.name.localeCompare(b.name)));
      setError(null);
      setLoading(false);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch customers";
      setError(errorMessage);
      setCustomers([]);
      setLoading(false);
      if (typeof showToast === "function") {
        showToast(errorMessage, "error");
      }
    }
  };

  const handleEdit = (customer) => {
    navigate(`/customers/edit/${customer.id}`);
  };

  const handleDelete = async (id) => {
    try {
      await deleteCustomer(id);
      setCustomers(customers.filter((cust) => cust.id !== id));
      if (typeof showToast === "function") {
        showToast("Customer deleted successfully!", "success");
      }
      setError(null);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete customer";
      setError(errorMessage);
      if (typeof showToast === "function") {
        showToast(errorMessage, "error");
      }
    }
    setShowDeleteModal(false);
    setCustomerIdToDelete(null);
  };

  const openDeleteModal = (id) => {
    setCustomerIdToDelete(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCustomerIdToDelete(null);
  };

  const filteredCustomers = customers.filter((customer) =>
    [customer.name, customer.phone, customer.address]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    if (filteredCustomers.length === 0) {
      setCurrentPage(1);
    }
  }, [filteredCustomers, totalPages, currentPage]);

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

  const viewCreditsClass = `p-2 rounded-md transition-colors duration-200 ${
    theme === "dark"
      ? "text-green-400 hover:bg-[#4B5563] hover:text-black"
      : "text-green-500 hover:bg-[#f7f7f7] hover:text-black"
  }`;

  if (loading) {
    return (
      <div
        className={`text-sm sm:text-base text-center ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}
      >
        Loading customers...
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
        Customers
      </h2>

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
            onClick={fetchCustomers}
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
            placeholder="Search by Name, Phone, or Address..."
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
          />
          <HiSearch
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          />
        </div>
      </div>

      {currentCustomers.length === 0 && !error && (
        <div
          className={`text-sm sm:text-base text-center ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          No customers found.
        </div>
      )}

      {currentCustomers.length > 0 && (
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
                    Name
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Phone
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Address
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentCustomers.map((customer, index) => (
                  <tr
                    key={customer.id || `row-${index}`}
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
                      {customer.name || "N/A"}
                    </td>
                    <td
                      className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base truncate ${
                        theme === "dark"
                          ? "text-gray-300 border-gray-700"
                          : "text-gray-700 border-gray-200"
                      }`}
                    >
                      {customer.phone || "N/A"}
                    </td>
                    <td
                      className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base truncate ${
                        theme === "dark"
                          ? "text-gray-300 border-gray-700"
                          : "text-gray-700 border-gray-200"
                      }`}
                    >
                      {customer.address || "N/A"}
                    </td>
                    <td
                      className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                        customer.status === "ACTIVE"
                          ? theme === "dark"
                            ? "text-green-400"
                            : "text-green-500"
                          : theme === "dark"
                          ? "text-red-400"
                          : "text-red-500"
                      } ${
                        theme === "dark" ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      {customer.status || "N/A"}
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
                          onClick={() => handleEdit(customer)}
                          className={actionButtonClass}
                          title="Edit"
                          aria-label={`Edit customer ${customer.name}`}
                        >
                          <HiPencil size={18} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(customer.id)}
                          className={actionButtonClass}
                          title="Delete"
                          aria-label={`Delete customer ${customer.name}`}
                        >
                          <HiTrash size={18} />
                        </button>
                        <Link
                          to={`/credit-management/owed-by-customer?customerId=${customer.id}`}
                          className={`${viewCreditsClass} px-2 py-1 text-sm sm:text-base flex items-center justify-center`}
                          title="View Credits"
                          aria-label={`View credits for customer ${customer.name}`}
                        >
                          View Credits
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
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
                {Math.min(startIndex + itemsPerPage, filteredCustomers.length)}{" "}
                of {filteredCustomers.length} customers
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
                Are you sure you want to delete this customer?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                <button
                  onClick={() => handleDelete(customerIdToDelete)}
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

export default CustomerList;
