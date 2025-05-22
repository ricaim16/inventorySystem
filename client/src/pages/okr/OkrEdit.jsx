import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  editObjective,
  editKeyResult,
  fetchObjectives,
} from "../../api/okrApi";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { format, addDays } from "date-fns";

const OkrEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isManager = user?.role === "MANAGER";
  const [objective, setObjective] = useState({
    title: "",
    description: "",
    time_period: "",
  });
  const [keyResults, setKeyResults] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadObjective = async () => {
      setIsLoading(true);
      try {
        const objectives = await fetchObjectives();
        const obj = objectives.find((o) => o.id === id);
        if (!obj) {
          throw new Error("Objective not found");
        }
        setObjective({
          title: obj.title,
          description: obj.description || "",
          time_period: obj.time_period,
        });
        setKeyResults(
          obj.KeyResults.map((kr) => ({
            id: kr.id,
            title: kr.title,
            description: kr.description || "",
            start_value: kr.start_value || 0,
            target_value: 100,
            weight: 1,
            deadline: format(new Date(kr.deadline), "yyyy-MM-dd"),
          }))
        );
        setError(null);
      } catch (error) {
        console.error("Load objective error:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        setError(
          error.response?.data?.details ||
            error.message ||
            "Failed to load objective"
        );
      } finally {
        setIsLoading(false);
      }
    };
    if (isManager) {
      loadObjective();
    } else {
      setError("Access denied. Only managers can edit OKRs.");
    }
  }, [id, isManager]);

  const handleEditObjective = async (e) => {
    e.preventDefault();
    if (!isManager) {
      setError("Access denied. Only managers can edit OKRs.");
      return;
    }
    if (!objective.title.trim() || !objective.time_period.trim()) {
      setError("Objective title and time period are required.");
      return;
    }
    if (keyResults.some((kr) => !kr.title.trim())) {
      setError("All key results must have a title.");
      return;
    }
    try {
      setError(null);
      await editObjective(id, {
        title: objective.title,
        description: objective.description,
        time_period: objective.time_period,
      });
      for (const kr of keyResults) {
        await editKeyResult(kr.id, {
          title: kr.title,
          description: kr.description,
          start_value: parseFloat(kr.start_value) || 0,
          target_value: 100,
          weight: 1,
          deadline: new Date(kr.deadline),
        });
      }
      navigate("/okr/track-progress");
    } catch (error) {
      console.error("Edit objective error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setError(
        error.response?.data?.details ||
          error.message ||
          "Failed to edit objective"
      );
    }
  };

  const handleAddKeyResult = () => {
    setKeyResults([
      ...keyResults,
      {
        id: `temp-${Date.now()}`,
        title: "",
        description: "",
        start_value: 0,
        target_value: 100,
        weight: 1,
        deadline: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      },
    ]);
  };

  if (!isManager) {
    return (
      <div
        className={`p-6 font-semibold text-xs sm:text-sm ${
          theme === "dark" ? "text-red-400" : "text-red-600"
        }`}
      >
        Access denied. Only managers can edit OKRs.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`p-6 text-sm ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      className={`p-6 rounded-xl shadow-sm transition-colors duration-200 ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
    >
      <h1
        className={`text-xl sm:text-2xl font-semibold mb-6 flex items-center ${
          theme === "dark" ? "text-teal-400" : "text-teal-600"
        }`}
      >
        <span className="mr-2">✏️</span> Edit Objective and Key Results
      </h1>
      {error && (
        <div
          className={`p-3 rounded-md mb-6 flex items-center text-xs sm:text-sm ${
            theme === "dark"
              ? "bg-red-900/20 text-red-400"
              : "bg-red-100 text-red-600"
          }`}
        >
          {error}
          <button
            onClick={() => setError(null)}
            className={`ml-auto text-xs ${
              theme === "dark"
                ? "text-red-400 hover:text-red-300"
                : "text-red-600 hover:text-red-800"
            }`}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}
      <form onSubmit={handleEditObjective} className="space-y-4">
        <div
          className={`p-4 rounded-md transition-colors duration-200 ${
            theme === "dark" ? "bg-gray-900" : "bg-white"
          }`}
        >
          <h2
            className={`text-base sm:text-lg font-semibold mb-3 ${
              theme === "dark" ? "text-teal-400" : "text-teal-600"
            }`}
          >
            Objective
          </h2>
          <div className="mb-4">
            <label
              htmlFor="objective-title"
              className={`block text-xs sm:text-sm font-medium ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="objective-title"
              type="text"
              name="title"
              value={objective.title}
              onChange={(e) =>
                setObjective({ ...objective, [e.target.name]: e.target.value })
              }
              placeholder="Enter objective title"
              className={`mt-1 block w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition-colors duration-200 ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600 text-gray-200"
                  : "bg-white border-gray-200 text-gray-800"
              }`}
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="objective-description"
              className={`block text-xs sm:text-sm font-medium ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Description
            </label>
            <textarea
              id="objective-description"
              name="description"
              value={objective.description}
              onChange={(e) =>
                setObjective({ ...objective, [e.target.name]: e.target.value })
              }
              placeholder="Add a description (optional)"
              className={`mt-1 block w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition-colors duration-200 ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600 text-gray-200"
                  : "bg-white border-gray-200 text-gray-800"
              }`}
              rows="3"
            />
            <span
              className={`text-xs sm:text-sm mt-1 block ${
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Optional
            </span>
          </div>
          <div>
            <label
              htmlFor="time-period"
              className={`block text-xs sm:text-sm font-medium ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Time Period <span className="text-red-500">*</span>
            </label>
            <input
              id="time-period"
              type="text"
              name="time_period"
              value={objective.time_period}
              onChange={(e) =>
                setObjective({ ...objective, [e.target.name]: e.target.value })
              }
              placeholder="e.g., Q2 2025"
              className={`mt-1 block w-32 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs transition-colors duration-200 ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600 text-gray-200"
                  : "bg-white border-gray-200 text-gray-800"
              }`}
              required
            />
          </div>
        </div>

        <div
          className={`p-4 rounded-md transition-colors duration-200 ${
            theme === "dark" ? "bg-gray-900" : "bg-white"
          }`}
        >
          <h2
            className={`text-base sm:text-lg font-semibold mb-3 ${
              theme === "dark" ? "text-teal-400" : "text-teal-600"
            }`}
          >
            Key Results
          </h2>
          {keyResults.map((kr, index) => (
            <div key={kr.id} className="space-y-4 mb-4">
              <div>
                <label
                  htmlFor={`kr-title-${index}`}
                  className={`block text-xs sm:text-sm font-medium ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Key Result Title <span className="text-red-500">*</span>
                </label>
                <input
                  id={`kr-title-${index}`}
                  type="text"
                  name="title"
                  value={kr.title}
                  onChange={(e) => {
                    const updated = [...keyResults];
                    updated[index][e.target.name] = e.target.value;
                    setKeyResults(updated);
                  }}
                  placeholder="Enter key result title"
                  className={`mt-1 block w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition-colors duration-200 ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-600 text-gray-200"
                      : "bg-white border-gray-200 text-gray-800"
                  }`}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor={`kr-description-${index}`}
                  className={`block text-xs sm:text-sm font-medium ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Description
                </label>
                <textarea
                  id={`kr-description-${index}`}
                  name="description"
                  value={kr.description}
                  onChange={(e) => {
                    const updated = [...keyResults];
                    updated[index][e.target.name] = e.target.value;
                    setKeyResults(updated);
                  }}
                  placeholder="Add a description (optional)"
                  className={`mt-1 block w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition-colors duration-200 ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-600 text-gray-200"
                      : "bg-white border-gray-200 text-gray-800"
                  }`}
                  rows="3"
                />
                <span
                  className={`text-xs sm:text-sm mt-1 block ${
                    theme === "dark" ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Optional
                </span>
              </div>
              <div>
                <label
                  htmlFor={`start-value-${index}`}
                  className={`block text-xs sm:text-sm font-medium ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Start Value <span className="text-red-500">*</span>
                </label>
                <input
                  id={`start-value-${index}`}
                  type="number"
                  name="start_value"
                  value={kr.start_value}
                  onChange={(e) => {
                    const updated = [...keyResults];
                    updated[index][e.target.name] =
                      e.target.value === "" ? "" : parseFloat(e.target.value);
                    setKeyResults(updated);
                  }}
                  onBlur={(e) => {
                    const updated = [...keyResults];
                    updated[index][e.target.name] =
                      e.target.value === "" ? 0 : parseFloat(e.target.value);
                    setKeyResults(updated);
                  }}
                  placeholder="0"
                  className={`mt-1 block w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition-colors duration-200 ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-600 text-gray-200"
                      : "bg-white border-gray-200 text-gray-800"
                  }`}
                />
              </div>
              <div>
                <label
                  htmlFor={`deadline-${index}`}
                  className={`block text-xs sm:text-sm font-medium ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  id={`deadline-${index}`}
                  type="date"
                  name="deadline"
                  value={kr.deadline}
                  onChange={(e) => {
                    const updated = [...keyResults];
                    updated[index][e.target.name] = e.target.value;
                    setKeyResults(updated);
                  }}
                  className={`mt-1 block w-32 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs transition-colors duration-200 ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-600 text-gray-200"
                      : "bg-white border-gray-200 text-gray-800"
                  }`}
                  required
                />
              </div>
            </div>
          ))}
          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleAddKeyResult}
              className={`text-sm sm:text-base font-medium transition-colors duration-200 ${
                theme === "dark"
                  ? "text-teal-400 hover:text-teal-300"
                  : "text-teal-600 hover:text-teal-800"
              }`}
            >
              +Add Another
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/okr/track-progress")}
            className={`px-4 py-2 rounded-md font-medium text-base sm:text-lg transition-colors duration-200 ${
              theme === "dark"
                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 rounded-md font-medium text-base sm:text-lg text-white transition-colors duration-200 ${
              theme === "dark"
                ? "bg-teal-700 hover:bg-teal-600"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            Done
          </button>
        </div>
      </form>
    </div>
  );
};

export default OkrEdit;
