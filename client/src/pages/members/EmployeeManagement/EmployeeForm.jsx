import { useEffect, useState, useRef } from "react";
import { createMember, updateMember } from "../../../api/memberApi";
import { useTheme } from "../../../context/ThemeContext";
import { getAllUsers } from "../../../api/userApi";

const EmployeeForm = ({
  onMemberCreated,
  initialData,
  onCancel,
  isViewMode,
  resetForm,
  showToast,
}) => {
  const { theme } = useTheme();
  const initialFormState = {
    user_id: "",
    FirstName: "",
    LastName: "",
    phone: "",
    role: "",
    position: "",
    address: "",
    gender: "",
    dob: "",
    salary: "",
    joining_date: "",
    status: "ACTIVE",
    biography: "",
  };
  const [formData, setFormData] = useState(initialFormState);
  const [photoFile, setPhotoFile] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [certificateUrl, setCertificateUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [users, setUsers] = useState([]);

  const userIdRef = useRef(null);
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const phoneRef = useRef(null);
  const roleRef = useRef(null);
  const positionRef = useRef(null);
  const addressRef = useRef(null);
  const genderRef = useRef(null);
  const dobRef = useRef(null);
  const salaryRef = useRef(null);
  const joiningDateRef = useRef(null);
  const statusRef = useRef(null);
  const biographyRef = useRef(null);
  const photoRef = useRef(null);
  const certificateRef = useRef(null);

  const BASE_URL = "http://localhost:8080";

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        console.log("Fetched users:", data.users);
        setUsers(data.users || []);
      } catch (err) {
        setErrors({ general: "Failed to fetch users" });
      }
    };
    if (!isViewMode) {
      fetchUsers();
    }

    if (resetForm) {
      setFormData(initialFormState);
      setPhotoFile(null);
      setCertificateFile(null);
      setPhotoUrl(null);
      setCertificateUrl(null);
      setErrors({});
      if (userIdRef.current) userIdRef.current.value = "";
    } else if (initialData) {
      setFormData({
        user_id: initialData.user_id || "",
        FirstName: initialData.FirstName || "",
        LastName: initialData.LastName || "",
        phone: initialData.phone || "",
        role: initialData.role || "",
        position: initialData.position || "",
        address: initialData.address || "",
        gender: initialData.gender || "",
        dob: initialData.dob
          ? new Date(initialData.dob).toISOString().split("T")[0]
          : "",
        salary: initialData.salary || "",
        joining_date: initialData.joining_date
          ? new Date(initialData.joining_date).toISOString().split("T")[0]
          : "",
        status: initialData.status || "ACTIVE",
        biography: initialData.biography || "",
      });
      setPhotoUrl(
        initialData.Photo ? `${BASE_URL}/${initialData.Photo}` : null
      );
      setCertificateUrl(
        initialData.certificate
          ? `${BASE_URL}/${initialData.certificate}`
          : null
      );
    }
  }, [initialData, isViewMode, resetForm]);

  useEffect(() => {
    const requiredFields = [
      "user_id",
      "FirstName",
      "LastName",
      "role",
      "position",
      "salary",
      "joining_date",
      "status",
    ];
    const filledFields = requiredFields.filter(
      (field) => formData[field] && formData[field] !== ""
    );
    const progressPercentage =
      (filledFields.length / requiredFields.length) * 100;
    setProgress(progressPercentage);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "user_id") {
      const selectedUser = users.find((user) => user.id === value);
      if (selectedUser) {
        setFormData((prev) => ({
          ...prev,
          user_id: value,
          FirstName: selectedUser.FirstName || prev.FirstName,
          LastName: selectedUser.LastName || prev.LastName,
          role: selectedUser.role || prev.role,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          user_id: value,
        }));
      }
    } else if (name === "photo" || name === "certificate") {
      handleFileChange(
        e,
        name === "photo" ? setPhotoFile : setCertificateFile,
        name === "photo" ? setPhotoUrl : setCertificateUrl
      );
    } else {
      let newValue = value;
      if (["salary"].includes(name)) {
        newValue = value === "" ? "" : parseFloat(value) || "";
      }
      setFormData((prev) => ({ ...prev, [name]: newValue }));
    }
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (e, setFile, setFileUrl) => {
    const file = e.target.files[0];
    if (file) {
      if (
        e.target.name === "photo" &&
        !["image/jpeg", "image/png"].includes(file.type)
      ) {
        setErrors((prev) => ({
          ...prev,
          photo: "Photo must be a JPEG or PNG file",
        }));
        return;
      }
      if (
        e.target.name === "certificate" &&
        !["image/jpeg", "image/png", "application/pdf"].includes(file.type)
      ) {
        setErrors((prev) => ({
          ...prev,
          certificate: "Certificate must be a JPEG, PNG, or PDF file",
        }));
        return;
      }
      setFile(file);
      setFileUrl(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, [e.target.name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.user_id || formData.user_id === "") {
      newErrors.user_id = "User is required";
    }
    if (!formData.FirstName || formData.FirstName === "") {
      newErrors.FirstName = "First Name is required";
    }
    if (!formData.LastName || formData.LastName === "") {
      newErrors.LastName = "Last Name is required";
    }
    if (!formData.role || formData.role === "") {
      newErrors.role = "Role is required";
    }
    if (!formData.position || formData.position === "") {
      newErrors.position = "Position is required";
    }
    if (
      formData.salary === "" ||
      formData.salary === null ||
      isNaN(formData.salary)
    ) {
      newErrors.salary = "Salary is required and must be a valid number";
    }
    if (!formData.joining_date || formData.joining_date === "") {
      newErrors.joining_date = "Joining Date is required";
    }
    if (!formData.status || formData.status === "") {
      newErrors.status = "Status is required";
    }

    if (formData.biography) {
      const wordCount = formData.biography.trim().split(/\s+/).length;
      if (wordCount > 100) {
        newErrors.biography = "Biography cannot exceed 100 words";
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    console.log("FormData state before submission:", formData);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const submissionData = {
        ...formData,
        photoFile,
        certificateFile,
      };

      console.log("Submitting data:", submissionData);

      let response;
      if (initialData && !isViewMode) {
        response = await updateMember(initialData.id, submissionData);
        showToast("Employee updated successfully!");
      } else {
        response = await createMember(submissionData);
        showToast("Employee added successfully!");
      }

      setFormData(initialFormState);
      setPhotoFile(null);
      setCertificateFile(null);
      setPhotoUrl(null);
      setCertificateUrl(null);
      if (userIdRef.current) userIdRef.current.value = "";
      onMemberCreated(response.member);
      setErrors({});
      onCancel();
    } catch (err) {
      console.error("Submission error:", err);
      setErrors({
        general: err.message.includes("Missing required fields")
          ? err.message
          : err.message || "Failed to save employee",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setPhotoFile(null);
    setCertificateFile(null);
    setPhotoUrl(null);
    setCertificateUrl(null);
    setErrors({});
    setProgress(0);
    onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`p-4 rounded-lg shadow-lg w-full mx-auto ${
        theme === "dark"
          ? "bg-gray-800 text-gray-200"
          : "bg-white text-gray-800"
      }`}
    >
      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor:
              progress <= 33
                ? "#5DB5B5"
                : progress <= 66
                ? "#1a2a44"
                : "#10B981",
          }}
        ></div>
      </div>

      {/* Section 1: Personal Details */}
      <div className="mb-6">
        <h2
          className={`text-lg font-bold mb-4 ${
            theme === "dark" ? "text-teal-400" : "text-teal-600"
          }`}
          style={{ color: "#10B981" }}
        >
          1. Personal Details
        </h2>
        {errors.general && (
          <div
            className={`mb-4 p-3 rounded ${
              theme === "dark"
                ? "bg-red-900/50 text-red-200"
                : "bg-red-100 text-red-700"
            }`}
          >
            {errors.general}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-1`}
            >
              User <span className="text-red-500">*</span>
            </label>
            {isViewMode ? (
              <p
                className={`w-full p-2 text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-800"
                }`}
              >
                {initialData?.user?.FirstName} {initialData?.user?.LastName} (
                {initialData?.user?.username})
              </p>
            ) : (
              <select
                name="user_id"
                value={formData.user_id}
                onChange={handleChange}
                ref={userIdRef}
                disabled={initialData || isViewMode || isSubmitting}
                className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                } ${errors.user_id ? "border-cyan-500" : ""}`}
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.FirstName} {user.LastName} ({user.username})
                  </option>
                ))}
              </select>
            )}
            {errors.user_id && (
              <p className="text-cyan-500 text-sm mt-1">{errors.user_id}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-1`}
            >
              First Name <span className="text-red-500">*</span>
            </label>
            {isViewMode ? (
              <p
                className={`w-full p-2 text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-800"
                }`}
              >
                {formData.FirstName}
              </p>
            ) : (
              <input
                type="text"
                name="FirstName"
                value={formData.FirstName}
                onChange={handleChange}
                ref={firstNameRef}
                placeholder="Enter First Name"
                disabled={isViewMode || isSubmitting}
                className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                } ${errors.FirstName ? "border-cyan-500" : ""}`}
              />
            )}
            {errors.FirstName && (
              <p className="text-cyan-500 text-sm mt-1">{errors.FirstName}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-1`}
            >
              Last Name <span className="text-red-500">*</span>
            </label>
            {isViewMode ? (
              <p
                className={`w-full p-2 text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-800"
                }`}
              >
                {formData.LastName}
              </p>
            ) : (
              <input
                type="text"
                name="LastName"
                value={formData.LastName}
                onChange={handleChange}
                ref={lastNameRef}
                placeholder="Enter Last Name"
                disabled={isViewMode || isSubmitting}
                className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                } ${errors.LastName ? "border-cyan-500" : ""}`}
              />
            )}
            {errors.LastName && (
              <p className="text-cyan-500 text-sm mt-1">{errors.LastName}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-1`}
            >
              Phone
            </label>
            {isViewMode ? (
              <p
                className={`w-full p-2 text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-800"
                }`}
              >
                {formData.phone || "N/A"}
              </p>
            ) : (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                ref={phoneRef}
                placeholder="Enter Phone Number"
                disabled={isViewMode || isSubmitting}
                className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                } ${errors.phone ? "border-cyan-500" : ""}`}
              />
            )}
            {errors.phone && (
              <p className="text-cyan-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-1`}
            >
              Gender
            </label>
            {isViewMode ? (
              <p
                className={`w-full p-2 text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-800"
                }`}
              >
                {formData.gender || "N/A"}
              </p>
            ) : (
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                ref={genderRef}
                disabled={isViewMode || isSubmitting}
                className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                } ${errors.gender ? "border-cyan-500" : ""}`}
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            )}
            {errors.gender && (
              <p className="text-cyan-500 text-sm mt-1">{errors.gender}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-1`}
            >
              Date of Birth
            </label>
            {isViewMode ? (
              <p
                className={`w-full p-2 text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-800"
                }`}
              >
                {formData.dob || "N/A"}
              </p>
            ) : (
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                ref={dobRef}
                disabled={isViewMode || isSubmitting}
                className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                } ${errors.dob ? "border-cyan-500" : ""}`}
              />
            )}
            {errors.dob && (
              <p className="text-cyan-500 text-sm mt-1">{errors.dob}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Employment Details */}
      <div className="mb-6">
        <h2
          className={`text-lg font-bold mb-4 ${
            theme === "dark" ? "text-teal-400" : "text-teal-600"
          }`}
          style={{ color: "#10B981" }}
        >
          2. Employment Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-1`}
            >
              Role <span className="text-red-500">*</span>
            </label>
            {isViewMode ? (
              <p
                className={`w-full p-2 text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-800"
                }`}
              >
                {formData.role || "N/A"}
              </p>
            ) : (
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                ref={roleRef}
                placeholder="Enter Role"
                disabled={isViewMode || isSubmitting}
                className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                } ${errors.role ? "border-cyan-500" : ""}`}
              />
            )}
            {errors.role && (
              <p className="text-cyan-500 text-sm mt-1">{errors.role}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-1`}
            >
              Position <span className="text-red-500">*</span>
            </label>
            {isViewMode ? (
              <p
                className={`w-full p-2 text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-800"
                }`}
              >
                {formData.position}
              </p>
            ) : (
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                ref={positionRef}
                placeholder="Enter Position"
                disabled={isViewMode || isSubmitting}
                className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                } ${errors.position ? "border-cyan-500" : ""}`}
              />
            )}
            {errors.position && (
              <p className="text-cyan-500 text-sm mt-1">{errors.position}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-1`}
            >
              Salary (Birr) <span className="text-red-500">*</span>
            </label>
            {isViewMode ? (
              <p
                className={`w-full p-2 text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-800"
                }`}
              >
                {formData.salary}
              </p>
            ) : (
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                ref={salaryRef}
                placeholder="Enter Salary"
                disabled={isViewMode || isSubmitting}
                className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                } ${errors.salary ? "border-cyan-500" : ""}`}
                step="0.01"
              />
            )}
            {errors.salary && (
              <p className="text-cyan-500 text-sm mt-1">{errors.salary}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-1`}
            >
              Joining Date <span className="text-red-500">*</span>
            </label>
            {isViewMode ? (
              <p
                className={`w-full p-2 text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-800"
                }`}
              >
                {formData.joining_date}
              </p>
            ) : (
              <input
                type="date"
                name="joining_date"
                value={formData.joining_date}
                onChange={handleChange}
                ref={joiningDateRef}
                disabled={isViewMode || isSubmitting}
                className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                } ${errors.joining_date ? "border-cyan-500" : ""}`}
              />
            )}
            {errors.joining_date && (
              <p className="text-cyan-500 text-sm mt-1">
                {errors.joining_date}
              </p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-1`}
            >
              Status <span className="text-red-500">*</span>
            </label>
            {isViewMode ? (
              <p
                className={`w-full p-2 text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-800"
                }`}
              >
                {formData.status}
              </p>
            ) : (
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="status"
                    value="ACTIVE"
                    checked={formData.status === "ACTIVE"}
                    onChange={handleChange}
                    ref={statusRef}
                    disabled={isViewMode || isSubmitting}
                    className={`w-4 h-4 text-teal-500 focus:ring-teal-500 ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600"
                        : "bg-white border-gray-300"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
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
                    disabled={isViewMode || isSubmitting}
                    className={`w-4 h-4 text-teal-500 focus:ring-teal-500 ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600"
                        : "bg-white border-gray-300"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Inactive
                  </span>
                </label>
              </div>
            )}
            {errors.status && (
              <p className="text-cyan-500 text-sm mt-1">{errors.status}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Additional Details */}
      <div className="mb-6">
        <h2
          className={`text-lg font-bold mb-4 ${
            theme === "dark" ? "text-teal-400" : "text-teal-600"
          }`}
          style={{ color: "#10B981" }}
        >
          3. Additional Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-1`}
            >
              Address
            </label>
            {isViewMode ? (
              <p
                className={`w-full p-2 text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-800"
                }`}
              >
                {formData.address || "N/A"}
              </p>
            ) : (
              <input
                type="text"
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                ref={addressRef}
                disabled={isViewMode || isSubmitting}
                className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                } ${errors.address ? "border-cyan-500" : ""}`}
              />
            )}
            {errors.address && (
              <p className="text-cyan-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-1`}
            >
              Biography
            </label>
            {isViewMode ? (
              <p
                className={`w-full p-2 text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-800"
                }`}
              >
                {formData.biography || "N/A"}
              </p>
            ) : (
              <textarea
                name="biography"
                value={formData.biography}
                onChange={handleChange}
                ref={biographyRef}
                placeholder="Enter Biography"
                disabled={isViewMode || isSubmitting}
                className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                } ${errors.biography ? "border-cyan-500" : ""}`}
                rows={4}
              />
            )}
            {errors.biography && (
              <p className="text-cyan-500 text-sm mt-1">{errors.biography}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Upload Documents */}
      <div className="mb-6">
        <h2
          className={`text-lg font-bold mb-4 ${
            theme === "dark" ? "text-teal-400" : "text-teal-600"
          }`}
          style={{ color: "#10B981" }}
        >
          4. Upload Documents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-1`}
            >
              Photo (JPEG/PNG)
            </label>
            {(isViewMode || initialData) && photoUrl ? (
              <div className="flex flex-col space-y-2">
                {!isViewMode && (
                  <input
                    type="file"
                    name="photo"
                    accept="image/jpeg,image/png"
                    onChange={handleChange}
                    ref={photoRef}
                    disabled={isSubmitting}
                    className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                      theme === "dark"
                        ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                        : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    } ${errors.photo ? "border-cyan-500" : ""}`}
                  />
                )}
                <a
                  href={photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm underline ${
                    theme === "dark"
                      ? "text-blue-400 hover:text-blue-300"
                      : "text-blue-600 hover:text-blue-800"
                  }`}
                >
                  View Photo
                </a>
              </div>
            ) : (isViewMode || initialData) && !photoUrl ? (
              <div className="flex flex-col space-y-2">
                {!isViewMode && (
                  <input
                    type="file"
                    name="photo"
                    accept="image/jpeg,image/png"
                    onChange={handleChange}
                    ref={photoRef}
                    disabled={isSubmitting}
                    className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                      theme === "dark"
                        ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                        : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    } ${errors.photo ? "border-cyan-500" : ""}`}
                  />
                )}
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No photo uploaded
                </p>
              </div>
            ) : (
              <input
                type="file"
                name="photo"
                accept="image/jpeg,image/png"
                onChange={handleChange}
                ref={photoRef}
                disabled={isSubmitting}
                className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                } ${errors.photo ? "border-cyan-500" : ""}`}
              />
            )}
            {errors.photo && (
              <p className="text-cyan-500 text-sm mt-1">{errors.photo}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-1`}
            >
              Certificate (JPEG/PNG/PDF)
            </label>
            {(isViewMode || initialData) && certificateUrl ? (
              <div className="flex flex-col space-y-2">
                {!isViewMode && (
                  <input
                    type="file"
                    name="certificate"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleChange}
                    ref={certificateRef}
                    disabled={isSubmitting}
                    className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                      theme === "dark"
                        ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                        : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    } ${errors.certificate ? "border-cyan-500" : ""}`}
                  />
                )}
                <a
                  href={certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm underline ${
                    theme === "dark"
                      ? "text-blue-400 hover:text-blue-300"
                      : "text-blue-600 hover:text-blue-800"
                  }`}
                >
                  View Certificate
                </a>
              </div>
            ) : (isViewMode || initialData) && !certificateUrl ? (
              <div className="flex flex-col space-y-2">
                {!isViewMode && (
                  <input
                    type="file"
                    name="certificate"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleChange}
                    ref={certificateRef}
                    disabled={isSubmitting}
                    className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                      theme === "dark"
                        ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                        : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    } ${errors.certificate ? "border-cyan-500" : ""}`}
                  />
                )}
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No certificate uploaded
                </p>
              </div>
            ) : (
              <input
                type="file"
                name="certificate"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleChange}
                ref={certificateRef}
                disabled={isSubmitting}
                className={`w-full p-2 rounded-md border transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-gray-700 text-gray-300 border-gray-600 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                    : "bg-white text-gray-700 border-gray-300 focus:border-teal-500 focus:ring focus:ring-teal-500/50"
                } ${errors.certificate ? "border-cyan-500" : ""}`}
              />
            )}
            {errors.certificate && (
              <p className="text-cyan-500 text-sm mt-1">{errors.certificate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      {!isViewMode && (
        <div className="flex space-x-4">
          <button
            type="submit"
            className={`bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 transition-colors duration-200 font-medium ${
              isSubmitting || progress < 100
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            disabled={isSubmitting || progress < 100}
          >
            {isSubmitting
              ? "Saving..."
              : initialData
              ? "Update Employee"
              : "Add Employee"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className={`bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-200 font-medium ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  );
};

export default EmployeeForm;
