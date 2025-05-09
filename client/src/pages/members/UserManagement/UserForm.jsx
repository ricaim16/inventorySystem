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
      className={`rounded-lg shadow-lg p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto scrollbar scrollbar-thumb-gray-400 ${
        theme === "dark"
          ? "bg-gray-800 scrollbar-track-gray-700"
          : "bg-[#f7f7f7] scrollbar-track-[#f7f7f7]"
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h2
          className={`text-xl font-bold ${
            theme === "dark" ? "text-gray-200" : "text-gray-800"
          }`}
        >
          {initialData ? "UPDATE USER" : "ADD USER"}
        </h2>
        <button
          onClick={onCancel}
          className="text-white bg-[#A52A2A] border border-[#8B1A1A] rounded px-2 py-1 hover:bg-[#8B1A1A] text-sm"
        >
          ✕
        </button>
      </div>
      {error && (
        <p
          className={`mb-4 text-center text-sm ${
            theme === "dark" ? "text-red-400" : "text-red-500"
          }`}
        >
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-200" : "text-gray-600"
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
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5E8C7] text-sm ${
              theme === "dark"
                ? "bg-gray-700 border-gray-500 text-gray-200"
                : "bg-white border-black text-gray-800"
            }`}
          />
        </div>

        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-200" : "text-gray-600"
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
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5E8C7] text-sm ${
              theme === "dark"
                ? "bg-gray-700 border-gray-500 text-gray-200"
                : "bg-white border-black text-gray-800"
            }`}
          />
        </div>

        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-200" : "text-gray-600"
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
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5E8C7] text-sm ${
              theme === "dark"
                ? "bg-gray-700 border-gray-500 text-gray-200"
                : "bg-white border-black text-gray-800"
            }`}
          />
        </div>

        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-200" : "text-gray-600"
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
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5E8C7] text-sm ${
              theme === "dark"
                ? "bg-gray-700 border-gray-500 text-gray-200"
                : "bg-white border-black text-gray-800"
            }`}
          />
          {emailStatus && (
            <p
              className={`mt-1 text-xs ${
                emailStatus === "Email available"
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {emailStatus}
            </p>
          )}
        </div>

        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-200" : "text-gray-600"
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
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5E8C7] text-sm ${
              theme === "dark"
                ? "bg-gray-700 border-gray-500 text-gray-200"
                : "bg-white border-black text-gray-800"
            }`}
          />
        </div>

        <div>
          <label
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-200" : "text-gray-600"
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
                className="h-4 w-4 text-[#E8D7A5] focus:ring-[#E8D7A5] border-gray-300"
              />
              <span
                className={`text-sm ${
                  theme === "dark" ? "text-gray-200" : "text-gray-600"
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
                className="h-4 w-4 text-[#E8D7A5] focus:ring-[#E8D7A5] border-gray-300"
              />
              <span
                className={`text-sm ${
                  theme === "dark" ? "text-gray-200" : "text-gray-600"
                }`}
              >
                Inactive
              </span>
            </label>
          </div>
        </div>

        <div className="sm:col-span-2 mt-6">
          <button
            onClick={handleSubmit}
            ref={submitRef}
            className={`w-full py-2 rounded-lg transition duration-300 text-sm ${
              theme === "dark"
                ? "bg-gray-600 text-white border-2 border-gray-500 hover:bg-gray-500 hover:text-white"
                : "bg-[#f7f7f7] text-gray-800 border-2 border-black hover:bg-[#eaeaea] hover:text-gray-800"
            }`}
          >
            {initialData ? "Update User" : "Add User"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserForm;
