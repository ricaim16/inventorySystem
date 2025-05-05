import { axiosInstance } from "./axiosInstance";

export const createUser = async (userData) => {
  try {
    const response = await axiosInstance.post(`/users/`, userData);
    return response.data;
  } catch (error) {
    console.error("Create user failed:", error.response?.data || error.message);
    throw error.response?.data?.error || error.message;
  }
};

export const getAllUsers = async () => {
  try {
    const response = await axiosInstance.get(`/users/`);
    return response.data;
  } catch (error) {
    console.error(
      "Get all users failed:",
      error.response?.data || error.message
    );
    throw error.response?.data?.error || error.message;
  }
};

export const getUserById = async (id) => {
  try {
    const response = await axiosInstance.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error("Get user failed:", error.response?.data || error.message);
    throw error.response?.data?.error || error.message;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await axiosInstance.put(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    console.error("Update user failed:", error.response?.data || error.message);
    throw error.response?.data?.error || error.message;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await axiosInstance.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error("Delete user failed:", error.response?.data || error.message);
    throw error.response?.data?.error || error.message;
  }
};
