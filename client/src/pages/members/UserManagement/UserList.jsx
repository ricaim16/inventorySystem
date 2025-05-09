import { useState } from "react";
import { deleteUser, updateUser } from "../../../api/userApi";
import { FiEdit, FiTrash2, FiAlertCircle } from "react-icons/fi";
import { useTheme } from "../../../context/ThemeContext";

const UserList = ({ users, onEditUser, onUserUpdated, showToast }) => {
  const { theme } = useTheme();
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState(null);

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      showToast("User deleted successfully!");
      onUserUpdated({ id, action: "delete" });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to delete user. This user may have associated records."
      );
    }
    setShowDeleteModal(false);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const response = await updateUser(id, { status: newStatus });
      showToast(`User status updated to ${newStatus}!`);
      onUserUpdated({ id, action: "update", user: response.user });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update status");
    }
  };

  const openDeleteModal = (id) => {
    setUserIdToDelete(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setUserIdToDelete(null);
  };

  return (
    <div
      className={`p-4 sm:p-6 rounded-lg shadow-lg w-full ${
        theme === "dark" ? "bg-gray-800" : "bg-[#f7f7f7]"
      }`}
    >
      <h2
        className={`text-lg sm:text-xl font-bold mb-4 ${
          theme === "dark" ? "text-gray-200" : "text-gray-800"
        }`}
      >
        User List
      </h2>
      {error && (
        <p className="text-red-500 mb-4 text-sm sm:text-base">{error}</p>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr
              className={`border-b ${
                theme === "dark" ? "border-gray-700" : "border-gray-300"
              }`}
            >
              <th
                className={`py-2 px-3 text-left text-xs sm:text-sm font-bold uppercase tracking-wider ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                First Name
              </th>
              <th
                className={`py-2 px-3 text-left text-xs sm:text-sm font-bold uppercase tracking-wider ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Last Name
              </th>
              <th
                className={`py-2 px-3 text-left text-xs sm:text-sm font-bold uppercase tracking-wider ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Username
              </th>
              <th
                className={`py-2 px-3 text-left text-xs sm:text-sm font-bold uppercase tracking-wider ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Email
              </th>
              <th
                className={`py-2 px-3 text-left text-xs sm:text-sm font-bold uppercase tracking-wider ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Role
              </th>
              <th
                className={`py-2 px-3 text-left text-xs sm:text-sm font-bold uppercase tracking-wider ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Status
              </th>
              <th
                className={`py-2 px-3 text-left text-xs sm:text-sm font-bold uppercase tracking-wider ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className={`border-b ${
                  theme === "dark" ? "border-gray-700" : "border-gray-300"
                }`}
              >
                <td
                  className={`py-2 px-3 text-xs sm:text-sm ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {user.FirstName}
                </td>
                <td
                  className={`py-2 px-3 text-xs sm:text-sm ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {user.LastName}
                </td>
                <td
                  className={`py-2 px-3 text-xs sm:text-sm ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {user.username}
                </td>
                <td
                  className={`py-2 px-3 text-xs sm:text-sm ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {user.email || "-"}
                </td>
                <td
                  className={`py-2 px-3 text-xs sm:text-sm ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {user.role}
                </td>
                <td className="py-2 px-3">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      user.status === "ACTIVE"
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="py-2 px-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleToggleStatus(user.id, user.status)}
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      user.status === "ACTIVE"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    } text-white`}
                    title={user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  >
                    {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => onEditUser(user)}
                    className={`p-1 ${
                      theme === "dark"
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                    title="Edit"
                  >
                    <FiEdit size={16} />
                  </button>
                  <button
                    onClick={() => openDeleteModal(user.id)}
                    className={`p-1 ${
                      theme === "dark"
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                    title="Delete"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div
            className={`p-4 sm:p-6 rounded-lg shadow-lg w-11/12 max-w-sm ${
              theme === "dark"
                ? "bg-[#f4f4f4] text-gray-800"
                : "bg-[#f4f4f4] text-gray-800"
            }`}
          >
            <div className="flex flex-col items-center">
              <div className="mb-3">
                <FiAlertCircle size={24} className="text-gray-500" />
              </div>
              <p className="text-sm sm:text-base mb-4 text-center">
                Are you sure you want to delete this user?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
                <button
                  onClick={() => handleDelete(userIdToDelete)}
                  className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300 text-sm sm:text-base"
                >
                  Yes, I'm sure
                </button>
                <button
                  onClick={closeDeleteModal}
                  className="py-2 px-4 text-gray-600 hover:text-gray-800 text-sm sm:text-base"
                >
                  No, cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
