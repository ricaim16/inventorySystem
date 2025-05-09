import { useState, useEffect } from "react";
import { okrApi } from "../../api/okrApi";

const OkrTrackProgress = () => {
  const [selectedObjective, setSelectedObjective] = useState(null);
  const [selectedKeyResult, setSelectedKeyResult] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObjectives = async () => {
      try {
        const data = await okrApi.getAllObjectives();
        setObjectives(data.data || []);
      } catch (error) {
        console.error("Error fetching objectives:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchObjectives();
  }, []);

  const handleUpdateObjective = async (e) => {
    e.preventDefault();
    if (!selectedObjective) return;
    try {
      await okrApi.updateObjective(selectedObjective.id, selectedObjective);
      setMessage("Objective updated successfully!");
    } catch (error) {
      setMessage(
        "Error updating objective: " + (error.message || "Unknown error")
      );
    }
  };

  const handleUpdateKeyResult = async (e) => {
    e.preventDefault();
    if (!selectedKeyResult) return;
    try {
      await okrApi.updateKeyResult(selectedKeyResult.id, selectedKeyResult);
      setMessage("Key Result updated successfully!");
    } catch (error) {
      setMessage(
        "Error updating key result: " + (error.message || "Unknown error")
      );
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Track Progress</h2>
      <select
        className="border p-2 mb-2 w-full rounded"
        onChange={(e) => {
          const obj = objectives.find((o) => o.id === parseInt(e.target.value));
          setSelectedObjective(obj ? { ...obj } : null);
          setSelectedKeyResult(null);
        }}
        value={selectedObjective?.id || ""}
      >
        <option value="">Select an Objective</option>
        {objectives.map((obj) => (
          <option key={obj.id} value={obj.id}>
            {obj.title}
          </option>
        ))}
      </select>
      {selectedObjective && (
        <form onSubmit={handleUpdateObjective} className="space-y-4 mb-6">
          <input
            className="border p-2 w-full rounded"
            value={selectedObjective.title}
            onChange={(e) =>
              setSelectedObjective({
                ...selectedObjective,
                title: e.target.value,
              })
            }
            placeholder="Title"
          />
          <input
            className="border p-2 w-full rounded"
            type="number"
            value={selectedObjective.progress}
            onChange={(e) =>
              setSelectedObjective({
                ...selectedObjective,
                progress: e.target.value,
              })
            }
            placeholder="Progress (%)"
            min="0"
            max="100"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Update Objective
          </button>
        </form>
      )}
      {selectedObjective && (
        <select
          className="border p-2 mb-2 w-full rounded"
          onChange={(e) => {
            const kr = selectedObjective.KeyResults.find(
              (kr) => kr.id === parseInt(e.target.value)
            );
            setSelectedKeyResult(kr ? { ...kr } : null);
          }}
          value={selectedKeyResult?.id || ""}
        >
          <option value="">Select a Key Result</option>
          {selectedObjective.KeyResults.map((kr) => (
            <option key={kr.id} value={kr.id}>
              {kr.title}
            </option>
          ))}
        </select>
      )}
      {selectedKeyResult && (
        <form onSubmit={handleUpdateKeyResult} className="space-y-4">
          <input
            className="border p-2 w-full rounded"
            value={selectedKeyResult.title}
            onChange={(e) =>
              setSelectedKeyResult({
                ...selectedKeyResult,
                title: e.target.value,
              })
            }
            placeholder="Title"
          />
          <input
            className="border p-2 w-full rounded"
            type="number"
            value={selectedKeyResult.progress}
            onChange={(e) =>
              setSelectedKeyResult({
                ...selectedKeyResult,
                progress: e.target.value,
              })
            }
            placeholder="Progress (%)"
            min="0"
            max="100"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Update Key Result
          </button>
        </form>
      )}
      {message && <p className="mt-4 text-red-500">{message}</p>}
    </div>
  );
};

export default OkrTrackProgress;
