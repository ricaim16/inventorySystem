import { axiosInstance } from "./axiosInstance";

export const getAllMembers = async () => {
  try {
    const response = await axiosInstance.get("/members");
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to fetch members");
  }
};

export const getMemberById = async (id) => {
  try {
    const response = await axiosInstance.get(`/members/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to fetch member");
  }
};

export const getSelfMember = async () => {
  try {
    const response = await axiosInstance.get("/members/self");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || "Failed to fetch member profile"
    );
  }
};

export const createMember = async (data) => {
  try {
    console.log("Received data in createMember:", data);

    if (!data || typeof data !== "object") {
      throw new Error("Invalid data: Data must be a non-empty object");
    }

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
    const missingFields = requiredFields.filter(
      (key) => !data[key] || data[key] === ""
    );
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== "") {
        formData.append(key, value);
      }
    }
    if (data.photoFile) formData.append("photo", data.photoFile);
    if (data.certificateFile)
      formData.append("certificate", data.certificateFile);

    const formDataEntries = {};
    for (const [key, value] of formData.entries()) {
      formDataEntries[key] = value instanceof File ? value.name : value;
    }
    console.log("FormData being sent:", formDataEntries);
    console.log("Axios request config:", {
      url: "/members",
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
    });

    const response = await axiosInstance.post("/members", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error in createMember:",
      JSON.stringify(
        {
          message: error.message,
          code: error.code,
          response: error.response
            ? {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers,
              }
            : null,
          request: error.request
            ? "Request made but no response received"
            : null,
        },
        null,
        2
      )
    );
    throw new Error(
      error.response?.data?.error ||
        error.message ||
        "Failed to create member due to an unknown error"
    );
  }
};

export const updateMember = async (id, data) => {
  try {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    }
    if (data.photoFile) formData.append("photo", data.photoFile);
    if (data.certificateFile)
      formData.append("certificate", data.certificateFile);

    const response = await axiosInstance.put(`/members/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to update member");
  }
};

export const updateSelfMember = async (data) => {
  try {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    }
    if (data.photoFile) formData.append("photo", data.photoFile);
    if (data.certificateFile)
      formData.append("certificate", data.certificateFile);

    const response = await axiosInstance.put("/members/self", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to update profile");
  }
};

export const deleteMember = async (id, leaveDate) => {
  try {
    const response = await axiosInstance.delete(`/members/${id}`, {
      data: { leaveDate },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to delete member");
  }
};
