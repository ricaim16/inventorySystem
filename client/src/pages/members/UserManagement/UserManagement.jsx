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
      // Removed: showToast("Users fetched successfully!");
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
      <div className="flex-1 pt-6 pr-6 pb-6">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="flex justify-between items-center mb-6">
          <h1
            className={`text-3xl font-bold ${
              theme === "dark" ? "text-gray-200" : "text-gray-800"
            }`}
          >
            User Management
          </h1>
          <button
            onClick={() => setIsFormOpen(true)}
            className={`py-2 px-4 text-lg rounded-md transition duration-300 font-bold ${
              theme === "dark"
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-[#10B981] text-gray-800 hover:bg-opacity-80"
            }`}
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
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <UserForm
              onUserCreated={handleUserCreated}
              initialData={editingUser}
              onCancel={handleCancel}
              showToast={showToast}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
