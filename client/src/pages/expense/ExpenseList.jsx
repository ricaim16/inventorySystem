import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { expenseApi } from "../../api/expenseApi";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import { FiSearch, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { HiExclamationCircle } from "react-icons/hi";

const ExpenseList = ({ showToast }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseIdToDelete, setExpenseIdToDelete] = useState(null);
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const itemsPerPage = 10;
  const BASE_URL = "http://localhost:8080";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to view expenses.");
      setLoading(false);
      return;
    }
    try {
      jwtDecode(token);
    } catch (err) {
      setError("Invalid token. Please log in again.");
      setLoading(false);
      return;
    }
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const data = await expenseApi.getAllExpenses();
      setExpenses(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setError("");
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Error fetching expenses");
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate("/expense/form");
  };

  const handleEdit = (expense) => {
    navigate("/expense/form", { state: { expense } });
  };

  const openDeleteModal = (id) => {
    setExpenseIdToDelete(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setExpenseIdToDelete(null);
  };

  const handleDelete = async (id) => {
    try {
      await expenseApi.deleteExpense(id);
      setExpenses(expenses.filter((e) => e.id !== id));
      showToast("Expense deleted successfully!");
      setError("");
    } catch (err) {
      setError(
        "Failed to delete expense: " +
          (err.response?.data?.error?.message || err.message)
      );
    }
    setShowDeleteModal(false);
    setExpenseIdToDelete(null);
  };

  const formatDate = (date) => {
    const options = {
      timeZone: "Africa/Addis_Ababa",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date ? new Date(date).toLocaleString("en-US", options) : "N/A";
  };

  const filteredExpenses = expenses.filter((expense) => {
    return [
      expense.reason,
      expense.amount?.toString(),
      formatDate(expense.date),
      expense.payment_method,
      expense.description,
      expense.receipt,
    ]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentExpenses = filteredExpenses.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    if (filteredExpenses.length === 0) {
      setCurrentPage(1);
    }
  }, [filteredExpenses, totalPages, currentPage]);

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

  if (loading) {
    return (
      <p
        className={`text-center text-sm sm:text-base ${
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        }`}
      >
        Loading...
      </p>
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
          Expenses List
        </h2>
        
      </div>

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
            onClick={fetchExpenses}
            className={`ml-4 px-4 py-1 rounded text-white text-sm ${
              theme === "dark"
                ? "bg-blue-700 hover:bg-blue-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            Retry
          </button>
        </div>
      )}

      <div className="mb-8 flex justify-start w-full max-w-md">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search by Category, Amount, Date..."
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
          <FiSearch
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
            size={18}
          />
        </div>
      </div>

      {filteredExpenses.length === 0 && !error && (
        <p
          className={`text-center text-sm sm:text-base ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}
        >
          No expenses found.
        </p>
      )}

      {filteredExpenses.length > 0 && (
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
                    Category
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden sm:table-cell ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Amount
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden sm:table-cell ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Date
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden sm:table-cell ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Payment Method
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden lg:table-cell ${
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
                    Receipt
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentExpenses.map((expense, index) => {
                  const rowNumber = startIndex + index + 1;
                  return (
                    <tr
                      key={expense.id || `row-${index}`}
                      className={`transition-colors duration-200 ${
                        theme === "dark"
                          ? "hover:bg-gray-800"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                          theme === "dark"
                            ? "text-gray-200 border-gray-700"
                            : "text-gray-900 border-gray-200"
                        }`}
                      >
                        {rowNumber}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                          theme === "dark"
                            ? "text-gray-200 border-gray-700"
                            : "text-gray-900 border-gray-200"
                        }`}
                      >
                        {expense.reason || "N/A"}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden sm:table-cell ${
                          theme === "dark"
                            ? "text-gray-200 border-gray-700"
                            : "text-gray-900 border-gray-200"
                        }`}
                      >
                        {expense.amount || "N/A"}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden sm:table-cell ${
                          theme === "dark"
                            ? "text-gray-200 border-gray-700"
                            : "text-gray-900 border-gray-200"
                        }`}
                      >
                        {formatDate(expense.date)}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden sm:table-cell ${
                          theme === "dark"
                            ? "text-gray-200 border-gray-700"
                            : "text-gray-900 border-gray-200"
                        }`}
                      >
                        {expense.payment_method || "N/A"}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden lg:table-cell ${
                          theme === "dark"
                            ? "text-gray-200 border-gray-700"
                            : "text-gray-900 border-gray-200"
                        }`}
                      >
                        {expense.description || "N/A"}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                          theme === "dark"
                            ? "text-gray-200 border-gray-700"
                            : "text-gray-900 border-gray-200"
                        }`}
                      >
                        {expense.receipt ? (
                          <a
                            href={`${BASE_URL}/${expense.receipt}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-teal-500 hover:underline transition-colors duration-200 ${
                              theme === "dark" ? "hover:text-teal-400" : ""
                            }`}
                          >
                            View Receipt
                          </a>
                        ) : (
                          "No Receipt"
                        )}
                      </td>
                      <td
                        className={`border-b border-gray-300 px-4 py-3 flex flex-wrap gap-2 items-center justify-start ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        <button
                          onClick={() => handleEdit(expense)}
                          className={`p-2 rounded-md transition-colors duration-200 ${
                            theme === "dark"
                              ? "text-gray-200 hover:bg-gray-700"
                              : "text-gray-900 hover:bg-gray-200"
                          }`}
                          title="Edit"
                          aria-label={`Edit expense ${expense.id}`}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        {user?.role === "MANAGER" && (
                          <button
                            onClick={() => openDeleteModal(expense.id)}
                            className={`p-2 rounded-md transition-colors duration-200 ${
                              theme === "dark"
                                ? "text-gray-200 hover:bg-gray-700"
                                : "text-gray-900 hover:bg-gray-200"
                            }`}
                            title="Delete"
                            aria-label={`Delete expense ${expense.id}`}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M3 7h18"
                              />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
              <FiChevronLeft size={20} />
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
              <FiChevronRight size={20} />
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
                Are you sure you want to delete this expense?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                <button
                  onClick={() => handleDelete(expenseIdToDelete)}
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

export default ExpenseList;
