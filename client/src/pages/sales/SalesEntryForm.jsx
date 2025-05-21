import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { addSale, editSale } from "../../api/salesApi";
import { getAllCustomers } from "../../api/customerApi";
import { getMedicineByBatchNumber } from "../../api/medicineApi";
import { getAllDosageForms } from "../../api/dosageApi";
import { useTheme } from "../../context/ThemeContext";

// Custom debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

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
    stock_quantity: 0,
  });
  const [customers, setCustomers] = useState([]);
  const [dosageForms, setDosageForms] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchSearch, setBatchSearch] = useState("");
  const [batchOptions, setBatchOptions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const inputRef = useRef(null); // Ref for the input to manage focus

  useEffect(() => {
    if (sale) {
      // Initialize form data with sale details
      const initialFormData = {
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
        stock_quantity: 0, // Initialize to 0, will be updated after fetching
      };
      setFormData(initialFormData);
      setBatchSearch(sale.product_batch_number || "");

      // Fetch the medicine's current stock level
      if (sale.product_batch_number) {
        getMedicineByBatchNumber(sale.product_batch_number)
          .then((medicines) => {
            const medicine = medicines.find(
              (med) => med.id === sale.medicine_id
            );
            if (medicine) {
              setFormData((prev) => ({
                ...prev,
                stock_quantity: medicine.quantity || 0,
              }));
            } else {
              setErrors((prev) => ({
                ...prev,
                generic: "Medicine not found for the given batch number.",
              }));
            }
          })
          .catch((err) => {
            console.error("Error fetching medicine for stock level:", err);
            setErrors((prev) => ({
              ...prev,
              generic: `Failed to load stock level: ${err.message}`,
            }));
          });
      }
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current !== event.target // Exclude input from closing dropdown
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  // Debounced API call for batch search
  const fetchBatchOptions = debounce(async (searchValue) => {
    if (!searchValue) {
      setBatchOptions([]);
      setBatchLoading(false);
      return;
    }
    setBatchLoading(true);
    try {
      console.log("Fetching medicines for batch:", searchValue);
      const medicines = await getMedicineByBatchNumber(searchValue);
      console.log("Medicines fetched:", medicines);
      if (medicines && medicines.length > 0) {
        setBatchOptions(medicines);
        setErrors((prev) => ({ ...prev, batch_not_found: null }));
      } else {
        setBatchOptions([]);
        setErrors((prev) => ({
          ...prev,
          batch_not_found:
            "No medicines found for this batch number. Please try another.",
        }));
      }
    } catch (err) {
      console.error("Error fetching batch options:", err);
      setErrors({
        batch_not_found: `Error fetching medicines: ${err.message}. Please try again.`,
      });
      setBatchOptions([]);
    } finally {
      setBatchLoading(false);
    }
  }, 300);

  const handleBatchSearchChange = (e) => {
    const searchValue = e.target.value;
    setBatchSearch(searchValue);
    setIsDropdownOpen(true);

    // Reset form data if search is cleared
    if (!searchValue) {
      setBatchOptions([]);
      setFormData((prev) => ({
        ...prev,
        product_batch_number: "",
        medicine_id: "",
        dosage_form_id: "",
        price: 0,
        total_amount: 0,
        product_name: "",
        dosage_form_name: "",
        prescription: false,
        stock_quantity: 0,
      }));
      setErrors((prev) => ({
        ...prev,
        product_batch_number: null,
        batch_not_found: null,
      }));
      return;
    }

    // Trigger debounced API call
    fetchBatchOptions(searchValue);
  };

  const handleBatchSelect = (medicine) => {
    const quantity = parseInt(formData.quantity) || 1;
    const price = medicine.sell_price || 0;
    const totalAmount = quantity * price;
    const dosageForm = dosageForms.find(
      (dose) => dose.id === medicine.dosage_form_id
    );
    setFormData((prev) => ({
      ...prev,
      product_batch_number: medicine.batch_number,
      medicine_id: medicine.id,
      dosage_form_id: medicine.dosage_form_id || "",
      price,
      total_amount: totalAmount,
      product_name: medicine.medicine_name || "",
      dosage_form_name: dosageForm?.name || "",
      prescription: medicine.required_prescription || false,
      stock_quantity: medicine.quantity || 0,
    }));
    setBatchSearch(medicine.batch_number);
    setIsDropdownOpen(false);
    setErrors((prev) => ({ ...prev, batch_not_found: null }));
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
    setBatchSearch("");
    setBatchOptions([]);
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
          {/* 1. Batch Number with Dropdown * */}
          <div ref={dropdownRef}>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Batch Number <span className="text-[#EF4444]">*</span>
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={batchSearch}
                onChange={handleBatchSearchChange}
                onFocus={() => setIsDropdownOpen(true)}
                className={`w-full p-2 border ${
                  theme === "dark"
                    ? "border-gray-500 bg-gray-700 text-white"
                    : "border-black bg-white text-gray-700"
                } rounded focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 ${
                  errors.product_batch_number ? "border-[#5DB5B5]" : ""
                }`}
                placeholder="Search batch number..."
                disabled={isSubmitting}
              />
              {/* Dropdown Icon */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  className={`absolute z-10 mt-1 w-full rounded-md shadow-lg ${
                    theme === "dark" ? "bg-gray-800" : "bg-white"
                  } max-h-60 overflow-y-auto`}
                >
                  {batchLoading ? (
                    <div
                      className={`p-2 text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Searching...
                    </div>
                  ) : batchOptions.length > 0 ? (
                    batchOptions.map((medicine) => (
                      <div
                        key={medicine.id}
                        onClick={() => handleBatchSelect(medicine)}
                        className={`p-2 cursor-pointer text-sm ${
                          theme === "dark"
                            ? "text-white hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {medicine.batch_number} ({medicine.medicine_name})
                      </div>
                    ))
                  ) : (
                    <div
                      className={`p-2 text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      No batch numbers found
                    </div>
                  )}
                </div>
              )}
            </div>
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
              placeholder="Select batch number to populate"
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
              placeholder="Select batch number to populate"
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
              disabled={isSubmitting}
              min="1"
              placeholder={
                formData.medicine_id && formData.dosage_form_id
                  ? "Enter quantity"
                  : "Select batch number first"
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
