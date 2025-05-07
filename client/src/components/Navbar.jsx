import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useState, useEffect } from "react";
import { getAllMedicines } from "../api/medicineApi";
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

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // Fetch medicines for autocomplete
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const data = await getAllMedicines();
        setMedicines(data);
      } catch (err) {
        console.error("Failed to fetch medicines:", err);
      }
    };
    fetchMedicines();
  }, []);

  // Filter medicines based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = medicines
        .filter((med) =>
          med.medicine_name.toLowerCase().startsWith(searchTerm.toLowerCase())
        )
        .slice(0, 5); // Limit to 5 suggestions
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
          {showDropdown && filteredMedicines.length > 0 && (
            <ul
              className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto ${
                theme === "dark" ? "bg-gray-800" : "bg-[#2A3B5A]"
              }`}
            >
              {filteredMedicines.map((med) => (
                <li
                  key={med.id}
                  onClick={() => handleMedicineSelect(med)}
                  className={`px-4 py-2 cursor-pointer text-base ${
                    theme === "dark"
                      ? "text-gray-200 hover:bg-gray-700"
                      : "text-white hover:bg-[#5DB5B5]"
                  } transition-colors duration-200`}
                >
                  {med.medicine_name}
                </li>
              ))}
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
            className={`flex items-center text-base font-medium ${
              theme === "dark"
                ? "text-gray-200 hover:text-[#5DB5B5]"
                : "text-white hover:text-[#5DB5B5]"
            } transition-colors duration-200`}
            aria-label="Notifications"
          >
            <BellIcon className="w-5 h-5 mr-1.5" />
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
            {user?.username || "User"}
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
              className={`flex items-center text-base font-medium ${
                theme === "dark"
                  ? "text-gray-200 hover:text-[#5DB5B5]"
                  : "text-white hover:text-[#5DB5B5]"
              } transition-colors duration-200`}
              onClick={() => setIsMenuOpen(false)}
            >
              <BellIcon className="w-5 h-5 mr-1.5" />
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
              {user?.username || "User"}
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
