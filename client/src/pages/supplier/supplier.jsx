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

const Supplier = ({ showToast }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

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

  // Use provided showToast or default
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
      </div>

      <Routes>
        <Route
          path="/list"
          element={<SupplierList showToast={toastHandler} />}
        />
        <Route path="/add" element={<SupplierAdd showToast={toastHandler} />} />
        <Route
          path="/report"
          element={<SupplierReport showToast={toastHandler} />}
        />
      </Routes>
    </div>
  );
};

export default Supplier;
