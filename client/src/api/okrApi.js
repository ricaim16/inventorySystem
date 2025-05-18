import axios from "axios";

const API_URL = "http://localhost:8080/api/okr";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn(
        "No JWT token found in localStorage for request:",
        config.url
      );
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    };
    console.error("API request failed:", errorDetails);
    return Promise.reject(error);
  }
);

export const addObjective = async (objective) => {
  try {
    console.log("Sending objective:", objective);
    const response = await axiosInstance.post("/objectives", objective);
    return response.data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      error: error.response?.data?.error,
      details: error.response?.data?.details,
      code: error.response?.data?.code,
      meta: error.response?.data?.meta,
    };
    console.error("Add objective error:", errorDetails);
    throw new Error(
      error.response?.data?.details ||
        error.response?.data?.error ||
        "Failed to add objective"
    );
  }
};

export const addKeyResult = async (keyResult) => {
  try {
    console.log("Sending key result:", keyResult);
    const response = await axiosInstance.post("/key-results", {
      ...keyResult,
      status: keyResult.status?.trim() || "No Status",
      comment: keyResult.comment?.trim() || null,
    });
    return response.data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      error: error.response?.data?.error,
      details: error.response?.data?.details,
      code: error.response?.data?.code,
      meta: error.response?.data?.meta,
    };
    console.error("Add key result error:", errorDetails);
    throw new Error(
      error.response?.data?.details ||
        error.response?.data?.error ||
        "Failed to create key result"
    );
  }
};

export const fetchObjectives = async () => {
  try {
    const response = await axiosInstance.get("/objectives");
    console.log("Fetched objectives:", response.data);
    return response.data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      error: error.response?.data?.error,
      details: error.response?.data?.details,
      code: error.response?.data?.code,
      meta: error.response?.data?.meta,
    };
    console.error("Fetch objectives error:", errorDetails);
    throw new Error(
      error.response?.data?.details ||
        error.response?.data?.error ||
        "Failed to fetch objectives"
    );
  }
};

export const editObjective = async (id, objective) => {
  try {
    const response = await axiosInstance.put(`/objectives/${id}`, objective);
    return response.data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      error: error.response?.data?.error,
      details: error.response?.data?.details,
      code: error.response?.data?.code,
      meta: error.response?.data?.meta,
    };
    console.error("Edit objective error:", errorDetails);
    throw new Error(
      error.response?.data?.details ||
        error.response?.data?.error ||
        "Failed to update objective"
    );
  }
};

export const editKeyResult = async (id, keyResult) => {
  try {
    const response = await axiosInstance.put(`/key-results/${id}/edit`, {
      ...keyResult,
      status: keyResult.status?.trim() || "No Status",
      comment: keyResult.comment?.trim() || null,
    });
    return response.data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      error: error.response?.data?.error,
      details: error.response?.data?.details,
      code: error.response?.data?.code,
      meta: error.response?.data?.meta,
    };
    console.error("Edit key result error:", errorDetails);
    throw new Error(
      error.response?.data?.details ||
        error.response?.data?.error ||
        "Failed to update key result"
    );
  }
};

export const updateKeyResultProgress = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/key-results/${id}`, {
      ...data,
      status: data.status?.trim() || undefined,
      comment: data.comment?.trim() || undefined,
    });
    return response.data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      error: error.response?.data?.error,
      details: error.response?.data?.details,
      code: error.response?.data?.code,
      meta: error.response?.data?.meta,
    };
    console.error("Update key result progress error:", errorDetails);
    throw new Error(
      error.response?.data?.details ||
        error.response?.data?.error ||
        "Failed to update key result progress"
    );
  }
};

export const deleteObjective = async (id) => {
  try {
    const response = await axiosInstance.delete(`/objectives/${id}`);
    return response.data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      error: error.response?.data?.error,
      details: error.response?.data?.details,
      code: error.response?.data?.code,
      meta: error.response?.data?.meta,
    };
    console.error("Delete objective error:", errorDetails);
    throw new Error(
      error.response?.data?.details ||
        error.response?.data?.error ||
        "Failed to delete objective"
    );
  }
};

export const deleteKeyResult = async (id) => {
  try {
    const response = await axiosInstance.delete(`/key-results/${id}`);
    return response.data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      error: error.response?.data?.error,
      details: error.response?.data?.details,
      code: error.response?.data?.code,
      meta: error.response?.data?.meta,
    };
    console.error("Delete key result error:", errorDetails);
    throw new Error(
      error.response?.data?.details ||
        error.response?.data?.error ||
        "Failed to delete key result"
    );
  }
};
