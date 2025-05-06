import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Sidebar from "../../../components/Sidebar";
import EmployeeForm from "./EmployeeForm";
import EmployeeList from "./EmployeeList";
import { useTheme } from "../../../context/ThemeContext";
import { getAllMembers } from "../../../api/memberApi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EmployeeManagement = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const [resetForm, setResetForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    } else if (user?.role !== "MANAGER") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  const fetchMembers = async () => {
    try {
      const data = await getAllMembers();
      setMembers(data.members || []);
    } catch (err) {
      setError(err.message || "Failed to fetch employees");
    }
  };

  useEffect(() => {
    if (user?.role === "MANAGER") {
      fetchMembers();
    }
  }, [user]);

  const showToast = (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: theme === "dark" ? "dark" : "light",
    });
  };

  const handleMemberCreated = (newMember) => {
    if (editingMember) {
      setMembers((prevMembers) =>
        prevMembers.map((member) =>
          member.id === newMember.id ? { ...member, ...newMember } : member
        )
      );
    } else {
      setMembers((prevMembers) => [...prevMembers, newMember]);
    }
    setIsFormOpen(false);
    setEditingMember(null);
    setViewingMember(null);
    fetchMembers();
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setViewingMember(null);
    setIsFormOpen(true);
    setResetForm(false);
  };

  const handleViewMember = (member) => {
    setViewingMember(member);
    setEditingMember(null);
    setIsFormOpen(true);
    setResetForm(false);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingMember(null);
    setViewingMember(null);
    setResetForm(false);
  };

  const handleAddEmployee = () => {
    setEditingMember(null);
    setViewingMember(null);
    setIsFormOpen(true);
    setResetForm(true);
  };

  return (
    <div
      className={`flex min-h-screen ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-[#F7F7F7] text-black"
      }`}
    >
      <Sidebar />
      <div className="flex-1 p-4 sm:p-6">
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={theme === "dark" ? "dark" : "light"}
        />
        {error && (
          <div
            className={`mb-6 p-3 rounded ${
              theme === "dark"
                ? "bg-red-900 text-red-200"
                : "bg-red-100 text-red-700"
            }`}
          >
            {error}
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <h1
            className={`text-2xl sm:text-3xl font-bold ${
              theme === "dark" ? "text-gray-200" : "text-gray-800"
            }`}
            style={{ color: "#10B981" }}
          >
            Employee Management
          </h1>
          <button
            onClick={handleAddEmployee}
            className={`py-2 px-4 rounded-md text-sm sm:text-base font-medium transition-colors duration-200 ${
              theme === "dark"
                ? "bg-[#10B981] text-gray-300 hover:bg-[#10B981] hover:text-white"
                : "bg-[#10B981] text-gray-700 hover:bg-[#10B981] hover:text-white"
            }`}
          >
            Add Employee
          </button>
        </div>
        {isFormOpen && (
          <div className="mb-6 w-full">
            <EmployeeForm
              onMemberCreated={handleMemberCreated}
              initialData={editingMember || viewingMember}
              onCancel={handleCancel}
              isViewMode={!!viewingMember}
              resetForm={resetForm}
              showToast={showToast}
            />
          </div>
        )}
        <EmployeeList
          members={members}
          onEditMember={handleEditMember}
          onViewMember={handleViewMember}
          onMemberUpdated={() => fetchMembers()}
          showToast={showToast}
        />
      </div>
    </div>
  );
};

export default EmployeeManagement;
