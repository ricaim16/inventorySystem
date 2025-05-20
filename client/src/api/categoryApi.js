// categoryApi.js
import { axiosInstance } from "./axiosInstance";

export const getAllCategories = async () => {
  try {
    console.log("Fetching all categories...");
    const response = await axiosInstance.get("/categories");
    console.log("Get All Categories Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get All Categories Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const getCategoryById = async (id) => {
  try {
    const response = await axiosInstance.get(`/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error("Get Category By ID Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const addCategory = async (categoryData) => {
  try {
    const response = await axiosInstance.post("/categories", categoryData);
    return response.data;
  } catch (error) {
    console.error("Add Category Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const editCategory = async (id, categoryData) => {
  try {
    const response = await axiosInstance.put(`/categories/${id}`, categoryData);
    return response.data;
  } catch (error) {
    console.error("Edit Category Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await axiosInstance.delete(`/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error("Delete Category Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};
