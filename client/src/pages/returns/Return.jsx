import React, { useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import ReturnList from "./ReturnList";
import ReturnReport from "./ReturnReport";
import ReturnForm from "./ReturnForm";
import { useTheme } from "../../context/ThemeContext";

const Return = ({ showToast }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    if (location.pathname === "/returns") {
      navigate("/returns/list", { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div
      className={`p-4 sm:p-6 max-w-full mx-auto ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-[#F7F7F7] text-black"
      } min-h-screen`}
    >
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-left">
        Returns Management
      </h2>

      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mb-4 sm:mb-6">
        <Link
          to="/returns/form"
          className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
            location.pathname === "/returns/form"
              ? "bg-[#10B981] text-white"
              : theme === "dark"
              ? "bg-gray-700 text-gray-300 hover:bg-[#10B981] hover:text-white"
              : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
          }`}
        >
          Add Return
        </Link>
        <Link
          to="/returns/list"
          className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
            location.pathname === "/returns/list"
              ? "bg-[#10B981] text-white"
              : theme === "dark"
              ? "bg-gray-700 text-gray-300 hover:bg-[#10B981] hover:text-white"
              : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
          }`}
        >
          Returns List
        </Link>
        <Link
          to="/returns/report"
          className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
            location.pathname === "/returns/report"
              ? "bg-[#10B981] text-white"
              : theme === "dark"
              ? "bg-gray-700 text-gray-300 hover:bg-[#10B981] hover:text-white"
              : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
          }`}
        >
          Returns Report
        </Link>
      </div>

      <Routes>
        <Route path="/" element={<ReturnList showToast={showToast} />} />
        <Route path="/list" element={<ReturnList showToast={showToast} />} />
        <Route
          path="/report"
          element={<ReturnReport showToast={showToast} />}
        />
        <Route path="/form" element={<ReturnForm showToast={showToast} />} />
      </Routes>
    </div>
  );
};

export default Return;
