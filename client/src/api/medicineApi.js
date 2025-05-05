import { axiosInstance, axiosFileInstance } from "./axiosInstance";

const API_URL = "/medicines";

export const getAllMedicines = async () => {
  try {
    const response = await axiosInstance.get(API_URL);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getLowStockMedicines = async () => {
  try {
    const response = await axiosInstance.get(`${API_URL}/low-stock`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteMedicine = async (id) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
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
    throw error;
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
    throw error;
  }
};

export const generateMedicineReport = async () => {
  try {
    const response = await axiosInstance.get(`${API_URL}/report`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getExpiredMedicines = async () => {
  try {
    const response = await axiosInstance.get("/expire");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getExpirationAlerts = async () => {
  try {
    const response = await axiosInstance.get("/expire/alerts");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const generateExpirationReport = async () => {
  try {
    const response = await axiosInstance.get("/expire/report");
    return response.data;
  } catch (error) {
    throw error;
  }
};
