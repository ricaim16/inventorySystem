import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import returnsApi from "../../api/returnsApi";
import { getAllMedicines } from "../../api/medicineApi";
import { getAllDosageForms } from "../../api/dosageApi";
import { getAllSales, editSale } from "../../api/salesApi";
import { useTheme } from "../../context/ThemeContext";

const ReturnForm = ({ returnData, onSave, onCancel, showToast }) => {
  const [formData, setFormData] = useState({
    sale_id: "",
    medicine_id: "",
    dosage_form_id: "",
    quantity: "",
    reason_for_return: "",
    product_name: "",
    product_batch_number: "",
  });
  const [sales, setSales] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [dosageForms, setDosageForms] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (returnData) {
      setFormData({
        sale_id: returnData.sale_id?.toString() || "",
        medicine_id: returnData.medicine_id?.toString() || "",
        dosage_form_id: returnData.dosage_form_id?.toString() || "",
        quantity: returnData.quantity?.toString() || "",
        reason_for_return: returnData.reason_for_return || "",
        product_name: returnData.product_name || "",
        product_batch_number: returnData.product_batch_number || "",
      });
    }
    fetchDropdownData();
  }, [returnData]);

  useEffect(() => {
    const requiredFields = [
      "sale_id",
      "medicine_id",
      "dosage_form_id",
      "quantity",
      "reason_for_return",
      "product_batch_number",
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
      const [salesRes, medRes, doseRes] = await Promise.all([
        getAllSales(),
        getAllMedicines(),
        getAllDosageForms(),
      ]);
      setSales(salesRes.filter((sale) => sale.quantity > 0));
      setMedicines(medRes);
      setDosageForms(doseRes);

      // If returnData exists, ensure formData is updated after sales are fetched
      if (returnData && salesRes.length > 0) {
        const selectedSale = salesRes.find(
          (sale) => sale.id.toString() === returnData.sale_id?.toString()
        );
        if (selectedSale) {
          setFormData((prev) => ({
            ...prev,
            sale_id: returnData.sale_id?.toString() || "",
            medicine_id: selectedSale.medicine_id?.toString() || "",
            dosage_form_id: selectedSale.dosage_form_id?.toString() || "",
            product_name: selectedSale.product_name || "",
            product_batch_number: selectedSale.product_batch_number || "",
          }));
        }
      }
    } catch (err) {
      setErrors({ generic: "Failed to load dropdown data: " + err.message });
    }
  };

  const handleSaleChange = (e) => {
    const saleId = e.target.value;
    if (saleId === "") {
      setFormData((prev) => ({
        ...prev,
        sale_id: "",
        medicine_id: "",
        dosage_form_id: "",
        product_name: "",
        product_batch_number: "",
      }));
      setErrors({
        sale_id: null,
        medicine_id: null,
        dosage_form_id: null,
        quantity: null,
        reason_for_return: null,
        product_name: null,
        product_batch_number: null,
      });
    } else {
      const selectedSale = sales.find((sale) => sale.id.toString() === saleId);
      if (selectedSale) {
        setFormData((prev) => ({
          ...prev,
          sale_id: saleId,
          medicine_id: selectedSale.medicine_id?.toString() || "",
          dosage_form_id: selectedSale.dosage_form_id?.toString() || "",
          product_name: selectedSale.product_name || "",
          product_batch_number: selectedSale.product_batch_number || "",
        }));
        setErrors({
          sale_id: null,
          medicine_id: null,
          dosage_form_id: null,
          quantity: null,
          reason_for_return: null,
          product_name: null,
          product_batch_number: null,
        });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.sale_id) newErrors.sale_id = "Sale is required";
    if (!formData.medicine_id) newErrors.medicine_id = "Medicine is required";
    if (!formData.dosage_form_id)
      newErrors.dosage_form_id = "Dosage form is required";
    if (!formData.quantity) newErrors.quantity = "Quantity is required";
    if (!formData.reason_for_return)
      newErrors.reason_for_return = "Reason for return is required";
    if (!formData.product_batch_number)
      newErrors.product_batch_number = "Batch number is required";

    if (formData.quantity && isNaN(parseInt(formData.quantity)))
      newErrors.quantity = "Quantity must be a valid number";
    if (formData.quantity && parseInt(formData.quantity) <= 0)
      newErrors.quantity = "Quantity must be greater than 0";

    const selectedSale = sales.find(
      (sale) => sale.id.toString() === formData.sale_id
    );
    if (
      selectedSale &&
      formData.quantity &&
      parseInt(formData.quantity) > selectedSale.quantity
    ) {
      newErrors.quantity = `Return quantity cannot exceed sale quantity (${selectedSale.quantity})`;
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
      const selectedSale = sales.find(
        (sale) => sale.id.toString() === formData.sale_id
      );
      const parsedQuantity = parseInt(formData.quantity);
      const newSaleQuantity = selectedSale.quantity - parsedQuantity;

      const payload = {
        sale_id: formData.sale_id,
        medicine_id: formData.medicine_id,
        dosage_form_id: formData.dosage_form_id,
        quantity: parsedQuantity,
        reason_for_return: formData.reason_for_return,
        product_name: formData.product_name || null,
        product_batch_number: formData.product_batch_number,
      };

      if (returnData?.id) {
        const existingReturn = await returnsApi.getReturnById(returnData.id);
        const quantityDifference = parsedQuantity - existingReturn.quantity;
        await returnsApi.updateReturn(returnData.id, payload);
        if (quantityDifference !== 0) {
          await editSale(selectedSale.id, {
            ...selectedSale,
            quantity: newSaleQuantity,
          });
        }
        showToast("Return updated successfully!");
      } else {
        await returnsApi.addReturn(payload);
        await editSale(selectedSale.id, {
          ...selectedSale,
          quantity: newSaleQuantity,
        });
        showToast("Return added successfully!");
      }

      if (typeof onSave === "function") {
        onSave();
      }
      const event = new Event("returnsUpdated");
      window.dispatchEvent(event);
      navigate("/returns/list");
    } catch (err) {
      setErrors({
        generic:
          err.response?.data?.message ||
          "Failed to save return: " + err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      sale_id: "",
      medicine_id: "",
      dosage_form_id: "",
      quantity: "",
      reason_for_return: "",
      product_name: "",
      product_batch_number: "",
    });
    setErrors({});
    setProgress(0);
    onCancel();
  };

  return (
    <div
      className={`returns-form p-4 rounded-lg shadow-lg ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
    >
      <style>
        {`
          .returns-form input,
          .returns-form textarea,
          .returns-form select {
            color: ${theme === "dark" ? "#FFFFFF" : "#4B5563"} !important;
            background-color: ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } !important;
            border-color: ${
              theme === "dark" ? "#6B7280" : "#000000"
            } !important;
            transition: border-color 0.2s ease-in-out;
          }

          .returns-form input:hover,
          .returns-form textarea:hover,
          .returns-form select:hover {
            border-color: ${
              theme === "dark" ? "#9CA3AF" : "#4B5563"
            } !important;
          }

          .returns-form input:focus,
          .returns-form textarea:focus,
          .returns-form select:focus {
            outline: none !important;
            border-color: ${
              theme === "dark" ? "#FFFFFF" : "#000000"
            } !important;
            box-shadow: none !important;
          }

          .returns-form input::placeholder,
          .returns-form textarea::placeholder {
            color: ${theme === "dark" ? "#9CA3AF" : "#9CA3AF"} !important;
          }

          .returns-form input:-webkit-autofill,
          .returns-form input:-webkit-autofill:hover,
          .returns-form input:-webkit-autofill:focus,
          .returns-form input:-webkit-autofill:active,
          .returns-form textarea:-webkit-autofill,
          .returns-form textarea:-webkit-autofill:hover,
          .returns-form textarea:-webkit-autofill:focus,
          .returns-form select:-webkit-autofill,
          .returns-form select:-webkit-autofill:hover,
          .returns-form select:-webkit-autofill:focus {
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

          .returns-form select option {
            background-color: ${
              theme === "dark" ? "#1F2937" : "#FFFFFF"
            } !important;
            color: ${theme === "dark" ? "#FFFFFF" : "#4B5563"} !important;
          }

          .returns-form select option:hover {
            background-color: ${
              theme === "dark" ? "#4B5563" : "#D4C392"
            } !important;
          }

          .returns-form input[readonly],
          .returns-form select[readonly],
          .returns-form textarea[readonly] {
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
          {returnData ? "Edit Return" : "Add Return"}
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
              Sale <span className="text-[#EF4444]">*</span>
            </label>
            <select
              name="sale_id"
              value={formData.sale_id || ""} // Ensure controlled component
              onChange={handleSaleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.sale_id ? "border-[#5DB5B5]" : ""
              }`}
              required
              disabled={isSubmitting || returnData?.sale_id} // Disable when submitting or editing
            >
              <option value="" disabled>
                Select Sale
              </option>
              {sales.map((sale) => (
                <option key={sale.id} value={sale.id.toString()}>
                  {sale.medicine?.medicine_name || "Unknown"} (Dosage:{" "}
                  {sale.dosage_form?.name || "N/A"}, Batch:{" "}
                  {sale.product_batch_number || "N/A"}, Qty: {sale.quantity})
                </option>
              ))}
            </select>
            {errors.sale_id && (
              <p className="text-[#5DB5B5] text-sm mt-1">{errors.sale_id}</p>
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
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.medicine_id ? "border-[#5DB5B5]" : ""
              }`}
              required
              readOnly
            >
              <option value="">Select Medicine</option>
              {medicines.map((med) => (
                <option key={med.id} value={med.id.toString()}>
                  {med.medicine_name}
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
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.dosage_form_id ? "border-[#5DB5B5]" : ""
              }`}
              required
              readOnly
            >
              <option value="">Select Dosage Form</option>
              {dosageForms.map((df) => (
                <option key={df.id} value={df.id.toString()}>
                  {df.name}
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
              disabled={isSubmitting}
              min="1"
              placeholder="Enter quantity"
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
              Reason for Return <span className="text-[#EF4444]">*</span>
            </label>
            <textarea
              name="reason_for_return"
              value={formData.reason_for_return}
              onChange={handleChange}
              className={`w-full p-2 border ${
                theme === "dark" ? "border-gray-500" : "border-black"
              } rounded focus:outline-none hover:border-gray-400 ${
                errors.reason_for_return ? "border-[#5DB5B5]" : ""
              }`}
              required
              disabled={isSubmitting}
              placeholder="Enter reason for return"
            />
            {errors.reason_for_return && (
              <p className="text-[#5DB5B5] text-sm mt-1">
                {errors.reason_for_return}
              </p>
            )}
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
              readOnly
              placeholder="Enter product name"
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
              Batch Number <span className="text-[#EF4444]">*</span>
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
              readOnly
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

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={handleSubmit}
          className={`bg-[#10B981] text-white px-4 py-2 rounded hover:bg-[#0E8C6A] transition-colors ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : returnData ? "Update" : "Add"}
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
    </div>
  );
};

export default ReturnForm;
