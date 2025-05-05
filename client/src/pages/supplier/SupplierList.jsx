import React, { useState, useEffect } from "react";
import { getAllSuppliers, deleteSupplier } from "../../api/supplierApi";
import SupplierAdd from "./SupplierAdd";
import { useTheme } from "../../context/ThemeContext";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const SupplierList = ({ showToast }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierIdToDelete, setSupplierIdToDelete] = useState(null);
  const { theme } = useTheme();
  const itemsPerPage = 10;

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const data = await getAllSuppliers();
      const supplierArray = Array.isArray(data) ? data : [];
      setSuppliers(
        supplierArray.sort((a, b) =>
          a.supplier_name.localeCompare(b.supplier_name)
        )
      );
      setError(null);
      setLoading(false);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch suppliers";
      setError(errorMessage);
      setSuppliers([]);
      setLoading(false);
      if (typeof showToast === "function") {
        showToast(errorMessage, "error");
      }
    }
  };

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteSupplier(id);
      if (typeof showToast === "function") {
        showToast("Supplier deleted successfully!");
      }
      fetchSuppliers();
    } catch (err) {
      const errorMessage =
        err.response?.status === 400
          ? err.response?.data?.message ||
            "Cannot delete supplier with associated credits or medicines"
          : "Failed to delete supplier";
      setError(errorMessage);
      if (typeof showToast === "function") {
        showToast(errorMessage, "error");
      }
    }
    setShowDeleteModal(false);
    setSupplierIdToDelete(null);
  };

  const openDeleteModal = (id) => {
    setSupplierIdToDelete(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSupplierIdToDelete(null);
  };

  const handleSave = async () => {
    setShowForm(false);
    setSelectedSupplier(null);
    await fetchSuppliers();
    if (typeof showToast === "function") {
      showToast("Supplier saved successfully!");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedSupplier(null);
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    [
      supplier.supplier_name,
      supplier.contact_info,
      supplier.location,
      supplier.email,
    ]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    if (filteredSuppliers.length === 0) {
      setCurrentPage(1);
    }
  }, [filteredSuppliers, totalPages, currentPage]);

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
        Suppliers
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
            onClick={fetchSuppliers}
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
            placeholder="Search by Name, Contact, Location, or Email..."
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
          <MagnifyingGlassIcon
            className={`absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          />
        </div>
      </div>

      {showForm && (
        <div className="mb-6">
          <SupplierAdd
            supplier={selectedSupplier}
            onSupplierSaved={handleSave}
            showToast={showToast}
            onClose={handleCancel}
          />
        </div>
      )}

      {currentSuppliers.length === 0 && !error && (
        <p
          className={`text-center text-sm sm:text-base md:text-lg ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}
        >
          No suppliers found.
        </p>
      )}

      {currentSuppliers.length > 0 && !showForm && (
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
                    Contact Info
                  </th>
                  <th
                    className={`border p-2 sm:p-3 text-left font-semibold uppercase tracking-wider ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[150px]`}
                  >
                    Location
                  </th>
                  <th
                    className={`border p-2 sm:p-3 text-left font-semibold uppercase tracking-wider hidden sm:table-cell ${
                      theme === "dark" ? "text-gray-200" : "text-gray-800"
                    } w-[200px]`}
                  >
                    Email
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
                {currentSuppliers.map((supplier, index) => (
                  <tr
                    key={supplier.id || `row-${index}`}
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
                      {supplier.supplier_name || "N/A"}
                    </td>
                    <td
                      className={`border p-2 sm:p-3 truncate ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {supplier.contact_info || "N/A"}
                    </td>
                    <td
                      className={`border p-2 sm:p-3 truncate ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {supplier.location || "N/A"}
                    </td>
                    <td
                      className={`border p-2 sm:p-3 truncate hidden sm:table-cell ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {supplier.email || "N/A"}
                    </td>
                    <td
                      className={`border p-2 sm:p-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      <button
                        onClick={() => handleEdit(supplier)}
                        className={`p-1.5 sm:p-2 rounded text-white text-sm sm:text-base bg-[#5DB5B5] hover:bg-[#4A8F8F] mr-2`}
                        title="Edit"
                        aria-label={`Edit supplier ${supplier.supplier_name}`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(supplier.id)}
                        className={`p-1.5 sm:p-2 rounded text-white text-sm sm:text-base ${
                          theme === "dark"
                            ? "bg-red-700 hover:bg-red-600"
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                        title="Delete"
                        aria-label={`Delete supplier ${supplier.supplier_name}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
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
                Are you sure you want to delete this supplier?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
                <button
                  onClick={() => handleDelete(supplierIdToDelete)}
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

export default SupplierList;
