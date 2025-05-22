import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addObjective, addKeyResult } from "../../api/okrApi";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { format, addDays } from "date-fns";

const OkrAdd = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isManager = user?.role === "MANAGER";
  const [error, setError] = useState(null);
  const [newObjective, setNewObjective] = useState({
    title: "",
    description: "",
    time_period: "Q2 2025",
  });
  const [newKeyResults, setNewKeyResults] = useState([
    {
      title: "",
      description: "",
      start_value: 0,
      target_value: 100,
      weight: 1,
      deadline: addDays(new Date(), 1),
    },
  ]);

  const handleAddObjective = async (e) => {
    e.preventDefault();
    if (!isManager) {
      setError("Access denied. Only managers can add OKRs.");
      return;
    }
    if (!newObjective.title.trim() || !newObjective.time_period.trim()) {
      setError("Objective title and time period are required.");
      return;
    }
    if (newKeyResults.some((kr) => !kr.title.trim())) {
      setError("Key result must have a title.");
      return;
    }
    try {
      setError(null);
      const objective = await addObjective({
        title: newObjective.title,
        description: newObjective.description,
        time_period: newObjective.time_period,
      });
      for (const kr of newKeyResults) {
        const keyResultData = {
          objective_id: objective.id,
          title: kr.title,
          description: kr.description || "",
          start_value: parseFloat(kr.start_value) ?? 0,
          target_value: 100,
          weight: 1,
          deadline: new Date(kr.deadline),
        };
        await addKeyResult(keyResultData);
      }
      setNewObjective({ title: "", description: "", time_period: "Q2 2025" });
      setNewKeyResults([
        {
          title: "",
          description: "",
          start_value: 0,
          target_value: 100,
          weight: 1,
          deadline: addDays(new Date(), 1),
        },
      ]);
      navigate("/okr/track-progress");
    } catch (error) {
      console.error("Add objective error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setError(
        error.response?.data?.details ||
          error.message ||
          "Failed to create objective"
      );
    }
  };

  const handleAddAnotherKeyResult = () => {
    setNewKeyResults([
      ...newKeyResults,
      {
        title: "",
        description: "",
        start_value: 0,
        target_value: 100,
        weight: 1,
        deadline: addDays(new Date(), 1),
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
        Access denied. Only managers can add OKRs.
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
        className={`text-xl sm:text-2xl font-semibold mb-6 ${
          theme === "dark" ? "text-teal-400" : "text-teal-600"
        }`}
      >
        OBJECTIVE AND KEY RESULT
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
      <form onSubmit={handleAddObjective} className="space-y-4">
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
              value={newObjective.title}
              onChange={(e) =>
                setNewObjective({
                  ...newObjective,
                  [e.target.name]: e.target.value,
                })
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
              value={newObjective.description}
              onChange={(e) =>
                setNewObjective({
                  ...newObjective,
                  [e.target.name]: e.target.value,
                })
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
              value={newObjective.time_period}
              onChange={(e) =>
                setNewObjective({
                  ...newObjective,
                  [e.target.name]: e.target.value,
                })
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
            Key Result
          </h2>
          {newKeyResults.map((kr, index) => (
            <div key={index} className="space-y-4 mb-4">
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
                    const updated = [...newKeyResults];
                    updated[index][e.target.name] = e.target.value;
                    setNewKeyResults(updated);
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
                    const updated = [...newKeyResults];
                    updated[index][e.target.name] = e.target.value;
                    setNewKeyResults(updated);
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
                    const updated = [...newKeyResults];
                    updated[index][e.target.name] =
                      e.target.value === "" ? "" : parseFloat(e.target.value);
                    setNewKeyResults(updated);
                  }}
                  onBlur={(e) => {
                    const updated = [...newKeyResults];
                    updated[index][e.target.name] =
                      e.target.value === "" ? 0 : parseFloat(e.target.value);
                    setNewKeyResults(updated);
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
                  value={format(new Date(kr.deadline), "yyyy-MM-dd")}
                  onChange={(e) => {
                    const updated = [...newKeyResults];
                    updated[index].deadline = new Date(e.target.value);
                    setNewKeyResults(updated);
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
              onClick={handleAddAnotherKeyResult}
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
            Add
          </button>
        </div>
      </form>
    </div>
  );
};

export default OkrAdd;
