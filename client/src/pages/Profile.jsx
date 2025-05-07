import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getUserById, updateUser } from "../api/userApi";

const Profile = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    username: "",
    FirstName: "",
    LastName: "",
    phone: "",
    email: "",
    address: "",
    dob: "",
    gender: "",
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserById(id || user.id);
        setFormData({
          username: userData.username || "",
          FirstName: userData.FirstName || "",
          LastName: userData.LastName || "",
          phone: userData.member?.phone || "+251",
          email: userData.member?.email || "",
          address: userData.member?.address || "",
          dob: userData.member?.dob || "",
          gender: userData.member?.gender || "",
        });
      } catch (err) {
        setError("Failed to load user data.");
      }
    };
    fetchUser();
  }, [id, user.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePicture = () => {
    setProfilePicture(null);
    setPreview(null);
    fileInputRef.current.value = null;
  };

  const handlePasswordSubmit = async () => {
    setPasswordError("");
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    try {
      await updateUser(id || user.id, { password: passwordData.newPassword });
      setSuccess("Password updated successfully!");
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordError("Failed to update password. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const updatedData = {
        username: formData.username,
        FirstName: formData.FirstName,
        LastName: formData.LastName,
      };

      await updateUser(id || user.id, updatedData);

      setSuccess("Profile updated successfully!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const countryCodes = [
    { code: "ET", dial: "+251" },
    { code: "US", dial: "+1" },
    { code: "UK", dial: "+44" },
  ];

  const handlePhoneChange = (e) => {
    const { value } = e.target;
    const selectedCode =
      countryCodes.find((c) => c.dial === formData.phone.split(" ")[0])?.dial ||
      "+251";
    const phoneNumber = value.replace(/[^0-9]/g, ""); // Allow only numbers
    setFormData((prev) => ({
      ...prev,
      phone: `${selectedCode} ${phoneNumber}`,
    }));
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-6 ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div
        className={`w-full max-w-2xl p-8 rounded-xl shadow-2xl ${
          theme === "dark"
            ? "bg-gray-800 text-gray-100"
            : "bg-white text-gray-900"
        }`}
      >
        <h2 className="text-3xl font-semibold mb-8 border-b-2 border-indigo-600 pb-2">
          Edit Profile
        </h2>

        {error && (
          <div
            className="bg-red-100 text-red-800 p-4 rounded-lg mb-6"
            role="alert"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            className="bg-green-100 text-green-800 p-4 rounded-lg mb-6"
            role="alert"
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center space-x-6">
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-gray-300">
              <img
                src={preview || "https://via.placeholder.com/112"}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex space-x-4">
              <label className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium cursor-pointer hover:bg-indigo-700 transition-all">
                Upload New Profile Picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
              </label>
              <button
                type="button"
                onClick={handleRemovePicture}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-all"
              >
                Remove Profile Picture
              </button>
            </div>
          </div>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-2"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-gray-100"
                  : "bg-gray-100 border-gray-300"
              }`}
              placeholder="Username"
              required
            />
          </div>

          {/* Change Password */}
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            {!showPasswordForm ? (
              <button
                type="button"
                onClick={() => setShowPasswordForm(true)}
                className="text-indigo-600 hover:underline font-medium"
              >
                Change Password
              </button>
            ) : (
              <div className="space-y-4">
                {passwordError && (
                  <div
                    className="bg-red-100 text-red-800 p-3 rounded-lg"
                    role="alert"
                  >
                    {passwordError}
                  </div>
                )}
                <div>
                  <label
                    htmlFor="oldPassword"
                    className="block text-sm font-medium mb-2"
                  >
                    Old Password
                  </label>
                  <input
                    id="oldPassword"
                    name="oldPassword"
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-100 border-gray-300"
                    }`}
                    placeholder="Old Password"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium mb-2"
                  >
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-100 border-gray-300"
                    }`}
                    placeholder="New Password"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium mb-2"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-100 border-gray-300"
                    }`}
                    placeholder="Confirm New Password"
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handlePasswordSubmit}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all"
                  >
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* First Name and Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="FirstName"
                className="block text-sm font-medium mb-2"
              >
                First Name
              </label>
              <input
                id="FirstName"
                name="FirstName"
                type="text"
                value={formData.FirstName}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-gray-100 border-gray-300"
                }`}
                placeholder="First Name"
                required
              />
            </div>
            <div>
              <label
                htmlFor="LastName"
                className="block text-sm font-medium mb-2"
              >
                Last Name
              </label>
              <input
                id="LastName"
                name="LastName"
                type="text"
                value={formData.LastName}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-gray-100 border-gray-300"
                }`}
                placeholder="Last Name"
                required
              />
            </div>
          </div>

          {/* Phone and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Phone Number
              </label>
              <div className="flex">
                <select
                  name="countryCode"
                  onChange={(e) => {
                    const newCode = e.target.value;
                    const currentNumber =
                      formData.phone.split(" ").slice(1).join("") || "";
                    setFormData((prev) => ({
                      ...prev,
                      phone: `${newCode} ${currentNumber}`,
                    }));
                  }}
                  value={formData.phone.split(" ")[0] || "+251"}
                  className={`p-3 border-r-0 rounded-l-lg focus:outline-none ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-gray-100"
                      : "bg-gray-100 border-gray-300"
                  }`}
                >
                  {countryCodes.map((country) => (
                    <option key={country.code} value={country.dial}>
                      {country.dial}
                    </option>
                  ))}
                </select>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone.split(" ").slice(1).join("") || ""}
                  onChange={handlePhoneChange}
                  className={`w-full p-3 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-gray-100"
                      : "bg-gray-100 border-gray-300"
                  }`}
                  placeholder="Phone Number"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-gray-100 border-gray-300"
                }`}
                placeholder="Email Address"
                required
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-2">
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-gray-100"
                  : "bg-gray-100 border-gray-300"
              }`}
              placeholder="Address"
              required
            />
          </div>

          {/* Date of Birth and Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="dob" className="block text-sm font-medium mb-2">
                Date of Birth
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-gray-100 border-gray-300"
                }`}
                max="2025-05-07"
                required
              />
            </div>
            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium mb-2"
              >
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-gray-100 border-gray-300"
                }`}
                required
              >
                <option value="">Select Gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:bg-indigo-400"
            >
              {isLoading ? "Saving..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
