// dosageApi.js
import { axiosInstance } from "./axiosInstance";

export const getAllDosageForms = async () => {
  try {
    console.log("Fetching all dosage forms...");
    const response = await axiosInstance.get("/dosage-forms");
    console.log("Get All Dosage Forms Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get All Dosage Forms Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const getDosageFormById = async (id) => {
  try {
    const response = await axiosInstance.get(`/dosage-forms/${id}`);
    return response.data;
  } catch (error) {
    console.error("Get Dosage Form By ID Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const addDosageForm = async (dosageData) => {
  try {
    const response = await axiosInstance.post("/dosage-forms", dosageData);
    return response.data;
  } catch (error) {
    console.error("Add Dosage Form Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const editDosageForm = async (id, dosageData) => {
  try {
    const response = await axiosInstance.put(`/dosage-forms/${id}`, dosageData);
    return response.data;
  } catch (error) {
    console.error("Edit Dosage Form Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const deleteDosageForm = async (id) => {
  try {
    const response = await axiosInstance.delete(`/dosage-forms/${id}`);
    return response.data;
  } catch (error) {
    console.error("Delete Dosage Form Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};
