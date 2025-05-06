import { useState, useEffect } from "react";
import { getAllCategories, deleteCategory } from "../../../api/categoryApi";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  PencilIcon,
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
    if (user?.role !== "MANAGER") return; // Safety check, though backend enforces this
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
    if (user?.role !== "MANAGER") return; // Prevent modal for non-managers
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
        Categories
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
            onClick={fetchCategories}
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
      <button
        onClick={() => setIsFormOpen(true)}
        className={`bg-[#10B981] text-white px-3 py-1.5 rounded mb-4 sm:mb-6 hover:bg-[#0E8C6A] transition duration-300 text-sm sm:text-base md:text-lg`}
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
          className={`text-center text-sm sm:text-base md:text-lg ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}
        >
          No categories found.
        </p>
      )}
      {currentCategories.length > 0 && (
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
                    } w-[120px]`}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentCategories.map((cat, index) => (
                  <tr
                    key={cat.id}
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
                      {cat.name || "N/A"}
                    </td>
                    <td
                      className={`border p-2 sm:p-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      <button
                        onClick={() => handleEdit(cat)}
                        className={`p-1.5 sm:p-2 rounded text-white text-sm sm:text-base bg-[#5DB5B5] hover:bg-[#4A8F8F] mr-2`}
                        title="Edit"
                        aria-label={`Edit category ${cat.name}`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {user?.role === "MANAGER" && (
                        <button
                          onClick={() => openDeleteModal(cat.id)}
                          className={`p-1.5 sm:p-2 rounded text-white text-sm sm:text-base ${
                            theme === "dark"
                              ? "bg-red-700 hover:bg-red-600"
                              : "bg-red-500 hover:bg-red-600"
                          }`}
                          title="Delete"
                          aria-label={`Delete category ${cat.name}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
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
          )}
        </>
      )}

      {user?.role === "MANAGER" && showDeleteModal && (
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
