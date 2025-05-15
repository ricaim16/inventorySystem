import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { okrApi } from "../../api/okrApi";

const OkrTrackProgress = () => {
  const { id } = useParams();
  const [okr, setOkr] = useState(null);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedKrId, setSelectedKrId] = useState(null);
  const [newValue, setNewValue] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    // UUID validation regex
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      setError("Invalid OKR ID format. Please provide a valid UUID.");
      return;
    }

    const fetchOkr = async () => {
      try {
        console.log("Fetching OKR with ID:", id);
        const response = await okrApi.getObjectiveById(id);
        console.log("API Response:", JSON.stringify(response, null, 2));
        if (!response) {
          setError("OKR not found.");
          return;
        }
        setOkr(response);
      } catch (error) {
        console.error("Error fetching OKR:", {
          message: error.message,
          response: error.response?.data || error.message,
          status: error.response?.status,
          stack: error.stack,
        });
        setError(
          error.response?.data?.error || "Failed to load OKR. Please try again."
        );
      }
    };
    fetchOkr();
  }, [id]);

  const handleUpdate = async () => {
    if (!selectedKrId || isNaN(newValue)) {
      setError("Invalid key result or progress value.");
      return;
    }

    const date = new Date().toLocaleString("en-US", {
      timeZone: "Africa/Addis_Ababa",
    });
    try {
      const selectedKr = okr.KeyResults.find((kr) => kr.id === selectedKrId);
      if (newValue > selectedKr.target_value || newValue < 0) {
        setError("Progress must be between 0 and the target value.");
        return;
      }

      await okrApi.updateKeyResult(selectedKrId, { progress: newValue });
      await okrApi.updateObjective(id, {
        progress: calculateProgress(okr.KeyResults),
        activity: [
          {
            user: "Emu Atsbaha",
            action: `updated progress to ${newValue}/${selectedKr.target_value}`,
            date,
          },
        ],
      });

      const updatedOkr = await okrApi.getObjectiveById(id);
      setOkr(updatedOkr);
      setShowModal(false);
      setComment("");
    } catch (error) {
      console.error("Error updating progress:", {
        message: error.message,
        response: error.response?.data || error.message,
        status: error.response?.status,
      });
      setError(error.response?.data?.error || "Failed to update progress.");
    }
  };

  const calculateProgress = (keyResults) => {
    if (!keyResults || !keyResults.length) return 0;
    const totalProgress = keyResults.reduce(
      (sum, kr) =>
        sum + (kr.progress / kr.target_value) * 100 * (kr.weight || 1),
      0
    );
    return Math.round(totalProgress / keyResults.length);
  };

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!okr) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 bg-gray-50">
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">{okr.title}</h2>
        <div className="mt-2 text-sm text-gray-600 flex items-center">
          <span className="mr-2">
            <img
              src="/default-user-icon.png"
              alt="User"
              className="w-5 h-5 rounded-full inline mr-1"
            />
            {okr.activity?.[0]?.user || "Unknown User"}
          </span>
          <span className="mx-2">|</span>
          <span>{okr.time_period || "No timeframe"}</span>
        </div>
        <div className="mt-4 text-sm text-gray-600 flex justify-between items-center">
          <div>
            <span>All timeframes</span>
            <span className="text-gray-400 ml-2">
              (Progress: {calculateProgress(okr.KeyResults)}%)
            </span>
          </div>
          <div className="space-x-2">
            <span className="text-gray-500 cursor-pointer">
              👁️ Show accomplished
            </span>
            <span
              className="text-gray-500 cursor-pointer"
              onClick={() => setShowDetails(!showDetails)}
            >
              👁️ Show Key Results & Initiatives
            </span>
          </div>
        </div>
        <div className="mt-4 flex justify-end items-center">
          <span className="text-blue-600 mr-2">R</span>
          <span className="text-gray-500 mr-2">no status</span>
          <div className="w-16 h-4 bg-gray-200 rounded-full">
            <div
              className="h-4 bg-blue-600 rounded-full"
              style={{ width: `${calculateProgress(okr.KeyResults)}%` }}
            ></div>
          </div>
          <span className="ml-2 text-sm text-gray-600">
            {calculateProgress(okr.KeyResults)}%
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 space-y-4">
          {okr.KeyResults.map((kr) => (
            <div
              key={kr.id}
              className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">📈</span>
                  <span className="text-gray-600">EA</span> {kr.title}
                </div>
                <div className="text-right">
                  <span className="text-gray-700">
                    {kr.progress}/{kr.target_value}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedKrId(kr.id);
                      setNewValue(kr.progress);
                      setShowModal(true);
                    }}
                    className="ml-2 text-blue-600 text-sm font-medium"
                  >
                    Update
                  </button>
                  <span className="text-gray-400 ml-2">no status</span>
                </div>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${(kr.progress / kr.target_value) * 100}%` }}
                ></div>
              </div>
              <div className="text-right mt-1 text-xs text-gray-500">
                {kr.progress}/{kr.target_value} (
                {Math.round((kr.progress / kr.target_value) * 100)}%)
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md w-96">
            <h3 className="text-lg font-bold text-gray-800">Update progress</h3>
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-500"
            >
              ✕
            </button>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New value
                </label>
                <input
                  type="number"
                  value={newValue}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    const maxValue =
                      okr.KeyResults.find((kr) => kr.id === selectedKrId)
                        ?.target_value || 100;
                    setNewValue(Math.min(maxValue, Math.max(0, value)));
                  }}
                  className="border w-full p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />{" "}
                /{" "}
                {okr.KeyResults.find((kr) => kr.id === selectedKrId)
                  ?.target_value || 100}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New status
                </label>
                <select
                  className="border w-full p-2 rounded-md bg-gray-100"
                  disabled
                >
                  <option>no status</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="border w-full p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a comment..."
                />
                <p className="text-sm text-gray-500 mt-1">Optional</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleString("en-US", {
                    timeZone: "Africa/Addis_Ababa",
                  })}
                  readOnly
                  className="border w-full p-2 rounded-md bg-gray-100"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-4">
              <button
                onClick={handleUpdate}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Done
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
                className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OkrTrackProgress;
