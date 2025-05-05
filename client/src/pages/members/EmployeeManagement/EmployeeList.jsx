import { useState } from "react";
import { deleteMember } from "../../../api/memberApi";
import { HiEye, HiPencil, HiTrash, HiExclamationCircle } from "react-icons/hi";
import { useTheme } from "../../../context/ThemeContext";

const EmployeeList = ({
  members,
  onEditMember,
  onMemberUpdated,
  showToast,
  onViewMember,
}) => {
  const { theme } = useTheme();
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberIdToDelete, setMemberIdToDelete] = useState(null);

  const handleDelete = async (id) => {
    try {
      await deleteMember(id);
      showToast("Employee deleted successfully!");
      onMemberUpdated({ id, action: "delete" });
    } catch (err) {
      setError(err.message || "Failed to delete employee");
    }
    setShowDeleteModal(false);
    setMemberIdToDelete(null);
  };

  const openDeleteModal = (id) => {
    setMemberIdToDelete(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setMemberIdToDelete(null);
  };

  const actionButtonClass = `p-2 rounded-md transition-colors duration-200 ${
    theme === "dark"
      ? "text-gray-300 hover:bg-[#4B5563]"
      : "text-gray-600 hover:bg-[#f7f7f7]"
  }`;

  return (
    <div
      className={`p-6 rounded-lg shadow-lg w-full ${
        theme === "dark"
          ? "bg-gray-800 text-gray-200"
          : "bg-white text-gray-800"
      }`}
    >
      <h2
        className={`text-2xl font-bold mb-6 ${
          theme === "dark" ? "text-teal-400" : "text-teal-600"
        }`}
        style={{ color: "#10B981" }}
      >
        Employee List
      </h2>
      {error && (
        <div
          className={`mb-6 p-3 rounded ${
            theme === "dark"
              ? "bg-red-900/50 text-red-200"
              : "bg-red-100 text-red-700"
          }`}
        >
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-teal-600 text-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                First Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Last Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">
                Salary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-gray-200 ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
          >
            {members.map((member, index) => (
              <tr
                key={member.id}
                className={theme === "dark" ? "bg-gray-700" : "bg-white"}
              >
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {index + 1}
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {member.FirstName}
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {member.LastName}
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm hidden sm:table-cell ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {member.position}
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell ${
                    theme === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {member.salary} Birr
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      member.status === "ACTIVE"
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <button
                    onClick={() => onViewMember(member)}
                    className={actionButtonClass}
                    title="View"
                  >
                    <HiEye size={18} />
                  </button>
                  <button
                    onClick={() => onEditMember(member)}
                    className={actionButtonClass}
                    title="Edit"
                  >
                    <HiPencil size={18} />
                  </button>
                  <button
                    onClick={() => openDeleteModal(member.id)}
                    className={actionButtonClass}
                    title="Delete"
                  >
                    <HiTrash size={18} />
                  </button>
                </td>
              </tr>
            ))}
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
                Are you sure you want to delete this employee?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                <button
                  onClick={() => handleDelete(memberIdToDelete)}
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

export default EmployeeList;
