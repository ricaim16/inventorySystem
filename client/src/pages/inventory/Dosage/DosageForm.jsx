import { useState, useEffect } from "react";
import { addDosageForm, editDosageForm } from "../../../api/dosageApi";
import { useTheme } from "../../../context/ThemeContext";

const DosageForm = ({ dosage, onSave, onCancel }) => {
  const [formData, setFormData] = useState({ name: "" });
  const [error, setError] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (dosage) {
      setFormData({ name: dosage.name || "" });
    } else {
      setFormData({ name: "" });
    }
  }, [dosage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (dosage && dosage.id) {
        await editDosageForm(dosage.id, formData);
      } else {
        await addDosageForm(formData);
      }
      onSave();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save dosage form");
    }
  };

  // Assume editable is true if undefined
  const isEditable = dosage ? dosage.editable !== false : true;

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
          input:-webkit-autofill:focus {
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
        {dosage ? "View/Edit Dosage Form" : "Add Dosage Form"}
      </h2>

      {error && (
        <div
          className={`mb-4 text-sm ${
            theme === "dark" ? "text-red-400" : "text-red-600"
          }`}
        >
          {error}
        </div>
      )}

      <div className="mb-6">
        <label
          className={`block text-sm font-medium ${
            theme === "dark" ? "text-gray-300" : "text-gray-600"
          } mb-1`}
        >
          Dosage Form Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Dosage Form Name"
          className={`w-full p-3 border rounded focus:outline-none text-base ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600 text-gray-200 hover:border-gray-400 focus:border-gray-400"
              : "bg-[#F7F7F7] border-gray-300 text-gray-600 hover:border-gray-500 focus:border-gray-500"
          } ${error ? "border-red-500" : ""}`}
          required
          readOnly={!isEditable}
        />
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          className={`bg-[#10B981] text-white px-4 py-2 rounded hover:bg-[#0E8C6A] transition-colors text-sm ${
            !isEditable ? "hidden" : ""
          }`}
        >
          {dosage ? "Save" : "Add"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-[#ababab] text-white px-4 py-2 rounded hover:bg-[#dedede] hover:text-black transition-colors text-sm"
        >
          {isEditable ? "Cancel" : "Close"}
        </button>
      </div>
    </form>
  );
};

export default DosageForm;
