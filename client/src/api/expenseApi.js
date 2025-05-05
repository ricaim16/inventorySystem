import { axiosInstance } from "./axiosInstance";

export const expenseApi = {
  addExpense: async (expenseData) => {
    try {
      const response = await axiosInstance.post("/expenses", expenseData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error adding expense:", error);
      throw error.response?.data || error;
    }
  },

  getAllExpenses: async () => {
    try {
      const response = await axiosInstance.get("/expenses");
      return response.data;
    } catch (error) {
      console.error("Error fetching expenses:", error);
      throw error.response?.data || error;
    }
  },

  getExpenseReport: async (filters = {}) => {
    try {
      const response = await axiosInstance.get("/expenses/report", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching expense report:", error);
      throw error.response?.data || error;
    }
  },

  updateExpense: async (id, expenseData) => {
    try {
      const response = await axiosInstance.put(`/expenses/${id}`, expenseData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error.response?.data || error;
    }
  },

  
  deleteExpense: async (id) => {
    try {
      const response = await axiosInstance.delete(`/expenses/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error.response?.data || error;
    }
  },
};

