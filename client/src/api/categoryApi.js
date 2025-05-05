import { axiosInstance } from "./axiosInstance";

export const getAllCategories = async () => {
  const response = await axiosInstance.get("/categories");
  return response.data;
};

export const getCategoryById = async (id) => {
  const response = await axiosInstance.get(`/categories/${id}`);
  return response.data;
};

export const addCategory = async (categoryData) => {
  const response = await axiosInstance.post("/categories", categoryData);
  return response.data;
};

export const editCategory = async (id, categoryData) => {
  const response = await axiosInstance.put(`/categories/${id}`, categoryData);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await axiosInstance.delete(`/categories/${id}`);
  return response.data;
};
