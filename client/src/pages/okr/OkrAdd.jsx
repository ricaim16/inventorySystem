import { useState } from "react";
import { okrApi } from "../../api/okrApi";

const OkrAdd = () => {
  const [objective, setObjective] = useState({
    title: "",
    description: "",
    time_period: "",
    progress: 0,
  });
  const [keyResult, setKeyResult] = useState({
    objective_id: "",
    title: "",
    weight: 0,
    deadline: "",
    progress: 0,
  });
  const [message, setMessage] = useState("");
  const [activeForm, setActiveForm] = useState("objective"); // State to toggle forms

  const handleObjectiveSubmit = async (e) => {
    e.preventDefault();
    try {
      await okrApi.addObjective(objective);
      setMessage("Objective added successfully!");
      setObjective({
        title: "",
        description: "",
        time_period: "",
        progress: 0,
      });
    } catch (error) {
      setMessage(
        "Error adding objective: " + (error.message || "Unknown error")
      );
    }
  };

  const handleKeyResultSubmit = async (e) => {
    e.preventDefault();
    try {
      await okrApi.addKeyResult(keyResult);
      setMessage("Key Result added successfully!");
      setKeyResult({
        objective_id: "",
        title: "",
        weight: 0,
        deadline: "",
        progress: 0,
      });
    } catch (error) {
      setMessage(
        "Error adding key result: " + (error.message || "Unknown error")
      );
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Add OKR</h2>
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveForm("objective")}
          className={`py-2 px-4 rounded ${
            activeForm === "objective"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Add Objective
        </button>
        <button
          onClick={() => setActiveForm("keyResult")}
          className={`py-2 px-4 rounded ${
            activeForm === "keyResult"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Add Key Result
        </button>
      </div>

      {activeForm === "objective" && (
        <form onSubmit={handleObjectiveSubmit} className="mb-6 space-y-4">
          <div>
            <label
              htmlFor="objective-title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title
            </label>
            <input
              id="objective-title"
              className="border p-2 w-full rounded"
              value={objective.title}
              onChange={(e) =>
                setObjective({ ...objective, title: e.target.value })
              }
              placeholder="Title"
              required
            />
          </div>
          <div>
            <label
              htmlFor="objective-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="objective-description"
              className="border p-2 w-full rounded"
              value={objective.description}
              onChange={(e) =>
                setObjective({ ...objective, description: e.target.value })
              }
              placeholder="Description"
            />
          </div>
          <div>
            <label
              htmlFor="objective-time-period"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Time Period
            </label>
            <input
              id="objective-time-period"
              className="border p-2 w-full rounded"
              value={objective.time_period}
              onChange={(e) =>
                setObjective({ ...objective, time_period: e.target.value })
              }
              placeholder="Time Period"
            />
          </div>
          <div>
            <label
              htmlFor="objective-progress"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Progress (%)
            </label>
            <input
              id="objective-progress"
              className="border p-2 w-full rounded"
              type="number"
              value={objective.progress}
              onChange={(e) =>
                setObjective({ ...objective, progress: e.target.value })
              }
              placeholder="Progress (%)"
              min="0"
              max="100"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Submit Objective
          </button>
        </form>
      )}

      {activeForm === "keyResult" && (
        <form onSubmit={handleKeyResultSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="keyresult-objective-id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Objective ID
            </label>
            <input
              id="keyresult-objective-id"
              className="border p-2 w-full rounded"
              value={keyResult.objective_id}
              onChange={(e) =>
                setKeyResult({ ...keyResult, objective_id: e.target.value })
              }
              placeholder="Objective ID"
              required
            />
          </div>
          <div>
            <label
              htmlFor="keyresult-title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title
            </label>
            <input
              id="keyresult-title"
              className="border p-2 w-full rounded"
              value={keyResult.title}
              onChange={(e) =>
                setKeyResult({ ...keyResult, title: e.target.value })
              }
              placeholder="Title"
            />
          </div>
          <div>
            <label
              htmlFor="keyresult-weight"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Weight
            </label>
            <input
              id="keyresult-weight"
              className="border p-2 w-full rounded"
              type="number"
              value={keyResult.weight}
              onChange={(e) =>
                setKeyResult({ ...keyResult, weight: e.target.value })
              }
              placeholder="Weight"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label
              htmlFor="keyresult-deadline"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Deadline
            </label>
            <input
              id="keyresult-deadline"
              className="border p-2 w-full rounded"
              type="date"
              value={keyResult.deadline}
              onChange={(e) =>
                setKeyResult({ ...keyResult, deadline: e.target.value })
              }
            />
          </div>
          <div>
            <label
              htmlFor="keyresult-progress"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Progress (%)
            </label>
            <input
              id="keyresult-progress"
              className="border p-2 w-full rounded"
              type="number"
              value={keyResult.progress}
              onChange={(e) =>
                setKeyResult({ ...keyResult, progress: e.target.value })
              }
              placeholder="Progress (%)"
              min="0"
              max="100"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Submit Key Result
          </button>
        </form>
      )}

      {message && <p className="mt-4 text-red-500">{message}</p>}
    </div>
  );
};

export default OkrAdd;
