import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  addCustomerCredit,
  editCustomerCredit,
  getAllCustomers,
  getAllMedicines,
} from "../../../api/customerApi";
import { useTheme } from "../../../context/ThemeContext";
import { axiosInstance } from "../../../api/axiosInstance";

const CustomerCreditForm = ({ customerId, credit, onSave, onCancel }) => {
  const { theme } = useTheme();
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const customerIdFromUrl = queryParams.get("customerId") || customerId;

  const [formData, setFormData] = useState({
    customer_id: customerIdFromUrl || credit?.customer_id?.toString() || "",
    credit_amount: credit?.credit_amount?.toString() || "",
    paid_amount: credit?.paid_amount?.toString() || "0",
    medicine_name: credit?.medicine_name || "",
    payment_method: credit?.payment_method || "NONE",
    description: credit?.description || "",
    payment_file: null,
  });
  const [customers, setCustomers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

  useEffect(() => {
    fetchCustomers();
    fetchMedicines();
    if (id && !credit) {
      fetchCredit();
    }
  }, [id, customerIdFromUrl, credit]);

  const fetchCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const data = await getAllCustomers();
      const customerList = Array.isArray(data) ? data : [];
      setCustomers(customerList);
      if (!customerList.length) {
        setErrors({
          general: "No customers available. Please add a customer first.",
        });
      } else if (customerIdFromUrl) {
        const validCustomer = customerList.find(
          (cust) => cust.id.toString() === customerIdFromUrl
        );
        if (!validCustomer) {
          setErrors({
            customer_id: "Selected customer is invalid or not found.",
          });
        }
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      setErrors({ general: "Failed to fetch customers: " + err.message });
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const data = await getAllMedicines();
      setMedicines(Array.isArray(data) ? data : []);
      if (!data?.length) {
        setErrors({
          general: "No medicines available. Please add a medicine first.",
        });
      }
    } catch (err) {
      console.error("Error fetching medicines:", err);
      setErrors({ general: "Failed to fetch medicines: " + err.message });
    }
  };

  const fetchCredit = async () => {
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.get(`/customers/credits/${id}`);
      const creditData = response.data.credit;
      setFormData({
        customer_id: creditData.customer_id?.toString() || "",
        credit_amount: creditData.credit_amount?.toString() || "",
        paid_amount: creditData.paid_amount?.toString() || "0",
        medicine_name: creditData.medicine_name || "",
        payment_method: creditData.payment_method || "NONE",
        description: creditData.description || "",
        payment_file: null,
      });
    } catch (err) {
      console.error("Error fetching credit:", err);
      setErrors({ general: "Failed to fetch credit: " + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: null }));
    setSuccessMessage("");
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.customer_id)
      newErrors.customer_id = "Please select a customer.";
    const creditAmount = parseFloat(formData.credit_amount);
    if (isNaN(creditAmount) || creditAmount <= 0)
      newErrors.credit_amount =
        "Please enter a valid credit amount greater than 0.";
    const paidAmount = parseFloat(formData.paid_amount);
    if (isNaN(paidAmount) || paidAmount < 0)
      newErrors.paid_amount =
        "Please enter a valid paid amount (0 or greater).";
    if (!formData.medicine_name)
      newErrors.medicine_name = "Please select a medicine.";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage("");

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    const submissionData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        submissionData.append(key, value);
      }
    });

    try {
      if (id || credit?.id) {
        await editCustomerCredit(id || credit.id, submissionData);
        setSuccessMessage("Credit updated successfully!");
      } else {
        await addCustomerCredit(submissionData);
        setSuccessMessage("Credit added successfully!");
      }
      onSave();
    } catch (err) {
      console.error("Error submitting form:", err);
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
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`p-4 rounded-lg shadow-lg mb-4 ${
        theme === "dark" ? "bg-gray-900" : "bg-[#F7F7F7]"
      }`}
    >
      <style>
        {`
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          select:-webkit-autofill,
          select:-webkit-autofill:hover,
          select:-webkit-autofill:focus {
            -webkit-box-shadow: 0 0 0px 1000px ${
              theme === "dark" ? "#111827" : "#F7F7F7"
            } inset !important;
            -webkit-text-fill-color: ${
              theme === "dark" ? "#D1D5DB" : "#4B5563"
            } !important;
          }
        `}
      </style>

      <h2
        className={`text-lg font-bold mb-4 ${
          theme === "dark" ? "text-gray-200" : "text-gray-800"
        }`}
      >
        {id || credit?.id ? "Edit Credit" : "Add Credit"}
      </h2>

      {errors.general && (
        <div
          className={`mb-4 text-sm ${
            theme === "dark" ? "text-red-400" : "text-red-600"
          }`}
        >
          {errors.general}
        </div>
      )}

      {successMessage && (
        <div
          className={`mb-4 text-sm ${
            theme === "dark" ? "text-green-400" : "text-green-600"
          }`}
        >
          {successMessage}
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            } mb-1`}
          >
            Customer <span className="text-red-500">*</span>
          </label>
          <select
            name="customer_id"
            value={formData.customer_id}
            onChange={handleChange}
            className={`w-full p-3 border rounded focus:outline-none text-base ${
              theme === "dark"
                ? "bg-gray-800 border-gray-600 text-gray-200 hover:border-gray-400 focus:border-gray-400"
                : "bg-[#F7F7F7] border-gray-300 text-gray-600 hover:border-gray-500 focus:border-gray-500"
            } ${errors.customer_id ? "border-red-500" : ""}`}
            required
            disabled={isSubmitting}
          >
            <option value="">Select a customer</option>
            {isLoadingCustomers ? (
              <option disabled>Loading customers...</option>
            ) : customers.length === 0 ? (
              <option disabled>No customers available</option>
            ) : (
              customers.map((cust) => (
                <option key={cust.id} value={cust.id.toString()}>
                  {cust.name || "Unnamed Customer"}
                </option>
              ))
            )}
          </select>
          {errors.customer_id && (
            <p
              className={`text-sm mt-1 ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            >
              {errors.customer_id}
            </p>
          )}
        </div>
        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            } mb-1`}
          >
            Credit Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="credit_amount"
            value={formData.credit_amount}
            onChange={handleChange}
            className={`w-full p-3 border rounded focus:outline-none text-base ${
              theme === "dark"
                ? "bg-gray-800 border-gray-600 text-gray-200 hover:border-gray-400 focus:border-gray-400"
                : "bg-[#F7F7F7] border-gray-300 text-gray-600 hover:border-gray-500 focus:border-gray-500"
            } ${errors.credit_amount ? "border-red-500" : ""}`}
            placeholder="Enter amount"
            min="0.01"
            step="0.01"
            required
            disabled={isSubmitting}
          />
          {errors.credit_amount && (
            <p
              className={`text-sm mt-1 ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            >
              {errors.credit_amount}
            </p>
          )}
        </div>
        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            } mb-1`}
          >
            Paid Amount
          </label>
          <input
            type="number"
            name="paid_amount"
            value={formData.paid_amount}
            onChange={handleChange}
            className={`w-full p-3 border rounded focus:outline-none text-base ${
              theme === "dark"
                ? "bg-gray-800 border-gray-600 text-gray-200 hover:border-gray-400 focus:border-gray-400"
                : "bg-[#F7F7F7] border-gray-300 text-gray-600 hover:border-gray-500 focus:border-gray-500"
            } ${errors.paid_amount ? "border-red-500" : ""}`}
            placeholder="Enter paid amount"
            min="0"
            step="0.01"
            disabled={isSubmitting}
          />
          {errors.paid_amount && (
            <p
              className={`text-sm mt-1 ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            >
              {errors.paid_amount}
            </p>
          )}
        </div>
        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            } mb-1`}
          >
            Medicine Name <span className="text-red-500">*</span>
          </label>
          <select
            name="medicine_name"
            value={formData.medicine_name}
            onChange={handleChange}
            className={`w-full p-3 border rounded focus:outline-none text-base ${
              theme === "dark"
                ? "bg-gray-800 border-gray-600 text-gray-200 hover:border-gray-400 focus:border-gray-400"
                : "bg-[#F7F7F7] border-gray-300 text-gray-600 hover:border-gray-500 focus:border-gray-500"
            } ${errors.medicine_name ? "border-red-500" : ""}`}
            required
            disabled={isSubmitting}
          >
            <option value="">Select a medicine</option>
            {medicines.map((med) => (
              <option key={med.id} value={med.medicine_name}>
                {med.medicine_name}
              </option>
            ))}
          </select>
          {errors.medicine_name && (
            <p
              className={`text-sm mt-1 ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            >
              {errors.medicine_name}
            </p>
          )}
        </div>
        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            } mb-1`}
          >
            Payment Method
          </label>
          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            className={`w-full p-3 border rounded focus:outline-none text-base ${
              theme === "dark"
                ? "bg-gray-800 border-gray-600 text-gray-200 hover:border-gray-400 focus:border-gray-400"
                : "bg-[#F7F7F7] border-gray-300 text-gray-600 hover:border-gray-500 focus:border-gray-500"
            }`}
            disabled={isSubmitting}
          >
            <option value="NONE">None</option>
            <option value="CASH">Cash</option>
            <option value="CREDIT">Credit</option>
            <option value="CBE">CBE</option>
            <option value="COOP">Coop</option>
            <option value="AWASH">Awash</option>
            <option value="EBIRR">Ebirr</option>
          </select>
        </div>
        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            } mb-1`}
          >
            Description
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`w-full p-3 border rounded focus:outline-none text-base ${
              theme === "dark"
                ? "bg-gray-800 border-gray-600 text-gray-200 hover:border-gray-400 focus:border-gray-400"
                : "bg-[#F7F7F7] border-gray-300 text-gray-600 hover:border-gray-500 focus:border-gray-500"
            }`}
            placeholder="Optional description"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            } mb-1`}
          >
            Payment File
          </label>
          <input
            type="file"
            name="payment_file"
            onChange={handleChange}
            className={`w-full p-3 border rounded focus:outline-none text-base ${
              theme === "dark"
                ? "bg-gray-800 border-gray-600 text-gray-200 hover:border-gray-400 focus:border-gray-400"
                : "bg-[#F7F7F7] border-gray-300 text-gray-600 hover:border-gray-500 focus:border-gray-500"
            }`}
            accept="image/jpeg,image/png,application/pdf"
            disabled={isSubmitting}
          />
          {(id || credit?.id) && formData.payment_file && (
            <p
              className={`text-sm mt-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Current file: {formData.payment_file.name}
            </p>
          )}
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          className={`bg-[#10B981] text-white px-4 py-2 rounded hover:bg-[#0E8C6A] transition-colors text-sm ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : id || credit?.id ? "Save" : "Add"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`bg-[#ababab] text-white px-4 py-2 rounded hover:bg-[#dedede] hover:text-black transition-colors text-sm ${
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

export default CustomerCreditForm;
