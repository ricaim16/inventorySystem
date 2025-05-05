import { axiosInstance } from "./axiosInstance";

const returnsApi = {
  getAllReturns: async () => {
    try {
      const response = await axiosInstance.get("/returns");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Error fetching returns"
      );
    }
  },

  getReturnById: async (id) => {
    try {
      const response = await axiosInstance.get(`/returns/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error fetching return");
    }
  },

  addReturn: async (returnData) => {
    try {
      const response = await axiosInstance.post("/returns", returnData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error adding return");
    }
  },

  updateReturn: async (id, returnData) => {
    try {
      const response = await axiosInstance.put(`/returns/${id}`, returnData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error updating return");
    }
  },

  deleteReturn: async (id) => {
    try {
      const response = await axiosInstance.delete(`/returns/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error deleting return");
    }
  },
};

export default returnsApi;
