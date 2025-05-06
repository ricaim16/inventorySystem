import React, { useState, useEffect } from "react";
import returnsApi from "../../api/returnsApi";
import ReturnForm from "./ReturnForm";
import { useTheme } from "../../context/ThemeContext";
import { FiSearch, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { HiPencil, HiTrash, HiExclamationCircle } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";

const ReturnList = ({ showToast }) => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [returnIdToDelete, setReturnIdToDelete] = useState(null);
  const { theme } = useTheme();
  const { user } = useAuth();
  const itemsPerPage = 10;

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const data = await returnsApi.getAllReturns();
      setReturns(
        data.sort((a, b) => new Date(b.return_date) - new Date(a.return_date))
      );
      setError(null);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Error fetching returns");
      setLoading(false);
    }
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

  const handleAdd = () => {
    setSelectedReturn(null);
    setShowForm(true);
  };

  const handleEdit = (returnItem) => {
    console.log("Editing return:", returnItem);
    setSelectedReturn(returnItem);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setReturnIdToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await returnsApi.deleteReturn(returnIdToDelete);
      setReturns(
        returns.filter((returnItem) => returnItem.id !== returnIdToDelete)
      );
      showToast("Return deleted successfully!");
      setError(null);
      fetchReturns();
      window.dispatchEvent(new Event("returnsUpdated"));
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete return: " + err.message
      );
    }
    setShowDeleteModal(false);
    setReturnIdToDelete(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setReturnIdToDelete(null);
  };

  const handleSave = () => {
    setShowForm(false);
    fetchReturns();
    window.dispatchEvent(new Event("returnsUpdated"));
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedReturn(null);
  };

  const filteredReturns = returns.filter((returnItem) => {
    return [
      returnItem.product_name,
      returnItem.product_batch_number,
      returnItem.medicine?.medicine_name,
      returnItem.dosage_form?.name,
      returnItem.reason_for_return,
      formatDate(returnItem.return_date),
    ]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReturns = filteredReturns.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    if (filteredReturns.length === 0) {
      setCurrentPage(1);
    }
  }, [filteredReturns, totalPages, currentPage]);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2
          className={`text-2xl sm:text-3xl font-semibold ${
            theme === "dark" ? "text-gray-100" : "text-gray-900"
          }`}
          style={{ color: "#10B981" }}
        >
          Returns List
        </h2>
        {!showForm && (
          <button
            onClick={handleAdd}
            className={`mt-4 sm:mt-0 px-4 py-2 rounded-lg text-white text-sm sm:text-base font-semibold transition-colors duration-200 ${
              theme === "dark"
                ? "bg-teal-700 hover:bg-teal-600"
                : "bg-teal-600 hover:bg-teal-500"
            }`}
          >
            Add Return
          </button>
        )}
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
            onClick={fetchReturns}
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

      {loading && (
        <p
          className={`text-center text-sm sm:text-base ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Loading...
        </p>
      )}

      {showForm && (
        <div className="mb-8">
          <ReturnForm
            returnData={selectedReturn}
            onSave={handleSave}
            onCancel={handleCancel}
            showToast={showToast}
          />
        </div>
      )}

      {!showForm && !loading && (
        <>
          <div className="mb-8 flex justify-start w-full max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search by Product, Batch, Medicine, or Date..."
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

          {filteredReturns.length === 0 && !error && (
            <p
              className={`text-center text-sm sm:text-base ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              No returns found.
            </p>
          )}

          {filteredReturns.length > 0 && (
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
                        Product Name
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
                        className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden sm:table-cell ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        Medicine
                      </th>
                      <th
                        className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden lg:table-cell ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        Dosage Form
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
                        className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        Reason
                      </th>
                      <th
                        className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden sm:table-cell ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        Return Date
                      </th>
                      <th
                        className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentReturns.map((returnItem, index) => {
                      const rowNumber = startIndex + index + 1;
                      return (
                        <tr
                          key={returnItem.id || `row-${index}`}
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
                            {returnItem.product_name || "N/A"}
                          </td>
                          <td
                            className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden sm:table-cell ${
                              theme === "dark"
                                ? "text-gray-200 border-gray-700"
                                : "text-gray-900 border-gray-200"
                            }`}
                          >
                            {returnItem.product_batch_number || "N/A"}
                          </td>
                          <td
                            className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden sm:table-cell ${
                              theme === "dark"
                                ? "text-gray-200 border-gray-700"
                                : "text-gray-900 border-gray-200"
                            }`}
                          >
                            {returnItem.medicine?.medicine_name || "N/A"}
                          </td>
                          <td
                            className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden lg:table-cell ${
                              theme === "dark"
                                ? "text-gray-200 border-gray-700"
                                : "text-gray-900 border-gray-200"
                            }`}
                          >
                            {returnItem.dosage_form?.name || "N/A"}
                          </td>
                          <td
                            className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden sm:table-cell ${
                              theme === "dark"
                                ? "text-gray-200 border-gray-700"
                                : "text-gray-900 border-gray-200"
                            }`}
                          >
                            {returnItem.quantity || "N/A"}
                          </td>
                          <td
                            className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                              theme === "dark"
                                ? "text-gray-200 border-gray-700"
                                : "text-gray-900 border-gray-200"
                            }`}
                          >
                            {returnItem.reason_for_return || "N/A"}
                          </td>
                          <td
                            className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden sm:table-cell ${
                              theme === "dark"
                                ? "text-gray-200 border-gray-700"
                                : "text-gray-900 border-gray-200"
                            }`}
                          >
                            {formatDate(returnItem.return_date)}
                          </td>
                          <td
                            className={`border-b border-gray-300 px-4 py-3 flex flex-wrap gap-2 items-center justify-start ${
                              theme === "dark"
                                ? "border-gray-700"
                                : "border-gray-200"
                            }`}
                          >
                            <button
                              onClick={() => handleEdit(returnItem)}
                              className={actionButtonClass}
                              title="Edit"
                              aria-label={`Edit return ${returnItem.id}`}
                            >
                              <HiPencil size={18} />
                            </button>
                            {["MANAGER", "EMPLOYEE"].includes(
                              user?.role?.toUpperCase()
                            ) && (
                              <button
                                onClick={() => handleDelete(returnItem.id)}
                                className={actionButtonClass}
                                title="Delete"
                                aria-label={`Delete return ${returnItem.id}`}
                              >
                                <HiTrash size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
                    <FiChevronLeft size={20} />
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
                    <FiChevronRight size={20} />
                  </button>
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
                Are you sure you want to delete this return?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                <button
                  onClick={confirmDelete}
                  className={`py-2 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300 text-sm sm:text-base font-semibold w-full sm:w-auto`}
                  aria-label="Confirm delete return"
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
                  aria-label="Cancel delete return"
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

export default ReturnList;
