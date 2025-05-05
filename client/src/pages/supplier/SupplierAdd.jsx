import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addSupplier, editSupplier } from "../../api/supplierApi";
import { useTheme } from "../../context/ThemeContext";

const SupplierAdd = ({ supplier, onSupplierSaved, showToast, onClose }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    supplier_name: "",
    contact_info: "",
    location: "",
    email: "",
    payment_info_cbe: "",
    payment_info_coop: "",
    payment_info_boa: "",
    payment_info_awash: "",
    payment_info_ebirr: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (supplier) {
      setFormData({
        supplier_name: supplier.supplier_name || "",
        contact_info: supplier.contact_info || "",
        location: supplier.location || "",
        email: supplier.email || "",
        payment_info_cbe: supplier.payment_info_cbe || "",
        payment_info_coop: supplier.payment_info_coop || "",
        payment_info_boa: supplier.payment_info_boa || "",
        payment_info_awash: supplier.payment_info_awash || "",
        payment_info_ebirr: supplier.payment_info_ebirr || "",
      });
    }
  }, [supplier]);

  useEffect(() => {
    const requiredFields = ["supplier_name", "contact_info", "location"];
    const filledFields = requiredFields.filter(
      (field) => formData[field].trim() !== ""
    );
    const progressPercentage =
      (filledFields.length / requiredFields.length) * 100;
    setProgress(progressPercentage);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value.trim() }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.supplier_name.trim())
      newErrors.supplier_name = "Supplier name is required";
    if (!formData.contact_info.trim())
      newErrors.contact_info = "Contact info is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!/^\+?\d{9,13}$/.test(formData.contact_info))
      newErrors.contact_info =
        "Contact info must be a valid phone number (9-13 digits, optional +)";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      let response;
      if (supplier?.id) {
        response = await editSupplier(supplier.id, formData);
        showToast("Supplier updated successfully!");
      } else {
        response = await addSupplier(formData);
        showToast("Supplier added successfully!");
      }
      if (typeof onSupplierSaved === "function") {
        onSupplierSaved(response.supplier || response);
      }
      if (typeof onClose === "function") {
        onClose();
      }
      navigate("/supplier/list", { replace: true });
    } catch (err) {
      const errorMessage =
        err.response?.status === 400
          ? err.response?.data?.message ||
            "Invalid input. Please check your data."
          : err.response?.status === 401
          ? "Unauthorized. Please log in again."
          : err.response?.status === 403
          ? "Forbidden. You lack permission to perform this action."
          : err.message === "Network Error"
          ? "Network error. Please check your connection and try again."
          : err.message || "An unexpected error occurred. Please try again.";
      showToast(errorMessage, "error");
      setErrors({ generic: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      supplier_name: "",
      contact_info: "",
      location: "",
      email: "",
      payment_info_cbe: "",
      payment_info_coop: "",
      payment_info_boa: "",
      payment_info_awash: "",
      payment_info_ebirr: "",
    });
    setErrors({});
    setProgress(0);
    if (typeof onClose === "function") {
      onClose();
    } else {
      navigate("/supplier/list");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`supplier-form p-4 rounded-lg shadow-lg ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
    >
      <style>
        {`
          .supplier-form input,
          .supplier-form textarea,
          .supplier-form select {
            color: ${theme === "dark" ? "#FFFFFF" : "#4B5563"} !important;
            background-color: ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } !important;
            border-color: ${
              theme === "dark" ? "#6B7280" : "#000000"
            } !important;
            transition: border-color 0.2s ease-in-out;
          }

          .supplier-form input:hover,
          .supplier-form textarea:hover,
          .supplier-form select:hover {
            border-color: ${
              theme === "dark" ? "#9CA3AF" : "#4B5563"
            } !important;
          }

          .supplier-form input:focus,
          .supplier-form textarea:focus,
          .supplier-form select:focus {
            outline: none !important;
            border-color: ${
              theme === "dark" ? "#FFFFFF" : "#000000"
            } !important;
            box-shadow: none !important;
          }

          .supplier-form input::placeholder,
          .supplier-form textarea::placeholder {
            color: ${theme === "dark" ? "#9CA3AF" : "#9CA3AF"} !important;
          }

          .supplier-form input:-webkit-autofill,
          .supplier-form input:-webkit-autofill:hover,
          .supplier-form input:-webkit-autofill:focus,
          .supplier-form input:-webkit-autofill:active,
          .supplier-form textarea:-webkit-autofill,
          .supplier-form textarea:-webkit-autofill:hover,
          .supplier-form textarea:-webkit-autofill:focus,
          .supplier-form select:-webkit-autofill,
          .supplier-form select:-webkit-autofill:hover,
          .supplier-form select:-webkit-autofill:focus {
            -webkit-box-shadow: 0 0 0 1000px ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } inset !important;
            -webkit-text-fill-color: ${
              theme === "dark" ? "#FFFFFF" : "#4B5563"
            } !important;
            background-color: ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } !important;
            border-color: ${
              theme === "dark" ? "#6B7280" : "#000000"
            } !important;
            transition: background-color 5000s ease-in-out 0s !important;
          }

          .supplier-form select option {
            background-color: ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } !important;
            color: ${theme === "dark" ? "#FFFFFF" : "#4B5563"} !important;
          }

          .supplier-form select option:hover {
            background-color: ${
              theme === "dark" ? "#4B5563" : "#D4C392"
            } !important;
          }

          .supplier-form input:disabled,
          .supplier-form select:disabled,
          .supplier-form textarea:disabled {
            background-color: ${
              theme === "dark" ? "#4B5563" : "#D1D5DB"
            } !important;
            color: ${theme === "dark" ? "#9CA3AF" : "#6B7280"} !important;
            border-color: ${
              theme === "dark" ? "#6B7280" : "#000000"
            } !important;
          }
        `}
      </style>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full mb-4">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor:
              progress <= 33
                ? "#5DB5B5"
                : progress <= 66
                ? "#1a2a44"
                : "#10B981",
          }}
        ></div>
      </div>

      {/* Section: Supplier Details */}
      <div className="mb-6">
        <h2
          className={`text-lg font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
          style={{ color: "#10B981" }}
        >
          {supplier?.id ? "Edit Supplier" : "Add Supplier"}
        </h2>
        {errors.generic && (
          <div className="text-[#5DB5B5] mb-4">{errors.generic}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Supplier Name <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              name="supplier_name"
              value={formData.supplier_name}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.supplier_name ? "border-[#5DB5B5]" : ""
              }`}
              required
              disabled={isSubmitting}
              placeholder="Enter supplier name"
            />
            {errors.supplier_name && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.supplier_name}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Contact Info <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              name="contact_info"
              value={formData.contact_info}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.contact_info ? "border-[#5DB5B5]" : ""
              }`}
              required
              disabled={isSubmitting}
              placeholder="Enter contact info (e.g., +1234567890)"
            />
            {errors.contact_info && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.contact_info}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Location <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.location ? "border-[#5DB5B5]" : ""
              }`}
              required
              disabled={isSubmitting}
              placeholder="Enter location"
            />
            {errors.location && (
              <p className="text-[#5DB5B5] text-sm mt-1">{errors.location}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.email ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
              placeholder="Enter email"
            />
            {errors.email && (
              <p className="text-[#5DB5B5] text-sm mt-1">{errors.email}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              CBE Payment Info
            </label>
            <input
              type="text"
              name="payment_info_cbe"
              value={formData.payment_info_cbe}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.payment_info_cbe ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
              placeholder="Enter CBE payment info"
            />
            {errors.payment_info_cbe && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.payment_info_cbe}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Coop Payment Info
            </label>
            <input
              type="text"
              name="payment_info_coop"
              value={formData.payment_info_coop}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.payment_info_coop ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
              placeholder="Enter Coop payment info"
            />
            {errors.payment_info_coop && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.payment_info_coop}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              BOA Payment Info
            </label>
            <input
              type="text"
              name="payment_info_boa"
              value={formData.payment_info_boa}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.payment_info_boa ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
              placeholder="Enter BOA payment info"
            />
            {errors.payment_info_boa && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.payment_info_boa}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Awash Payment Info
            </label>
            <input
              type="text"
              name="payment_info_awash"
              value={formData.payment_info_awash}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.payment_info_awash ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
              placeholder="Enter Awash payment info"
            />
            {errors.payment_info_awash && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.payment_info_awash}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              eBirr Payment Info
            </label>
            <input
              type="text"
              name="payment_info_ebirr"
              value={formData.payment_info_ebirr}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.payment_info_ebirr ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
              placeholder="Enter eBirr payment info"
            />
            {errors.payment_info_ebirr && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.payment_info_ebirr}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex space-x-3">
        <button
          type="submit"
          className={`bg-[#10B981] text-white px-4 py-2 rounded hover:bg-[#0E8C6A] transition-colors ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : supplier?.id ? "Update" : "Add"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className={`bg-[#ababab] text-white px-4 py-2 rounded hover:bg-[#dedede] hover:text-black transition-colors ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default SupplierAdd;
