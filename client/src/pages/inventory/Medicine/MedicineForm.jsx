import { useState, useEffect } from "react";
import { addMedicine, editMedicine } from "../../../api/medicineApi";
import { getAllCategories } from "../../../api/categoryApi";
import { getAllDosageForms } from "../../../api/dosageApi";
import { getAllSuppliers } from "../../../api/supplierApi";
import { useTheme } from "../../../context/ThemeContext";
import { useNavigate } from "react-router-dom";

const MedicineForm = ({ medicine, onSave, onCancel }) => {
  const navigate = useNavigate();
  const initialFormData = {
    medicine_name: "",
    brand_name: "",
    batch_number: "",
    invoice_number: "",
    category_id: "",
    dosage_form_id: "",
    medicine_weight: "",
    quantity: "",
    supplier_id: "",
    unit_price: "",
    sell_price: "",
    expire_date: new Date().toISOString().slice(0, 10),
    required_prescription: false,
    payment_method: "NONE",
    Payment_file: null,
    details: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [categories, setCategories] = useState([]);
  const [dosageForms, setDosageForms] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { theme } = useTheme();

  useEffect(() => {
    if (medicine) {
      setFormData({
        medicine_name: medicine.medicine_name || "",
        brand_name: medicine.brand_name || "",
        batch_number: medicine.batch_number || "",
        invoice_number: medicine.invoice_number || "",
        category_id: medicine.category_id || "",
        dosage_form_id: medicine.dosage_form_id || "",
        medicine_weight: medicine.medicine_weight || "",
        quantity: medicine.quantity || "",
        supplier_id: medicine.supplier_id || "",
        unit_price: medicine.unit_price || "",
        sell_price: medicine.sell_price || "",
        expire_date: medicine.expire_date
          ? new Date(medicine.expire_date).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        required_prescription: medicine.required_prescription || false,
        payment_method: medicine.payment_method || "NONE",
        Payment_file: null,
        details: medicine.details || "",
      });
    }
    fetchDropdownData();
  }, [medicine]);

  useEffect(() => {
    const requiredFields = [
      "medicine_name",
      "invoice_number",
      "category_id",
      "dosage_form_id",
      "quantity",
      "supplier_id",
      "unit_price",
      "expire_date",
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
      const [catRes, dosRes, supRes] = await Promise.all([
        getAllCategories(),
        getAllDosageForms(),
        getAllSuppliers(),
      ]);
      setCategories(catRes);
      setDosageForms(dosRes);
      setSuppliers(supRes);
    } catch (err) {
      setErrors({ general: "Failed to load dropdown data" });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    let newValue = value;

    if (
      ["quantity", "unit_price", "sell_price", "medicine_weight"].includes(name)
    ) {
      newValue = value === "" ? "" : parseFloat(value) || "";
    }

    if (name === "details") {
      const words = value.trim().split(/\s+/);
      if (words.length > 20) {
        setErrors((prev) => ({
          ...prev,
          details: "Details cannot exceed 20 words",
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : files ? files[0] : newValue,
    }));

    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.medicine_name)
      newErrors.medicine_name = "Medicine name is required";
    if (formData.quantity === "" || formData.quantity === null)
      newErrors.quantity = "Quantity is required";
    if (formData.unit_price === "" || formData.unit_price === null)
      newErrors.unit_price = "Unit price is required";
    if (!formData.category_id) newErrors.category_id = "Category is required";
    if (!formData.dosage_form_id)
      newErrors.dosage_form_id = "Dosage form is required";
    if (!formData.supplier_id) newErrors.supplier_id = "Supplier is required";
    if (!formData.expire_date)
      newErrors.expire_date = "Expire date is required";
    if (!formData.invoice_number)
      newErrors.invoice_number = "Invoice number is required";

    if (formData.quantity !== "" && isNaN(parseInt(formData.quantity)))
      newErrors.quantity = "Quantity must be a valid number";
    if (formData.unit_price !== "" && isNaN(parseFloat(formData.unit_price)))
      newErrors.unit_price = "Unit price must be a valid number";
    if (formData.sell_price !== "" && isNaN(parseFloat(formData.sell_price)))
      newErrors.sell_price = "Sell price must be a valid number";
    if (
      formData.medicine_weight !== "" &&
      isNaN(parseFloat(formData.medicine_weight))
    )
      newErrors.medicine_weight = "Medicine weight must be a valid number";

    if (formData.details) {
      const wordCount = formData.details.trim().split(/\s+/).length;
      if (wordCount > 20) {
        newErrors.details = "Details cannot exceed 20 words";
      }
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
      const submissionData = new FormData();
      const numericFields = [
        "quantity",
        "unit_price",
        "sell_price",
        "medicine_weight",
      ];

      for (const key in formData) {
        if (formData[key] === null || formData[key] === undefined) {
          continue;
        }
        if (numericFields.includes(key)) {
          const value = formData[key];
          if (value === "") continue;
          submissionData.append(key, parseFloat(value));
        } else if (key === "required_prescription") {
          submissionData.append(key, formData[key].toString());
        } else if (key === "Payment_file") {
          if (formData[key] instanceof File) {
            submissionData.append(key, formData[key]);
          }
        } else {
          submissionData.append(key, formData[key]);
        }
      }

      for (const [key, value] of submissionData.entries()) {
        console.log(`${key}: ${value}`);
      }

      let response;
      if (medicine) {
        response = await editMedicine(medicine.id, submissionData);
      } else {
        response = await addMedicine(submissionData);
      }
      const savedMedicine = response.medicine || response;
      onSave(savedMedicine);
      navigate("/inventory/medicine/list");
    } catch (err) {
      setErrors({
        general:
          err.response?.data?.error?.message || "Failed to save medicine",
        details: err.response?.data?.error?.details || null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setErrors({});
    setProgress(0);
    onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`medicine-form p-4 rounded-lg shadow-lg ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
    >
      <style>
        {`
          .medicine-form input,
          .medicine-form textarea,
          .medicine-form select {
            color: ${theme === "dark" ? "#FFFFFF" : "#4B5563"} !important;
            background-color: ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } !important;
            border-color: ${
              theme === "dark" ? "#6B7280" : "#000000"
            } !important;
            transition: border-color 0.2s ease-in-out;
          }

          .medicine-form input:hover,
          .medicine-form textarea:hover,
          .medicine-form select:hover {
            border-color: ${
              theme === "dark" ? "#9CA3AF" : "#4B5563"
            } !important;
          }

          .medicine-form input:focus,
          .medicine-form textarea:focus,
          .medicine-form select:focus {
            outline: none !important;
            border-color: ${
              theme === "dark" ? "#FFFFFF" : "#000000"
            } !important;
            box-shadow: none !important;
          }

          .medicine-form input::placeholder,
          .medicine-form textarea::placeholder {
            color: ${theme === "dark" ? "#9CA3AF" : "#9CA3AF"}22 !important;
          }

          .medicine-form input:-webkit-autofill,
          .medicine-form input:-webkit-autofill:hover,
          .medicine-form input:-webkit-autofill:focus,
          .medicine-form input:-webkit-autofill:active,
          .medicine-form textarea:-webkit-autofill,
          .medicine-form textarea:-webkit-autofill:hover,
          .medicine-form textarea:-webkit-autofill:focus,
          .medicine-form select:-webkit-autofill,
          .medicine-form select:-webkit-autofill:hover,
          .medicine-form select:-webkit-autofill:focus {
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

          .medicine-form select option {
            background-color: ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } !important;
            color: ${theme === "dark" ? "#FFFFFF" : "#4B5563"} !important;
          }

          .medicine-form select option:hover {
            background-color: ${
              theme === "dark" ? "#4B5563" : "#D4C392"
            } !important;
          }

          .medicine-form input[type="checkbox"] {
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

          .medicine-form input[type="checkbox"]:hover {
            border-color: ${
              theme === "dark" ? "#9CA3AF" : "#4B5563"
            } !important;
          }

          .medicine-form input[type="checkbox"]:focus {
            outline: none !important;
            box-shadow: 0 0 0 2px ${
              theme === "dark" ? "#9CA3AF" : "#4B5563"
            } !important;
          }

          .medicine-form input[type="file"] {
            color: ${theme === "dark" ? "#FFFFFF" : "#4B5563"} !important;
          }

          .navbar input,
          .navbar textarea,
          .navbar select {
            background-color: ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } !important;
            color: ${theme === "dark" ? "#FFFFFF" : "#1F2937"} !important;
            border-color: ${
              theme === "dark" ? "#4B5563" : "#D1D5DB"
            } !important;
          }

          .navbar input:-webkit-autofill,
          .navbar input:-webkit-autofill:hover,
          .navbar input:-webkit-autofill:focus,
          .navbar input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } inset !important;
            -webkit-text-fill-color: ${
              theme === "dark" ? "#FFFFFF" : "#1F2937"
            } !important;
            background-color: ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } !important;
            border-color: ${
              theme === "dark" ? "#4B5563" : "#D1D5DB"
            } !important;
            transition: background-color 5000s ease-in-out 0s !important;
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

      {/* Section 1: Medicine Details */}
      <div className="mb-6">
        <h2
          className={`text-lg font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          1. Medicine Details
        </h2>
        {errors.general && (
          <div className="text-[#5DB5B5] mb-4">
            {errors.general}
            {errors.details && (
              <ul className="list-disc ml-4">
                {Object.entries(errors.details).map(([key, value]) => (
                  <li key={key}>{`${key}: ${value}`}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              name="medicine_name"
              value={formData.medicine_name}
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.medicine_name ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
            />
            {errors.medicine_name && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.medicine_name}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Brand Name
            </label>
            <input
              type="text"
              name="brand_name"
              value={formData.brand_name}
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400`}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Batch Number
            </label>
            <input
              type="text"
              name="batch_number"
              value={formData.batch_number}
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400`}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Invoice Number <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              name="invoice_number"
              value={formData.invoice_number}
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.invoice_number ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
            />
            {errors.invoice_number && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.invoice_number}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Category <span className="text-[#EF4444]">*</span>
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.category_id ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.category_id}
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
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.dosage_form_id ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
            >
              <option value="">Select Dosage Form</option>
              {dosageForms.map((dos) => (
                <option key={dos.id} value={dos.id}>
                  {dos.name}
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
              Medicine Weight
            </label>
            <input
              type="number"
              name="medicine_weight"
              value={formData.medicine_weight}
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.medicine_weight ? "border-[#5DB5B5]" : ""
              }`}
              step="0.01"
              disabled={isSubmitting}
            />
            {errors.medicine_weight && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.medicine_weight}
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
              disabled={isSubmitting}
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
              Supplier <span className="text-[#EF4444]">*</span>
            </label>
            <select
              name="supplier_id"
              value={formData.supplier_id}
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.supplier_id ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
            >
              <option value="">Select Supplier</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.supplier_name}
                </option>
              ))}
            </select>
            {errors.supplier_id && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.supplier_id}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Unit Price <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="number"
              name="unit_price"
              value={formData.unit_price}
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.unit_price ? "border-[#5DB5B5]" : ""
              }`}
              step="0.01"
              disabled={isSubmitting}
            />
            {errors.unit_price && (
              <p className="text-[#5DB5B5] text-sm mt-1">{errors.unit_price}</p>
            )}
          </div>
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
              name="sell_price"
              value={formData.sell_price}
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.sell_price ? "border-[#5DB5B5]" : ""
              }`}
              step="0.01"
              disabled={isSubmitting}
            />
            {errors.sell_price && (
              <p className="text-[#5DB5B5] text-sm mt-1">{errors.sell_price}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Expire Date <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="date"
              name="expire_date"
              value={formData.expire_date}
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.expire_date ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
            />
            {errors.expire_date && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.expire_date}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Payment Method
            </label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400`}
              disabled={isSubmitting}
            >
              <option value="NONE">None</option>
              <option value="CASH">Cash</option>
              <option value="CBE">CBE</option>
              <option value="COOP">COOP</option>
              <option value="AWASH">Awash</option>
              <option value="EBIRR">Ebirr</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="required_prescription"
              checked={formData.required_prescription}
              onChange={handleChange}
              className={`mr-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400`}
              disabled={isSubmitting}
            />
            <label
              className={`text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              }`}
            >
              Requires Prescription
            </label>
          </div>
        </div>
      </div>

      {/* Section 2: Additional Details */}
      <div className="mb-6">
        <h2
          className={`text-lg font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          2. Additional Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Details
            </label>
            <textarea
              name="details"
              value={formData.details}
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 break-words ${
                errors.details ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
              rows={4}
            />
            {errors.details && (
              <p className="text-[#5DB5B5] text-sm mt-1">{errors.details}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Upload Document */}
      <div className="mb-6">
        <h2
          className={`text-lg font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          3. Upload Document
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Payment File
            </label>
            <input
              type="file"
              name="Payment_file"
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 text-${
                theme === "dark" ? "white" : "gray-600"
              }`}
              disabled={isSubmitting}
            />
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
          {isSubmitting ? "Saving..." : medicine ? "Update" : "Add"}
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

export default MedicineForm;
