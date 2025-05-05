import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ExpireAlert from "./ExpireAlert";
import ExpireList from "./ExpireList";
import ExpireReport from "./ExpireReport";
import {
  getExpiredMedicines,
  getExpirationAlerts,
} from "../../api/medicineApi";

const Expire = () => {
  const [expiredMedicines, setExpiredMedicines] = useState([]);
  const [expiringMedicines, setExpiringMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
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
    fetchExpiredMedicines();
    fetchExpirationAlerts();
  }, [user]);

  const fetchExpiredMedicines = async () => {
    try {
      const data = await getExpiredMedicines();
      setExpiredMedicines(data);
      setError(null);
    } catch (err) {
      setError(
        "Failed to fetch expired medicines: " +
          (err.response?.data?.error?.message || err.message)
      );
    }
  };

  const fetchExpirationAlerts = async () => {
    try {
      const data = await getExpirationAlerts();
      setExpiringMedicines(data);
      setError(null);
    } catch (err) {
      setError(
        "Failed to fetch expiration alerts: " +
          (err.response?.data?.error?.message || err.message)
      );
    }
  };

  const handleView = (medicine) => {
    setSelectedMedicine(medicine);
    setIsViewOpen(true);
  };

  const getExpiryStatus = (expireDate) => {
    const now = getCurrentEAT();
    const expiry = new Date(expireDate);
    const monthsDiff = (expiry - now) / (1000 * 60 * 60 * 24 * 30);
    if (monthsDiff <= 0) return "red"; // Expired
    if (monthsDiff <= 3) return "red"; // Critical
    if (monthsDiff <= 6) return "yellow"; // Warning
    return "green"; // Safe
  };

  return (
    <div
      className={`p-4 sm:p-6 lg:p-8 min-h-screen ${
        theme === "dark"
          ? "bg-gray-900 text-white"
          : "bg-[#F7F7F7] text-gray-800"
      }`}
    >
      <h2
        className="text-2xl sm:text-3xl font-bold mb-6 text-left"
        style={{ color: theme === "dark" ? "#10B981" : "#10B981" }}
      >
        Expiration Management
      </h2>

      {error && (
        <div
          className={`mb-4 sm:mb-6 flex flex-col sm:flex-row items-center justify-between ${
            theme === "dark"
              ? "bg-red-900 text-red-200"
              : "bg-red-100 text-red-500"
          } p-3 sm:p-4 rounded-lg`}
        >
          <span className="text-sm sm:text-base">{error}</span>
          <button
            onClick={() => {
              fetchExpiredMedicines();
              fetchExpirationAlerts();
            }}
            className={`mt-2 sm:mt-0 sm:ml-4 px-3 py-1 rounded text-white text-sm sm:text-base ${
              theme === "dark"
                ? "bg-blue-700 hover:bg-blue-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            Retry
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mb-4 sm:mb-6">
        <Link
          to="/expired-date/alert"
          className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
            location.pathname === "/expired-date/alert"
              ? "bg-[#10B981] text-white"
              : theme === "dark"
              ? "bg-gray-800 text-gray-300 hover:bg-[#10B981] hover:text-white"
              : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
          }`}
        >
          Expiration Alerts
        </Link>
        <Link
          to="/expired-date/list"
          className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
            location.pathname === "/expired-date/list"
              ? "bg-[#10B981] text-white"
              : theme === "dark"
              ? "bg-gray-800 text-gray-300 hover:bg-[#10B981] hover:text-white"
              : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
          }`}
        >
          Expired Medicines
        </Link>
        <Link
          to="/expired-date/report"
          className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
            location.pathname === "/Expired-date/report"
              ? "bg-[#10B981] text-white"
              : theme === "dark"
              ? "bg-gray-800 text-gray-300 hover:bg-[#10B981] hover:text-white"
              : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
          }`}
        >
          Expiration Report
        </Link>
      </div>

      {/* Routes */}
      <div className="w-full">
        <Routes>
          <Route
            path="alert"
            element={<ExpireAlert onSelectMedicine={handleView} />}
          />
          <Route
            path="list"
            element={<ExpireList onSelectMedicine={handleView} />}
          />
          <Route path="report" element={<ExpireReport />} />
        </Routes>
      </div>

      {/* View Medicine Modal */}
      {isViewOpen && selectedMedicine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg ${
              theme === "dark"
                ? "bg-gray-800 text-gray-200"
                : "bg-white text-gray-800"
            }`}
          >
            <h3 className="text-lg sm:text-xl font-bold mb-4">
              Expired Medicine Details
            </h3>
            <div className="space-y-2 text-sm sm:text-base">
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
                <strong>Quantity:</strong> {selectedMedicine.quantity}
              </p>
              <p>
                <strong>Supplier:</strong>{" "}
                {selectedMedicine.supplier.supplier_name}
              </p>
              <p>
                <strong>Expire Date:</strong>{" "}
                {formatEAT(selectedMedicine.expire_date)}
              </p>
              <p>
                <strong>Created By:</strong>{" "}
                {selectedMedicine.createdBy.username}
              </p>
            </div>
            <button
              onClick={() => setIsViewOpen(false)}
              className={`mt-4 w-full py-2 rounded text-white text-sm sm:text-base ${
                theme === "dark"
                  ? "bg-gray-600 hover:bg-gray-500"
                  : "bg-gray-500 hover:bg-gray-600"
              }`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expire;
