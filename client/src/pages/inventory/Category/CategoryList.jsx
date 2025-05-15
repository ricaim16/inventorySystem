import { useState, useEffect } from "react";
import { getAllCategories, deleteCategory } from "../../../api/categoryApi";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import CategoryForm from "./CategoryForm";

const CategoryList = ({ showToast }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryIdToDelete, setCategoryIdToDelete] = useState(null);
  const itemsPerPage = 10;
  const { theme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch categories");
      if (typeof showToast === "function") {
        showToast("Failed to fetch categories", "error");
      }
    }
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      if (typeof showToast === "function") {
        showToast("Category deleted successfully!");
      }
      fetchCategories();
    } catch (err) {
      const errorMessage =
        err.response?.status === 409
          ? "This category cannot be deleted because it is associated with one or more medicines."
          : "Failed to delete category";
      setError(errorMessage);
      if (typeof showToast === "function") {
        showToast(errorMessage, "error");
      }
    }
    setShowDeleteModal(false);
    setCategoryIdToDelete(null);
  };

  const openDeleteModal = (id) => {
    setCategoryIdToDelete(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCategoryIdToDelete(null);
  };

  const handleSave = () => {
    setIsFormOpen(false);
    setSelectedCategory(null);
    fetchCategories();
    if (typeof showToast === "function") {
      showToast("Category saved successfully!");
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCategories = categories.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    if (categories.length === 0) {
      setCurrentPage(1);
    }
  }, [categories, totalPages, currentPage]);

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

  const actionButtonClass = `p-2 rounded-lg transition-colors duration-200 ${
    theme === "dark"
      ? "text-gray-300 hover:bg-gray-700"
      : "text-gray-600 hover:bg-gray-200"
  }`;

  return (
    <div
      className={`p-6 rounded-xl shadow-md w-full font-sans transition-all duration-300 ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
    >
      <h2
        className={`text-2xl font-bold mb-6 ${
          theme === "dark" ? "text-gray-100" : "text-gray-900"
        }`}
        style={{ color: "#10B981" }}
      >
        Categories
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
            onClick={fetchCategories}
            className={`ml-4 px-4 py-2 rounded-lg text-white text-base ${
              theme === "dark"
                ? "bg-blue-700 hover:bg-blue-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            Retry
          </button>
        </div>
      )}

      <button
        onClick={() => setIsFormOpen(true)}
        className={`bg-[#10B981] text-white px-4 py-2 rounded-lg mb-6 hover:bg-[#0E8C6A] transition duration-300 text-base font-semibold`}
      >
        Add Category
      </button>

      {isFormOpen && (
        <CategoryForm
          category={selectedCategory}
          onSave={handleSave}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      {currentCategories.length === 0 && !error && (
        <p
          className={`text-center text-base ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          No categories found.
        </p>
      )}

      {currentCategories.length > 0 && (
        <>
          <div className="overflow-x-auto min-w-full rounded-lg shadow-sm border border-gray-200">
            <table
              className={`w-full border-collapse text-base font-sans table-auto ${
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
                    className={`border-b border-gray-300 px-4 py-3 text-left font-bold text-sm uppercase tracking-wider ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    No.
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-bold text-sm uppercase tracking-wider ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Name
                  </th>
                  <th
                    className={`border-b border-gray-300 px-4 py-3 text-left font-bold text-sm uppercase tracking-wider ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentCategories.map((cat, index) => (
                  <tr
                    key={cat.id}
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
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    <td
                      className={`border-b border-gray-300 px-4 py-3 text-base font-medium ${
                        theme === "dark"
                          ? "text-gray-300 border-gray-700"
                          : "text-gray-700 border-gray-200"
                      }`}
                    >
                      {startIndex + index + 1}
                    </td>
                    <td
                      className={`border-b border-gray-300 px-4 py-3 text-base truncate ${
                        theme === "dark"
                          ? "text-gray-300 border-gray-700"
                          : "text-gray-700 border-gray-200"
                      }`}
                    >
                      {cat.name || "N/A"}
                    </td>
                    <td
                      className={`border-b border-gray-300 px-4 py-3 text-base ${
                        theme === "dark"
                          ? "text-gray-300 border-gray-700"
                          : "text-gray-700 border-gray-200"
                      }`}
                    >
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(cat)}
                          className={actionButtonClass}
                          title="Edit"
                          aria-label={`Edit category ${cat.name}`}
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        {(user?.role === "MANAGER" ||
                          user?.role === "EMPLOYEE") && (
                          <button
                            onClick={() => openDeleteModal(cat.id)}
                            className={actionButtonClass}
                            title="Delete"
                            aria-label={`Delete category ${cat.name}`}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
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
                className={`text-base ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, categories.length)} of{" "}
                {categories.length} categories
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${
                    currentPage === 1
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-gray-700"
                  } ${
                    theme === "dark"
                      ? "text-gray-300 bg-gray-800"
                      : "text-gray-600 bg-gray-100"
                  }`}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === page
                        ? "bg-teal-600 text-white"
                        : theme === "dark"
                        ? "text-gray-300 bg-gray-800 hover:bg-gray-700"
                        : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                    } text-base`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${
                    currentPage === totalPages
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-gray-700"
                  } ${
                    theme === "dark"
                      ? "text-gray-300 bg-gray-800"
                      : "text-gray-600 bg-gray-100"
                  }`}
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {(user?.role === "MANAGER" || user?.role === "EMPLOYEE") &&
        showDeleteModal && (
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
                  Are you sure you want to delete this category?
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
                  <button
                    onClick={() => handleDelete(categoryIdToDelete)}
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

export default CategoryList;
