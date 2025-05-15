import React, { useState, useEffect } from "react";
import { okrApi } from "../../api/okrApi";

const OkrGenerateReport = () => {
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObjectives = async () => {
      try {
        const data = await okrApi.getAllObjectives();
        setObjectives(data || []);
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
    <div className="p-4 bg-gray-50">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Generate Report</h2>
      {objectives.length === 0 ? (
        <p>No objectives found.</p>
      ) : (
        objectives.map((obj) => (
          <div key={obj.id} className="border p-4 rounded-md mb-4">
            <h3 className="font-bold text-gray-800">{obj.title}</h3>
            <div className="ml-4 mt-2 space-y-2">
              <div>
                <span className="text-sm text-gray-600">Progress</span>
                <span className="ml-2 text-gray-700">{obj.progress}%</span>
                <span className="ml-2 inline-block w-12 h-12 bg-gray-200 rounded-full"></span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Status</span>
                <span className="ml-2 text-gray-700">no status</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Progress driver</span>
                <span className="ml-2 text-blue-600">📈 Key Results</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Update, freq.</span>
                <span className="ml-2 text-gray-700">Weekly</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Owner</span>
                <span className="ml-2 text-green-600">EA Emu Atsbaha</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Lead</span>
                <span className="ml-2 text-gray-700">Emu Atsbaha</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Timeframe</span>
                <span className="ml-2 text-gray-700">{obj.time_period}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Alignment</span>
                <span className="ml-2 text-red-600">✗ No alignment</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Tags</span>
                <span className="ml-2 text-blue-600">+ Add tag</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Contributors</span>
                <span className="ml-2 text-blue-600">+ Add contributor</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Stage</span>
                <span className="ml-2 text-gray-700">📋 Active</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default OkrGenerateReport;
