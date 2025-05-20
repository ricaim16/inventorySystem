import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { expenseApi } from "../../api/expenseApi";
import { useTheme } from "../../context/ThemeContext";
import { FaCalendarAlt } from "react-icons/fa"; // Import calendar icon from react-icons

const ExpenseEntryForm = ({
  expense: propExpense,
  onSave,
  onCancel,
  showToast,
}) => {
  const [formData, setFormData] = useState({
    reason: "",
    amount: "",
    description: "",
    date: "",
    payment_method: "NONE",
    receipt: null,
    additional_info: "",
  });
  const [existingReceipt, setExistingReceipt] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { state } = useLocation();
  const expense = propExpense || state?.expense;
  const BASE_URL = "http://localhost:8080";
  const dateInputRef = useRef(null); // Ref for the date input

  const paymentMethods = [
    "NONE",
    "CASH",
    "CREDIT",
    "CBE",
    "COOP",
    "AWASH",
    "EBIRR",
  ];

  useEffect(() => {
    if (expense) {
      setFormData({
        reason: expense.reason || "",
        amount: expense.amount ? expense.amount.toString() : "",
        description: expense.description || "",
        date: expense.date
          ? new Date(expense.date).toISOString().split("T")[0]
          : "",
        payment_method: expense.payment_method || "NONE",
        receipt: null,
        additional_info: expense.additional_info || "",
      });
      setExistingReceipt(expense.receipt || null);
    } else {
      setExistingReceipt(null);
      setFormData({
        reason: "",
        amount: "",
        description: "",
        date: "",
        payment_method: "NONE",
        receipt: null,
        additional_info: "",
      });
    }
  }, [expense]);

  useEffect(() => {
    const requiredFields = ["reason", "amount", "date", "payment_method"];
    const filledFields = requiredFields.filter((field) => {
      return (
        formData[field] !== "" &&
        formData[field] !== null &&
        formData[field] !== "NONE"
      );
    });
    const progressPercentage =
      (filledFields.length / requiredFields.length) * 100;
    setProgress(progressPercentage);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value.trim(),
    }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleClearReceipt = () => {
    setFormData((prev) => ({ ...prev, receipt: null }));
    setExistingReceipt(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.reason.trim()) newErrors.reason = "Category is required";
    if (!formData.amount) newErrors.amount = "Amount is required";
    if (formData.amount && parseFloat(formData.amount) <= 0)
      newErrors.amount = "Amount must be greater than 0";
    if (!formData.date) newErrors.date = "Date is required";
    if (formData.payment_method === "NONE")
      newErrors.payment_method = "Payment method is required";

    if (formData.amount && isNaN(parseFloat(formData.amount)))
      newErrors.amount = "Amount must be a valid number";

    if (
      formData.payment_method &&
      !paymentMethods.includes(formData.payment_method)
    ) {
      newErrors.payment_method = "Invalid payment method selected";
    }

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
      const data = new FormData();
      data.append("reason", formData.reason);
      data.append("amount", parseFloat(formData.amount));
      data.append("description", formData.description || "");
      data.append("date", formData.date);
      data.append("payment_method", formData.payment_method);
      data.append("additional_info", formData.additional_info || "");

      if (formData.receipt) {
        data.append("receipt", formData.receipt);
      } else if (expense && existingReceipt) {
        data.append("existing_receipt", existingReceipt);
      }

      if (expense) {
        await expenseApi.updateExpense(expense.id, data);
        showToast("Expense updated successfully!");
      } else {
        await expenseApi.addExpense(data);
        showToast("Expense added successfully!");
      }
      if (typeof onSave === "function") {
        onSave();
      }
      navigate("/expense/list");
    } catch (err) {
      setErrors({
        generic:
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Error saving expense",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      reason: "",
      amount: "",
      description: "",
      date: "",
      payment_method: "NONE",
      receipt: null,
      additional_info: "",
    });
    setExistingReceipt(null);
    setErrors({});
    setProgress(0);
    onCancel ? onCancel() : navigate("/expense/list");
  };

  // Function to open the calendar picker
  const openCalendar = () => {
    if (dateInputRef.current && !isSubmitting) {
      dateInputRef.current.showPicker(); // Programmatically open the calendar
      dateInputRef.current.focus(); // Ensure input is focused
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className={`expense-form p-4 rounded-lg shadow-lg ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
    >
      <style>
        {`
          .expense-form input,
          .expense-form textarea,
          .expense-form select {
            color: ${theme === "dark" ? "#FFFFFF" : "#4B5563"} !important;
            background-color: ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } !important;
            border-color: ${
              theme === "dark" ? "#6B7280" : "#000000"
            } !important;
            transition: border-color 0.2s ease-in-out;
          }

          .expense-form input:hover,
          .expense-form textarea:hover,
          .expense-form select:hover {
            border-color: ${
              theme === "dark" ? "#9CA3AF" : "#4B5563"
            } !important;
          }

          .expense-form input:focus,
          .expense-form textarea:focus,
          .expense-form select:focus {
            outline: none !important;
            border-color: ${
              theme === "dark" ? "#FFFFFF" : "#000000"
            } !important;
            box-shadow: none !important;
          }

          .expense-form input::placeholder,
          .expense-form textarea::placeholder {
            color: ${theme === "dark" ? "#9CA3AF" : "#9CA3AF"} !important;
          }

          .expense-form input:-webkit-autofill,
          .expense-form input:-webkit-autofill:hover,
          .expense-form input:-webkit-autofill:focus,
          .expense-form input:-webkit-autofill:active,
          .expense-form textarea:-webkit-autofill,
          .expense-form textarea:-webkit-autofill:hover,
          .expense-form textarea:-webkit-autofill:focus,
          .expense-form select:-webkit-autofill,
          .expense-form select:-webkit-autofill:hover,
          .expense-form select:-webkit-autofill:focus {
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

          .expense-form select option {
            background-color: ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } !important;
            color: ${theme === "dark" ? "#FFFFFF" : "#4B5563"} !important;
          }

          .expense-form select option:hover {
            background-color: ${
              theme === "dark" ? "#4B5563" : "#D4C392"
            } !important;
          }

          .expense-form input:disabled,
          .expense-form select:disabled,
          .expense-form textarea:disabled {
            background-color: ${
              theme === "dark" ? "#4B5563" : "#D1D5DB"
            } !important;
            color: ${theme === "dark" ? "#9CA3AF" : "#6B7280"} !important;
            border-color: ${
              theme === "dark" ? "#6B7280" : "#000000"
            } !important;
          }

          /* Ensure native date picker arrow is visible */
          .expense-form input[type="date"]::-webkit-calendar-picker-indicator {
            filter: ${
              theme === "dark" ? "invert(1)" : "none"
            }; /* Adjust icon color for dark theme */
            cursor: pointer;
            opacity: 1;
            background: transparent;
          }

          /* Style for the date input container */
          .date-input-container {
            position: relative;
            display: flex;
            align-items: center;
          }

          .date-input-container input {
            flex: 1;
          }

          .date-input-container .calendar-icon {
            position: absolute;
            right: 10px;
            cursor: pointer;
            color: ${theme === "dark" ? "#FFFFFF" : "#4B5563"};
          }

          .date-input-container .calendar-icon:hover {
            color: ${theme === "dark" ? "#9CA3AF" : "#000000"};
          }

          .date-input-container input:disabled + .calendar-icon {
            color: ${theme === "dark" ? "#6B7280" : "#9CA3AF"};
            cursor: not-allowed;
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

      {/* Section: Expense Details */}
      <div className="mb-6">
        <h2
          className={`text-lg font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          {expense ? "Edit Expense" : "Add Expense"}
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
              Category <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.reason ? "border-[#5DB5B5]" : ""
              }`}
              required
              disabled={isSubmitting}
              placeholder="Enter category"
            />
            {errors.reason && (
              <p className="text-[#5DB5B5] text-sm mt-1">{errors.reason}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Amount <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.amount ? "border-[#5DB5B5]" : ""
              }`}
              required
              min="0"
              step="0.01"
              disabled={isSubmitting}
              placeholder="Enter amount"
            />
            {errors.amount && (
              <p className="text-[#5DB5B5] text-sm mt-1">{errors.amount}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Date <span className="text-[#EF4444]">*</span>
            </label>
            <div className="date-input-container">
              <input
                ref={dateInputRef}
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                  errors.date ? "border-[#5DB5B5]" : ""
                }`}
                required
                disabled={isSubmitting}
                onClick={openCalendar} // Ensure calendar opens on input click
              />
              <FaCalendarAlt
                className="calendar-icon"
                onClick={openCalendar}
                size={20}
                title="Open Calendar"
              />
            </div>
            {errors.date && (
              <p className="text-[#5DB5B5] text-sm mt-1">{errors.date}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Payment Method <span className="text-[#EF4444]">*</span>
            </label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.payment_method ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            {errors.payment_method && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.payment_method}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.description ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
              placeholder="Enter description"
            />
            {errors.description && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.description}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Additional Info
            </label>
            <textarea
              name="additional_info"
              value={formData.additional_info}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                errors.additional_info ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
              placeholder="Enter additional info"
            />
            {errors.additional_info && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.additional_info}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Receipt (Image)
            </label>
            <div
              className={`border p-2 rounded bg-opacity-50 ${
                errors.receipt ? "border-[#5DB5B5]" : ""
              }`}
            >
              {existingReceipt && (
                <div className="mb-2">
                  <p
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-600"
                    }`}
                  >
                    Current Receipt: {existingReceipt.split("/").pop()}
                  </p>
                  <img
                    src={`${BASE_URL}/${existingReceipt}`}
                    alt="Current Receipt"
                    className="max-w-[200px] h-auto rounded border my-2"
                    onError={(e) =>
                      console.error("Error loading receipt image:", e)
                    }
                  />
                  <a
                    href={`${BASE_URL}/${existingReceipt}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    View Full Receipt
                  </a>
                  <button
                    type="button"
                    onClick={handleClearReceipt}
                    className={`ml-2 text-sm underline ${
                      theme === "dark"
                        ? "text-[#EF4444] hover:text-[#EF7777]"
                        : "text-[#EF4444] hover:text-[#EF1111]"
                    }`}
                    disabled={isSubmitting}
                  >
                    Remove Receipt
                  </button>
                </div>
              )}
              <input
                type="file"
                name="receipt"
                onChange={handleChange}
                accept=".jpg,.jpeg,.png"
                className={`w-full p-2 border rounded focus:outline-none hover:border-gray-400 ${
                  errors.receipt ? "border-[#5DB5B5]" : ""
                }`}
                disabled={isSubmitting}
              />
              <p
                className={`text-xs mt-1 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {existingReceipt
                  ? "Upload a new file to replace the current receipt."
                  : "Upload a receipt if available (optional). Accepted formats: JPG, JPEG, PNG."}
              </p>
            </div>
            {errors.receipt && (
              <p className="text-[#5DB5B5] text-sm mt-1">{errors.receipt}</p>
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
          {isSubmitting ? "Saving..." : expense ? "Update" : "Add"}
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

export default ExpenseEntryForm;
