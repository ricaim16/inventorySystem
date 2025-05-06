import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import MedicineForm from "./MedicineForm";
import MedicineList from "./MedicineList";
import MedicineReport from "./MedicineReport";
import { getAllMedicines, deleteMedicine } from "../../../api/medicineApi";

const Medicine = () => {
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();

  const formatEAT = (date) => {
    const options = {
      timeZone: "Africa/Addis_Ababa",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    return new Date(date).toLocaleString("en-US", options);
  };

  const getCurrentEAT = () => {
    const now = new Date();
    const utcDate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds(),
        now.getUTCMilliseconds()
      )
    );
    const etOffset = 3 * 60 * 60 * 1000;
    return new Date(utcDate.getTime() + etOffset);
  };

  useEffect(() => {
    if (!user) {
      setError("No authentication token found. Please log in.");
      return;
    }
    fetchMedicines();
  }, [user]);

  const fetchMedicines = async () => {
    try {
      const data = await getAllMedicines();
      const sortedData = [...data].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
      setMedicines(sortedData);
      setError(null);
    } catch (err) {
      setError(
        "Failed to fetch medicines: " +
          (err.response?.data?.error?.message || err.message)
      );
    }
  };

  const handleEdit = (medicine) => {
    setSelectedMedicine(medicine);
    setIsFormOpen(true);
  };

  const handleView = (medicine) => {
    setSelectedMedicine(medicine);
    setIsViewOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      try {
        await deleteMedicine(id);
        setMedicines(medicines.filter((med) => med.id !== id));
      } catch (err) {
        setError(
          "Failed to delete medicine: " +
            (err.response?.data?.error?.message || err.message)
        );
      }
    }
  };

  const handleSave = (newMedicine) => {
    setMedicines((prev) => {
      if (selectedMedicine) {
        const updatedList = prev.filter((med) => med.id !== newMedicine.id);
        return [newMedicine, ...updatedList];
      }
      return [newMedicine, ...prev];
    });
    setIsFormOpen(false);
    setSelectedMedicine(null);
  };

  const handleAddMedicine = () => {
    setSelectedMedicine(null);
    setIsFormOpen(true);
  };

  const getExpiryStatus = (expireDate) => {
    const now = getCurrentEAT();
    const expiry = new Date(expireDate);
    const monthsDiff = (expiry - now) / (1000 * 60 * 60 * 24 * 30);
    if (monthsDiff <= 3) return "red";
    if (monthsDiff <= 6) return "yellow";
    return "green";
  };

  return (
    <div
      className={`flex min-h-screen ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-[#F7F7F7] text-black"
      }`}
    >
      <div className="flex-1 p-4 sm:p-6">
        <h2
          className="text-2xl sm:text-3xl font-bold mb-6 text-left"
          style={{ color: theme === "dark" ? "#10B981" : "#10B981" }}
        >
          Medicine Management
        </h2>
        {error && (
          <div
            className={`mb-4 sm:mb-6 p-3 rounded ${
              theme === "dark"
                ? "bg-red-900 text-red-200"
                : "bg-red-100 text-red-700"
            }`}
          >
            {error}
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mb-4 sm:mb-6">
          <Link
            to="/inventory/medicine/add"
            className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
              location.pathname === "/inventory/medicine/add"
                ? "bg-[#10B981] text-white"
                : theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-[#10B981] hover:text-white"
                : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
            }`}
          >
            Add Medicine
          </Link>
          <Link
            to="/inventory/medicine/list"
            className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
              location.pathname === "/inventory/medicine/list"
                ? "bg-[#10B981] text-white"
                : theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-[#10B981] hover:text-white"
                : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
            }`}
          >
            Medicine List
          </Link>
          {user?.role === "MANAGER" && (
            <Link
              to="/inventory/medicine/report"
              className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
                location.pathname === "/inventory/medicine/report"
                  ? "bg-[#10B981] text-white"
                  : theme === "dark"
                  ? "bg-gray-700 text-gray-300 hover:bg-[#10B981] hover:text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
              }`}
            >
              Medicine Report
            </Link>
          )}
        </div>

        {/* Routes */}
        <Routes>
          <Route
            path="add"
            element={
              <MedicineForm
                medicine={selectedMedicine}
                onSave={handleSave}
                onCancel={() => setIsFormOpen(false)}
              />
            }
          />
          <Route
            path="list"
            element={<MedicineList onSelectMedicine={handleView} />}
          />
          {user?.role === "MANAGER" && (
            <Route path="report" element={<MedicineReport />} />
          )}
        </Routes>

        {/* View Medicine Modal */}
        {isViewOpen && selectedMedicine && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div
              className={`p-6 rounded-lg shadow-lg max-w-lg w-full ${
                theme === "dark"
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-800"
              }`}
            >
              <h3 className="text-xl font-bold mb-4">Medicine Details</h3>
              <p>
                <strong>Invoice Number:</strong>{" "}
                {selectedMedicine.invoice_number}
              </p>
              <p>
                <strong>Medicine Name:</strong> {selectedMedicine.medicine_name}
              </p>
              <p>
                <strong>Brand:</strong> {selectedMedicine.brand_name || "N/A"}
              </p>
              <p>
                <strong>Batch Number:</strong>{" "}
                {selectedMedicine.batch_number || "N/A"}
              </p>
              <p>
                <strong>Category:</strong> {selectedMedicine.category.name}
              </p>
              <p>
                <strong>Dosage Form:</strong>{" "}
                {selectedMedicine.dosage_form.name}
              </p>
              <p>
                <strong>Weight:</strong>{" "}
                {selectedMedicine.medicine_weight || "N/A"}
              </p>
              <p>
                <strong>Quantity:</strong> {selectedMedicine.quantity}
              </p>
              <p>
                <strong>Supplier:</strong>{" "}
                {selectedMedicine.supplier.supplier_name}
              </p>
              <p>
                <strong>Unit Price:</strong> {selectedMedicine.unit_price}
              </p>
              <p>
                <strong>Sell Price:</strong>{" "}
                {selectedMedicine.sell_price || "N/A"}
              </p>
              <p>
                <strong>Total Price:</strong> {selectedMedicine.total_price}
              </p>
              <p>
                <strong>Expire Date:</strong>{" "}
                {formatEAT(selectedMedicine.expire_date)}
              </p>
              <p>
                <strong>Requires Prescription:</strong>{" "}
                {selectedMedicine.required_prescription ? "Yes" : "No"}
              </p>
              <p>
                <strong>Payment Method:</strong>{" "}
                {selectedMedicine.payment_method}
              </p>
              {selectedMedicine.Payment_file && (
                <p>
                  <strong>Payment File:</strong>{" "}
                  <a
                    href={`http://localhost:8080/${selectedMedicine.Payment_file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`underline ${
                      theme === "dark"
                        ? "text-blue-400 hover:text-blue-300"
                        : "text-blue-600 hover:text-blue-800"
                    }`}
                  >
                    View File
                  </a>
                </p>
              )}
              <p>
                <strong>Details:</strong> {selectedMedicine.details || "N/A"}
              </p>
              {user?.role === "MANAGER" && (
                <>
                  <p>
                    <strong>Created By:</strong>{" "}
                    {selectedMedicine.createdBy.username}
                  </p>
                  <p>
                    <strong>Created At:</strong>{" "}
                    {formatEAT(selectedMedicine.createdAt)}
                  </p>
                  <p>
                    <strong>Updated At:</strong>{" "}
                    {formatEAT(selectedMedicine.updatedAt)}
                  </p>
                </>
              )}
              <button
                onClick={() => setIsViewOpen(false)}
                className={`mt-4 px-4 py-2 rounded font-medium transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-gray-600 text-white hover:bg-gray-500"
                    : "bg-gray-500 text-white hover:bg-gray-600"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Medicine;
