import React, { useState, useEffect } from "react";
import {
  getLowStockMedicines,
  getExpiredMedicines,
  getExpirationAlerts,
} from "../api/medicineApi";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";

const Notifications = () => {
  const { user } = useAuth();
  const [lowStockMedicines, setLowStockMedicines] = useState([]);
  const [expiredMedicines, setExpiredMedicines] = useState([]);
  const [expiringSoonMedicines, setExpiringSoonMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletedIds, setDeletedIds] = useState(
    new Set(
      JSON.parse(
        localStorage.getItem(
          `deletedNotificationIds_${user?.role}_${user?.id}`
        ) || "[]"
      )
    )
  );

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const lowStockData = await getLowStockMedicines();
      console.log("Low Stock Medicines:", lowStockData);
      const expiredData = await getExpiredMedicines();
      console.log("Expired Medicines:", expiredData);
      const expiringSoonData = await getExpirationAlerts();
      console.log("Expiring Soon Medicines:", expiringSoonData);

      // Filter out deleted notifications for this user and role
      const filteredLowStock = Array.isArray(lowStockData)
        ? lowStockData.filter((med) => !deletedIds.has(med.id))
        : [];
      const filteredExpired = expiredData?.medicines
        ? expiredData.medicines.filter((med) => !deletedIds.has(med.id))
        : [];
      const filteredExpiringSoon = Array.isArray(expiringSoonData)
        ? expiringSoonData.filter((med) => !deletedIds.has(med.id))
        : [];

      setLowStockMedicines(filteredLowStock);
      setExpiredMedicines(filteredExpired);
      setExpiringSoonMedicines(filteredExpiringSoon);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to fetch notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [deletedIds]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(
        `deletedNotificationIds_${user.role}_${user.id}`,
        JSON.stringify(Array.from(deletedIds))
      );
    }
  }, [deletedIds, user]);

  const formatDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getSupplierName = (medicine) => {
    if (medicine.supplier?.name) return medicine.supplier.name;
    if (medicine.supplier?.supplier_name)
      return medicine.supplier.supplier_name;
    if (medicine.supplier_name) return medicine.supplier_name;
    return "N/A";
  };

  const handleDelete = (type, id) => {
    const newDeletedIds = new Set(deletedIds);
    newDeletedIds.add(id);
    setDeletedIds(newDeletedIds);

    if (type === "lowStock") {
      setLowStockMedicines(lowStockMedicines.filter((med) => med.id !== id));
    } else if (type === "expired") {
      setExpiredMedicines(expiredMedicines.filter((med) => med.id !== id));
    } else if (type === "expiringSoon") {
      setExpiringSoonMedicines(
        expiringSoonMedicines.filter((med) => med.id !== id)
      );
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Medicine Notifications
      </h1>
      {loading && <p className="text-gray-600 text-lg">Loading...</p>}
      {error && (
        <p className="text-red-600 bg-red-50 p-4 rounded-lg mb-6">{error}</p>
      )}

      <button
        onClick={fetchNotifications}
        className="mb-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
      >
        Refresh Notifications
      </button>

      {/* Low Stock Notifications */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Low Stock Medicines ({lowStockMedicines.length})
        </h2>
        {lowStockMedicines.length === 0 ? (
          <p className="text-gray-500 italic">No low stock medicines.</p>
        ) : (
          <div className="grid gap-4">
            {lowStockMedicines.map((medicine) => (
              <div
                key={medicine.id}
                className="flex items-center justify-between p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {medicine.medicine_name || "N/A"} (
                    {medicine.category?.name || "N/A"})
                  </p>
                  <p className="text-gray-600">
                    Batch Number: {medicine.batch_number || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    Dosage Form: {medicine.dosage_form?.name || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    Current Quantity: {medicine.quantity || 0}
                  </p>
                  <p className="text-gray-600">
                    Supplier: {getSupplierName(medicine)}
                  </p>
                  <p className="text-gray-600">
                    Total Value: ETB {(medicine.total_price || 0).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete("lowStock", medicine.id)}
                  className="text-red-500 hover:text-red-700 transition-colors duration-200"
                  aria-label="Delete low stock notification"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expired Medicines Notifications */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Expired Medicines ({expiredMedicines.length})
        </h2>
        {expiredMedicines.length === 0 ? (
          <p className="text-gray-500 italic">No expired medicines.</p>
        ) : (
          <div className="grid gap-4">
            {expiredMedicines.map((medicine) => (
              <div
                key={medicine.id}
                className="flex items-center justify-between p-4 bg-red-50 border-l-4 border-red-400 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {medicine.medicine_name || "N/A"} (
                    {medicine.category?.name || "N/A"})
                  </p>
                  <p className="text-gray-600">
                    Batch Number: {medicine.batch_number || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    Dosage Form: {medicine.dosage_form?.name || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    Current Quantity: {medicine.quantity || 0}
                  </p>
                  <p className="text-gray-600">
                    Supplier: {getSupplierName(medicine)}
                  </p>
                  <p className="text-gray-600">
                    Total Value: ETB {(medicine.total_price || 0).toFixed(2)}
                  </p>
                  <p className="text-gray-600">
                    Expired: {formatDate(medicine.expire_date)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete("expired", medicine.id)}
                  className="text-red-500 hover:text-red-700 transition-colors duration-200"
                  aria-label="Delete expired notification"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expiring Soon Notifications */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Expiring Soon Medicines ({expiringSoonMedicines.length})
        </h2>
        {expiringSoonMedicines.length === 0 ? (
          <p className="text-gray-500 italic">No medicines expiring soon.</p>
        ) : (
          <div className="grid gap-4">
            {expiringSoonMedicines.map((medicine) => (
              <div
                key={medicine.id}
                className="flex items-center justify-between p-4 bg-orange-50 border-l-4 border-orange-400 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {medicine.medicine_name || "N/A"} (
                    {medicine.category?.name || "N/A"})
                  </p>
                  <p className="text-gray-600">
                    Batch Number: {medicine.batch_number || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    Dosage Form: {medicine.dosage_form?.name || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    Current Quantity: {medicine.quantity || 0}
                  </p>
                  <p className="text-gray-600">
                    Supplier: {getSupplierName(medicine)}
                  </p>
                  <p className="text-gray-600">
                    Total Value: ETB {(medicine.total_price || 0).toFixed(2)}
                  </p>
                  <p className="text-gray-600">
                    Expires: {formatDate(medicine.expire_date)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete("expiringSoon", medicine.id)}
                  className="text-red-500 hover:text-red-700 transition-colors duration-200"
                  aria-label="Delete expiring soon notification"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
