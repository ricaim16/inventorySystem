// src/api/userApi.js
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
    console.log("Fetching user with id:", id); // Debug log
    const response = await axiosInstance.get(`/users/${id}`);
    console.log("getUserById response:", response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error("Get user failed:", error.response?.data || error.message);
    throw error.response?.data?.error || error.message;
  }
};

export const updateUser = async (id, userData) => {
  try {
    console.log("Updating user with id:", id, "data:", userData); // Debug log
    const response = await axiosInstance.put(`/users/${id}`, userData);
    console.log("updateUser response:", response.data); // Debug log
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
