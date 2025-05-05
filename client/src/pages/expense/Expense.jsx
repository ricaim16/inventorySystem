import React, { useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import ExpenseList from "./ExpenseList";
import ExpenseReport from "./ExpenseReport";
import ExpenseEntryForm from "./ExpenseEntryForm";
import { useTheme } from "../../context/ThemeContext";

const Expense = ({ showToast }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    if (location.pathname === "/expense") {
      navigate("/expense/list", { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div
      className={`p-4 sm:p-6 max-w-full mx-auto ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-[#F7F7F7] text-black"
      } min-h-screen`}
    >
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-left">
        Expense Management
      </h2>

      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mb-4 sm:mb-6">
        <Link
          to="/expense/form"
          className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
            location.pathname === "/expense/form"
              ? "bg-[#10B981] text-white"
              : theme === "dark"
              ? "bg-gray-700 text-gray-300 hover:bg-[#10B981] hover:text-white"
              : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
          }`}
        >
          Add Expense
        </Link>
        <Link
          to="/expense/list"
          className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
            location.pathname === "/expense/list"
              ? "bg-[#10B981] text-white"
              : theme === "dark"
              ? "bg-gray-700 text-gray-300 hover:bg-[#10B981] hover:text-white"
              : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
          }`}
        >
          Expense List
        </Link>
        <Link
          to="/expense/report"
          className={`py-2 px-4 rounded text-center text-sm sm:text-base ${
            location.pathname === "/expense/report"
              ? "bg-[#10B981] text-white"
              : theme === "dark"
              ? "bg-gray-700 text-gray-300 hover:bg-[#10B981] hover:text-white"
              : "bg-gray-200 text-gray-700 hover:bg-[#10B981] hover:text-white"
          }`}
        >
          Expense Report
        </Link>
      </div>

      <Routes>
        <Route path="/list" element={<ExpenseList showToast={showToast} />} />
        <Route
          path="/report"
          element={<ExpenseReport showToast={showToast} />}
        />
        <Route
          path="/form"
          element={<ExpenseEntryForm showToast={showToast} />}
        />
      </Routes>
    </div>
  );
};

export default Expense;
