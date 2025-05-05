import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addSale, editSale } from "../../api/salesApi";
import { getAllCustomers } from "../../api/customerApi";
import { getAllMedicines } from "../../api/medicineApi";
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
  });
  const [customers, setCustomers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [dosageForms, setDosageForms] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
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
      const [custRes, medRes, doseRes] = await Promise.all([
        getAllCustomers(),
        getAllMedicines(),
        getAllDosageForms(),
      ]);
      setCustomers(custRes);
      setMedicines(medRes);
      setDosageForms(doseRes);
    } catch (err) {
      setErrors({ generic: "Failed to load dropdown data: " + err.message });
    }
  };

  const updateFormFields = (medicineId, dosageFormId) => {
    if (!medicineId || !dosageFormId) return;

    const selectedMedicine = medicines.find((med) => med.id === medicineId);
    if (selectedMedicine) {
      const quantity = parseInt(formData.quantity) || 0;
      const price = selectedMedicine.sell_price || 0;
      const totalAmount = quantity * price;
      setFormData((prev) => ({
        ...prev,
        price: price,
        total_amount: totalAmount,
        product_name: selectedMedicine.medicine_name || prev.product_name,
        prescription: selectedMedicine.required_prescription
          ? prev.prescription
          : false,
      }));
    }
  };

  const handleMedicineChange = (e) => {
    const medicineId = e.target.value;
    setFormData((prev) => ({ ...prev, medicine_id: medicineId }));
    setErrors((prev) => ({ ...prev, medicine_id: null }));
    if (formData.dosage_form_id) {
      updateFormFields(medicineId, formData.dosage_form_id);
    }
  };

  const handleDosageChange = (e) => {
    const dosageFormId = e.target.value;
    setFormData((prev) => ({ ...prev, dosage_form_id: dosageFormId }));
    setErrors((prev) => ({ ...prev, dosage_form_id: null }));
    if (formData.medicine_id) {
      updateFormFields(formData.medicine_id, dosageFormId);
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
    setErrors((prev) => ({ ...prev, [name]: null }));
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

    const selectedMedicine = medicines.find(
      (med) => med.id === formData.medicine_id
    );
    if (
      selectedMedicine &&
      formData.quantity &&
      parseInt(formData.quantity) > selectedMedicine.quantity
    ) {
      newErrors.quantity = `Quantity exceeds available stock (${selectedMedicine.quantity}).`;
    }

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
      const response = sale
        ? await editSale(sale.id, payload)
        : await addSale(payload);
      onSave?.(response);
      showToast(
        sale ? "Sale updated successfully!" : "Sale added successfully!"
      );
      navigate("/sales"); // Navigate to sales list after successful save
    } catch (err) {
      setErrors({
        generic:
          err.response?.data?.message || "Failed to save sale: " + err.message,
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
    });
    setErrors({});
    setProgress(0);
    onCancel();
  };

  const paymentMethods = [
    { value: "CASH", label: "Cash" },
    { value: "CREDIT", label: "Credit Card" },
    { value: "CBE", label: "CBE Bank Transfer" },
    { value: "COOP", label: "Cooperative Bank" },
    { value: "AWASH", label: "Awash Bank" },
    { value: "EBIRR", label: "eBirr Mobile Payment" },
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              disabled={isSubmitting}
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
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Medicine <span className="text-[#EF4444]">*</span>
            </label>
            <select
              name="medicine_id"
              value={formData.medicine_id}
              onChange={handleMedicineChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.medicine_id ? "border-[#5DB5B5]" : ""
              }`}
              required
              disabled={isSubmitting}
            >
              <option value="">Select Medicine</option>
              {medicines.map((med) => (
                <option key={med.id} value={med.id}>
                  {med.medicine_name} (Stock: {med.quantity})
                </option>
              ))}
            </select>
            {errors.medicine_id && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.medicine_id}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Dosage Form <span className="text-[#EF4444]">*</span>
            </label>
            <select
              name="dosage_form_id"
              value={formData.dosage_form_id}
              onChange={handleDosageChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.dosage_form_id ? "border-[#5DB5B5]" : ""
              }`}
              required
              disabled={isSubmitting}
            >
              <option value="">Select Dosage Form</option>
              {dosageForms.map((dose) => (
                <option key={dose.id} value={dose.id}>
                  {dose.name}
                </option>
              ))}
            </select>
            {errors.dosage_form_id && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.dosage_form_id}
              </p>
            )}
          </div>
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
              disabled={
                isSubmitting ||
                !formData.medicine_id ||
                !formData.dosage_form_id
              }
              min="1"
              placeholder={
                formData.medicine_id && formData.dosage_form_id
                  ? "Enter quantity"
                  : "Select medicine and dosage first"
              }
            />
            {errors.quantity && (
              <p className="text-[#5DB5B5] text-sm mt-1">{errors.quantity}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Price (From Medicine)
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
              disabled={isSubmitting}
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
          <div className="flex items-center">
            <input
              type="checkbox"
              name="prescription"
              checked={formData.prescription}
              onChange={handleChange}
              className={`mr-2 h-5 w-5 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400`}
              disabled={isSubmitting}
            />
            <label
              className={`text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              }`}
            >
              Prescription Provided
            </label>
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Product Name
            </label>
            <input
              type="text"
              name="product_name"
              value={formData.product_name}
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.product_name ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
            />
            {errors.product_name && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.product_name}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Batch Number <span className="text-[#EF4974]">*</span>
            </label>
            <input
              type="text"
              name="product_batch_number"
              value={formData.product_batch_number}
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.product_batch_number ? "border-[#5DB5B5]" : ""
              }`}
              required
              disabled={isSubmitting}
              placeholder="Enter batch number"
            />
            {errors.product_batch_number && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.product_batch_number}
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
          {isSubmitting ? "Saving..." : sale ? "Update" : "Add"}
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

export default SalesEntryForm;
