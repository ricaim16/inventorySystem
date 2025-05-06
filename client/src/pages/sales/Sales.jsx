import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import SalesList from "./SalesList";
import SalesReport from "./SalesReport";
import SalesEntryForm from "./SalesEntryForm";
import { useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

const Sales = ({ showToast }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();

  // Automatically navigate to /sales/list on mount if at /sales
  useEffect(() => {
    if (location.pathname === "/sales") {
      navigate("/sales/list", { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div
      className={`p-4 sm:p-6 max-w-full mx-auto ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-[#F7F7F7] text-black"
      } min-h-screen`}
    >
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-left">
        Sales Management
      </h2>

      {/* Navigation Links */}
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mb-4 sm:mb-6">
        <Link
          to="/sales/entry-form"
          className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
            location.pathname === "/sales/entry-form"
              ? "bg-[#10B981] text-white"
              : theme === "dark"
              ? "bg-gray-700 text-gray-300 hover:bg-[#10B981] hover:text-white"
              : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
          }`}
        >
          Add Sale
        </Link>
        <Link
          to="/sales/list"
          className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
            location.pathname === "/sales/list"
              ? "bg-[#10B981] text-white"
              : theme === "dark"
              ? "bg-gray-700 text-gray-300 hover:bg-[#10B981] hover:text-white"
              : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
          }`}
        >
          Sales List
        </Link>
        {user?.role === "MANAGER" && (
          <Link
            to="/sales/report"
            className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
              location.pathname === "/sales/report"
                ? "bg-[#10B981] text-white"
                : theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-[#10B981] hover:text-white"
                : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
            }`}
          >
            Sales Report
          </Link>
        )}
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<SalesList showToast={showToast} />} />
        <Route path="/list" element={<SalesList showToast={showToast} />} />
        {user?.role === "MANAGER" && (
          <Route
            path="/report"
            element={<SalesReport showToast={showToast} />}
          />
        )}
        <Route
          path="/entry-form"
          element={<SalesEntryForm showToast={showToast} />}
        />
      </Routes>
    </div>
  );
};

export default Sales;
