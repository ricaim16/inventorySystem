import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { okrApi } from "../../api/okrApi";

const OkrAdd = () => {
  const [objective, setObjective] = useState("");
  const [keyResults, setKeyResults] = useState([
    {
      title: "",
      startValue: "",
      targetValue: "",
      progress: 0,
      weight: 1,
      deadline: "2025-12-31",
    },
  ]);
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Initialize useNavigate

  const validateKeyResults = () => {
    for (const kr of keyResults) {
      const startValue = parseFloat(kr.startValue);
      const targetValue = parseFloat(kr.targetValue);
      if (!kr.title.trim()) {
        return "Key Result title is required.";
      }
      if (isNaN(startValue) || startValue < 0) {
        return "Start value must be a non-negative number.";
      }
      if (isNaN(targetValue) || targetValue <= startValue) {
        return "Target value must be a number greater than start value.";
      }
      const deadlineDate = new Date(kr.deadline);
      if (!kr.deadline || isNaN(deadlineDate.getTime())) {
        return "Valid deadline is required.";
      }
    }
    return "";
  };

  const handleAddKeyResult = () => {
    setKeyResults([
      ...keyResults,
      {
        title: "",
        startValue: "",
        targetValue: "",
        progress: 0,
        weight: 1,
        deadline: "2025-12-31",
      },
    ]);
  };

  const handleDeleteKeyResult = (index) => {
    if (keyResults.length === 1) {
      return;
    }
    const newKrs = keyResults.filter((_, i) => i !== index);
    setKeyResults(newKrs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!objective.trim()) {
      setError("Objective title is required.");
      return;
    }

    const validationError = validateKeyResults();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");

    const payload = {
      title: objective.trim(),
      description: "",
      time_period: "Q2 2025",
      progress: 0,
    };

    try {
      console.log("Sending objective payload:", payload);
      const response = await okrApi.addObjective(payload);
      const objectiveId = response.id; // Use string UUID as per schema
      console.log("Received objective ID:", objectiveId);

      const validKeyResults = keyResults
        .map((kr, index) => {
          const startValue = parseFloat(kr.startValue);
          const targetValue = parseFloat(kr.targetValue);
          const progress = parseFloat(kr.progress || 0);
          const weight = parseFloat(kr.weight || 1);
          const deadline = new Date(kr.deadline).toISOString();

          console.log(`Parsing key result ${index}:`, {
            title: kr.title.trim(),
            startValue,
            targetValue,
            progress,
            weight,
            deadline,
          });

          if (
            !kr.title.trim() ||
            isNaN(startValue) ||
            startValue < 0 ||
            isNaN(targetValue) ||
            targetValue <= startValue ||
            isNaN(progress) ||
            progress < 0 ||
            isNaN(weight) ||
            weight <= 0 ||
            !kr.deadline
          ) {
            console.log(`Invalid key result at index ${index}:`, kr);
            return null;
          }

          return {
            objective_id: objectiveId,
            title: kr.title.trim(),
            description: "",
            start_value: startValue,
            target_value: targetValue,
            progress,
            weight,
            deadline,
          };
        })
        .filter((kr) => kr !== null);

      if (validKeyResults.length === 0) {
        throw new Error("No valid key results provided.");
      }

      console.log("Sending key results:", validKeyResults);
      const keyResultPromises = validKeyResults.map((kr, index) =>
        okrApi.addKeyResult(kr).catch((err) => {
          console.error(`Failed to add key result ${index}:`, {
            keyResult: kr,
            error: err.error || err.message || "Unknown error",
          });
          return { error: err.error || err.message, keyResult: kr };
        })
      );
      const results = await Promise.all(keyResultPromises);
      const failedResults = results.filter((r) => r.error);

      if (failedResults.length > 0) {
        const errorMessages = failedResults
          .map((r) => `${r.keyResult.title}: ${r.error}`)
          .join("; ");
        setError(
          `Failed to add ${failedResults.length} key result(s): ${errorMessages}`
        );
      } else {
        setObjective("");
        setKeyResults([
          {
            title: "",
            startValue: "",
            targetValue: "",
            progress: 0,
            weight: 1,
            deadline: "2025-12-31",
          },
        ]);
        navigate(`/okr/${objectiveId}`); // Use navigate instead of window.location.href
      }
    } catch (error) {
      console.error("Error in handleSubmit:", {
        message: error.message,
        response: error.error || error.message,
      });
      const errorMessage =
        error.error ||
        error.details ||
        error.message ||
        "Failed to create key result or objective.";
      setError(errorMessage);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4 flex items-center text-gray-800">
        <span className="mr-2">🎯</span> Add OKR
      </h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="objective"
            className="block text-sm font-medium text-gray-700"
          >
            Objective
          </label>
          <input
            id="objective"
            type="text"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Objective"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Key Results
          </label>
          {keyResults.map((kr, index) => (
            <div key={index} className="flex space-x-4 mt-2 items-center">
              <div className="flex-1">
                <label
                  htmlFor={`keyResultTitle-${index}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Key Result Title
                </label>
                <input
                  id={`keyResultTitle-${index}`}
                  type="text"
                  value={kr.title}
                  onChange={(e) => {
                    const newKrs = [...keyResults];
                    newKrs[index].title = e.target.value;
                    setKeyResults(newKrs);
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Key Result Title"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor={`startValue-${index}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Start Value
                </label>
                <input
                  id={`startValue-${index}`}
                  type="number"
                  value={kr.startValue}
                  onChange={(e) => {
                    const newKrs = [...keyResults];
                    newKrs[index].startValue = e.target.value;
                    setKeyResults(newKrs);
                  }}
                  className="mt-1 w-24 border border-gray-300 rounded-md p-3 shadow-sm"
                  placeholder="Start Value"
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor={`targetValue-${index}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Target Value
                </label>
                <input
                  id={`targetValue-${index}`}
                  type="number"
                  value={kr.targetValue}
                  onChange={(e) => {
                    const newKrs = [...keyResults];
                    newKrs[index].targetValue = e.target.value;
                    setKeyResults(newKrs);
                  }}
                  className="mt-1 w-24 border border-gray-300 rounded-md p-3 shadow-sm"
                  placeholder="Target Value"
                  min={parseFloat(kr.startValue) + 1 || 1}
                  step="1"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor={`deadline-${index}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Deadline
                </label>
                <input
                  id={`deadline-${index}`}
                  type="date"
                  value={kr.deadline}
                  onChange={(e) => {
                    const newKrs = [...keyResults];
                    newKrs[index].deadline = e.target.value;
                    setKeyResults(newKrs);
                  }}
                  className="mt-1 w-40 border border-gray-300 rounded-md p-3 shadow-sm"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => handleDeleteKeyResult(index)}
                className={`mt-6 text-red-600 hover:text-red-800 ${
                  keyResults.length === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={keyResults.length === 1}
              >
                Delete
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddKeyResult}
            className="mt-2 text-blue-600 text-sm font-medium"
          >
            + Add another
          </button>
        </div>
        <div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Goals
          </button>
        </div>
      </form>
    </div>
  );
};

export default OkrAdd;
