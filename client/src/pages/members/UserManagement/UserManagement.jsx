import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Sidebar from "../../../components/Sidebar";
import UserForm from "./UserForm";
import UserList from "./UserList";
import { useTheme } from "../../../context/ThemeContext";
import { getAllUsers } from "../../../api/userApi";

const UserManagement = ({ showToast }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    } else if (user?.role !== "MANAGER") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data.users);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserCreated = (newUser) => {
    if (editingUser) {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === newUser.id ? { ...user, ...newUser } : user
        )
      );
      showToast("User updated successfully!");
    } else {
      setUsers((prevUsers) => [...prevUsers, newUser]);
      showToast("User added successfully!");
    }
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const handleUserUpdated = ({ id, action, user: updatedUser }) => {
    if (action === "delete") {
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
    } else if (action === "update" && updatedUser) {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === id ? { ...user, ...updatedUser } : user
        )
      );
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className={`flex-1 p-4 sm:p-6 md:p-8 w-full rounded-xl shadow-lg transition-all duration-300 ${
          theme === "dark" ? "bg-gray-900" : "bg-white"
        }`}
      >
        {error && (
          <div
            className={`${
              theme === "dark"
                ? "text-red-400 bg-red-900/20"
                : "text-red-500 bg-red-100"
            } mb-6 flex items-center text-base p-4 rounded-lg`}
          >
            {error}
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <h1
            className={`text-2xl sm:text-3xl font-semibold ${
              theme === "dark" ? "text-gray-100" : "text-gray-900"
            }`}
            style={{ color: "#10B981" }}
          >
            User Management
          </h1>
          <button
            onClick={() => setIsFormOpen(true)}
            className={`py-2 px-4 rounded-lg text-sm sm:text-base font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors duration-300`}
          >
            Add User
          </button>
        </div>
        <UserList
          users={users}
          onEditUser={handleEditUser}
          onUserUpdated={handleUserUpdated}
          showToast={showToast}
        />
        {isFormOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            <div
              className={`p-6 rounded-xl shadow-lg w-11/12 max-w-md ${
                theme === "dark"
                  ? "bg-gray-800 text-gray-200 border-gray-700"
                  : "bg-white text-gray-800 border-gray-200"
              } border transition-all duration-300`}
            >
              <UserForm
                onUserCreated={handleUserCreated}
                initialData={editingUser}
                onCancel={handleCancel}
                showToast={showToast}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
