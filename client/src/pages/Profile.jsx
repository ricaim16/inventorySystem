import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getUserById, updateUser, checkEmail } from "../api/userApi";
import Sidebar from "../components/Sidebar";

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

      await updateUser(id || user.id, updatedData);
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
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className={`flex-1 pt-6 pr-6 pb-6 pl-4 ${
          theme === "dark" ? "bg-gray-900" : "bg-gray-100"
        }`}
      >
        <h1 className={`text-3xl font-bold mb-6 text-[#10B981]`}>
          Edit Profile
        </h1>

        {error && (
          <div
            className="bg-red-50 text-red-700 p-3 rounded-md mb-4 flex items-center"
            role="alert"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div
            className="bg-green-50 text-green-700 p-3 rounded-md mb-4 flex items-center"
            role="alert"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            {success}
          </div>
        )}

        <div
          className={`max-w-2xl p-6 rounded-md shadow-md ${
            theme === "dark"
              ? "bg-gray-800 text-gray-100"
              : "bg-[#f4f4f4] text-gray-900"
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-1"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100 focus:border-[#10B981]"
                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-[#10B981]"
                } focus:outline-none focus:ring-2 focus:ring-[#10B981]`}
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100 focus:border-[#10B981]"
                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-[#10B981]"
                } focus:outline-none focus:ring-2 focus:ring-[#10B981]`}
                placeholder="Enter your email"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="FirstName"
                  className="block text-sm font-medium mb-1"
                >
                  First Name
                </label>
                <input
                  id="FirstName"
                  name="FirstName"
                  type="text"
                  value={formData.FirstName}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-gray-100 focus:border-[#10B981]"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:border-[#10B981]"
                  } focus:outline-none focus:ring-2 focus:ring-[#10B981]`}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="LastName"
                  className="block text-sm font-medium mb-1"
                >
                  Last Name
                </label>
                <input
                  id="LastName"
                  name="LastName"
                  type="text"
                  value={formData.LastName}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-gray-100 focus:border-[#10B981]"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:border-[#10B981]"
                  } focus:outline-none focus:ring-2 focus:ring-[#10B981]`}
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              {!showPasswordForm ? (
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(true)}
                  className={`text-[#10B981] hover:text-[#059669] transition-colors duration-200 ${
                    theme === "dark" ? "hover:text-[#34D399]" : ""
                  }`}
                >
                  Change Password
                </button>
              ) : (
                <div className="space-y-4">
                  {passwordError && (
                    <div
                      className="bg-red-50 text-red-700 p-2 rounded-md flex items-center text-sm"
                      role="alert"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {passwordError}
                    </div>
                  )}
                  <div className="relative">
                    <label
                      htmlFor="oldPassword"
                      className="block text-sm font-medium mb-1"
                    >
                      Current Password
                    </label>
                    <input
                      id="oldPassword"
                      name="oldPassword"
                      type={showOldPassword ? "text" : "password"}
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange}
                      className={`w-full p-2 pr-10 border rounded-md ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-gray-100 focus:border-[#10B981]"
                          : "bg-gray-50 border-gray-300 text-gray-900 focus:border-[#10B981]"
                      } focus:outline-none focus:ring-2 focus:ring-[#10B981]`}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-2 top-9 text-[#10B981] hover:text-[#059669]"
                    >
                      {showOldPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium mb-1"
                    >
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className={`w-full p-2 pr-10 border rounded-md ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-gray-100 focus:border-[#10B981]"
                          : "bg-gray-50 border-gray-300 text-gray-900 focus:border-[#10B981]"
                      } focus:outline-none focus:ring-2 focus:ring-[#10B981]`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-9 text-[#10B981] hover:text-[#059669]"
                    >
                      {showNewPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium mb-1"
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`w-full p-2 pr-10 border rounded-md ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-gray-100 focus:border-[#10B981]"
                          : "bg-gray-50 border-gray-300 text-gray-900 focus:border-[#10B981]"
                      } focus:outline-none focus:ring-2 focus:ring-[#10B981]`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-2 top-9 text-[#10B981] hover:text-[#059669]"
                    >
                      {showConfirmPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                          />
                        </svg>
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
                    className={`py-2 px-4 rounded-md font-medium transition duration-300 ${
                      theme === "dark"
                        ? "bg-gray-600 text-gray-100 hover:bg-gray-500"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    Cancel Password Change
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 py-2 px-4 rounded-md font-bold transition duration-300 ${
                  theme === "dark"
                    ? "bg-[#10B981] text-white hover:bg-[#059669]"
                    : "bg-[#10B981] text-white hover:bg-[#059669]"
                } disabled:bg-[#10B981]/50 disabled:cursor-not-allowed`}
              >
                {isLoading ? "Saving..." : "Update Profile"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className={`flex-1 py-2 px-4 rounded-md font-bold transition duration-300 ${
                  theme === "dark"
                    ? "bg-gray-600 text-gray-100 hover:bg-gray-500"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
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
