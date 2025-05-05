import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  addCustomer,
  editCustomer,
  getCustomerById,
} from "../../api/customerApi";
import { useTheme } from "../../context/ThemeContext";

const CustomerForm = ({ showToast }) => {
  const { theme } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    status: "ACTIVE",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (id) {
      fetchCustomer();
    }
  }, [id]);

  useEffect(() => {
    const requiredFields = ["name", "phone", "address"];
    const filledFields = requiredFields.filter(
      (field) => formData[field].trim() !== ""
    );
    const progressPercentage =
      (filledFields.length / requiredFields.length) * 100;
    setProgress(progressPercentage);
  }, [formData]);

  const fetchCustomer = async () => {
    try {
      const customer = await getCustomerById(id);
      setFormData({
        name: customer.name || "",
        phone: customer.phone || "",
        address: customer.address || "",
        status: customer.status || "ACTIVE",
      });
      setErrors({});
    } catch (err) {
      console.error("Fetch Customer Error:", err, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      const errorMessage =
        err.response?.data?.message || "Failed to fetch customer";
      setErrors({ generic: errorMessage });
      showToast(errorMessage, "error");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value.trim() }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!/^\+?\d{9,13}$/.test(formData.phone))
      newErrors.phone = "Phone must be 9-13 digits, optionally starting with +";
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
      if (id) {
        response = await editCustomer(id, formData);
        showToast("Customer updated successfully");
      } else {
        response = await addCustomer(formData);
        showToast("Customer added successfully");
      }
      setTimeout(() => navigate("/customers/list"), 100);
    } catch (err) {
      console.error("Customer save error:", err, err.response?.data);
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
      setErrors({ generic: errorMessage });
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      phone: "",
      address: "",
      status: "ACTIVE",
    });
    setErrors({});
    setProgress(0);
    navigate("/customers/list");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`customer-form p-4 rounded-lg shadow-lg ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
    >
      <style>
        {`
          .customer-form input,
          .customer-form select {
            color: ${theme === "dark" ? "#FFFFFF" : "#4B5563"} !important;
            background-color: ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } !important;
            border-color: ${
              theme === "dark" ? "#6B7280" : "#000000"
            } !important;
            transition: border-color 0.2s ease-in-out;
          }

          .customer-form input:hover,
          .customer-form select:hover {
            border-color: ${
              theme === "dark" ? "#9CA3AF" : "#4B5563"
            } !important;
          }

          .customer-form input:focus,
          .customer-form select:focus {
            outline: none !important;
            border-color: ${
              theme === "dark" ? "#FFFFFF" : "#000000"
            } !important;
            box-shadow: none !important;
          }

          .customer-form input::placeholder {
            color: ${theme === "dark" ? "#9CA3AF" : "#9CA3AF"} !important;
          }

          .customer-form input:-webkit-autofill,
          .customer-form input:-webkit-autofill:hover,
          .customer-form input:-webkit-autofill:focus,
          .customer-form input:-webkit-autofill:active,
          .customer-form select:-webkit-autofill,
          .customer-form select:-webkit-autofill:hover,
          .customer-form select:-webkit-autofill:focus {
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

          .customer-form select option {
            background-color: ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } !important;
            color: ${theme === "dark" ? "#FFFFFF" : "#4B5563"} !important;
          }

          .customer-form select option:hover {
            background-color: ${
              theme === "dark" ? "#4B5563" : "#D4C392"
            } !important;
          }

          .customer-form input:disabled,
          .customer-form select:disabled {
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

      {/* Section: Customer Details */}
      <div className="mb-6">
        <h2
          className={`text-lg font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
          style={{ color: "#10B981" }}
        >
          {id ? "Edit Customer" : "Add Customer"}
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
              Name <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.name ? "border-[#5DB5B5]" : ""
              }`}
              required
              disabled={isSubmitting}
              placeholder="Enter customer name"
            />
            {errors.name && (
              <p className="text-[#5DB5B5] text-sm mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Phone <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.phone ? "border-[#5DB5B5]" : ""
              }`}
              required
              disabled={isSubmitting}
              placeholder="Enter phone number (e.g., +1234567890)"
            />
            {errors.phone && (
              <p className="text-[#5DB5B5] text-sm mt-1">{errors.phone}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Address <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.address ? "border-[#5DB5B5]" : ""
              }`}
              required
              disabled={isSubmitting}
              placeholder="Enter address"
            />
            {errors.address && (
              <p className="text-[#5DB5B5] text-sm mt-1">{errors.address}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.status ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            {errors.status && (
              <p className="text-[#5DB5B5] text-sm mt-1">{errors.status}</p>
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
          {isSubmitting ? "Saving..." : id ? "Update" : "Add"}
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

export default CustomerForm;
