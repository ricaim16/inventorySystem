import React, { useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { toast } from "react-toastify";
import SupplierList from "./SupplierList";
import SupplierAdd from "./SupplierAdd";
import SupplierReport from "./SupplierReport";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext"; // Assuming you have an AuthContext

const Supplier = ({ showToast }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth(); // Get user info, including role
  const userRole = user?.role; // e.g., "MANAGER" or "EMPLOYEE"

  // Define showToast function if not provided as prop
  const defaultShowToast = (message, type = "success") => {
    if (type === "error") {
      toast.error(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } else {
      toast.success(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const toastHandler = showToast || defaultShowToast;

  useEffect(() => {
    if (location.pathname === "/supplier") {
      navigate("/supplier/list", { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div
      className={`p-4 sm:p-6 max-w-full mx-auto ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-[#F7F7F7] text-black"
      } min-h-screen`}
    >
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-left">
        Supplier Management
      </h2>

      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mb-4 sm:mb-6">
        {/* Show 'Add Supplier' for both MANAGER and EMPLOYEE */}
        {(userRole === "MANAGER" || userRole === "EMPLOYEE") && (
          <Link
            to="/supplier/add"
            className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
              location.pathname === "/supplier/add"
                ? "bg-[#10B981] text-white"
                : theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-[#10B981] hover:text-white"
                : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
            }`}
          >
            Add Supplier
          </Link>
        )}
        {/* Show 'Supplier List' for both MANAGER and EMPLOYEE */}
        {(userRole === "MANAGER" || userRole === "EMPLOYEE") && (
          <Link
            to="/supplier/list"
            className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
              location.pathname === "/supplier/list"
                ? "bg-[#10B981] text-white"
                : theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-[#10B981] hover:text-white"
                : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
            }`}
          >
            Supplier List
          </Link>
        )}
        {/* Show 'Supplier Report' only for MANAGER */}
        {userRole === "MANAGER" && (
          <Link
            to="/supplier/report"
            className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
              location.pathname === "/supplier/report"
                ? "bg-[#10B981] text-white"
                : theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-[#10B981] hover:text-white"
                : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
            }`}
          >
            Supplier Report
          </Link>
        )}
      </div>

      <Routes>
        <Route
          path="/list"
          element={
            userRole === "MANAGER" || userRole === "EMPLOYEE" ? (
              <SupplierList showToast={toastHandler} />
            ) : (
              <div>Unauthorized</div>
            )
          }
        />
        <Route
          path="/add"
          element={
            userRole === "MANAGER" || userRole === "EMPLOYEE" ? (
              <SupplierAdd showToast={toastHandler} />
            ) : (
              <div>Unauthorized</div>
            )
          }
        />
        <Route
          path="/report"
          element={
            userRole === "MANAGER" ? (
              <SupplierReport showToast={toastHandler} />
            ) : (
              <div>Unauthorized</div>
            )
          }
        />
      </Routes>
    </div>
  );
};

export default Supplier;
