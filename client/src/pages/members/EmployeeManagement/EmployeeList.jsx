import { useState } from "react";
import { deleteMember } from "../../../api/memberApi";
import {
  HiEye,
  HiPencil,
  HiTrash,
  HiExclamationCircle,
  HiX,
} from "react-icons/hi";
import { useTheme } from "../../../context/ThemeContext";

const EmployeeList = ({
  members,
  onEditMember,
  onMemberUpdated,
  showToast,
}) => {
  const { theme } = useTheme();
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberIdToDelete, setMemberIdToDelete] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const formatEAT = (date) => {
    const options = {
      timeZone: "Africa/Addis_Ababa",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(date).toLocaleString("en-US", options);
  };

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

  const handleView = (member) => {
    setSelectedMember(member);
    setIsViewOpen(true);
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
        Employees
      </h2>

      {error && (
        <div
          className={`${
            theme === "dark"
              ? "text-red-400 bg-red-900/20"
              : "text-red-600 bg-red-100"
          } mb-6 flex items-center text-base p-4 rounded-lg`}
        >
          {error}
        </div>
      )}

      {isViewOpen && selectedMember && (
        <div
          className={`mb-8 p-6 sm:p-8 md:p-10 rounded-2xl shadow-xl relative max-w-6xl mx-auto transition-all duration-300 border-2 ${
            theme === "dark"
              ? "bg-gray-800 border-teal-600/50"
              : "bg-white border-teal-200/50"
          }`}
        >
          <button
            onClick={() => {
              setIsViewOpen(false);
              setSelectedMember(null);
            }}
            className={`absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300 transform hover:scale-105 ${
              theme === "dark"
                ? "text-gray-300 bg-gray-700/50 hover:bg-red-600/80 hover:text-white"
                : "text-gray-600 bg-gray-100/50 hover:bg-red-500 hover:text-white"
            }`}
            aria-label="Close employee details"
          >
            <HiX size={24} />
          </button>
          <h3
            className={`text-2xl sm:text-3xl font-semibold mb-8 text-left ${
              theme === "dark" ? "text-gray-100" : "text-gray-900"
            }`}
            style={{ color: "#10B981" }}
          >
            Employee Details
          </h3>
          <div className="space-y-10">
            {/* Personal Information */}
            <div className="border-b-2 border-gray-300 pb-8">
              <h4
                className={`text-lg sm:text-xl font-semibold mb-6`}
                style={{ color: "#5DB5B5" }}
              >
                Personal Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    First Name
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {selectedMember.FirstName}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Last Name
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {selectedMember.LastName}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Gender
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {selectedMember.gender || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Date of Birth
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {selectedMember.dob ? formatEAT(selectedMember.dob) : "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Phone
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {selectedMember.phone || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Address
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {selectedMember.address || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="border-b-2 border-gray-300 pb-8">
              <h4
                className={`text-lg sm:text-xl font-semibold mb-6`}
                style={{ color: "#5DB5B5" }}
              >
                Employment Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Position
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {selectedMember.position}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Salary
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {selectedMember.salary} Birr
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Status
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      selectedMember.status === "ACTIVE"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {selectedMember.status}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Role
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {selectedMember.role || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Joining Date
                  </span>
                  <span
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {selectedMember.joining_date
                      ? formatEAT(selectedMember.joining_date)
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="pb-8">
              <h4
                className={`text-lg sm:text-xl font-semibold mb-6`}
                style={{ color: "#5DB5B5" }}
              >
                Additional Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Photo
                  </span>
                  {selectedMember.Photo ? (
                    <a
                      href={`http://localhost:8080/${selectedMember.Photo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm sm:text-base text-teal-500 hover:underline transition-colors duration-200 ${
                        theme === "dark" ? "hover:text-teal-400" : ""
                      }`}
                    >
                      View Photo
                    </a>
                  ) : (
                    <span
                      className={`text-sm sm:text-base ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      N/A
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Certificate
                  </span>
                  {selectedMember.certificate ? (
                    <a
                      href={`http://localhost:8080/${selectedMember.certificate}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm sm:text-base text-teal-500 hover:underline transition-colors duration-200 ${
                        theme === "dark" ? "hover:text-teal-400" : ""
                      }`}
                    >
                      View Certificate
                    </a>
                  ) : (
                    <span
                      className={`text-sm sm:text-base ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      N/A
                    </span>
                  )}
                </div>
                <div className="flex flex-col col-span-2">
                  <span
                    className={`font-semibold text-sm sm:text-base ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Biography
                  </span>
                  <span
                    className={`text-sm sm:text-base break-words ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {selectedMember.biography || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isViewOpen && (
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
                  No.
                </th>
                <th
                  className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider ${
                    theme === "dark" ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  First Name
                </th>
                <th
                  className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden sm:table-cell ${
                    theme === "dark" ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  Last Name
                </th>
                <th
                  className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden md:table-cell ${
                    theme === "dark" ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  Position
                </th>
                <th
                  className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden lg:table-cell ${
                    theme === "dark" ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  Salary
                </th>
                <th
                  className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden xl:table-cell ${
                    theme === "dark" ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  Role
                </th>
                <th
                  className={`border-b border-gray-300 px-4 py-3 text-left font-semibold text-xs sm:text-sm uppercase tracking-wider hidden sm:table-cell ${
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
              {members.length > 0 ? (
                members.map((member, index) => (
                  <tr
                    key={member.id || `row-${index}`}
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
                    data-row={index + 1}
                  >
                    <td
                      className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base font-medium ${
                        theme === "dark"
                          ? "text-gray-300 border-gray-700"
                          : "text-gray-700 border-gray-200"
                      }`}
                    >
                      {index + 1}
                    </td>
                    <td
                      className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base ${
                        theme === "dark"
                          ? "text-gray-300 border-gray-700"
                          : "text-gray-700 border-gray-200"
                      }`}
                    >
                      {member.FirstName}
                    </td>
                    <td
                      className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden sm:table-cell ${
                        theme === "dark"
                          ? "text-gray-300 border-gray-700"
                          : "text-gray-700 border-gray-200"
                      }`}
                    >
                      {member.LastName}
                    </td>
                    <td
                      className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden md:table-cell ${
                        theme === "dark"
                          ? "text-gray-300 border-gray-700"
                          : "text-gray-700 border-gray-200"
                      }`}
                    >
                      {member.position}
                    </td>
                    <td
                      className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden lg:table-cell ${
                        theme === "dark"
                          ? "text-gray-300 border-gray-700"
                          : "text-gray-700 border-gray-200"
                      }`}
                    >
                      {member.salary} Birr
                    </td>
                    <td
                      className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden xl:table-cell ${
                        theme === "dark"
                          ? "text-gray-300 border-gray-700"
                          : "text-gray-700 border-gray-200"
                      }`}
                    >
                      {member.role || "N/A"}
                    </td>
                    <td
                      className={`border-b border-gray-300 px-4 py-3 text-sm sm:text-base hidden sm:table-cell ${
                        theme === "dark"
                          ? "text-gray-300 border-gray-700"
                          : "text-gray-700 border-gray-200"
                      }`}
                    >
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
                    <td
                      className={`border-b border-gray-300 px-4 py-3 flex flex-wrap gap-2 items-center justify-start ${
                        theme === "dark" ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <button
                        key={`view-${member.id || index}`}
                        onClick={() => handleView(member)}
                        className={actionButtonClass}
                        title="View"
                        aria-label={`View employee ${member.FirstName} ${member.LastName}`}
                      >
                        <HiEye size={18} />
                      </button>
                      <button
                        key={`edit-${member.id || index}`}
                        onClick={() => onEditMember(member)}
                        className={actionButtonClass}
                        title="Edit"
                        aria-label={`Edit employee ${member.FirstName} ${member.LastName}`}
                      >
                        <HiPencil size={18} />
                      </button>
                      <button
                        key={`delete-${member.id || index}`}
                        onClick={() => openDeleteModal(member.id)}
                        className={actionButtonClass}
                        title="Delete"
                        aria-label={`Delete employee ${member.FirstName} ${member.LastName}`}
                      >
                        <HiTrash size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className={`border-b border-gray-300 px-4 py-3 text-center text-sm sm:text-base ${
                      theme === "dark"
                        ? "text-gray-300 border-gray-700 bg-gray-900"
                        : "text-gray-600 border-gray-200 bg-white"
                    }`}
                  >
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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
