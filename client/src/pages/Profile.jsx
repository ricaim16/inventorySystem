import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getUserById, updateUser, checkEmail } from "../api/userApi";
import Sidebar from "../components/Sidebar";
import {
  HiExclamationCircle,
  HiCheckCircle,
  HiEye,
  HiEyeOff,
} from "react-icons/hi";

// Custom debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const Profile = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    FirstName: "",
    LastName: "",
    username: "",
    email: "",
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [emailStatus, setEmailStatus] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserById(id || user.id);
        console.log("Initial fetched user data:", userData); // Debug log
        setFormData({
          FirstName: userData.FirstName || "",
          LastName: userData.LastName || "",
          username: userData.username || "",
          email: userData.email || "",
        });
      } catch (err) {
        console.error("Fetch user error:", err);
        if (err.message.includes("404")) {
          setError("User not found. Please check the URL or contact support.");
        } else {
          setError("Failed to load user data.");
        }
      }
    };
    fetchUser();
  }, [id, user.id]);

  // Debounced email check
  const checkEmailAvailability = debounce(async (email) => {
    setEmailStatus(""); // Reset status
    if (!email || (formData.email && email === formData.email)) {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input change - ${name}: ${value}`); // Debug log
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "email") {
      checkEmailAvailability(value);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordError("");
  };

  const handleReset = () => {
    setFormData({
      FirstName: "",
      LastName: "",
      username: "",
      email: "",
    });
    setPasswordData({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPasswordForm(false);
    setEmailStatus("");
    setError("");
    setSuccess("");
    setPasswordError("");
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setPasswordError("");
    setIsLoading(true);

    // Validate required fields
    if (!formData.FirstName || !formData.LastName || !formData.username) {
      setError("Please fill all required fields.");
      setIsLoading(false);
      return;
    }

    // Validate email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Invalid email format");
      setIsLoading(false);
      return;
    }

    // Check email availability
    if (emailStatus === "Email already exists") {
      setError("Email already exists");
      setIsLoading(false);
      return;
    }

    if (showPasswordForm) {
      if (!passwordData.oldPassword) {
        setPasswordError("Please enter your current password.");
        setIsLoading(false);
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError("New password and confirm password do not match.");
        setIsLoading(false);
        return;
      }
      if (passwordData.newPassword.length < 8) {
        setPasswordError("New password must be at least 8 characters long.");
        setIsLoading(false);
        return;
      }
      if (
        !/[A-Z]/.test(passwordData.newPassword) ||
        !/[0-9]/.test(passwordData.newPassword)
      ) {
        setPasswordError(
          "New password must include at least one uppercase letter and one number."
        );
        setIsLoading(false);
        return;
      }
    }

    try {
      const updatedData = {
        FirstName: formData.FirstName,
        LastName: formData.LastName,
        username: formData.username,
        email: formData.email || null,
      };

      if (showPasswordForm && passwordData.newPassword) {
        updatedData.oldPassword = passwordData.oldPassword;
        updatedData.password = passwordData.newPassword;
      }

      console.log("Data being sent to updateUser:", updatedData); // Debug log
      await updateUser(id || user.id, updatedData);

      // Store the sent data as a fallback
      const sentData = { ...updatedData };

      // Re-fetch user data to ensure the form reflects the updated values
      const userData = await getUserById(id || user.id);
      console.log("Updated user data from getUserById:", userData); // Debug log

      // Validate fetched data against sent data
      if (userData.LastName !== sentData.LastName) {
        console.warn(
          `Backend returned incorrect LastName. Expected: ${sentData.LastName}, Got: ${userData.LastName}. Using sent data as fallback.`
        );
        setFormData({
          FirstName: sentData.FirstName,
          LastName: sentData.LastName,
          username: sentData.username,
          email: sentData.email || "",
        });
      } else {
        setFormData({
          FirstName: userData.FirstName || "",
          LastName: userData.LastName || "",
          username: userData.username || "",
          email: userData.email || "",
        });
      }

      setSuccess("Profile updated successfully!");
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setEmailStatus("");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      console.error("Update error:", err);
      if (err.response?.data?.error.includes("password")) {
        setPasswordError(
          err.response?.data?.error ||
            "Failed to update password. Please check your current password."
        );
      } else if (err.response?.data?.error.includes("email")) {
        setError("Email already exists or is invalid.");
      } else {
        setError(
          err.response?.data?.error ||
            "Failed to update profile. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans">
      <Sidebar />
      <div
        className={`flex-1 p-4 sm:p-6 md:p-8 w-full rounded-xl shadow-lg transition-all duration-300 ${
          theme === "dark" ? "bg-gray-900" : "bg-white"
        }`}
      >
        <h1
          className={`text-2xl sm:text-3xl font-semibold mb-6 ${
            theme === "dark" ? "text-gray-100" : "text-gray-900"
          }`}
          style={{ color: "#10B981" }}
        >
          Edit Profile
        </h1>

        {error && (
          <div
            className={`${
              theme === "dark"
                ? "text-red-400 bg-red-900/20"
                : "text-red-500 bg-red-100"
            } mb-6 flex items-center text-base p-4 rounded-lg`}
            role="alert"
          >
            <HiExclamationCircle className="w-6 h-6 mr-2" />
            {error}
          </div>
        )}
        {success && (
          <div
            className={`${
              theme === "dark"
                ? "text-green-500 bg-green-900/20"
                : "text-green-500 bg-green-100"
            } mb-6 flex items-center text-base p-4 rounded-lg`}
            role="alert"
          >
            <HiCheckCircle className="w-6 h-6 mr-2" />
            {success}
          </div>
        )}

        <div
          className={`max-w-3xl p-6 rounded-xl shadow-lg transition-all duration-300 ${
            theme === "dark"
              ? "bg-gray-800 text-gray-200 border-gray-700"
              : "bg-white text-gray-800 border-gray-200"
          } border`}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Username <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg text-base ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-500 text-gray-200 placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg text-base ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-500 text-gray-200 placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                placeholder="Enter your email"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="FirstName"
                  className={`block text-sm font-medium mb-1 ${
                    theme === "dark" ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="FirstName"
                  name="FirstName"
                  type="text"
                  value={formData.FirstName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg text-base ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-500 text-gray-200 placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                  } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="LastName"
                  className={`block text-sm font-medium mb-1 ${
                    theme === "dark" ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="LastName"
                  name="LastName"
                  type="text"
                  value={formData.LastName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg text-base ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-500 text-gray-200 placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                  } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Password
              </label>
              {!showPasswordForm ? (
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(true)}
                  className={`text-teal-500 hover:text-teal-400 transition-colors duration-200 text-sm font-semibold`}
                >
                  Change Password
                </button>
              ) : (
                <div className="space-y-4">
                  {passwordError && (
                    <div
                      className={`${
                        theme === "dark"
                          ? "text-red-400 bg-red-900/20"
                          : "text-red-500 bg-red-100"
                      } p-3 rounded-lg flex items-center text-base`}
                      role="alert"
                    >
                      <HiExclamationCircle className="w-5 h-5 mr-2" />
                      {passwordError}
                    </div>
                  )}
                  <div className="relative">
                    <label
                      htmlFor="oldPassword"
                      className={`block text-sm font-medium mb-1 ${
                        theme === "dark" ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      Current Password
                    </label>
                    <input
                      id="oldPassword"
                      name="oldPassword"
                      type={showOldPassword ? "text" : "password"}
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-3 py-2 border rounded-lg text-base ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-500 text-gray-200 placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-9 text-teal-500 hover:text-teal-400"
                    >
                      {showOldPassword ? (
                        <HiEye className="w-5 h-5" />
                      ) : (
                        <HiEyeOff className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <label
                      htmlFor="newPassword"
                      className={`block text-sm font-medium mb-1 ${
                        theme === "dark" ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-3 py-2 border rounded-lg text-base ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-500 text-gray-200 placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-9 text-teal-500 hover:text-teal-400"
                    >
                      {showNewPassword ? (
                        <HiEye className="w-5 h-5" />
                      ) : (
                        <HiEyeOff className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <label
                      htmlFor="confirmPassword"
                      className={`block text-sm font-medium mb-1 ${
                        theme === "dark" ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-3 py-2 border rounded-lg text-base ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-500 text-gray-200 placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-9 text-teal-500 hover:text-teal-400"
                    >
                      {showConfirmPassword ? (
                        <HiEye className="w-5 h-5" />
                      ) : (
                        <HiEyeOff className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({
                        oldPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                      setPasswordError("");
                      setShowOldPassword(false);
                      setShowNewPassword(false);
                      setShowConfirmPassword(false);
                    }}
                    className={`w-full py-2 rounded-lg text-sm sm:text-base font-semibold transition-colors duration-300 ${
                      theme === "dark"
                        ? "bg-gray-700 text-gray-200 hover:bg-[#4B5563]"
                        : "bg-gray-200 text-gray-600 hover:bg-[#f7f7f7]"
                    }`}
                  >
                    Cancel Password Change
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 py-2 rounded-lg text-sm sm:text-base font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors duration-300 disabled:bg-teal-600/50 disabled:cursor-not-allowed`}
              >
                {isLoading ? "Saving..." : "Update Profile"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className={`flex-1 py-2 rounded-lg text-sm sm:text-base font-semibold transition-colors duration-300 ${
                  theme === "dark"
                    ? "bg-gray-700 text-gray-200 hover:bg-[#4B5563]"
                    : "bg-gray-200 text-gray-600 hover:bg-[#f7f7f7]"
                }`}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
