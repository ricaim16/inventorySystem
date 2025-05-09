import { axiosInstance } from "./axiosInstance";

export const okrApi = {
  // Add a new objective (for OkrAdd)
  addObjective: async (objectiveData) => {
    try {
      const response = await axiosInstance.post(
        "/okr/objectives",
        objectiveData
      );
      return response.data;
    } catch (error) {
      console.error("Error adding objective:", error);
      throw error.response?.data || error;
    }
  },

  // Fetch all objectives with key results (for OkrGenerateReport)
  getAllObjectives: async () => {
    try {
      const response = await axiosInstance.get("/okr/objectives");
      return response.data;
    } catch (error) {
      console.error("Error fetching objectives:", error);
      throw error.response?.data || error;
    }
  },

  // Update an objective (for OkrTrackProgress)
  updateObjective: async (id, objectiveData) => {
    try {
      const response = await axiosInstance.put(
        `/okr/objectives/${id}`,
        objectiveData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating objective:", error);
      throw error.response?.data || error;
    }
  },

  // Delete an objective
  deleteObjective: async (id) => {
    try {
      const response = await axiosInstance.delete(`/okr/objectives/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting objective:", error);
      throw error.response?.data || error;
    }
  },

  // Add a new key result (for OkrAdd)
  addKeyResult: async (keyResultData) => {
    try {
      const response = await axiosInstance.post(
        "/okr/keyresults",
        keyResultData
      );
      return response.data;
    } catch (error) {
      console.error("Error adding key result:", error);
      throw error.response?.data || error;
    }
  },

  // Update a key result (for OkrTrackProgress)
  updateKeyResult: async (id, keyResultData) => {
    try {
      const response = await axiosInstance.put(
        `/okr/keyresults/${id}`,
        keyResultData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating key result:", error);
      throw error.response?.data || error;
    }
  },

  // Delete a key result
  deleteKeyResult: async (id) => {
    try {
      const response = await axiosInstance.delete(`/okr/keyresults/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting key result:", error);
      throw error.response?.data || error;
    }
  },
};
