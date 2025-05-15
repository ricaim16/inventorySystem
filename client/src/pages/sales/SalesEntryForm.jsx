import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addSale, editSale } from "../../api/salesApi";
import { getAllCustomers } from "../../api/customerApi";
import { getMedicineByBatchNumber } from "../../api/medicineApi";
import { getAllDosageForms } from "../../api/dosageApi";
import { useTheme } from "../../context/ThemeContext";

const SalesEntryForm = ({ sale, onSave, onCancel, showToast }) => {
  const [formData, setFormData] = useState({
    customer_id: "",
    medicine_id: "",
    dosage_form_id: "",
    quantity: "",
    price: 0,
    total_amount: 0,
    payment_method: "",
    prescription: false,
    product_name: "",
    product_batch_number: "",
    dosage_form_name: "",
    stock_quantity: 0, // Added to store stock level
  });
  const [customers, setCustomers] = useState([]);
  const [dosageForms, setDosageForms] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchLoading, setBatchLoading] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (sale) {
      setFormData({
        customer_id: sale.customer_id || "",
        medicine_id: sale.medicine_id || "",
        dosage_form_id: sale.dosage_form_id || "",
        quantity: sale.quantity || "",
        price: sale.price || 0,
        total_amount: sale.total_amount || 0,
        payment_method: sale.payment_method || "",
        prescription: sale.prescription || false,
        product_name: sale.product_name || "",
        product_batch_number: sale.product_batch_number || "",
        dosage_form_name: sale.dosage_form?.name || "",
        stock_quantity: sale.quantity || 0, // Initialize with sale quantity or fetch from API
      });
    }
    fetchDropdownData();
  }, [sale]);

  useEffect(() => {
    const requiredFields = [
      "medicine_id",
      "dosage_form_id",
      "quantity",
      "product_batch_number",
      "payment_method",
    ];
    const filledFields = requiredFields.filter(
      (field) => formData[field] !== "" && formData[field] !== null
    );
    const progressPercentage =
      (filledFields.length / requiredFields.length) * 100;
    setProgress(progressPercentage);
  }, [formData]);

  const fetchDropdownData = async () => {
    try {
      console.log("Fetching dropdown data...");
      const [custRes, doseRes] = await Promise.all([
        getAllCustomers(),
        getAllDosageForms(),
      ]);
      console.log("Dropdown data fetched:", {
        customers: custRes,
        dosageForms: doseRes,
      });
      setCustomers(custRes || []);
      setDosageForms(doseRes || []);
      setErrors((prev) => ({ ...prev, generic: null }));
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      setErrors({
        generic: `Failed to load dropdown data: ${err.message}. Please try again.`,
      });
    }
  };

  const handleBatchNumberChange = async (e) => {
    const batchNumber = e.target.value.trim();
    console.log("Batch number entered:", batchNumber);

    // Validate batch number format (alphanumeric with : or -)
    const batchNumberRegex = /^[A-Za-z0-9:-]+$/;
    if (batchNumber && !batchNumberRegex.test(batchNumber)) {
      setErrors((prev) => ({
        ...prev,
        product_batch_number:
          "Invalid batch number format. Use alphanumeric characters, :, or -.",
        batch_not_found: null,
      }));
      setFormData((prev) => ({
        ...prev,
        product_batch_number: batchNumber,
        medicine_id: "",
        dosage_form_id: "",
        price: 0,
        total_amount: 0,
        product_name: "",
        dosage_form_name: "",
        prescription: false,
        stock_quantity: 0,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      product_batch_number: batchNumber,
    }));
    setErrors((prev) => ({
      ...prev,
      product_batch_number: null,
      batch_not_found: null,
    }));

    if (!batchNumber) {
      setFormData((prev) => ({
        ...prev,
        medicine_id: "",
        dosage_form_id: "",
        price: 0,
        total_amount: 0,
        product_name: "",
        dosage_form_name: "",
        prescription: false,
        stock_quantity: 0,
      }));
      return;
    }

    setBatchLoading(true);
    try {
      console.log("Fetching medicine from API...");
      const medicine = await getMedicineByBatchNumber(batchNumber);
      console.log("Medicine fetched by batch number:", medicine);
      if (medicine && medicine.id) {
        const quantity = parseInt(formData.quantity) || 1;
        const price = medicine.sell_price || 0;
        const totalAmount = quantity * price;
        // Find dosage form name from dosageForms state
        const dosageForm = dosageForms.find(
          (dose) => dose.id === medicine.dosage_form_id
        );
        setFormData((prev) => ({
          ...prev,
          medicine_id: medicine.id,
          dosage_form_id: medicine.dosage_form_id || "",
          price,
          total_amount: totalAmount,
          product_name: medicine.medicine_name || "",
          dosage_form_name: dosageForm?.name || "",
          prescription: medicine.required_prescription || false,
          stock_quantity: medicine.quantity || 0, // Set stock level
        }));
        setErrors((prev) => ({ ...prev, batch_not_found: null }));
      } else {
        setErrors((prev) => ({
          ...prev,
          batch_not_found:
            "No medicine found for this batch number. Please check the batch number.",
        }));
        setFormData((prev) => ({
          ...prev,
          medicine_id: "",
          dosage_form_id: "",
          price: 0,
          total_amount: 0,
          product_name: "",
          dosage_form_name: "",
          prescription: false,
          stock_quantity: 0,
        }));
      }
    } catch (err) {
      console.error("Error in handleBatchNumberChange:", err);
      setErrors({
        batch_not_found: `Error fetching medicine: ${err.message}. Please try again.`,
      });
      setFormData((prev) => ({
        ...prev,
        medicine_id: "",
        dosage_form_id: "",
        price: 0,
        total_amount: 0,
        product_name: "",
        dosage_form_name: "",
        prescription: false,
        stock_quantity: 0,
      }));
    } finally {
      setBatchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value.trim(),
      };
      if (name === "quantity" && prev.medicine_id && prev.dosage_form_id) {
        const quantity = parseInt(value) || 0;
        const price = prev.price || 0;
        newData.total_amount = quantity * price;
      }
      return newData;
    });
    setErrors((prev) => ({ ...prev, [name]: null, batch_not_found: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.medicine_id) newErrors.medicine_id = "Medicine is required";
    if (!formData.dosage_form_id)
      newErrors.dosage_form_id = "Dosage form is required";
    if (!formData.quantity) newErrors.quantity = "Quantity is required";
    if (!formData.product_batch_number)
      newErrors.product_batch_number = "Batch number is required";
    if (!formData.payment_method)
      newErrors.payment_method = "Payment method is required";

    if (formData.quantity && isNaN(parseInt(formData.quantity)))
      newErrors.quantity = "Quantity must be a valid number";

    if (formData.quantity && parseInt(formData.quantity) <= 0)
      newErrors.quantity = "Quantity must be greater than 0";

    if (
      formData.quantity &&
      parseInt(formData.quantity) > formData.stock_quantity
    )
      newErrors.quantity = `Quantity cannot exceed stock level (${formData.stock_quantity})`;

    const validPaymentMethods = paymentMethods.map((method) => method.value);
    if (
      formData.payment_method &&
      !validPaymentMethods.includes(formData.payment_method)
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
      const payload = {
        medicine_id: formData.medicine_id,
        customer_id: formData.customer_id || null,
        dosage_form_id: formData.dosage_form_id,
        quantity: parseInt(formData.quantity),
        prescription: formData.prescription,
        product_name: formData.product_name,
        product_batch_number: formData.product_batch_number,
        payment_method: formData.payment_method,
      };
      console.log("Submitting sale payload:", payload);
      const response = sale
        ? await editSale(sale.id, payload)
        : await addSale(payload);
      console.log("Sale response:", response);
      onSave?.(response);
      showToast(
        sale ? "Sale updated successfully!" : "Sale added successfully!"
      );
      navigate("/sales");
    } catch (err) {
      console.error("Error submitting sale:", err);
      setErrors({
        generic:
          err.response?.data?.message || `Failed to save sale: ${err.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      customer_id: "",
      medicine_id: "",
      dosage_form_id: "",
      quantity: "",
      price: 0,
      total_amount: 0,
      payment_method: "",
      prescription: false,
      product_name: "",
      product_batch_number: "",
      dosage_form_name: "",
      stock_quantity: 0,
    });
    setErrors({});
    setProgress(0);
    onCancel();
  };

  const paymentMethods = [
    { value: "CASH", label: "Cash" },
    { value: "CREDIT", label: "Credit" },
    { value: "CBE", label: "CBE" },
    { value: "COOP", label: "Cooperative" },
    { value: "AWASH", label: "Awash" },
    { value: "EBIRR", label: "eBirr" },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className={`sales-form p-4 rounded-lg shadow-lg ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
    >
      <style>
        {`
          .sales-form input,
          .sales-form textarea,
          .sales-form select {
            color: ${theme === "dark" ? "#FFFFFF" : "#4B5563"} !important;
            background-color: ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } !important;
            border-color: ${
              theme === "dark" ? "#6B7280" : "#000000"
            } !important;
            transition: border-color 0.2s ease-in-out;
          }

          .sales-form input:hover,
          .sales-form textarea:hover,
          .sales-form select:hover {
            border-color: ${
              theme === "dark" ? "#9CA3AF" : "#4B5563"
            } !important;
          }

          .sales-form input:focus,
          .sales-form textarea:focus,
          .sales-form select:focus {
            outline: none !important;
            border-color: ${
              theme === "dark" ? "#FFFFFF" : "#000000"
            } !important;
            box-shadow: none !important;
          }

          .sales-form input::placeholder,
          .sales-form textarea::placeholder {
            color: ${theme === "dark" ? "#9CA3AF" : "#9CA3AF"} !important;
          }

          .sales-form input:-webkit-autofill,
          .sales-form input:-webkit-autofill:hover,
          .sales-form input:-webkit-autofill:focus,
          .sales-form input:-webkit-autofill:active,
          .sales-form textarea:-webkit-autofill,
          .sales-form textarea:-webkit-autofill:hover,
          .sales-form textarea:-webkit-autofill:focus,
          .sales-form select:-webkit-autofill,
          .sales-form select:-webkit-autofill:hover,
          .sales-form select:-webkit-autofill:focus {
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

          .sales-form select option {
            background-color: ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } !important;
            color: ${theme === "dark" ? "#FFFFFF" : "#4B5563"} !important;
          }

          .sales-form select option:hover {
            background-color: ${
              theme === "dark" ? "#4B5563" : "#D4C392"
            } !important;
          }

          .sales-form input[type="checkbox"] {
            accent-color: #10B981 !important;
            background-color: ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } !important;
            border-color: ${
              theme === "dark" ? "#6B7280" : "#000000"
            } !important;
            width: 16px !important;
            height: 16px !important;
            cursor: pointer;
          }

          .sales-form input[type="checkbox"]:hover {
            border-color: ${
              theme === "dark" ? "#9CA3AF" : "#4B5563"
            } !important;
          }

          .sales-form input[type="checkbox"]:focus {
            outline: none !important;
            box-shadow: 0 0 0 2px ${
              theme === "dark" ? "#9CA3AF" : "#4B5563"
            } !important;
          }

          .sales-form input:disabled,
          .sales-form select:disabled {
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

      {/* Section 1: Sale Details */}
      <div className="mb-6">
        <h2
          className={`text-lg font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          Sale Details
        </h2>
        {errors.generic && (
          <div className="text-[#5DB5B5] mb-4">{errors.generic}</div>
        )}
        {errors.batch_not_found && (
          <div className="text-[#5DB5B5] mb-4">{errors.batch_not_found}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Batch Number * */}
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Batch Number <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              name="product_batch_number"
              value={formData.product_batch_number}
              onChange={handleBatchNumberChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.product_batch_number ? "border-[#5DB5B5]" : ""
              }`}
              required
              disabled={isSubmitting || batchLoading}
              placeholder="Enter batch number (e.g., TEST123 or 4:1)"
            />
            {batchLoading && (
              <p className="text-gray-500 text-sm mt-1">Searching...</p>
            )}
            {errors.product_batch_number && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.product_batch_number}
              </p>
            )}
          </div>

          {/* 2. Medicine Name * */}
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Medicine Name <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              name="product_name"
              value={formData.product_name}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.medicine_id ? "border-[#5DB5B5]" : ""
              } ${theme === "dark" ? "bg-gray-600" : "bg-[#D1D5DB]"}`}
              disabled
              placeholder="Enter batch number to populate"
            />
            <p
              className={`text-sm mt-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Stock Level: {formData.stock_quantity || "N/A"}
            </p>
            {errors.medicine_id && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.medicine_id}
              </p>
            )}
          </div>

          {/* 3. Dosage Form * */}
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Dosage Form <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              name="dosage_form_name"
              value={formData.dosage_form_name}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.dosage_form_id ? "border-[#5DB5B5]" : ""
              } ${theme === "dark" ? "bg-gray-600" : "bg-[#D1D5DB]"}`}
              disabled
              placeholder="Enter batch number to populate"
            />
            {errors.dosage_form_id && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.dosage_form_id}
              </p>
            )}
          </div>

          {/* 4. Quantity * */}
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Quantity <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.quantity ? "border-[#5DB5B5]" : ""
              }`}
              required
              disabled={isSubmitting || batchLoading}
              min="1"
              placeholder={
                formData.medicine_id && formData.dosage_form_id
                  ? "Enter quantity"
                  : "Enter batch number first"
              }
            />
            {errors.quantity && (
              <p className="text-[#5DB5B5] text-sm mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* 5. Sell Price */}
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Sell Price
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                theme === "dark" ? "bg-gray-600" : "bg-[#D1D5DB]"
              }`}
              disabled
              step="0.01"
            />
          </div>

          {/* 6. Total Amount */}
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Total Amount
            </label>
            <input
              type="number"
              name="total_amount"
              value={formData.total_amount}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                theme === "dark" ? "bg-gray-600" : "bg-[#D1D5DB]"
              }`}
              disabled
              step="0.01"
            />
          </div>

          {/* 7. Payment Method * */}
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
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.payment_method ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting || batchLoading}
              required
            >
              <option value="">Select Payment Method</option>
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
            {errors.payment_method && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.payment_method}
              </p>
            )}
          </div>

          {/* 8. Prescription Provided */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="prescription"
              checked={formData.prescription}
              onChange={handleChange}
              className={`mr-2 h-5 w-5 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400`}
              disabled={isSubmitting || batchLoading}
            />
            <label
              className={`text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              }`}
            >
              Prescription Provided
            </label>
          </div>

          {/* 9. Customer (Optional) */}
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Customer (Optional)
            </label>
            <select
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.customer_id ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting || batchLoading}
            >
              <option value="">Select Customer</option>
              {customers.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name}
                </option>
              ))}
            </select>
            {errors.customer_id && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.customer_id}
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
            isSubmitting || batchLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isSubmitting || batchLoading}
        >
          {isSubmitting ? "Saving..." : sale ? "Update" : "Add"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className={`bg-[#ababab] text-white px-4 py-2 rounded hover:bg-[#dedede] hover:text-black transition-colors ${
            isSubmitting || batchLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isSubmitting || batchLoading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default SalesEntryForm;
