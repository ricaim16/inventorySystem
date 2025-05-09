import { useState, useEffect } from "react";
import { okrApi } from "../../api/okrApi";

const OkrGenerateReport = () => {
  const [objectives, setObjectives] = useState([]);
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

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Generate Report</h2>
      {objectives.length === 0 ? (
        <p>No objectives found.</p>
      ) : (
        <ul className="space-y-4">
          {objectives.map((obj) => (
            <li key={obj.id} className="border p-4 rounded">
              <h3 className="font-bold">
                {obj.title} (Progress: {obj.progress}%)
              </h3>
              <p>{obj.description}</p>
              <ul className="mt-2">
                {obj.KeyResults.map((kr) => (
                  <li key={kr.id} className="ml-4">
                    Key Result: {kr.title} (Progress: {kr.progress}%)
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OkrGenerateReport;
