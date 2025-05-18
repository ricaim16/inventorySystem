import React, { useEffect, useState } from "react";
import { fetchObjectives } from "../../api/okrApi";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const OkrGenerateReport = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isManager = user?.role === "MANAGER";
  const [objectives, setObjectives] = useState([]);
  const [filteredObjectives, setFilteredObjectives] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadObjectives = async () => {
      setIsLoading(true);
      try {
        const data = await fetchObjectives();
        setObjectives(data);
        setFilteredObjectives(data);
        setError(null);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (isManager) {
      loadObjectives();
    }
  }, [isManager]);

  useEffect(() => {
    const filtered = objectives.filter((objective) =>
      objective.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredObjectives(filtered);
  }, [searchQuery, objectives]);

  if (!isManager) {
    return (
      <div
        className={`p-4 sm:p-6 font-semibold text-sm sm:text-base ${
          theme === "dark" ? "text-red-400" : "text-red-600"
        }`}
      >
        Access denied. Only managers can view reports.
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 rounded-xl shadow-sm transition-colors duration-200 ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      {/* Header Section */}
      <div className="mb-6 sm:mb-8 border-b pb-4">
        <h1
          className={`text-2xl sm:text-3xl font-bold transition-colors duration-200 ${
            theme === "dark" ? "text-teal-400" : "text-teal-600"
          }`}
        >
          OKR Performance Report
        </h1>
        <p
          className={`mt-2 text-sm sm:text-base ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Objectives and Key Results{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <div
          className={`relative w-full sm:w-3/4 md:w-2/3 lg:w-1/2 max-w-lg transition-colors duration-200 ${
            theme === "dark" ? "text-gray-200" : "text-gray-800"
          }`}
        >
          <input
            type="text"
            placeholder="Search objectives by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm sm:text-base transition-colors duration-200 ${
              theme === "dark"
                ? "bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
            } focus:outline-none focus:ring-2 focus:ring-teal-500`}
          />
          <span
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-lg ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            🔍
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className={`p-3 rounded-lg mb-6 flex items-center text-sm sm:text-base ${
            theme === "dark"
              ? "bg-red-900/20 text-red-400"
              : "bg-red-100 text-red-600"
          } shadow-sm`}
        >
          {error}
          <button
            onClick={() => setError(null)}
            className={`ml-auto text-xs sm:text-sm ${
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

      {/* Loading State */}
      {isLoading && (
        <div
          className={`text-sm sm:text-base ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Loading report data...
        </div>
      )}

      {/* Objectives List */}
      <div className="space-y-4 sm:space-y-6">
        {filteredObjectives.length === 0 && !isLoading ? (
          <p
            className={`text-sm sm:text-base ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {searchQuery
              ? "No objectives match your search."
              : "No objectives available to report. Please add OKRs to generate a report."}
          </p>
        ) : (
          filteredObjectives.map((objective) => (
            <div
              key={objective.id}
              className={`border rounded-lg p-4 sm:p-5 transition-colors duration-200 ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-white border-gray-200"
              } shadow-md hover:shadow-lg`}
            >
              {/* Objective Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                <div className="flex items-center">
                  <span className="mr-2 text-xl sm:text-2xl">🎯</span>
                  <h3
                    className={`text-lg sm:text-xl font-bold transition-colors duration-200 ${
                      theme === "dark" ? "text-teal-400" : "text-teal-600"
                    }`}
                  >
                    {objective.title}
                  </h3>
                </div>
                <div
                  className={`text-sm sm:text-base mt-2 sm:mt-0 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <span className="font-medium">Progress:</span>{" "}
                  {objective.progress.toFixed(0)}%
                </div>
              </div>

              {/* Objective Details */}
              <div
                className={`text-sm sm:text-base mb-4 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <p>
                  <span className="font-medium">Time Period:</span>{" "}
                  {objective.time_period}
                </p>
                {objective.description && (
                  <p>
                    <span className="font-medium">Description:</span>{" "}
                    {objective.description}
                  </p>
                )}
              </div>

              {/* Key Results Section */}
              <h4
                className={`text-base sm:text-lg font-semibold mb-3 transition-colors duration-200 ${
                  theme === "dark" ? "text-teal-400" : "text-teal-600"
                }`}
              >
                Key Results
              </h4>
              {objective.KeyResults.length === 0 ? (
                <p
                  className={`text-sm sm:text-base ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No key results defined for this objective.
                </p>
              ) : (
                <div className="space-y-3">
                  {objective.KeyResults.map((kr) => (
                    <div
                      key={kr.id}
                      className={`p-3 rounded-md border transition-colors duration-200 ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <p
                        className={`text-sm sm:text-base font-medium ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {kr.title}
                      </p>
                      <div
                        className={`text-sm sm:text-base mt-1 ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <p>
                          <span className="font-medium">Progress:</span>{" "}
                          {kr.progress}/{kr.target_value} (
                          {(
                            ((kr.progress - (kr.start_value || 0)) /
                              (kr.target_value - (kr.start_value || 0))) *
                            100
                          ).toFixed(0)}
                          %)
                        </p>
                        <p>
                          <span className="font-medium">Weight:</span>{" "}
                          {kr.weight || 1}
                        </p>
                        <p>
                          <span className="font-medium">Deadline:</span>{" "}
                          {new Date(kr.deadline).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        {kr.status && (
                          <p>
                            <span className="font-medium">Status:</span>{" "}
                            {kr.status}
                          </p>
                        )}
                        {kr.description && (
                          <p>
                            <span className="font-medium">Description:</span>{" "}
                            {kr.description}
                          </p>
                        )}
                        {kr.comment && (
                          <p>
                            <span className="font-medium">Comment:</span>{" "}
                            {kr.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OkrGenerateReport;
