import { axiosInstance } from "./axiosInstance";

export const createUser = async (userData) => {
  try {
    const response = await axiosInstance.post(`/users/`, userData);
    return response.data;
  } catch (error) {
    console.error(
      "Create user failed:",
      JSON.stringify(error.response?.data, null, 2) || error.message
    );
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
      JSON.stringify(error.response?.data, null, 2) || error.message
    );
    throw error.response?.data?.error || error.message;
  }
};

export const getUserById = async (id) => {
  try {
    console.log("Fetching user with id:", id);
    const response = await axiosInstance.get(`/users/${id}`);
    console.log("getUserById response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Get user failed:",
      JSON.stringify(error.response?.data, null, 2) || error.message
    );
    throw error.response?.data?.error || error.message;
  }
};

export const updateUser = async (id, userData) => {
  try {
    console.log("Updating user with id:", id, "data:", userData);
    const response = await axiosInstance.put(`/users/${id}`, userData);
    console.log("updateUser response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Update user failed:",
      JSON.stringify(error.response?.data, null, 2) || error.message
    );
    throw error.response?.data?.error || error.message;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await axiosInstance.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      "Delete user failed:",
      JSON.stringify(error.response?.data, null, 2) || error.message
    );
    throw error.response?.data?.error || error.message;
  }
};

export const checkEmail = async (email) => {
  try {
    const fullUrl = `${
      axiosInstance.defaults.baseURL
    }/users/check-email?email=${encodeURIComponent(email)}`;
    console.log("Checking email:", email, "URL:", fullUrl);
    const response = await axiosInstance.get(`/users/check-email`, {
      params: { email },
    });
    console.log("checkEmail response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Check email failed:",
      JSON.stringify(error.response?.data, null, 2) || error.message,
      "Status:",
      error.response?.status,
      "URL:",
      error.config?.url
    );
    throw error.response?.data?.error || error.message;
  }
};
