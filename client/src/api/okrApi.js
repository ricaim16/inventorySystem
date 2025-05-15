import { axiosInstance } from "./axiosInstance";

export const okrApi = {
  addObjective: async (objectiveData) => {
    try {
      const response = await axiosInstance.post(
        "/okr/objectives",
        objectiveData
      );
      console.log("Objective creation response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error adding objective:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error.response?.data || { error: error.message };
    }
  },

  getAllObjectives: async () => {
    try {
      const response = await axiosInstance.get("/okr/objectives");
      return response.data;
    } catch (error) {
      console.error("Error fetching objectives:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error.response?.data || { error: error.message };
    }
  },

  getObjectiveById: async (id) => {
    try {
      const response = await axiosInstance.get(`/okr/objectives/${id}`);
      console.log("Objective by ID response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching objective by ID:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error.response?.data || { error: error.message };
    }
  },

  updateObjective: async (id, objectiveData) => {
    try {
      const response = await axiosInstance.put(
        `/okr/objectives/${id}`,
        objectiveData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating objective:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error.response?.data || { error: error.message };
    }
  },

  deleteObjective: async (id) => {
    try {
      const response = await axiosInstance.delete(`/okr/objectives/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting objective:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error.response?.data || { error: error.message };
    }
  },

  addKeyResult: async (keyResultData) => {
    try {
      console.log("Sending key result payload:", keyResultData);
      const response = await axiosInstance.post(
        "/okr/key-results",
        keyResultData
      );
      console.log("Key result creation response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error adding key result:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        keyResultData,
      });
      throw error.response?.data || { error: error.message };
    }
  },

  updateKeyResult: async (id, keyResultData) => {
    try {
      const response = await axiosInstance.put(
        `/okr/key-results/${id}`,
        keyResultData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating key result:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error.response?.data || { error: error.message };
    }
  },

  deleteKeyResult: async (id) => {
    try {
      const response = await axiosInstance.delete(`/okr/key-results/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting key result:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error.response?.data || { error: error.message };
    }
  },
};
