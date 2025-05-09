import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useState, useEffect } from "react";
import {
  getAllMedicines,
  getLowStockMedicines,
  getExpiredMedicines,
  getExpirationAlerts,
} from "../api/medicineApi";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

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

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [seenNotificationIds, setSeenNotificationIds] = useState(
    new Set(JSON.parse(localStorage.getItem("seenNotificationIds")) || [])
  );
  const [deletedIds, setDeletedIds] = useState(
    new Set(JSON.parse(localStorage.getItem("deletedNotificationIds")) || [])
  );
  const navigate = useNavigate();
  const location = useLocation();

  // Sync seenNotificationIds with localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "seenNotificationIds",
      JSON.stringify(Array.from(seenNotificationIds))
    );
  }, [seenNotificationIds]);

  // Sync deletedIds with localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "deletedNotificationIds",
      JSON.stringify(Array.from(deletedIds))
    );
  }, [deletedIds]);

  // Fetch medicines for autocomplete
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const data = await getAllMedicines();
        console.log("Fetched Medicines for Search:", data);
        setMedicines(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch medicines:", err);
        setMedicines([]);
      }
    };
    fetchMedicines();
  }, []);

  // Fetch notifications and update count
  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const allMedicines = await getAllMedicines();
        const now = getCurrentEAT();

        // Low Stock Medicines (quantity < 10)
        const lowStockData = allMedicines.filter(
          (med) => med.quantity < 10 && med.quantity >= 0
        );

        // Expired Medicines (past expiry date)
        const expiredData = {
          medicines: allMedicines.filter(
            (med) => new Date(med.expire_date) < now
          ),
        };

        // Expiring Soon Medicines (within 3 months OR within 1 week)
        const oneWeekFromNow = new Date(
          now.getTime() + 7 * 24 * 60 * 60 * 1000
        );
        const threeMonthsFromNow = new Date(
          now.getTime() + 90 * 24 * 60 * 60 * 1000
        );
        const expiringSoonData = allMedicines.filter((med) => {
          const expiryDate = new Date(med.expire_date);
          return (
            (expiryDate >= now && expiryDate <= threeMonthsFromNow) || // Within 3 months
            (expiryDate >= now && expiryDate <= oneWeekFromNow) // OR within 1 week
          );
        });

        // Filter out deleted notifications
        const filteredLowStock = Array.isArray(lowStockData)
          ? lowStockData.filter((med) => !deletedIds.has(med.id))
          : [];
        const filteredExpired = expiredData?.medicines
          ? expiredData.medicines.filter((med) => !deletedIds.has(med.id))
          : [];
        const filteredExpiringSoon = Array.isArray(expiringSoonData)
          ? expiringSoonData.filter((med) => !deletedIds.has(med.id))
          : [];

        const lowStockIds = filteredLowStock.map((med) => med.id);
        const expiredIds = filteredExpired.map((med) => med.id);
        const expiringSoonIds = filteredExpiringSoon.map((med) => med.id);

        const allCurrentIds = [
          ...new Set([...lowStockIds, ...expiredIds, ...expiringSoonIds]),
        ];

        if (isMounted) {
          // Calculate notification count (notifications not seen)
          const newNotificationCount = allCurrentIds.filter(
            (id) => !seenNotificationIds.has(id)
          ).length;

          console.log("Notification Counts:", {
            lowStockCount: lowStockIds.length,
            expiredCount: expiredIds.length,
            expiringSoonCount: expiringSoonIds.length,
            totalCount: allCurrentIds.length,
            newNotificationCount,
            seenNotificationIds: Array.from(seenNotificationIds),
            deletedIds: Array.from(deletedIds),
          });

          setNotificationCount(newNotificationCount);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        if (isMounted) {
          setNotificationCount(0);
        }
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [seenNotificationIds, deletedIds]);

  // Mark notifications as seen when viewing the notifications page
  useEffect(() => {
    if (location.pathname === "/notifications") {
      const markNotificationsAsSeen = async () => {
        try {
          const allMedicines = await getAllMedicines();
          const now = getCurrentEAT();

          // Low Stock Medicines (quantity < 10)
          const lowStockData = allMedicines.filter(
            (med) => med.quantity < 10 && med.quantity >= 0
          );

          // Expired Medicines (past expiry date)
          const expiredData = {
            medicines: allMedicines.filter(
              (med) => new Date(med.expire_date) < now
            ),
          };

          // Expiring Soon Medicines (within 3 months OR within 1 week)
          const oneWeekFromNow = new Date(
            now.getTime() + 7 * 24 * 60 * 60 * 1000
          );
          const threeMonthsFromNow = new Date(
            now.getTime() + 90 * 24 * 60 * 60 * 1000
          );
          const expiringSoonData = allMedicines.filter((med) => {
            const expiryDate = new Date(med.expire_date);
            return (
              (expiryDate >= now && expiryDate <= threeMonthsFromNow) ||
              (expiryDate >= now && expiryDate <= oneWeekFromNow)
            );
          });

          // Filter out deleted notifications
          const filteredLowStock = Array.isArray(lowStockData)
            ? lowStockData.filter((med) => !deletedIds.has(med.id))
            : [];
          const filteredExpired = expiredData?.medicines
            ? expiredData.medicines.filter((med) => !deletedIds.has(med.id))
            : [];
          const filteredExpiringSoon = Array.isArray(expiringSoonData)
            ? expiringSoonData.filter((med) => !deletedIds.has(med.id))
            : [];

          const lowStockIds = filteredLowStock.map((med) => med.id);
          const expiredIds = filteredExpired.map((med) => med.id);
          const expiringSoonIds = filteredExpiringSoon.map((med) => med.id);

          const allCurrentIds = [
            ...new Set([...lowStockIds, ...expiredIds, ...expiringSoonIds]),
          ];

          // Mark all current notifications as seen
          const newSeenIds = new Set([
            ...seenNotificationIds,
            ...allCurrentIds,
          ]);
          setSeenNotificationIds(newSeenIds);
          setNotificationCount(0); // Reset count when viewing notifications
          console.log("Updated Seen Notification IDs:", Array.from(newSeenIds));
        } catch (err) {
          console.error("Failed to update seen notification IDs:", err);
        }
      };
      markNotificationsAsSeen();
    }
  }, [location.pathname, deletedIds]);

  // Filter medicines based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const cleanedSearchTerm = searchTerm.trim().toLowerCase();
      const filtered = medicines
        .filter((med) =>
          (med.medicine_name || "").toLowerCase().includes(cleanedSearchTerm)
        )
        .slice(0, 5);
      setFilteredMedicines(filtered);
      setShowDropdown(true);
    } else {
      setFilteredMedicines([]);
      setShowDropdown(false);
    }
  }, [searchTerm, medicines]);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(
        `/inventory/medicine/list?search=${encodeURIComponent(searchTerm)}`
      );
      setShowDropdown(false);
    } else {
      navigate("/inventory/medicine/list");
    }
    setSearchTerm("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleMedicineSelect = (medicine) => {
    navigate(`/inventory/medicine/list?medicineId=${medicine.id}`);
    setSearchTerm("");
    setShowDropdown(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 h-20 shadow-md z-50 sm:left-48 md:left-56 lg:left-64 transition-all duration-300 ${
        theme === "dark" ? "bg-gray-900" : "bg-[#1A2A44]"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="flex items-center justify-between px-4 py-4 max-w-7xl mx-auto h-full">
        {/* Hamburger Menu (Mobile) */}
        <div className="sm:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              theme === "dark"
                ? "text-gray-200 hover:bg-gray-700"
                : "text-white hover:bg-[#5DB5B5]"
            }`}
            aria-label="Toggle menu"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 mx-4 sm:mx-0">
          <input
            type="text"
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full sm:w-72 pl-10 pr-3 py-2.5 rounded-full text-base font-medium ${
              theme === "dark"
                ? "bg-gray-800 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5DB5B5]"
                : "bg-[#2A3B5A] text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5DB5B5]"
            } transition-all duration-200 hover:placeholder-[#5DB5B5]`}
          />
          <style>
            {`
              input:hover::placeholder {
                color: #5DB5B5;
              }
            `}
          </style>
          <button
            onClick={handleSearch}
            className="absolute left-3 top-1/2 transform -translate-y-1/2"
            aria-label="Search medicines"
          >
            <MagnifyingGlassIcon
              className={`w-5 h-5 ${
                theme === "dark" ? "text-gray-400" : "text-gray-300"
              }`}
            />
          </button>
          {/* Autocomplete Dropdown */}
          {showDropdown && (
            <ul
              className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto ${
                theme === "dark" ? "bg-gray-800" : "bg-[#2A3B5A]"
              }`}
            >
              {filteredMedicines.length > 0 ? (
                filteredMedicines.map((med) => (
                  <li
                    key={med.id}
                    onClick={() => handleMedicineSelect(med)}
                    className={`px-4 py-2 cursor-pointer text-base ${
                      theme === "dark"
                        ? "text-gray-200 hover:bg-gray-700"
                        : "text-white hover:bg-[#5DB5B5]"
                    } transition-colors duration-200`}
                  >
                    {med.medicine_name || "Unnamed Medicine"}
                  </li>
                ))
              ) : (
                <li
                  className={`px-4 py-2 text-base ${
                    theme === "dark" ? "text-gray-400" : "text-gray-300"
                  }`}
                >
                  No medicines found
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center space-x-5">
          <button
            onClick={toggleTheme}
            className={`flex items-center p-2 rounded-full text-base font-medium ${
              theme === "dark"
                ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                : "bg-[#2A3B5A] text-white hover:bg-[#5DB5B5]"
            } transition-all duration-200`}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <SunIcon className="w-5 h-5 mr-1.5" />
            ) : (
              <MoonIcon className="w-5 h-5 mr-1.5" />
            )}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <Link
            to="/notifications"
            className={`flex items-center text-base font-medium relative ${
              theme === "dark"
                ? "text-gray-200 hover:text-[#5DB5B5]"
                : "text-white hover:text-[#5DB5B5]"
            } transition-colors duration-200`}
            aria-label="Notifications"
          >
            <div className="relative">
              <BellIcon className="w-6 h-6 mr-1.5" />
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </div>
            Notifications
          </Link>
          <Link
            to="/profile"
            className={`flex items-center text-base font-medium ${
              theme === "dark"
                ? "text-gray-200 hover:text-[#5DB5B5]"
                : "text-white hover:text-[#5DB5B5]"
            } transition-colors duration-200`}
            aria-label="Profile"
          >
            <UserIcon className="w-5 h-5 mr-1.5" />
            {user?.username || "Admin"}
          </Link>
          <button
            onClick={logout}
            className={`flex items-center text-base font-medium ${
              theme === "dark"
                ? "text-gray-200 hover:text-[#5DB5B5]"
                : "text-white hover:text-[#5DB5B5]"
            } transition-colors duration-200`}
            aria-label="Logout"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-1.5" />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          className={`sm:hidden ${
            theme === "dark" ? "bg-gray-800" : "bg-[#2A3B5A]"
          } px-4 py-4 shadow-md transition-all duration-300`}
        >
          <div className="flex flex-col space-y-3">
            <Link
              to="/settings"
              className={`flex items-center text-base font-medium ${
                theme === "dark"
                  ? "text-gray-200 hover:text-[#5DB5B5]"
                  : "text-white hover:text-[#5DB5B5]"
              } transition-colors duration-200`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Cog6ToothIcon className="w-5 h-5 mr-1.5" />
              Settings
            </Link>
            <button
              onClick={() => {
                toggleTheme();
                setIsMenuOpen(false);
              }}
              className={`flex items-center text-base font-medium p-2 rounded-lg ${
                theme === "dark"
                  ? "bg-gray-800 text-yellow-400 hover:bg-[#5DB5B5]"
                  : "bg-[#2A3B5A] text-white hover:bg-[#5DB5B5]"
              } transition-all duration-200`}
            >
              {theme === "dark" ? (
                <SunIcon className="w-5 h-5 mr-1.5" />
              ) : (
                <MoonIcon className="w-5 h-5 mr-1.5" />
              )}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
            <Link
              to="/notifications"
              className={`flex items-center text-base font-medium relative ${
                theme === "dark"
                  ? "text-gray-200 hover:text-[#5DB5B5]"
                  : "text-white hover:text-[#5DB5B5]"
              } transition-colors duration-200`}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="relative">
                <BellIcon className="w-6 h-6 mr-1.5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </div>
              Notifications
            </Link>
            <Link
              to="/profile"
              className={`flex items-center text-base font-medium ${
                theme === "dark"
                  ? "text-gray-200 hover:text-[#5DB5B5]"
                  : "text-white hover:text-[#5DB5B5]"
              } transition-colors duration-200`}
              onClick={() => setIsMenuOpen(false)}
            >
              <UserIcon className="w-5 h-5 mr-1.5" />
              {user?.username || "Admin"}
            </Link>
            <button
              onClick={() => {
                logout();
                setIsMenuOpen(false);
              }}
              className={`flex items-center text-base font-medium ${
                theme === "dark"
                  ? "text-gray-200 hover:text-[#5DB5B5]"
                  : "text-white hover:text-[#5DB5B5]"
              } transition-colors duration-200`}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-1.5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
