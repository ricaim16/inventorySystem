import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllCustomers, deleteCustomer } from "../../api/customerApi";
import { useTheme } from "../../context/ThemeContext";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

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

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (loading) {
    return (
      <p
        className={`text-center text-sm sm:text-base md:text-lg ${
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        }`}
      >
        Loading...
      </p>
    );
  }

  return (
    <div
      className={`p-3 sm:p-4 md:p-6 rounded-lg shadow-lg w-full max-w-[100vw] mx-auto ${
        theme === "dark" ? "bg-gray-900" : "bg-[#F7F7F7]"
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
          className={`mb-4 flex flex-col sm:flex-row items-center justify-between p-3 rounded ${
            theme === "dark"
              ? "bg-red-900 text-red-200 border border-red-700"
              : "bg-red-100 text-red-700 border border-red-400"
          }`}
        >
          <span className="text-sm sm:text-base">{error}</span>
          <button
            onClick={fetchCustomers}
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

      <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:mb-6">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search by Name, Phone, or Address..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full p-2 pl-8 border rounded text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#10B981] ${
              theme === "dark"
                ? "bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-600 placeholder-gray-500"
            }`}
          />
          {" "}
          <MagnifyingGlassIcon
            className={`absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          />
        </div>
      </div>

      {currentCustomers.length === 0 && !error && (
        <p
          className={`text-center text-sm sm:text-base md:text-lg ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}
        >
          No customers found.
        </p>
      )}

      {currentCustomers.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table
              className={`w-full border-collapse text-sm sm:text-base ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <thead>
                <tr
                  className={`${
                    theme === "dark" ? "bg-gray-800" : "bg-gray-300"
                  }`}
                >
                  <th
                    className={`border p-2 sm:p-3 text-left font-semibold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[60px]`}
                  >
                    No.
                  </th>
                  <th
                    className={`border p-2 sm:p-3 text-left font-semibold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[200px]`}
                  >
                    Name
                  </th>
                  <th
                    className={`border p-2 sm:p-3 text-left font-semibold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[150px]`}
                  >
                    Phone
                  </th>
                  <th
                    className={`border p-2 sm:p-3 text-left font-semibold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[150px]`}
                  >
                    Address
                  </th>
                  <th
                    className={`border p-2 sm:p-3 text-left font-semibold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[100px]`}
                  >
                    Status
                  </th>
                  <th
                    className={`border p-2 sm:p-3 text-left font-semibold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[200px]`}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentCustomers.map((customer, index) => (
                  <tr
                    key={customer.id || `row-${index}`}
                    className={`border-b ${
                      theme === "dark"
                        ? `border-gray-700 ${
                            index % 2 === 0 ? "bg-gray-800" : "bg-gray-900"
                          } hover:bg-gray-700`
                        : `border-gray-200 ${
                            index % 2 === 0 ? "bg-gray-50" : "bg-white"
                          } hover:bg-[#EAEAEA]`
                    }`}
                  >
                    <td
                      className={`border p-2 sm:p-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {startIndex + index + 1}
                    </td>
                    <td
                      className={`border p-2 sm:p-3 truncate ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {customer.name || "N/A"}
                    </td>
                    <td
                      className={`border p-2 sm:p-3 truncate ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {customer.phone || "N/A"}
                    </td>
                    <td
                      className={`border p-2 sm:p-3 truncate ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {customer.address || "N/A"}
                    </td>
                    <td
                      className={`border p-2 sm:p-3 ${
                        customer.status === "ACTIVE"
                          ? "text-green-600"
                          : "text-red-600"
                      } ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {customer.status || "N/A"}
                    </td>
                    <td
                      className={`border p-2 sm:p-3 flex flex-wrap gap-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      <button
                        onClick={() => handleEdit(customer)}
                        className={`p-1.5 sm:p-2 rounded text-white text-sm sm:text-base bg-[#5DB5B5] hover:bg-[#4A8F8F] mr-2`}
                        title="Edit"
                        aria-label={`Edit customer ${customer.name}`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(customer.id)}
                        className={`p-1.5 sm:p-2 rounded text-white text-sm sm:text-base ${
                          theme === "dark"
                            ? "bg-red-700 hover:bg-red-600"
                            : "bg-red-500 hover:bg-red-600"
                        } mr-2`}
                        title="Delete"
                        aria-label={`Delete customer ${customer.name}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                      <Link
                        to={`/credit-management/owed-by-customer?customerId=${customer.id}`}
                        className="px-3 py-1 rounded text-white text-xs sm:text-sm bg-[#5DB5B5] hover:bg-[#4A8F8F]"
                      >
                        View Credits
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-center items-center space-x-1 flex-wrap gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-2 py-1 border rounded text-sm sm:text-base ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 border rounded text-sm sm:text-base ${
                  currentPage === page
                    ? "bg-[#10B981] text-white"
                    : theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-2 py-1 border rounded text-sm sm:text-base ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div
            className={`p-4 sm:p-6 rounded-lg shadow-lg w-11/12 max-w-sm ${
              theme === "dark"
                ? "bg-gray-800 text-gray-200"
                : "bg-[#F7F7F7] text-gray-800"
            }`}
          >
            <div className="flex flex-col items-center">
              <div className="mb-3">
                <ExclamationCircleIcon
                  className={`h-6 w-6 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                />
              </div>
              <p
                className={`text-sm sm:text-base mb-4 text-center font-semibold ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Are you sure you want to delete this customer?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
                <button
                  onClick={() => handleDelete(customerIdToDelete)}
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
    </div>
  );
};

export default CustomerList;
