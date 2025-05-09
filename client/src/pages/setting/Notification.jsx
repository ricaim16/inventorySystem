import { useState, useEffect } from "react";
import { useNotification } from "../context/NotificationContext";
import { getAllMedicines } from "../api/medicineApi";
import { useTheme } from "../context/ThemeContext";
import { XMarkIcon } from "@heroicons/react/24/outline";

// Helper to get current time in EAT (East Africa Time)
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
      now.getUTCMinutes()
    )
  );
  const etOffset = 3 * 60 * 60 * 1000; // EAT is UTC+3
  return new Date(utcDate.getTime() + etOffset);
};

const Notification = () => {
  const { notificationCount, deletedIds, setDeletedIds, syncNotifications } =
    useNotification();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState({
    lowStock: [],
    expired: [],
    expiringSoon: [],
  });
  const [loading, setLoading] = useState(true);

  // Fetch and categorize notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const allMedicines = await getAllMedicines();
        const now = getCurrentEAT();
        const oneWeekFromNow = new Date(
          now.getTime() + 7 * 24 * 60 * 60 * 1000
        );
        const threeMonthsFromNow = new Date(
          now.getTime() + 90 * 24 * 60 * 60 * 1000
        );

        // Low Stock Medicines (quantity < 10)
        const lowStock = allMedicines
          .filter(
            (med) =>
              med.quantity < 10 && med.quantity >= 0 && !deletedIds.has(med.id)
          )
          .map((med) => ({
            id: med.id,
            message: `${
              med.medicine_name || "Unnamed Medicine"
            } has low stock (Quantity: ${med.quantity})`,
            type: "lowStock",
          }));

        // Expired Medicines (past expiry date)
        const expired = allMedicines
          .filter(
            (med) => new Date(med.expire_date) < now && !deletedIds.has(med.id)
          )
          .map((med) => ({
            id: med.id,
            message: `${
              med.medicine_name || "Unnamed Medicine"
            } has expired on ${new Date(med.expire_date).toLocaleDateString()}`,
            type: "expired",
          }));

        // Expiring Soon Medicines (within 3 months OR within 1 week)
        const expiringSoon = allMedicines
          .filter((med) => {
            const expiryDate = new Date(med.expire_date);
            return (
              ((expiryDate >= now && expiryDate <= threeMonthsFromNow) ||
                (expiryDate >= now && expiryDate <= oneWeekFromNow)) &&
              !deletedIds.has(med.id)
            );
          })
          .map((med) => ({
            id: med.id,
            message: `${
              med.medicine_name || "Unnamed Medicine"
            } will expire on ${new Date(med.expire_date).toLocaleDateString()}`,
            type: "expiringSoon",
          }));

        setNotifications({
          lowStock,
          expired,
          expiringSoon,
        });
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        setNotifications({
          lowStock: [],
          expired: [],
          expiringSoon: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    // Sync notifications after fetching
    syncNotifications();
  }, [deletedIds, syncNotifications]);

  // Handle dismissing a notification
  const handleDismiss = (notificationId) => {
    setDeletedIds((prev) => {
      const newDeletedIds = new Set(prev);
      newDeletedIds.add(notificationId);
      return newDeletedIds;
    });
    // Update notifications immediately
    setNotifications((prev) => ({
      lowStock: prev.lowStock.filter((n) => n.id !== notificationId),
      expired: prev.expired.filter((n) => n.id !== notificationId),
      expiringSoon: prev.expiringSoon.filter((n) => n.id !== notificationId),
    }));
  };

  // Render notification section
  const renderNotificationSection = (title, notifications, type) => {
    if (notifications.length === 0) return null;

    return (
      <div className="mb-6">
        <h2
          className={`text-xl font-semibold mb-3 ${
            theme === "dark" ? "text-gray-200" : "text-white"
          }`}
        >
          {title}
        </h2>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center justify-between p-4 mb-2 rounded-lg ${
              theme === "dark" ? "bg-gray-800" : "bg-[#2A3B5A]"
            } ${
              type === "expired"
                ? "border-l-4 border-red-500"
                : type === "lowStock"
                ? "border-l-4 border-yellow-500"
                : "border-l-4 border-orange-500"
            }`}
          >
            <span
              className={`${theme === "dark" ? "text-gray-200" : "text-white"}`}
            >
              {notification.message}
            </span>
            <button
              onClick={() => handleDismiss(notification.id)}
              className={`p-2 rounded-full ${
                theme === "dark"
                  ? "text-gray-400 hover:bg-gray-700"
                  : "text-gray-300 hover:bg-[#5DB5B5]"
              }`}
              aria-label="Dismiss notification"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen p-6 pt-24 ${
        theme === "dark" ? "bg-gray-900" : "bg-[#1A2A44]"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-4xl mx-auto">
        <h1
          className={`text-3xl font-bold mb-6 ${
            theme === "dark" ? "text-gray-200" : "text-white"
          }`}
        >
          Notifications {notificationCount > 0 && `(${notificationCount})`}
        </h1>
        {loading ? (
          <p
            className={`${
              theme === "dark" ? "text-gray-400" : "text-gray-300"
            }`}
          >
            Loading notifications...
          </p>
        ) : notifications.lowStock.length === 0 &&
          notifications.expired.length === 0 &&
          notifications.expiringSoon.length === 0 ? (
          <p
            className={`${
              theme === "dark" ? "text-gray-400" : "text-gray-300"
            }`}
          >
            No notifications available.
          </p>
        ) : (
          <>
            {renderNotificationSection(
              "Low Stock Alerts",
              notifications.lowStock,
              "lowStock"
            )}
            {renderNotificationSection(
              "Expired Medicines",
              notifications.expired,
              "expired"
            )}
            {renderNotificationSection(
              "Expiring Soon Alerts",
              notifications.expiringSoon,
              "expiringSoon"
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notification;
