import { createContext, useContext, useState, useEffect } from "react";
import { getAllMedicines } from "../api/medicineApi";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);
  const [seenNotificationIds, setSeenNotificationIds] = useState(
    new Set(
      JSON.parse(
        localStorage.getItem(`seenNotificationIds_${user?.role}_${user?.id}`) ||
          "[]"
      )
    )
  );
  const [deletedIds, setDeletedIds] = useState(
    new Set(
      JSON.parse(
        localStorage.getItem(
          `deletedNotificationIds_${user?.role}_${user?.id}`
        ) || "[]"
      )
    )
  );

  useEffect(() => {
    if (user) {
      localStorage.setItem(
        `seenNotificationIds_${user.role}_${user.id}`,
        JSON.stringify(Array.from(seenNotificationIds))
      );
    }
  }, [seenNotificationIds, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(
        `deletedNotificationIds_${user.role}_${user.id}`,
        JSON.stringify(Array.from(deletedIds))
      );
    }
  }, [deletedIds, user]);

  const syncNotifications = async () => {
    try {
      const allMedicines = await getAllMedicines();
      const now = new Date();
      const threeMonthsFromNow = new Date(
        now.getTime() + 90 * 24 * 60 * 60 * 1000
      );

      // Identify notifications
      const lowStockIds = allMedicines
        .filter(
          (med) =>
            med.quantity < 10 && med.quantity >= 0 && !deletedIds.has(med.id)
        )
        .map((med) => med.id);
      const expiredIds = allMedicines
        .filter(
          (med) => new Date(med.expire_date) < now && !deletedIds.has(med.id)
        )
        .map((med) => med.id);
      const expiringSoonIds = allMedicines
        .filter((med) => {
          const expiryDate = new Date(med.expire_date);
          return (
            expiryDate >= now &&
            expiryDate <= threeMonthsFromNow &&
            !deletedIds.has(med.id)
          );
        })
        .map((med) => med.id);

      // Combine all notification IDs
      const allCurrentIds = [
        ...new Set([...lowStockIds, ...expiredIds, ...expiringSoonIds]),
      ];

      // Update seenNotificationIds
      setSeenNotificationIds((prev) => new Set([...prev, ...allCurrentIds]));

      // Set notification count to the total number of active notifications
      setNotificationCount(allCurrentIds.length);
    } catch (err) {
      console.error("Failed to sync notifications:", err);
    }
  };

  useEffect(() => {
    if (user) {
      syncNotifications();
      const interval = setInterval(syncNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [deletedIds, seenNotificationIds, user]);

  const value = {
    notificationCount,
    seenNotificationIds,
    deletedIds,
    setDeletedIds,
    syncNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
