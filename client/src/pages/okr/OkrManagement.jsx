import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import OkrAdd from "./OkrAdd.jsx";
import OkrGenerateReport from "./OkrGenerateReport.jsx";
import OkrTrackProgress from "./OkrTrackProgress.jsx";
import OkrEdit from "./OkrEdit.jsx";
import { useAuth } from "../../context/AuthContext";

const OkrManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER";

  if (!isManager) {
    return (
      <div className="p-6">Access denied. Only managers can manage OKRs.</div>
    );
  }

  return (
    <div className="p-6">
      <Routes>
        <Route path="/add" element={<OkrAdd />} />
        <Route path="/track-progress" element={<OkrTrackProgress />} />
        <Route path="/generate-report" element={<OkrGenerateReport />} />
        <Route path="/edit/:id" element={<OkrEdit />} />
      </Routes>
    </div>
  );
};

export default OkrManagement;
