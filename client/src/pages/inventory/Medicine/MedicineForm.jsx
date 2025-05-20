import { useState, useEffect, useRef } from "react";
import { addMedicine, editMedicine } from "../../../api/medicineApi";
import { getAllCategories } from "../../../api/categoryApi";
import { getAllDosageForms } from "../../../api/dosageApi";
import { getAllSuppliers } from "../../../api/supplierApi";
import { useTheme } from "../../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { FaCalendarAlt } from "react-icons/fa";

const MedicineForm = ({ medicine, onSave, onCancel }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const initialFormData = {
    medicine_name: "",
    brand_name: "",
    batch_number: "",
    invoice_number: "",
    category_id: "",
    dosage_form_id: "",
    medicine_weight: "",
    quantity: "",
    initial_quantity: "",
    supplier_id: "",
    unit_price: "",
    sell_price: "",
    total_price: "",
    expire_date: "",
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
  const [categorySearch, setCategorySearch] = useState("");
  const [dosageSearch, setDosageSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDosageDropdown, setShowDosageDropdown] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const categoryDropdownRef = useRef(null);
  const dosageDropdownRef = useRef(null);
  const supplierDropdownRef = useRef(null);
  const expireDateInputRef = useRef(null);

  const paymentMethods = [
    { value: "AWASH", label: "Awash" },
    { value: "CASH", label: "Cash" },
    { value: "CBE", label: "CBE" },
    { value: "COOP", label: "COOP" },
    { value: "CREDIT", label: "Credit" },
    { value: "EBIRR", label: "Ebirr" },
    { value: "NONE", label: "None" },
  ].sort((a, b) => a.label.localeCompare(b.label));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, dosRes, supRes] = await Promise.all([
          getAllCategories(),
          getAllDosageForms(),
          getAllSuppliers(),
        ]);
        setCategories(catRes.sort((a, b) => a.name.localeCompare(b.name)));
        setDosageForms(dosRes.sort((a, b) => a.name.localeCompare(b.name)));
        setSuppliers(
          supRes.sort((a, b) => a.supplier_name.localeCompare(b.supplier_name))
        );
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
        setErrors({ general: "Failed to load dropdown data" });
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (medicine) {
      const calculatedTotalPrice = (
        (parseFloat(medicine.unit_price) || 0) *
        (parseInt(medicine.quantity) || 0)
      ).toFixed(2);
      setFormData({
        medicine_name: medicine.medicine_name || "",
        brand_name: medicine.brand_name || "",
        batch_number: medicine.batch_number || "",
        invoice_number: medicine.invoice_number || "",
        category_id: medicine.category_id || "",
        dosage_form_id: medicine.dosage_form_id || "",
        medicine_weight: medicine.medicine_weight || "",
        quantity: medicine.quantity || "",
        initial_quantity: medicine.initial_quantity || "",
        supplier_id: medicine.supplier_id || "",
        unit_price: medicine.unit_price || "",
        sell_price: medicine.sell_price || "",
        total_price: calculatedTotalPrice,
        expire_date: medicine.expire_date
          ? new Date(medicine.expire_date).toISOString().slice(0, 10)
          : "",
        required_prescription: medicine.required_prescription || false,
        payment_method: medicine.payment_method || "NONE",
        Payment_file: null, // Do not pre-populate file input
        details: medicine.details || "",
      });

      setCategorySearch(
        categories.find((cat) => cat.id === medicine.category_id)?.name || ""
      );
      setDosageSearch(
        dosageForms.find((dos) => dos.id === medicine.dosage_form_id)?.name ||
          ""
      );
      setSupplierSearch(
        suppliers.find((sup) => sup.id === medicine.supplier_id)
          ?.supplier_name || ""
      );
    } else {
      setFormData({
        ...initialFormData,
        expire_date: "",
      });
      setCategorySearch("");
      setDosageSearch("");
      setSupplierSearch("");
    }
  }, [medicine, categories, dosageForms, suppliers]);

  useEffect(() => {
    const requiredFields = [
      "medicine_name",
      "batch_number",
      "category_id",
      "dosage_form_id",
      "quantity",
      "initial_quantity",
      "supplier_id",
      "unit_price",
      "sell_price",
      "expire_date",
    ];
    const filledFields = requiredFields.filter(
      (field) => formData[field] !== "" && formData[field] !== null
    );
    const progressPercentage =
      (filledFields.length / requiredFields.length) * 100;
    setProgress(progressPercentage);
  }, [formData]);

  useEffect(() => {
    const unitPrice = parseFloat(formData.unit_price) || 0;
    const quantity = parseInt(formData.quantity) || 0;
    const totalPrice = (unitPrice * quantity).toFixed(2);
    setFormData((prev) => ({
      ...prev,
      total_price: totalPrice === "0.00" ? "" : totalPrice,
    }));
  }, [formData.unit_price, formData.quantity]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setShowCategoryDropdown(false);
      }
      if (
        dosageDropdownRef.current &&
        !dosageDropdownRef.current.contains(event.target)
      ) {
        setShowDosageDropdown(false);
      }
      if (
        supplierDropdownRef.current &&
        !supplierDropdownRef.current.contains(event.target)
      ) {
        setShowSupplierDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    let newValue = value;

    if (
      [
        "quantity",
        "initial_quantity",
        "unit_price",
        "sell_price",
        "medicine_weight",
      ].includes(name)
    ) {
      newValue = value === "" ? "" : parseFloat(value) || "";
    } else if (name === "batch_number") {
      newValue = value.trim().toUpperCase();
    } else if (
      ["category_id", "dosage_form_id", "supplier_id"].includes(name)
    ) {
      newValue = value === "" ? "" : value.toString();
    }

    if (name === "quantity") {
      setFormData((prev) => ({
        ...prev,
        quantity: newValue,
        initial_quantity: newValue,
      }));
    } else if (name === "details") {
      const words = value.trim().split(/\s+/);
      if (words.length > 20) {
        setErrors((prev) => ({
          ...prev,
          details: "Details cannot exceed 20 words",
        }));
        return;
      }
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : files ? files[0] : newValue,
      }));
    }

    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const openCalendar = () => {
    if (expireDateInputRef.current && !isSubmitting) {
      expireDateInputRef.current.showPicker();
      expireDateInputRef.current.focus();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.medicine_name)
      newErrors.medicine_name = "Medicine name is required";
    if (!formData.batch_number)
      newErrors.batch_number = "Batch number is required";
    if (formData.quantity === "" || formData.quantity === null)
      newErrors.quantity = "Quantity is required";
    if (formData.initial_quantity === "" || formData.initial_quantity === null)
      newErrors.initial_quantity = "Initial quantity is required";
    if (formData.unit_price === "" || formData.unit_price === null)
      newErrors.unit_price = "Unit price is required";
    if (formData.sell_price === "" || formData.sell_price === null)
      newErrors.sell_price = "Sell price is required";
    if (!formData.category_id) newErrors.category_id = "Category is required";
    if (!formData.dosage_form_id)
      newErrors.dosage_form_id = "Dosage form is required";
    if (!formData.supplier_id) newErrors.supplier_id = "Supplier is required";
    if (!formData.expire_date)
      newErrors.expire_date = "Expire date is required";

    if (formData.quantity !== "" && isNaN(parseInt(formData.quantity)))
      newErrors.quantity = "Quantity must be a valid integer";
    if (
      formData.initial_quantity !== "" &&
      isNaN(parseInt(formData.initial_quantity))
    )
      newErrors.initial_quantity = "Initial quantity must be a valid integer";
    if (formData.unit_price !== "" && isNaN(parseFloat(formData.unit_price)))
      newErrors.unit_price = "Unit price must be a valid number";
    if (formData.sell_price !== "" && isNaN(parseFloat(formData.sell_price)))
      newErrors.sell_price = "Sell price must be a valid number";
    if (
      formData.medicine_weight !== "" &&
      isNaN(parseFloat(formData.medicine_weight))
    )
      newErrors.medicine_weight = "Medicine weight must be a valid number";

    if (
      formData.unit_price !== "" &&
      formData.sell_price !== "" &&
      parseFloat(formData.sell_price) < parseFloat(formData.unit_price)
    ) {
      newErrors.sell_price =
        "Sell price must be equal to or greater than unit price";
    }

    if (formData.details) {
      const wordCount = formData.details.trim().split(/\s+/).length;
      if (wordCount > 20) {
        newErrors.details = "Details cannot exceed 20 words";
      }
    }

    if (formData.Payment_file) {
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(formData.Payment_file.type)) {
        newErrors.Payment_file = "File must be JPEG, PNG, or PDF";
      }
      if (formData.Payment_file.size > 5 * 1024 * 1024) {
        newErrors.Payment_file = "File size must not exceed 5MB";
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
        "initial_quantity",
        "unit_price",
        "sell_price",
        "medicine_weight",
      ];
      const optionalFields = [
        "brand_name",
        "batch_number",
        "invoice_number",
        "details",
        "payment_method",
      ];

      // Append all relevant fields
      for (const key in formData) {
        if (formData[key] === null || formData[key] === undefined) {
          continue;
        }
        if (numericFields.includes(key)) {
          const value =
            key === "quantity" || key === "initial_quantity"
              ? parseInt(formData[key])
              : parseFloat(formData[key]);
          if (!isNaN(value)) {
            submissionData.append(key, value.toString());
          }
        } else if (key === "required_prescription") {
          submissionData.append(key, formData[key].toString());
        } else if (key === "Payment_file" && formData[key] instanceof File) {
          submissionData.append(key, formData[key]);
        } else if (optionalFields.includes(key)) {
          submissionData.append(key, formData[key] || "");
        } else if (key !== "total_price") {
          submissionData.append(key, formData[key].toString());
        }
      }

      // For edits, explicitly handle Payment_file if unchanged
      if (medicine && !formData.Payment_file) {
        submissionData.append("Payment_file", ""); // Indicate no new file
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
      console.error("Submit error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      let errorMessage = "Failed to save medicine";
      const errorDetails = err.response?.data?.error?.details || null;

      if (err.response?.status === 500) {
        errorMessage = "Server error: Unable to update medicine";
      } else if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      }

      setErrors({
        general: errorMessage,
        ...(errorDetails || {}),
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

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const filteredDosageForms = dosageForms.filter((dos) =>
    dos.name.toLowerCase().includes(dosageSearch.toLowerCase())
  );
  const filteredSuppliers = suppliers.filter((sup) =>
    sup.supplier_name.toLowerCase().includes(supplierSearch.toLowerCase())
  );

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
            color: ${theme === "dark" ? "#9CA3AF" : "#9CA3AF"} !important;
          }

          .medicine-form input:-webkit-autofill,
          .medicine-form textarea:-webkit-autofill,
          .medicine-form select:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 1000px ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } inset !important;
            -webkit-text-fill-color: ${
              theme === "dark" ? "#FFFFFF" : "#4B5563"
            } !important;
          }

          .medicine-form select option {
            background-color: ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } !important;
            color: ${theme === "dark" ? "#FFFFFF" : "#4B5563"} !important;
          }

          .medicine-form input[type="checkbox"] {
            accent-color: #10B981 !important;
          }

          .medicine-form input[type="file"] {
            color: ${theme === "dark" ? "#FFFFFF" : "#4B5563"} !important;
          }

          .medicine-form input[type="date"]::-webkit-calendar-picker-indicator {
            filter: ${theme === "dark" ? "invert(1)" : "none"};
            cursor: pointer;
            opacity: 1;
            background: transparent;
          }

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

      <div className="mb-6">
        <h2
          className={`text-lg font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          1. Medicine Details
        </h2>
        {errors.general && (
          <div className="text-[#5DB5B5] mb-4">{errors.general}</div>
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
              className={`w-full p-2 border rounded focus:outline-none ${
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
              className="w-full p-2 border rounded focus:outline-none"
              disabled={isSubmitting}
            />
          </div>
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
              name="batch_number"
              value={formData.batch_number}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none ${
                errors.batch_number ? "border-[#5DB5B5]" : ""
              }`}
              disabled={isSubmitting}
            />
            {errors.batch_number && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.batch_number}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Invoice Number
            </label>
            <input
              type="text"
              name="invoice_number"
              value={formData.invoice_number}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Category <span className="text-[#EF4444]">*</span>
            </label>
            <div className="relative" ref={categoryDropdownRef}>
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                onFocus={() => setShowCategoryDropdown(true)}
                placeholder="Search Category..."
                className={`w-full p-2 border rounded focus:outline-none ${
                  errors.category_id ? "border-[#5DB5B5]" : ""
                }`}
                disabled={isSubmitting}
              />
              {showCategoryDropdown && (
                <div
                  className={`absolute w-full mt-1 max-h-48 overflow-y-auto border rounded shadow-lg z-10 ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className={`p-2 cursor-pointer hover:${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                        } ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                        onMouseDown={() => {
                          setFormData((prev) => ({
                            ...prev,
                            category_id: cat.id,
                          }));
                          setCategorySearch(cat.name);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        {cat.name}
                      </div>
                    ))
                  ) : (
                    <div
                      className={`p-2 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      No categories found
                    </div>
                  )}
                </div>
              )}
            </div>
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
            <div className="relative" ref={dosageDropdownRef}>
              <input
                type="text"
                value={dosageSearch}
                onChange={(e) => setDosageSearch(e.target.value)}
                onFocus={() => setShowDosageDropdown(true)}
                placeholder="Search Dosage Form..."
                className={`w-full p-2 border rounded focus:outline-none ${
                  errors.dosage_form_id ? "border-[#5DB5B5]" : ""
                }`}
                disabled={isSubmitting}
              />
              {showDosageDropdown && (
                <div
                  className={`absolute w-full mt-1 max-h-48 overflow-y-auto border rounded shadow-lg z-10 ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {filteredDosageForms.length > 0 ? (
                    filteredDosageForms.map((dos) => (
                      <div
                        key={dos.id}
                        className={`p-2 cursor-pointer hover:${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                        } ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                        onMouseDown={() => {
                          setFormData((prev) => ({
                            ...prev,
                            dosage_form_id: dos.id,
                          }));
                          setDosageSearch(dos.name);
                          setShowDosageDropdown(false);
                        }}
                      >
                        {dos.name}
                      </div>
                    ))
                  ) : (
                    <div
                      className={`p-2 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      No dosage forms found
                    </div>
                  )}
                </div>
              )}
            </div>
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
              className={`w-full p-2 border rounded focus:outline-none ${
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
              className={`w-full p-2 border rounded focus:outline-none ${
                errors.quantity ? "border-[#5DB5B5]" : ""
              }`}
              step="1"
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
            <div className="relative" ref={supplierDropdownRef}>
              <input
                type="text"
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                onFocus={() => setShowSupplierDropdown(true)}
                placeholder="Search Supplier..."
                className={`w-full p-2 border rounded focus:outline-none ${
                  errors.supplier_id ? "border-[#5DB5B5]" : ""
                }`}
                disabled={isSubmitting}
              />
              {showSupplierDropdown && (
                <div
                  className={`absolute w-full mt-1 max-h-48 overflow-y-auto border rounded shadow-lg z-10 ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((sup) => (
                      <div
                        key={sup.id}
                        className={`p-2 cursor-pointer hover:${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                        } ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                        onMouseDown={() => {
                          setFormData((prev) => ({
                            ...prev,
                            supplier_id: sup.id,
                          }));
                          setSupplierSearch(sup.supplier_name);
                          setShowSupplierDropdown(false);
                        }}
                      >
                        {sup.supplier_name}
                      </div>
                    ))
                  ) : (
                    <div
                      className={`p-2 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      No suppliers found
                    </div>
                  )}
                </div>
              )}
            </div>
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
              className={`w-full p-2 border rounded focus:outline-none ${
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
              Sell Price <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="number"
              name="sell_price"
              value={formData.sell_price}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:outline-none ${
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
              Total Price
            </label>
            <input
              type="number"
              name="total_price"
              value={formData.total_price}
              className="w-full p-2 border rounded focus:outline-none bg-gray-100 cursor-not-allowed"
              step="0.01"
              disabled
            />
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              } mb-1`}
            >
              Expire Date <span className="text-[#EF4444]">*</span>
            </label>
            <div className="date-input-container">
              <input
                ref={expireDateInputRef}
                type="date"
                name="expire_date"
                value={formData.expire_date}
                onChange={handleChange}
                onClick={openCalendar}
                className={`w-full p-2 border rounded focus:outline-none ${
                  errors.expire_date ? "border-[#5DB5B5]" : ""
                }`}
                disabled={isSubmitting}
              />
              <FaCalendarAlt
                className="calendar-icon"
                onClick={openCalendar}
                size={20}
                title="Open Calendar"
              />
            </div>
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
              className="w-full p-2 border rounded focus:outline-none"
              disabled={isSubmitting}
            >
              <option value="">Select Payment Method</option>
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="required_prescription"
              checked={formData.required_prescription}
              onChange={handleChange}
              className="mr-2 border rounded focus:outline-none"
              disabled={isSubmitting}
            />
            <label
              className={`text-base font-medium ${
                theme === "dark" ? "text-white" : "text-gray-600"
              }`}
            >
              Requires Prescription
            </label>
          </div>
        </div>
      </div>

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
              className={`w-full p-2 border rounded focus:outline-none break-words ${
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
            {medicine && medicine.Payment_file && (
              <div className="mb-2">
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Current File:
                  <a
                    href={medicine.Payment_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-500 hover:underline ml-1"
                  >
                    View Current File
                  </a>
                </p>
              </div>
            )}
            <input
              type="file"
              name="Payment_file"
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none"
              disabled={isSubmitting}
              accept="image/jpeg,image/png,application/pdf"
            />
            {errors.Payment_file && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.Payment_file}
              </p>
            )}
          </div>
        </div>
      </div>

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
