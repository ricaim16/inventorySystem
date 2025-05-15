import { axiosInstance, axiosFileInstance } from "./axiosInstance";

const API_URL = "/medicines";

export const getAllMedicines = async () => {
  try {
    console.log("Fetching all medicines from:", `${API_URL}`);
    const response = await axiosInstance.get(API_URL);
    console.log("Medicines fetched:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching all medicines:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      `Failed to fetch medicines: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

export const getMedicineByBatchNumber = async (batchNumber) => {
  try {
    console.log(`Fetching medicine with batch number: ${batchNumber}`);
    const encodedBatchNumber = encodeURIComponent(batchNumber);
    const url = `${API_URL}/batch/${encodedBatchNumber}`;
    console.log(`Request URL: ${url}`);
    const response = await axiosInstance.get(url);
    console.log(`Response for batch number ${batchNumber}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching medicine by batch number ${batchNumber}:`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      `Failed to fetch medicine by batch number: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

export const getLowStockMedicines = async () => {
  try {
    const response = await axiosInstance.get(`${API_URL}/low-stock`);
    return response.data;
  } catch (error) {
    console.error("Error fetching low stock medicines:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw (
      error.response?.data?.error || {
        message: "Failed to fetch low stock medicines",
      }
    );
  }
};

export const deleteMedicine = async (id) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting medicine:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw (
      error.response?.data?.error || { message: "Failed to delete medicine" }
    );
  }
};

export const addMedicine = async (data) => {
  try {
    const response = await axiosFileInstance.post(API_URL, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding medicine:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack,
    });
    throw (
      error.response?.data?.error || {
        message: "Failed to add medicine",
        details: error.response?.data?.error?.details || error.message,
      }
    );
  }
};

export const editMedicine = async (id, data) => {
  try {
    const response = await axiosFileInstance.put(`${API_URL}/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating medicine:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw (
      error.response?.data?.error || {
        message: "Failed to update medicine",
        details: error.message || "Unknown error occurred",
      }
    );
  }
};

export const generateMedicineReport = async () => {
  try {
    const response = await axiosInstance.get(`${API_URL}/report`);
    return response.data;
  } catch (error) {
    console.error("Error generating medicine report:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw (
      error.response?.data?.error || {
        message: "Failed to generate medicine report",
      }
    );
  }
};

export const getExpiredMedicines = async () => {
  try {
    const response = await axiosInstance.get(`${API_URL}/expire`);
    return response.data;
  } catch (error) {
    console.error("Error fetching expired medicines:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw (
      error.response?.data?.error || {
        message: "Failed to fetch expired medicines",
      }
    );
  }
};

export const getExpirationAlerts = async () => {
  try {
    const response = await axiosInstance.get(`${API_URL}/expire/alerts`);
    return response.data;
  } catch (error) {
    console.error("Error fetching expiration alerts:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack,
    });
    throw (
      error.response?.data?.error || {
        message: "Failed to fetch expiration alerts",
        details: error.response?.data?.error?.details || error.message,
      }
    );
  }
};

export const generateExpirationReport = async () => {
  try {
    const response = await axiosInstance.get("/expire/report");
    return response.data;
  } catch (error) {
    console.error("Error generating expiration report:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw (
      error.response?.data?.error || {
        message: "Failed to generate expiration report",
      }
    );
  }
};
