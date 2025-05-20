import { useState } from "react";
import { deleteUser, updateUser } from "../../../api/userApi";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { HiExclamationCircle } from "react-icons/hi";
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

  const actionButtonClass = `p-2 rounded-md transition-colors duration-200 ${
    theme === "dark"
      ? "text-gray-300 hover:bg-[#4B5563]"
      : "text-gray-600 hover:bg-[#f7f7f7]"
  }`;

  return (
    <div
      className={`p-4 sm:p-6 md:p-8 rounded-xl shadow-lg w-full font-sans transition-all duration-300 ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
    >
      <h2
        className={`text-2xl sm:text-3xl font-semibold mb-6 ${
          theme === "dark" ? "text-gray-100" : "text-gray-900"
        }`}
        style={{ color: "#10B981" }}
      >
        User List
      </h2>
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
      <div className="overflow-x-auto min-w-full rounded-lg shadow-sm border border-gray-200">
        <table
          className={`w-full border-collapse text-sm sm:text-base font-sans table-auto ${
            theme === "dark" ? "bg-gray-900" : "bg-white"
          }`}
        >
          <thead>
            <tr
              className={`${
                theme === "dark" ? "bg-teal-700" : "bg-teal-600"
              } text-white`}
            >
              <th
                className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                First Name
              </th>
              <th
                className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                Last Name
              </th>
              <th
                className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                Username
              </th>
              <th
                className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                Email
              </th>
              <th
                className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                Role
              </th>
              <th
                className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                Status
              </th>
              <th
                className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user, index) => (
                <tr
                  key={user.id || `row-${index}`}
                  className={`${
                    index % 2 === 0
                      ? theme === "dark"
                        ? "bg-gray-900"
                        : "bg-gray-50"
                      : theme === "dark"
                      ? "bg-gray-800"
                      : "bg-white"
                  } transition-colors duration-200 ${
                    theme === "dark"
                      ? "hover:bg-[#4B5563]"
                      : "hover:bg-[#f7f7f7]"
                  }`}
                >
                  <td
                    className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                      theme === "dark"
                        ? "text-gray-300 border-gray-700"
                        : "text-gray-700 border-gray-200"
                    }`}
                  >
                    {user.FirstName}
                  </td>
                  <td
                    className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                      theme === "dark"
                        ? "text-gray-300 border-gray-700"
                        : "text-gray-700 border-gray-200"
                    }`}
                  >
                    {user.LastName}
                  </td>
                  <td
                    className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                      theme === "dark"
                        ? "text-gray-300 border-gray-700"
                        : "text-gray-700 border-gray-200"
                    }`}
                  >
                    {user.username}
                  </td>
                  <td
                    className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                      theme === "dark"
                        ? "text-gray-300 border-gray-700"
                        : "text-gray-700 border-gray-200"
                    }`}
                  >
                    {user.email || "-"}
                  </td>
                  <td
                    className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                      theme === "dark"
                        ? "text-gray-300 border-gray-700"
                        : "text-gray-700 border-gray-200"
                    }`}
                  >
                    {user.role}
                  </td>
                  <td
                    className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
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
                  <td
                    className={`border-b border-gray-300 px-4 py-3 flex flex-wrap gap-2 items-center justify-start ${
                      theme === "dark"
                        ? "text-gray-300 border-gray-700"
                        : "text-gray-700 border-gray-200"
                    }`}
                  >
                    <button
                      onClick={() => handleToggleStatus(user.id, user.status)}
                      className={`px-3 py-1 rounded-lg text-sm sm:text-base font-semibold ${
                        user.status === "ACTIVE"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
                      } text-white`}
                      title={
                        user.status === "ACTIVE" ? "Deactivate" : "Activate"
                      }
                    >
                      {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => onEditUser(user)}
                      className={actionButtonClass}
                      title="Edit"
                      aria-label={`Edit user ${user.username}`}
                    >
                      <FiEdit size={18} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(user.id)}
                      className={actionButtonClass}
                      title="Delete"
                      aria-label={`Delete user ${user.username}`}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className={`border-b border-gray-300 px-4 py-3 text-center text-sm sm:text-base ${
                    theme === "dark"
                      ? "text-gray-300 border-gray-700 bg-gray-900"
                      : "text-gray-600 border-gray-200 bg-white"
                  }`}
                >
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-xl shadow-lg w-11/12 max-w-md ${
              theme === "dark"
                ? "bg-gray-800 text-gray-200 border-gray-700"
                : "bg-white text-gray-800 border-gray-200"
            } border transition-all duration-300`}
          >
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <HiExclamationCircle
                  size={36}
                  className={theme === "dark" ? "text-red-400" : "text-red-500"}
                />
              </div>
              <p
                className={`text-sm sm:text-base mb-6 text-center font-semibold ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Are you sure you want to delete this user?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                <button
                  onClick={() => handleDelete(userIdToDelete)}
                  className={`py-2 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300 text-sm sm:text-base font-semibold w-full sm:w-auto`}
                >
                  Yes, I'm sure
                </button>
                <button
                  onClick={closeDeleteModal}
                  className={`py-2 px-6 rounded-lg font-semibold text-sm sm:text-base transition-colors duration-200 w-full sm:w-auto ${
                    theme === "dark"
                      ? "bg-gray-700 text-gray-200 hover:bg-[#4B5563]"
                      : "bg-gray-200 text-gray-600 hover:bg-[#f7f7f7]"
                  }`}
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
