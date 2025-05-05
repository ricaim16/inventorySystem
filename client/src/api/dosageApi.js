import { axiosInstance } from "./axiosInstance";

export const getAllDosageForms = async () => {
  const response = await axiosInstance.get("/dosage-forms");
  return response.data;
};

export const getDosageFormById = async (id) => {
  const response = await axiosInstance.get(`/dosage-forms/${id}`);
  return response.data;
};

export const addDosageForm = async (dosageData) => {
  const response = await axiosInstance.post("/dosage-forms", dosageData);
  return response.data;
};

export const editDosageForm = async (id, dosageData) => {
  const response = await axiosInstance.put(`/dosage-forms/${id}`, dosageData);
  return response.data;
};

export const deleteDosageForm = async (id) => {
  const response = await axiosInstance.delete(`/dosage-forms/${id}`);
  return response.data;
};
