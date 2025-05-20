import { useEffect, useState, useRef } from "react";
import { createUser, updateUser, checkEmail } from "../../../api/userApi";
import { useTheme } from "../../../context/ThemeContext";

// Custom debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const UserForm = ({ onUserCreated, initialData, onCancel, showToast }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    FirstName: "",
    LastName: "",
    username: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    status: "ACTIVE",
  });
  const [error, setError] = useState("");
  const [emailStatus, setEmailStatus] = useState(""); // Track email availability

  // Refs for input fields to manage focus
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const statusRef = useRef(null);
  const statusInactiveRef = useRef(null);
  const submitRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        FirstName: initialData.FirstName || "",
        LastName: initialData.LastName || "",
        username: initialData.username || "",
        email: initialData.email || "",
        password: "",
        role: "EMPLOYEE",
        status: initialData.status || "ACTIVE",
        id: initialData.id,
      });
      setEmailStatus(""); // Reset email status on edit
    }
  }, [initialData]);

  // Debounced email check
  const checkEmailAvailability = debounce(async (email) => {
    setEmailStatus(""); // Reset status
    if (!email || (initialData && email === initialData.email)) {
      return; // No need to check if email is empty or unchanged
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailStatus("Invalid email format");
      return;
    }
    try {
      const result = await checkEmail(email);
      setEmailStatus(
        result.exists ? "Email already exists" : "Email available"
      );
    } catch (err) {
      console.error("Email check error:", err);
      if (err.response?.status === 400) {
        setEmailStatus(err.response.data.error);
      } else {
        setEmailStatus("Error checking email");
      }
    }
  }, 500);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "email") {
      checkEmailAvailability(value);
    }
  };

  const handleKeyDown = (e, nextRef) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef.current) {
        nextRef.current.focus();
      } else {
        handleSubmit(e);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (
        !formData.FirstName ||
        !formData.LastName ||
        !formData.username ||
        !formData.password ||
        !formData.status
      ) {
        setError("Please fill all required fields");
        return;
      }
      // Validate email format (if provided)
      if (
        formData.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
      ) {
        setError("Invalid email format");
        return;
      }
      // Check if email is already taken
      if (emailStatus === "Email already exists") {
        setError("Email already exists");
        return;
      }

      let response;
      if (initialData) {
        response = await updateUser(initialData.id, {
          FirstName: formData.FirstName,
          LastName: formData.LastName,
          username: formData.username,
          email: formData.email || null,
          role: formData.role,
          status: formData.status,
          ...(formData.password && { password: formData.password }),
        });
        showToast("User updated successfully!");
      } else {
        response = await createUser({
          FirstName: formData.FirstName,
          LastName: formData.LastName,
          username: formData.username,
          email: formData.email || null,
          password: formData.password,
          role: formData.role,
          status: formData.status,
        });
        showToast("User added successfully!");
      }
      setFormData({
        FirstName: "",
        LastName: "",
        username: "",
        email: "",
        password: "",
        role: "EMPLOYEE",
        status: "ACTIVE",
      });
      setEmailStatus("");
      onUserCreated(response.user);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to save user. Please try again."
      );
    }
  };

  return (
    <div
      className={`rounded-xl shadow-lg p-6 w-full max-w-3xl mx-auto max-h-[90vh] overflow-y-auto scrollbar-thin ${
        theme === "dark"
          ? "bg-gray-800 border-gray-700 scrollbar-thumb-gray-500 scrollbar-track-gray-800"
          : "bg-white border-gray-200 scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h2
          className={`text-2xl sm:text-3xl font-semibold ${
            theme === "dark" ? "text-gray-100" : "text-gray-900"
          }`}
          style={{ color: "#10B981" }}
        >
          {initialData ? "Update User" : "Add User"}
        </h2>
        <button
          onClick={onCancel}
          className={`px-3 py-1 rounded-lg text-sm sm:text-base font-semibold transition-colors duration-300 ${
            theme === "dark"
              ? "bg-gray-700 text-gray-200 hover:bg-[#4B5563]"
              : "bg-gray-200 text-gray-600 hover:bg-[#f7f7f7]"
          }`}
        >
          ✕
        </button>
      </div>
      {error && (
        <div
          className={`${
            theme === "dark"
              ? "text-red-400 bg-red-900/20"
              : "text-red-500 bg-red-100"
          } mb-6 text-base p-4 rounded-lg text-center`}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}
          >
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="FirstName"
            value={formData.FirstName}
            onChange={handleChange}
            onKeyDown={(e) => handleKeyDown(e, lastNameRef)}
            ref={firstNameRef}
            placeholder="Enter First Name"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm ${
              theme === "dark"
                ? "bg-gray-700 border-gray-500 text-gray-200 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
            }`}
          />
        </div>

        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}
          >
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="LastName"
            value={formData.LastName}
            onChange={handleChange}
            onKeyDown={(e) => handleKeyDown(e, usernameRef)}
            ref={lastNameRef}
            placeholder="Enter Last Name"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm ${
              theme === "dark"
                ? "bg-gray-700 border-gray-500 text-gray-200 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
            }`}
          />
        </div>

        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}
          >
            Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            onKeyDown={(e) => handleKeyDown(e, emailRef)}
            ref={usernameRef}
            placeholder="Enter Username"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm ${
              theme === "dark"
                ? "bg-gray-700 border-gray-500 text-gray-200 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
            }`}
          />
        </div>

        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}
          >
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onKeyDown={(e) => handleKeyDown(e, passwordRef)}
            ref={emailRef}
            placeholder="Enter Email"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm ${
              theme === "dark"
                ? "bg-gray-700 border-gray-500 text-gray-200 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
            }`}
          />
          {emailStatus && (
            <div
              className={`mt-1 text-xs p-1 rounded ${
                emailStatus === "Email available"
                  ? theme === "dark"
                    ? "text-green-500 bg-green-900/20"
                    : "text-green-500 bg-green-100"
                  : theme === "dark"
                  ? "text-red-500 bg-red-900/20"
                  : "text-red-500 bg-red-100"
              }`}
            >
              {emailStatus}
            </div>
          )}
        </div>

        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}
          >
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onKeyDown={(e) => handleKeyDown(e, statusRef)}
            ref={passwordRef}
            placeholder="Enter Password"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm ${
              theme === "dark"
                ? "bg-gray-700 border-gray-500 text-gray-200 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
            }`}
          />
        </div>

        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}
          >
            Status <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="status"
                value="ACTIVE"
                checked={formData.status === "ACTIVE"}
                onChange={handleChange}
                onKeyDown={(e) => handleKeyDown(e, statusInactiveRef)}
                ref={statusRef}
                className="h-4 w-4 text-teal-500 focus:ring-teal-500 border-gray-300"
              />
              <span
                className={`text-sm ${
                  theme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Active
              </span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="status"
                value="INACTIVE"
                checked={formData.status === "INACTIVE"}
                onChange={handleChange}
                onKeyDown={(e) => handleKeyDown(e, submitRef)}
                ref={statusInactiveRef}
                className="h-4 w-4 text-teal-500 focus:ring-teal-500 border-gray-300"
              />
              <span
                className={`text-sm ${
                  theme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Inactive
              </span>
            </label>
          </div>
        </div>

        <div className="sm:col-span-2 mt-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSubmit}
            ref={submitRef}
            className={`flex-1 py-2 rounded-lg text-sm sm:text-base font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors duration-300`}
          >
            {initialData ? "Update User" : "Add User"}
          </button>
          <button
            onClick={onCancel}
            className={`flex-1 py-2 rounded-lg text-sm sm:text-base font-semibold transition-colors duration-300 ${
              theme === "dark"
                ? "bg-gray-700 text-gray-200 hover:bg-[#4B5563]"
                : "bg-gray-200 text-gray-600 hover:bg-[#f7f7f7]"
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserForm;
