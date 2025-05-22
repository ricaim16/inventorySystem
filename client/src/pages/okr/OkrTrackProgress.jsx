import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import {
  fetchObjectives,
  updateKeyResultProgress,
  deleteObjective,
  deleteKeyResult,
  addKeyResult,
} from "../../api/okrApi";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { format, addDays } from "date-fns";
import {
  EllipsisVerticalIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { HiExclamationCircle } from "react-icons/hi";

Modal.setAppElement("#root");

const OkrTrackProgress = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isManager = user?.role === "MANAGER";
  const [objectives, setObjectives] = useState([]);
  const [expandedObjective, setExpandedObjective] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedKeyResult, setSelectedKeyResult] = useState(null);
  const [newProgress, setNewProgress] = useState(0);
  const [newStatus, setNewStatus] = useState("Not Started");
  const [newTitle, setNewTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState({
    title: "",
    description: "",
    start_value: 0,
    target_value: 100,
    weight: 1,
    deadline: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    status: "Not Started",
    comment: "",
  });
  const [addingNewKeyResult, setAddingNewKeyResult] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [showDeleteObjectiveModal, setShowDeleteObjectiveModal] =
    useState(false);
  const [showDeleteKeyResultModal, setShowDeleteKeyResultModal] =
    useState(false);
  const [objectiveIdToDelete, setObjectiveIdToDelete] = useState(null);
  const [keyResultIdToDelete, setKeyResultIdToDelete] = useState(null);
  const [isCloseButtonClicked, setIsCloseButtonClicked] = useState(false);

  useEffect(() => {
    const loadObjectives = async () => {
      setIsLoading(true);
      try {
        const data = await fetchObjectives();
        console.log("Fetched objectives:", JSON.stringify(data, null, 2));
        setObjectives(data);
        setError(null);
      } catch (error) {
        console.error("Fetch objectives failed:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        setError(
          `Failed to load objectives: ${
            error.response?.data?.error || error.message
          }`
        );
      } finally {
        setIsLoading(false);
      }
    };
    if (isManager) {
      loadObjectives();
    } else {
      setError("Access denied. Only managers can view OKRs.");
    }
  }, [isManager]);

  const calculateObjectiveProgress = (keyResults) => {
    if (!keyResults || keyResults.length === 0) return 0;

    const totalWeight = keyResults.reduce(
      (sum, kr) => sum + (Number(kr.weight) || 1),
      0
    );
    if (totalWeight === 0) return 0;

    const weightedProgress = keyResults.reduce((sum, kr) => {
      const progress = Number(kr.progress) || 0;
      const startValue = Number(kr.start_value) || 0;
      const targetValue = Number(kr.target_value) || 100;

      if (targetValue <= startValue) {
        console.warn(
          `Invalid key result values: targetValue (${targetValue}) <= startValue (${startValue})`,
          kr
        );
        return sum;
      }

      const progressPercentage =
        ((progress - startValue) / (targetValue - startValue)) * 100;
      const cappedProgress = Math.min(100, Math.max(0, progressPercentage));
      return sum + cappedProgress * (Number(kr.weight) || 1);
    }, 0);

    const finalProgress = weightedProgress / totalWeight;
    return Math.min(100, Math.max(0, finalProgress));
  };

  const validateProgress = (objective) => {
    const calculatedProgress = calculateObjectiveProgress(objective.KeyResults);
    if (Math.abs(calculatedProgress - (objective.progress || 0)) > 0.1) {
      console.warn(
        `Progress mismatch for objective ${objective.id}: Backend ${
          objective.progress || 0
        }%, Calculated ${calculatedProgress}%`,
        { keyResults: objective.KeyResults }
      );
    }
    return calculatedProgress;
  };

  const toggleExpand = (id) => {
    setExpandedObjective(expandedObjective === id ? null : id);
  };

  const handleEditObjective = (obj) => {
    navigate(`/okr/edit/${obj.id}`);
    setMenuOpen(null);
  };

  const openDeleteObjectiveModal = (id) => {
    setObjectiveIdToDelete(id);
    setShowDeleteObjectiveModal(true);
  };

  const closeDeleteObjectiveModal = () => {
    setShowDeleteObjectiveModal(false);
    setObjectiveIdToDelete(null);
  };

  const handleDeleteObjective = async () => {
    try {
      await deleteObjective(objectiveIdToDelete);
      const data = await fetchObjectives();
      setObjectives(data);
      setError(null);
    } catch (error) {
      console.error("Delete objective error:", error);
      setError(error.message || "Failed to delete objective");
    }
    closeDeleteObjectiveModal();
    setMenuOpen(null);
  };

  const openDeleteKeyResultModal = (id) => {
    setKeyResultIdToDelete(id);
    setShowDeleteKeyResultModal(true);
  };

  const closeDeleteKeyResultModal = () => {
    setShowDeleteKeyResultModal(false);
    setKeyResultIdToDelete(null);
  };

  const handleDeleteKeyResult = async () => {
    try {
      await deleteKeyResult(keyResultIdToDelete);
      const data = await fetchObjectives();
      setObjectives(data);
      setError(null);
    } catch (error) {
      console.error("Delete key result error:", error);
      setError(error.message || "Failed to delete key result");
    }
    closeDeleteKeyResultModal();
  };

  const openProgressModal = (keyResult) => {
    setSelectedKeyResult(keyResult);
    setNewProgress(keyResult.progress || 0);
    setNewStatus(keyResult.status || "Not Started");
    setNewTitle(keyResult.title || "");
    setComment(keyResult.comment || "");
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedKeyResult(null);
    setNewProgress(0);
    setNewStatus("Not Started");
    setNewTitle("");
    setComment("");
    setError(null);
  };

  const handleUpdateProgress = async () => {
    if (
      !selectedKeyResult ||
      isNaN(parseFloat(newProgress)) ||
      newProgress < (selectedKeyResult.start_value || 0) ||
      newProgress > (selectedKeyResult.target_value || 100)
    ) {
      setError(
        "Invalid progress value. Must be between start and target values."
      );
      return;
    }
    if (!newTitle.trim()) {
      setError("Key result title cannot be empty.");
      return;
    }
    const effectiveStatus =
      parseFloat(newProgress) >= (selectedKeyResult.target_value || 100)
        ? "Completed"
        : newStatus;
    if (
      !["Not Started", "In Progress", "Needs Attention", "Completed"].includes(
        effectiveStatus
      )
    ) {
      setError("Invalid status selected.");
      return;
    }
    try {
      await updateKeyResultProgress(selectedKeyResult.id, {
        title: newTitle,
        progress: parseFloat(newProgress),
        comment: comment || "",
        status: effectiveStatus,
      });
      const data = await fetchObjectives();
      setObjectives(data);
      setError(null);
      closeModal();
    } catch (error) {
      console.error("Update progress error:", error);
      setError(
        error.response?.data?.details ||
          error.response?.data?.error ||
          "Failed to update progress"
      );
    }
  };

  const handleAddKeyResult = async (objectiveId) => {
    if (!newKeyResult.title.trim()) {
      setError("Key result title is required.");
      return;
    }
    if (
      newKeyResult.status &&
      !["Not Started", "In Progress", "Needs Attention", "Completed"].includes(
        newKeyResult.status
      )
    ) {
      setError("Invalid status selected.");
      return;
    }
    try {
      const initialProgress = parseFloat(newKeyResult.start_value) || 0;
      await addKeyResult({
        objective_id: objectiveId,
        title: newKeyResult.title,
        description: newKeyResult.description || "",
        start_value: parseFloat(newKeyResult.start_value) || 0,
        target_value: 100,
        weight: 1,
        deadline: new Date(newKeyResult.deadline),
        progress: initialProgress,
        status: newKeyResult.status || "Not Started",
        comment: newKeyResult.comment || "",
      });
      const data = await fetchObjectives();
      setObjectives(data);
      setError(null);
      setNewKeyResult({
        title: "",
        description: "",
        start_value: 0,
        target_value: 100,
        weight: 1,
        deadline: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        status: "Not Started",
        comment: "",
      });
      setAddingNewKeyResult(null);
    } catch (error) {
      console.error("Add key result error:", error);
      setError(
        error.response?.data?.details ||
          error.response?.data?.error ||
          "Failed to add key result"
      );
    }
  };

  const startAddingKeyResult = (objectiveId) => {
    setAddingNewKeyResult(objectiveId);
    setNewKeyResult({
      title: "",
      description: "",
      start_value: 0,
      target_value: 100,
      weight: 1,
      deadline: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      status: "Not Started",
      comment: "",
    });
  };

  const cancelAddingKeyResult = () => {
    setAddingNewKeyResult(null);
    setNewKeyResult({
      title: "",
      description: "",
      start_value: 0,
      target_value: 100,
      weight: 1,
      deadline: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      status: "Not Started",
      comment: "",
    });
  };

  const toggleMenu = (objectiveId) => {
    setMenuOpen(menuOpen === objectiveId ? null : objectiveId);
  };

  if (!isManager) {
    return (
      <div
        className={`p-4 sm:p-6 font-semibold text-sm sm:text-base ${
          theme === "dark" ? "text-red-400" : "text-red-600"
        }`}
      >
        Access denied. Only managers can track Grok progress.
      </div>
    );
  }

  return (
    <div
      className={`p-4 sm:p-6 rounded-xl shadow-sm transition-colors duration-200 ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between mb-4 sm:mb-6">
        <div>
          <button
            className={`pb-1 mr-0 sm:mr-4 font-semibold text-2xl sm:text-3xl transition-colors duration-200 ${
              theme === "dark" ? "text-teal-400" : "text-teal-600"
            }`}
          >
            My Goals
          </button>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4 mt-2 sm:mt-0">
          <button
            className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold text-sm sm:text-base text-white transition-colors duration-200 ${
              theme === "dark"
                ? "bg-teal-700 hover:bg-teal-600"
                : "bg-teal-600 hover:bg-teal-700"
            } shadow-md`}
            onClick={() => navigate("/okr/add")}
          >
            + Add Goal
          </button>
        </div>
      </div>
      <h2
        className={`text-lg sm:text-xl font-semibold mb-4 sm:mb-6 ${
          theme === "dark" ? "text-teal-400" : "text-teal-600"
        }`}
      >
        Active OKRs
      </h2>
      {error && (
        <div
          className={`p-3 rounded-lg mb-4 sm:mb-6 flex items-center text-sm sm:text-base ${
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
      {isLoading && (
        <div
          className={`text-sm sm:text-base ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Loading...
        </div>
      )}
      {objectives.length === 0 && !isLoading ? (
        <p
          className={`text-sm sm:text-base ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          No objectives available. Add a new OKR to get started.
        </p>
      ) : (
        objectives.map((objective) => (
          <div key={objective.id}>
            <div
              className={`border rounded-lg p-4 sm:p-5 mb-2 sm:mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer transition-colors duration-200 ${
                theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-white"
              } shadow-md hover:shadow-lg`}
              onClick={() => toggleExpand(objective.id)}
            >
              <div className="w-full sm:w-auto">
                <div className="flex items-center">
                  <span className="mr-2 text-xl sm:text-2xl">🎯</span>
                  <h3
                    className={`font-bold text-base sm:text-lg`}
                    style={{ color: "#5DB5B5" }}
                  >
                    {objective.title}
                  </h3>
                </div>
                <div
                  className={`text-xs sm:text-sm flex flex-wrap items-center mt-2 sm:mt-1 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <span className="flex items-center mr-3 sm:mr-4 mb-1 sm:mb-0">
                    <span className="mr-1">👤</span>{" "}
                    {user?.username || "Unknown"}
                  </span>
                  <span className="flex items-center mb-1 sm:mb-0">
                    <span className="mr-1">📝</span>
                    {objective.description || "No description provided"}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 mt-3 sm:mt-0">
                <span
                  className={`text-xs sm:text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {objective.time_period}
                </span>
                <div className="w-10 h-10 sm:w-12 sm:h-12 relative">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <defs>
                      <linearGradient
                        id={`progressGradient-${objective.id}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor={theme === "dark" ? "#2dd4bf" : "#4CAF50"}
                        />
                        <stop
                          offset="100%"
                          stopColor={theme === "dark" ? "#38b2ac" : "#66BB6A"}
                        />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      stroke={theme === "dark" ? "#444" : "#eee"}
                      strokeWidth="2"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      stroke={`url(#progressGradient-${objective.id})`}
                      strokeWidth="2"
                      strokeDasharray={`${
                        validateProgress(objective) || 0
                      }, 100`}
                      transform="rotate(-90 18 18)"
                    />
                    <text
                      x="18"
                      y="22"
                      style={{
                        fill: theme === "dark" ? "#2dd4bf" : "#4CAF50",
                        fontWeight: "bold",
                        fontSize: "12px",
                      }}
                      textAnchor="middle"
                    >
                      {(validateProgress(objective) || 0).toFixed(0)}%
                    </text>
                  </svg>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(objective.id);
                    }}
                    className={`p-1 rounded-full hover:bg-gray-200 transition-colors duration-200 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                    aria-label="More options"
                  >
                    <EllipsisVerticalIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                  {menuOpen === objective.id && (
                    <div
                      className={`absolute right-0 mt-2 w-36 sm:w-40 rounded-lg shadow-lg z-10 border ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-600"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <button
                        onClick={() => handleEditObjective(objective)}
                        className={`block w-full text-left px-4 py-2 text-base font-medium transition-colors duration-200 ${
                          theme === "dark"
                            ? "text-teal-400 hover:bg-gray-700"
                            : "text-teal-600 hover:bg-gray-100"
                        }`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteObjectiveModal(objective.id)}
                        className={`block w-full text-left px-4 py-2 text-base font-medium transition-colors duration-200 ${
                          theme === "dark"
                            ? "text-red-400 hover:bg-gray-700"
                            : "text-red-600 hover:bg-gray-100"
                        }`}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {expandedObjective === objective.id && (
              <div className="ml-0 sm:ml-4">
                <div
                  className={`border rounded-lg p-4 sm:p-5 mb-2 sm:mb-3 transition-colors duration-200 ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-600"
                      : "bg-white"
                  } shadow-sm`}
                >
                  <h4
                    className={`font-semibold mb-3 sm:mb-4 text-base sm:text-lg ${
                      theme === "dark" ? "text-teal-400" : "text-teal-600"
                    }`}
                  >
                    Key Results
                  </h4>
                  {objective.KeyResults.map((kr) => (
                    <div
                      key={kr.id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 p-3 border-b border-gray-600 text-sm sm:text-base"
                    >
                      <div className="flex flex-col w-full sm:w-auto">
                        <span
                          className={`text-base sm:text-lg font-medium ${
                            theme === "dark" ? "text-gray-200" : "text-gray-800"
                          } flex items-center`}
                        >
                          <ArrowTrendingUpIcon
                            className="size-6 mr-2 text-green-500"
                            aria-hidden="true"
                          />
                          {kr.title}
                        </span>
                        {kr.description && (
                          <span
                            className={`text-xs sm:text-sm mt-1 ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            Description: {kr.description}
                          </span>
                        )}
                        {kr.comment && (
                          <span
                            className={`text-xs sm:text-sm mt-1 ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            Comment: {kr.comment}
                          </span>
                        )}
                        <div
                          className={`text-xs sm:text-sm flex flex-wrap items-center mt-1 ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          <span className="mb-1 sm:mb-0">
                            Deadline:{" "}
                            {format(new Date(kr.deadline), "yyyy-MM-dd")}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center space-x-2 sm:space-x-4 mt-3 sm:mt-0">
                        <button
                          onClick={() => openProgressModal(kr)}
                          className={`text-sm sm:text-base font-medium hover:underline transition-colors duration-200 ${
                            theme === "dark"
                              ? "text-teal-400 hover:text-teal-300"
                              : "text-teal-600 hover:text-teal-800"
                          }`}
                        >
                          Update
                        </button>
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <span
                            className={`text-sm sm:text-base ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            {kr.progress}/{kr.target_value}
                          </span>
                          <div className="w-32 sm:w-40 bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${
                                theme === "dark" ? "bg-teal-500" : "bg-teal-600"
                              }`}
                              style={{
                                width: `${
                                  ((kr.progress - (kr.start_value || 0)) /
                                    (kr.target_value - (kr.start_value || 0))) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span
                            className={`text-sm sm:text-base ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            {kr.status || "Not Started"}
                          </span>
                        </div>
                        <button
                          onClick={() => openDeleteKeyResultModal(kr.id)}
                          className={`text-sm sm:text-base font-medium hover:underline transition-colors duration-200 ${
                            theme === "dark"
                              ? "text-red-400 hover:text-red-300"
                              : "text-red-600 hover:text-red-800"
                          }`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {addingNewKeyResult === objective.id && (
                    <div
                      className={`p-4 sm:p-5 rounded-lg transition-colors duration-200 ${
                        theme === "dark" ? "bg-gray-900" : "bg-white"
                      } shadow-sm`}
                    >
                      <h4
                        className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${
                          theme === "dark" ? "text-teal-400" : "text-teal-600"
                        }`}
                      >
                        Add Key Result
                      </h4>
                      <div className="space-y-4 sm:space-y-5 mb-4 sm:mb-6">
                        <div>
                          <label
                            htmlFor="kr-title"
                            className={`block text-xs sm:text-sm font-medium ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            Title <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="kr-title"
                            type="text"
                            value={newKeyResult.title}
                            onChange={(e) =>
                              setNewKeyResult({
                                ...newKeyResult,
                                title: e.target.value,
                              })
                            }
                            placeholder="Enter key result title"
                            className={`mt-1 block w-full border rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base transition-colors duration-200 ${
                              theme === "dark"
                                ? "bg-gray-800 border-gray-600 text-gray-200"
                                : "bg-white border-gray-200 text-gray-800"
                            }`}
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="kr-description"
                            className={`block text-xs sm:text-sm font-medium ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            Description
                          </label>
                          <textarea
                            id="kr-description"
                            value={newKeyResult.description}
                            onChange={(e) =>
                              setNewKeyResult({
                                ...newKeyResult,
                                description: e.target.value,
                              })
                            }
                            placeholder="Add a description (optional)"
                            className={`mt-1 block w-full border rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base transition-colors duration-200 ${
                              theme === "dark"
                                ? "bg-gray-800 border-gray-600 text-gray-200"
                                : "bg-white border-gray-200 text-gray-800"
                            }`}
                            rows="3"
                          />
                          <span
                            className={`text-xs sm:text-sm mt-1 block ${
                              theme === "dark"
                                ? "text-gray-500"
                                : "text-gray-400"
                            }`}
                          >
                            Optional
                          </span>
                        </div>
                        <div>
                          <label
                            htmlFor="kr-status"
                            className={`block text-xs sm:text-sm font-medium ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            Status
                          </label>
                          <select
                            id="kr-status"
                            value={newKeyResult.status}
                            onChange={(e) =>
                              setNewKeyResult({
                                ...newKeyResult,
                                status: e.target.value,
                              })
                            }
                            className={`mt-1 block w-full border rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base transition-colors duration-200 ${
                              theme === "dark"
                                ? "bg-gray-800 border-gray-600 text-gray-200"
                                : "bg-white border-gray-200 text-gray-800"
                            }`}
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Needs Attention">
                              Needs Attention
                            </option>
                            <option value="Completed">Completed</option>
                          </select>
                          <span
                            className={`text-xs sm:text-sm mt-1 block ${
                              theme === "dark"
                                ? "text-gray-500"
                                : "text-gray-400"
                            }`}
                          >
                            Optional
                          </span>
                        </div>
                        <div>
                          <label
                            htmlFor="kr-comment"
                            className={`block text-xs sm:text-sm font-medium ${
                              theme === "dark"
                                ? "text-gray fattori-400"
                                : "text-gray-600"
                            }`}
                          >
                            Comment
                          </label>
                          <textarea
                            id="kr-comment"
                            value={newKeyResult.comment}
                            onChange={(e) =>
                              setNewKeyResult({
                                ...newKeyResult,
                                comment: e.target.value,
                              })
                            }
                            placeholder="Add a comment (optional)"
                            className={`mt-1 block w-full border rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base transition-colors duration-200 ${
                              theme === "dark"
                                ? "bg-gray-800 border-gray-600 text-gray-200"
                                : "bg-white border-gray-200 text-gray-800"
                            }`}
                            rows="3"
                          />
                          <span
                            className={`text-xs sm:text-sm mt-1 block ${
                              theme === "dark"
                                ? "text-gray-500"
                                : "text-gray-400"
                            }`}
                          >
                            Optional
                          </span>
                        </div>
                        <div>
                          <label
                            htmlFor="start-value"
                            className={`block text-xs sm:text-sm font-medium ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            Start Value <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="start-value"
                            type="number"
                            value={newKeyResult.start_value}
                            onChange={(e) =>
                              setNewKeyResult({
                                ...newKeyResult,
                                start_value:
                                  e.target.value === ""
                                    ? ""
                                    : parseFloat(e.target.value),
                              })
                            }
                            onBlur={(e) =>
                              setNewKeyResult({
                                ...newKeyResult,
                                start_value:
                                  e.target.value === ""
                                    ? 0
                                    : parseFloat(e.target.value),
                              })
                            }
                            placeholder="0"
                            className={`mt-1 block w-full border rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base transition-colors duration-200 ${
                              theme === "dark"
                                ? "bg-gray-800 border-gray-600 text-gray-200"
                                : "bg-white border-gray-200 text-gray-800"
                            }`}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="deadline"
                            className={`block text-xs sm:text-sm font-medium ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            Deadline <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="deadline"
                            type="date"
                            value={newKeyResult.deadline}
                            onChange={(e) =>
                              setNewKeyResult({
                                ...newKeyResult,
                                deadline: e.target.value,
                              })
                            }
                            className={`mt-1 block w-32 sm:w-40 border rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base transition-colors duration-200 ${
                              theme === "dark"
                                ? "bg-gray-800 border-gray-600 text-gray-200"
                                : "bg-white border-gray-200 text-gray-800"
                            }`}
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 sm:space-x-3">
                        <button
                          onClick={cancelAddingKeyResult}
                          className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold text-sm sm:text-base transition-colors duration-200 shadow-md ${
                            theme === "dark"
                              ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }`}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddKeyResult(objective.id)}
                          className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold text-sm sm:text-base text-white transition-colors duration-200 shadow-md ${
                            theme === "dark"
                              ? "bg-teal-700 hover:bg-teal-600"
                              : "bg-teal-600 hover:bg-teal-700"
                          }`}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                  {!addingNewKeyResult && (
                    <button
                      onClick={() => startAddingKeyResult(objective.id)}
                      className={`mt-2 text-sm sm:text-base font-medium hover:underline transition-colors duration-200 ${
                        theme === "dark"
                          ? "text-teal-400 hover:text-teal-300"
                          : "text-teal-600 hover:text-teal-800"
                      }`}
                    >
                      + Add Key Result
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))
      )}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className={`p-4 sm:p-6 rounded-lg shadow-lg w-full sm:w-[400px] mx-auto mt-16 sm:mt-20 border transition-colors duration-200 ${
          theme === "dark" ? "bg-gray-900 border-gray-600" : "bg-gray-100"
        }`}
        overlayClassName={`fixed inset-0 transition-opacity duration-200 ${
          theme === "dark" ? "bg-gray-900/50" : "bg-gray-100/50"
        } flex items-center justify-center`}
      >
        <div className="flex justify-between items-center mb-4 sm:mb-5">
          <h2
            className={`text-lg sm:text-xl font-semibold ${
              theme === "dark" ? "text-teal-400" : "text-teal-600"
            }`}
          >
            Update Progress
          </h2>
          <button
            onClick={() => {
              setIsCloseButtonClicked(true);
              closeModal();
              setTimeout(() => setIsCloseButtonClicked(false), 200);
            }}
            className={`text-sm font-medium px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 shadow-sm`}
          >
            ✕
          </button>
        </div>
        {error && (
          <div
            className={`p-2 rounded-lg mb-4 sm:mb-5 text-xs sm:text-sm ${
              theme === "dark"
                ? "bg-red-900/20 text-red-400"
                : "bg-red-100 text-red-600"
            } shadow-sm`}
          >
            {error}
          </div>
        )}
        <div className="mb-4 sm:mb-5">
          <label
            className={`block text-xs sm:text-sm font-medium ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Key Result
          </label>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter key result"
            className={`mt-1 block w-full border rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base transition-colors duration-200 ${
              theme === "dark"
                ? "bg-gray-800 border-gray-600 text-gray-200"
                : "bg-white border-gray-200 text-gray-800"
            }`}
            required
          />
        </div>
        <div className="mb-4 sm:mb-5">
          <label
            className={`block text-xs sm:text-sm font-medium ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            New Progress
          </label>
          <div className="flex items-center space-x-2 sm:space-x-3 mt-1">
            <input
              type="number"
              value={newProgress}
              onChange={(e) => setNewProgress(e.target.value)}
              className={`border rounded-lg p-2 sm:p-3 w-20 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base transition-colors duration-200 ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600 text-gray-200"
                  : "bg-white border-gray-200 text-gray-800"
              }`}
              min={selectedKeyResult?.start_value || 0}
              max={selectedKeyResult?.target_value || 100}
            />
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className={`border rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base transition-colors duration-200 ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600 text-gray-200"
                  : "bg-white border-gray-200 text-gray-800"
              }`}
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Needs Attention">Needs Attention</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
        <div className="mb-4 sm:mb-5">
          <label
            className={`block text-xs sm:text-sm font-medium ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className={`w-full border rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base transition-colors duration-200 ${
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
        <div className="flex justify-end space-x-2 sm:space-x-3">
          <button
            onClick={closeModal}
            className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold text-sm sm:text-base transition-colors duration-200 shadow-md ${
              theme === "dark"
                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateProgress}
            className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold text-sm sm:text-base text-white transition-colors duration-200 shadow-md ${
              theme === "dark"
                ? "bg-teal-700 hover:bg-teal-600"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            Done
          </button>
        </div>
      </Modal>

      {showDeleteObjectiveModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-xl shadow-lg w-11/12 max-w-md ${
              theme === "dark"
                ? "bg-gray-800 text-gray-200 border-gray-700"
                : "bg-white text-gray-800 border-gray-200"
            } border transition-all duration-300`}
          >
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <HiExclamationCircle
                  size={36}
                  className={theme === "dark" ? "text-red-400" : "text-red-500"}
                />
              </div>
              <p
                className={`text-sm sm:text-base mb-6 text-center font-semibold ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Are you sure you want to delete this objective?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                <button
                  onClick={handleDeleteObjective}
                  className={`py-2 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300 text-sm sm:text-base font-semibold w-full sm:w-auto`}
                >
                  Yes, I'm sure
                </button>
                <button
                  onClick={closeDeleteObjectiveModal}
                  className={`py-2 px-6 rounded-lg font-semibold text-sm sm:text-base transition-colors duration-200 w-full sm:w-auto ${
                    theme === "dark"
                      ? "bg-gray-700 text-gray-200 hover:bg-[#4B5563]"
                      : "bg-gray-200 text-gray-600 hover:bg-[#f7f7f7]"
                  }`}
                >
                  No, cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteKeyResultModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-xl shadow-lg w-11/12 max-w-md ${
              theme === "dark"
                ? "bg-gray-800 text-gray-200 border-gray-700"
                : "bg-white text-gray-800 border-gray-200"
            } border transition-all duration-300`}
          >
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <HiExclamationCircle
                  size={36}
                  className={theme === "dark" ? "text-red-400" : "text-red-500"}
                />
              </div>
              <p
                className={`text-sm sm:text-base mb-6 text-center font-semibold ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Are you sure you want to delete this key result?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                <button
                  onClick={handleDeleteKeyResult}
                  className={`py-2 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300 text-sm sm:text-base font-semibold w-full sm:w-auto`}
                >
                  Yes, I'm sure
                </button>
                <button
                  onClick={closeDeleteKeyResultModal}
                  className={`py-2 px-6 rounded-lg font-semibold text-sm sm:text-base transition-colors duration-200 w-full sm:w-auto ${
                    theme === "dark"
                      ? "bg-gray-700 text-gray-200 hover:bg-[#4B5563]"
                      : "bg-gray-200 text-gray-600 hover:bg-[#f7f7f7]"
                  }`}
                >
                  No, cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OkrTrackProgress;
