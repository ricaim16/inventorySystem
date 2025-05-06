import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ArchiveBoxIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowUturnLeftIcon,
  CurrencyDollarIcon,
  TruckIcon,
  UsersIcon,
  CreditCardIcon,
  UserGroupIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  ListBulletIcon,
  DocumentChartBarIcon,
} from "@heroicons/react/24/outline";

const Sidebar = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isManager = user?.role === "MANAGER";

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    dashboard: true,
    inventory: false,
    medicine: false,
    expiredDate: false,
    sales: false,
    returns: false,
    expense: false,
    supplier: false,
    customers: false,
    creditManagement: false,
    members: false,
    okr: false,
    settings: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-3 sm:top-4 left-3 sm:left-4 z-50 sm:hidden p-2 rounded-md ${
          theme === "dark"
            ? "bg-gray-800 text-gray-200"
            : "bg-[#1a2a44] text-white"
        } focus:outline-none transition-all duration-200`}
        aria-label="Toggle Sidebar"
      >
        {isSidebarOpen ? (
          <XMarkIcon className="w-5 sm:w-6 h-5 sm:h-6" />
        ) : (
          <Bars3Icon className="w-5 sm:w-6 h-5 sm:h-6" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-2/3 max-w-[200px]" : "w-0 sm:w-48 md:w-56 lg:w-64"
        } sm:w-48 md:w-56 lg:w-64 ${
          theme === "dark" ? "bg-gray-900" : "bg-[#1a2a44]"
        } text-gray-200 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden sm:overflow-visible z-40`}
      >
        {/* Sidebar Header */}
        <div
          className={`p-3 sm:p-4 lg:p-5 text-lg sm:text-xl lg:text-2xl font-semibold ${
            theme === "dark" ? "text-[#5DB5B5]" : "text-[#5DB5B5]"
          } flex items-center justify-between font-sans`}
        >
          <span className="truncate">Yusra Pharmacy</span>
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 overflow-y-auto">
          {/* Dashboard */}
          <div className="mb-1 sm:mb-2">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `w-full flex items-center px-2 sm:px-3 lg:px-5 py-1 sm:py-2 text-sm sm:text-base font-medium font-sans transition-all duration-200 ${
                  isActive
                    ? "bg-[#1e5f7a] text-white"
                    : theme === "dark"
                    ? "text-gray-200 hover:bg-gray-800"
                    : "text-white hover:bg-[#1e5f7a]"
                }`
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              <HomeIcon className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3" />
              Dashboard
            </NavLink>
          </div>

          {/* Inventory */}
          <div className="mb-1 sm:mb-2">
            <button
              onClick={() => toggleSection("inventory")}
              className={`w-full flex items-center px-2 sm:px-3 lg:px-5 py-1 sm:py-2 text-sm sm:text-base font-medium font-sans transition-all duration-200 ${
                theme === "dark"
                  ? "text-gray-200 hover:bg-gray-800"
                  : "text-white hover:bg-[#1e5f7a]"
              } focus:outline-none`}
              aria-expanded={openSections.inventory}
              aria-controls="inventory-section"
            >
              <ArchiveBoxIcon className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3" />
              Inventory
              <svg
                className={`w-4 sm:w-5 h-4 sm:h-5 ml-auto transform ${
                  openSections.inventory ? "rotate-180" : ""
                } transition-transform duration-200`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openSections.inventory && (
              <div id="inventory-section" className="pl-6 sm:pl-7 lg:pl-9">
                <div className="mb-1">
                  <button
                    onClick={() => toggleSection("medicine")}
                    className={`w-full flex items-center px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 ${
                      theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    } focus:outline-none truncate`}
                    aria-expanded={openSections.medicine}
                    aria-controls="medicine-section"
                  >
                    <PlusIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                    Medicine
                    <svg
                      className={`w-4 sm:w-5 h-4 sm:h-5 ml-auto transform ${
                        openSections.medicine ? "rotate-180" : ""
                      } transition-transform duration-200`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {openSections.medicine && (
                    <div id="medicine-section" className="pl-3 sm:pl-4 lg:pl-5">
                      <NavLink
                        to="/inventory/medicine/add"
                        className={({ isActive }) =>
                          `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                            isActive
                              ? "bg-[#1e5f7a] text-white"
                              : theme === "dark"
                              ? "text-gray-400 hover:bg-gray-800"
                              : "text-gray-200 hover:bg-[#1e5f7a]"
                          }`
                        }
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <PlusIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                        Add Medicine
                      </NavLink>
                      <NavLink
                        to="/inventory/medicine/list"
                        className={({ isActive }) =>
                          `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                            isActive
                              ? "bg-[#1e5f7a] text-white"
                              : theme === "dark"
                              ? "text-gray-400 hover:bg-gray-800"
                              : "text-gray-200 hover:bg-[#1e5f7a]"
                          }`
                        }
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <ListBulletIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                        Medicine List
                      </NavLink>
                      {isManager && (
                        <NavLink
                          to="/inventory/medicine/report"
                          className={({ isActive }) =>
                            `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                              isActive
                                ? "bg-[#1e5f7a] text-white"
                                : theme === "dark"
                                ? "text-gray-400 hover:bg-gray-800"
                                : "text-gray-200 hover:bg-[#1e5f7a]"
                            }`
                          }
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          <DocumentChartBarIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                          Medicine Report
                        </NavLink>
                      )}
                    </div>
                  )}
                </div>
                <NavLink
                  to="/inventory/category"
                  className={({ isActive }) =>
                    `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                      isActive
                        ? "bg-[#1e5f7a] text-white"
                        : theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <ListBulletIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                  Category
                </NavLink>
                <NavLink
                  to="/inventory/dosage-forms"
                  className={({ isActive }) =>
                    `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                      isActive
                        ? "bg-[#1e5f7a] text-white"
                        : theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <DocumentChartBarIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                  Dosage Form
                </NavLink>
              </div>
            )}
          </div>

          {/* Expired Date */}
          <div className="mb-1 sm:mb-2">
            <button
              onClick={() => toggleSection("expiredDate")}
              className={`w-full flex items-center px-2 sm:px-3 lg:px-5 py-1 sm:py-2 text-sm sm:text-base font-medium font-sans transition-all duration-200 ${
                theme === "dark"
                  ? "text-gray-200 hover:bg-gray-800"
                  : "text-white hover:bg-[#1e5f7a]"
              } focus:outline-none`}
              aria-expanded={openSections.expiredDate}
              aria-controls="expired-date-section"
            >
              <ClockIcon className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3" />
              Expired Date
              <svg
                className={`w-4 sm:w-5 h-4 sm:h-5 ml-auto transform ${
                  openSections.expiredDate ? "rotate-180" : ""
                } transition-transform duration-200`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openSections.expiredDate && (
              <div id="expired-date-section" className="pl-6 sm:pl-7 lg:pl-9">
                <NavLink
                  to="/expired-date/alert"
                  className={({ isActive }) =>
                    `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                      isActive
                        ? "bg-[#1e5f7a] text-white"
                        : theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <svg
                    className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Expire Alert
                </NavLink>
                <NavLink
                  to="/expired-date/list"
                  className={({ isActive }) =>
                    `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                      isActive
                        ? "bg-[#1e5f7a] text-white"
                        : theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <ListBulletIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                  Expire List
                </NavLink>
                {isManager && (
                  <NavLink
                    to="/expired-date/report"
                    className={({ isActive }) =>
                      `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                        isActive
                          ? "bg-[#1e5f7a] text-white"
                          : theme === "dark"
                          ? "text-gray-400 hover:bg-gray-800"
                          : "text-gray-200 hover:bg-[#1e5f7a]"
                      }`
                    }
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <DocumentChartBarIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                    Expire Report
                  </NavLink>
                )}
              </div>
            )}
          </div>

          {/* Sales */}
          <div className="mb-1 sm:mb-2">
            <button
              onClick={() => toggleSection("sales")}
              className={`w-full flex items-center px-2 sm:px-3 lg:px-5 py-1 sm:py-2 text-sm sm:text-base font-medium font-sans transition-all duration-200 ${
                theme === "dark"
                  ? "text-gray-200 hover:bg-gray-800"
                  : "text-white hover:bg-[#1e5f7a]"
              } focus:outline-none`}
              aria-expanded={openSections.sales}
              aria-controls="sales-section"
            >
              <ChartBarIcon className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3" />
              Sales
              <svg
                className={`w-4 sm:w-5 h-4 sm:h-5 ml-auto transform ${
                  openSections.sales ? "rotate-180" : ""
                } transition-transform duration-200`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openSections.sales && (
              <div id="sales-section" className="pl-6 sm:pl-7 lg:pl-9">
                <NavLink
                  to="/sales/entry-form"
                  className={({ isActive }) =>
                    `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                      isActive
                        ? "bg-[#1e5f7a] text-white"
                        : theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <PlusIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                  Sales Entry Form
                </NavLink>
                <NavLink
                  to="/sales/list"
                  className={({ isActive }) =>
                    `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                      isActive
                        ? "bg-[#1e5f7a] text-white"
                        : theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <ListBulletIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                  Sales List
                </NavLink>
                {isManager && (
                  <NavLink
                    to="/sales/report"
                    className={({ isActive }) =>
                      `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                        isActive
                          ? "bg-[#1e5f7a] text-white"
                          : theme === "dark"
                          ? "text-gray-400 hover:bg-gray-800"
                          : "text-gray-200 hover:bg-[#1e5f7a]"
                      }`
                    }
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <DocumentChartBarIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                    Sales Report
                  </NavLink>
                )}
              </div>
            )}
          </div>

          {/* Returns */}
          <div className="mb-1 sm:mb-2">
            <button
              onClick={() => toggleSection("returns")}
              className={`w-full flex items-center px-2 sm:px-3 lg:px-5 py-1 sm:py-2 text-sm sm:text-base font-medium font-sans transition-all duration-200 ${
                theme === "dark"
                  ? "text-gray-200 hover:bg-gray-800"
                  : "text-white hover:bg-[#1e5f7a]"
              } focus:outline-none`}
              aria-expanded={openSections.returns}
              aria-controls="returns-section"
            >
              <ArrowUturnLeftIcon className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3" />
              Return
              <svg
                className={`w-4 sm:w-5 h-4 sm:h-5 ml-auto transform ${
                  openSections.returns ? "rotate-180" : ""
                } transition-transform duration-200`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openSections.returns && (
              <div id="returns-section" className="pl-6 sm:pl-7 lg:pl-9">
                <NavLink
                  to="/returns/form"
                  className={({ isActive }) =>
                    `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                      isActive
                        ? "bg-[#1e5f7a] text-white"
                        : theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <PlusIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                  Return Form
                </NavLink>
                <NavLink
                  to="/returns/list"
                  className={({ isActive }) =>
                    `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                      isActive
                        ? "bg-[#1e5f7a] text-white"
                        : theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <ListBulletIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                  Return List
                </NavLink>
              </div>
            )}
          </div>

          {/* Expense (Manager Only) */}
          {isManager && (
            <div className="mb-1 sm:mb-2">
              <button
                onClick={() => toggleSection("expense")}
                className={`w-full flex items-center px-2 sm:px-3 lg:px-5 py-1 sm:py-2 text-sm sm:text-base font-medium font-sans transition-all duration-200 ${
                  theme === "dark"
                    ? "text-gray-200 hover:bg-gray-800"
                    : "text-white hover:bg-[#1e5f7a]"
                } focus:outline-none`}
                aria-expanded={openSections.expense}
                aria-controls="expense-section"
              >
                <CurrencyDollarIcon className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3" />
                Expense
                <svg
                  className={`w-4 sm:w-5 h-4 sm:h-5 ml-auto transform ${
                    openSections.expense ? "rotate-180" : ""
                  } transition-transform duration-200`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openSections.expense && (
                <div id="expense-section" className="pl-6 sm:pl-7 lg:pl-9">
                  <NavLink
                    to="/expense/form"
                    className={({ isActive }) =>
                      `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                        isActive
                          ? "bg-[#1e5f7a] text-white"
                          : theme === "dark"
                          ? "text-gray-400 hover:bg-gray-800"
                          : "text-gray-200 hover:bg-[#1e5f7a]"
                      }`
                    }
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <PlusIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                    Expense Entry Form
                  </NavLink>
                  <NavLink
                    to="/expense/list"
                    className={({ isActive }) =>
                      `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                        isActive
                          ? "bg-[#1e5f7a] text-white"
                          : theme === "dark"
                          ? "text-gray-400 hover:bg-gray-800"
                          : "text-gray-200 hover:bg-[#1e5f7a]"
                      }`
                    }
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <ListBulletIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                    Expense List
                  </NavLink>
                  <NavLink
                    to="/expense/report"
                    className={({ isActive }) =>
                      `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                        isActive
                          ? "bg-[#1e5f7a] text-white"
                          : theme === "dark"
                          ? "text-gray-400 hover:bg-gray-800"
                          : "text-gray-200 hover:bg-[#1e5f7a]"
                      }`
                    }
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <DocumentChartBarIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                    Expense Report
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* Supplier */}
          <div className="mb-1 sm:mb-2">
            <button
              onClick={() => toggleSection("supplier")}
              className={`w-full flex items-center px-2 sm:px-3 lg:px-5 py-1 sm:py-2 text-sm sm:text-base font-medium font-sans transition-all duration-200 ${
                theme === "dark"
                  ? "text-gray-200 hover:bg-gray-800"
                  : "text-white hover:bg-[#1e5f7a]"
              } focus:outline-none`}
              aria-expanded={openSections.supplier}
              aria-controls="supplier-section"
            >
              <TruckIcon className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3" />
              Supplier
              <svg
                className={`w-4 sm:w-5 h-4 sm:h-5 ml-auto transform ${
                  openSections.supplier ? "rotate-180" : ""
                } transition-transform duration-200`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openSections.supplier && (
              <div id="supplier-section" className="pl-6 sm:pl-7 lg:pl-9">
                <NavLink
                  to="/supplier/add"
                  className={({ isActive }) =>
                    `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                      isActive
                        ? "bg-[#1e5f7a] text-white"
                        : theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <PlusIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                  Add Supplier
                </NavLink>
                <NavLink
                  to="/supplier/list"
                  className={({ isActive }) =>
                    `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                      isActive
                        ? "bg-[#1e5f7a] text-white"
                        : theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <ListBulletIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                  Supplier List
                </NavLink>
                {isManager && (
                  <NavLink
                    to="/supplier/report"
                    className={({ isActive }) =>
                      `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                        isActive
                          ? "bg-[#1e5f7a] text-white"
                          : theme === "dark"
                          ? "text-gray-400 hover:bg-gray-800"
                          : "text-gray-200 hover:bg-[#1e5f7a]"
                      }`
                    }
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <DocumentChartBarIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                    Supplier Report
                  </NavLink>
                )}
              </div>
            )}
          </div>

          {/* Customers */}
          <div className="mb-1 sm:mb-2">
            <button
              onClick={() => toggleSection("customers")}
              className={`w-full flex items-center px-2 sm:px-3 lg:px-5 py-1 sm:py-2 text-sm sm:text-base font-medium font-sans transition-all duration-200 ${
                theme === "dark"
                  ? "text-gray-200 hover:bg-gray-800"
                  : "text-white hover:bg-[#1e5f7a]"
              } focus:outline-none`}
              aria-expanded={openSections.customers}
              aria-controls="customers-section"
            >
              <UsersIcon className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3" />
              Customers
              <svg
                className={`w-4 sm:w-5 h-4 sm:h-5 ml-auto transform ${
                  openSections.customers ? "rotate-180" : ""
                } transition-transform duration-200`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openSections.customers && (
              <div id="customers-section" className="pl-6 sm:pl-7 lg:pl-9">
                <NavLink
                  to="/customers/add"
                  className={({ isActive }) =>
                    `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                      isActive
                        ? "bg-[#1e5f7a] text-white"
                        : theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <PlusIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                  Add Customer
                </NavLink>
                <NavLink
                  to="/customers/list"
                  className={({ isActive }) =>
                    `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                      isActive
                        ? "bg-[#1e5f7a] text-white"
                        : theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <ListBulletIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                  Customer List
                </NavLink>
              </div>
            )}
          </div>

          {/* Credit Management */}
          <div className="mb-1 sm:mb-2">
            <button
              onClick={() => toggleSection("creditManagement")}
              className={`w-full flex items-center px-2 sm:px-3 lg:px-5 py-1 sm:py-2 text-sm sm:text-base font-medium font-sans transition-all duration-200 ${
                theme === "dark"
                  ? "text-gray-200 hover:bg-gray-800"
                  : "text-white hover:bg-[#1e5f7a]"
              } focus:outline-none`}
              aria-expanded={openSections.creditManagement}
              aria-controls="credit-management-section"
            >
              <CreditCardIcon className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3" />
              Credit Management
              <svg
                className={`w-4 sm:w-5 h-4 sm:h-5 ml-auto transform ${
                  openSections.creditManagement ? "rotate-180" : ""
                } transition-transform duration-200`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openSections.creditManagement && (
              <div
                id="credit-management-section"
                className="pl-6 sm:pl-7 lg:pl-9"
              >
                <NavLink
                  to="/credit-management/owed-by-customer"
                  className={({ isActive }) =>
                    `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                      isActive
                        ? "bg-[#1e5f7a] text-white"
                        : theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <ListBulletIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                  Owed by Customer
                </NavLink>
                <NavLink
                  to="/credit-management/owed-to-supplier"
                  className={({ isActive }) =>
                    `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                      isActive
                        ? "bg-[#1e5f7a] text-white"
                        : theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <ListBulletIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                  Owed to Supplier
                </NavLink>
              </div>
            )}
          </div>

          {/* Members (Manager Only) */}
          {isManager && (
            <div className="mb-1 sm:mb-2">
              <button
                onClick={() => toggleSection("members")}
                className={`w-full flex items-center px-2 sm:px-3 lg:px-5 py-1 sm:py-2 text-sm sm:text-base font-medium font-sans transition-all duration-200 ${
                  theme === "dark"
                    ? "text-gray-200 hover:bg-gray-800"
                    : "text-white hover:bg-[#1e5f7a]"
                } focus:outline-none`}
                aria-expanded={openSections.members}
                aria-controls="members-section"
              >
                <UserGroupIcon className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3" />
                Members
                <svg
                  className={`w-4 sm:w-5 h-4 sm:h-5 ml-auto transform ${
                    openSections.members ? "rotate-180" : ""
                  } transition-transform duration-200`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openSections.members && (
                <div id="members-section" className="pl-6 sm:pl-7 lg:pl-9">
                  <NavLink
                    to="/members/employee-management"
                    className={({ isActive }) =>
                      `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                        isActive
                          ? "bg-[#1e5f7a] text-white"
                          : theme === "dark"
                          ? "text-gray-400 hover:bg-gray-800"
                          : "text-gray-200 hover:bg-[#1e5f7a]"
                      }`
                    }
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <PlusIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                    Employee Management
                  </NavLink>
                  <NavLink
                    to="/members/user-management"
                    className={({ isActive }) =>
                      `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                        isActive
                          ? "bg-[#1e5f7a] text-white"
                          : theme === "dark"
                          ? "text-gray-400 hover:bg-gray-800"
                          : "text-gray-200 hover:bg-[#1e5f7a]"
                      }`
                    }
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <ListBulletIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                    User Management
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* OKR (Manager Only) */}
          {isManager && (
            <div className="mb-1 sm:mb-2">
              <button
                onClick={() => toggleSection("okr")}
                className={`w-full flex items-center px-2 sm:px-3 lg:px-5 py-1 sm:py-2 text-sm sm:text-base font-medium font-sans transition-all duration-200 ${
                  theme === "dark"
                    ? "text-gray-200 hover:bg-gray-800"
                    : "text-white hover:bg-[#1e5f7a]"
                } focus:outline-none`}
                aria-expanded={openSections.okr}
                aria-controls="okr-section"
              >
                <CheckCircleIcon className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3" />
                OKR
                <svg
                  className={`w-4 sm:w-5 h-4 sm:h-5 ml-auto transform ${
                    openSections.okr ? "rotate-180" : ""
                  } transition-transform duration-200`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openSections.okr && (
                <div id="okr-section" className="pl-6 sm:pl-7 lg:pl-9">
                  <NavLink
                    to="/okr/add"
                    className={({ isActive }) =>
                      `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                        isActive
                          ? "bg-[#1e5f7a] text-white"
                          : theme === "dark"
                          ? "text-gray-400 hover:bg-gray-800"
                          : "text-gray-200 hover:bg-[#1e5f7a]"
                      }`
                    }
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <PlusIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                    Add OKR
                  </NavLink>
                  <NavLink
                    to="/okr/track-progress"
                    className={({ isActive }) =>
                      `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                        isActive
                          ? "bg-[#1e5f7a] text-white"
                          : theme === "dark"
                          ? "text-gray-400 hover:bg-gray-800"
                          : "text-gray-200 hover:bg-[#1e5f7a]"
                      }`
                    }
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <ListBulletIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                    Track Progress
                  </NavLink>
                  <NavLink
                    to="/okr/generate-report"
                    className={({ isActive }) =>
                      `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                        isActive
                          ? "bg-[#1e5f7a] text-white"
                          : theme === "dark"
                          ? "text-gray-400 hover:bg-gray-800"
                          : "text-gray-200 hover:bg-[#1e5f7a]"
                      }`
                    }
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <DocumentChartBarIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                    Generate Report
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          <div className="mb-1 sm:mb-2">
            <button
              onClick={() => toggleSection("settings")}
              className={`w-full flex items-center px-2 sm:px-3 lg:px-5 py-1 sm:py-2 text-sm sm:text-base font-medium font-sans transition-all duration-200 ${
                theme === "dark"
                  ? "text-gray-200 hover:bg-gray-800"
                  : "text-white hover:bg-[#1e5f7a]"
              } focus:outline-none`}
              aria-expanded={openSections.settings}
              aria-controls="settings-section"
            >
              <Cog6ToothIcon className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3" />
              Settings
              <svg
                className={`w-4 sm:w-5 h-4 sm:h-5 ml-auto transform ${
                  openSections.settings ? "rotate-180" : ""
                } transition-transform duration-200`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openSections.settings && (
              <div id="settings-section" className="pl-6 sm:pl-7 lg:pl-9">
                <NavLink
                  to="/settings/general"
                  className={({ isActive }) =>
                    `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                      isActive
                        ? "bg-[#1e5f7a] text-white"
                        : theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <PlusIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                  General Settings
                </NavLink>
                <NavLink
                  to="/settings/account"
                  className={({ isActive }) =>
                    `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                      isActive
                        ? "bg-[#1e5f7a] text-white"
                        : theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <ListBulletIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                  Account Settings
                </NavLink>
                <NavLink
                  to="/settings/notifications"
                  className={({ isActive }) =>
                    `block px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-sans transition-all duration-200 truncate ${
                      isActive
                        ? "bg-[#1e5f7a] text-white"
                        : theme === "dark"
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-200 hover:bg-[#1e5f7a]"
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <DocumentChartBarIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 inline" />
                  Notification Settings
                </NavLink>
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="mb-1 sm:mb-2">
            <NavLink
              to="/logout"
              className={({ isActive }) =>
                `w-full flex items-center px-2 sm:px-3 lg:px-5 py-1 sm:py-2 text-sm sm:text-base font-medium font-sans transition-all duration-200 ${
                  isActive
                    ? "bg-[#1e5f7a] text-white"
                    : theme === "dark"
                    ? "text-gray-200 hover:bg-gray-800"
                    : "text-white hover:bg-[#1e5f7a]"
                }`
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              <ArrowRightOnRectangleIcon className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3" />
              Logout
            </NavLink>
          </div>
        </nav>
      </div>

      {/* Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 sm:hidden z-30"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;
