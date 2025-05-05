import { axiosInstance, axiosFileInstance } from "./axiosInstance";

const API_URL = "/customers"; // Remove /api prefix to avoid duplication

// Fetch all customers
export const getAllCustomers = async () => {
  try {
    const response = await axiosInstance.get(API_URL);
    console.log("Get All Customers Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get All Customers Error:", error);
    console.error("Error Details:", {
      message: error.message || "No message",
      status: error.response?.status || "No status",
      data: error.response?.data || "No data",
      stack: error.stack || "No stack",
    });
    throw new Error(
      error.response?.data?.message || "Failed to fetch customers"
    );
  }
};

// Fetch a customer by ID
export const getCustomerById = async (id) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/${id}`);
    console.log("Get Customer By ID Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Customer By ID Error:", error);
    console.error("Error Details:", {
      message: error.message || "No message",
      status: error.response?.status || "No status",
      data: error.response?.data || "No data",
      stack: error.stack || "No stack",
    });
    throw new Error(
      error.response?.data?.message || "Failed to fetch customer"
    );
  }
};

// Add a new customer
export const addCustomer = async (data) => {
  try {
    const response = await axiosInstance.post(API_URL, data);
    console.log("Add Customer Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Add Customer Error:", error);
    console.error("Error Details:", {
      message: error.message || "No message",
      status: error.response?.status || "No status",
      data: error.response?.data || "No data",
      stack: error.stack || "No stack",
    });
    throw new Error(error.response?.data?.message || "Failed to add customer");
  }
};

// Edit an existing customer
export const editCustomer = async (id, data) => {
  try {
    const response = await axiosInstance.put(`${API_URL}/${id}`, data);
    console.log("Edit Customer Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Edit Customer Error:", error);
    console.error("Error Details:", {
      message: error.message || "No message",
      status: error.response?.status || "No status",
      data: error.response?.data || "No data",
      stack: error.stack || "No stack",
    });
    throw new Error(
      error.response?.data?.message || "Failed to update customer"
    );
  }
};

// Delete a customer
export const deleteCustomer = async (id) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/${id}`);
    console.log("Delete Customer Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Delete Customer Error:", error);
    console.error("Error Details:", {
      message: error.message || "No message",
      status: error.response?.status || "No status",
      data: error.response?.data || "No data",
      stack: error.stack || "No stack",
    });
    throw new Error(
      error.response?.data?.message || "Failed to delete customer"
    );
  }
};

// Fetch customer credits
export const getCustomerCredits = async (customerId) => {
  console.log("Fetching credits for customerId:", customerId);
  try {
    const response = await axiosInstance.get(
      `${API_URL}/${customerId}/credits`
    );
    console.log("Get Credits Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Credits Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    if (error.response?.status === 404) {
      console.log("No credits found for customer:", customerId);
      return { credits: [], creditCount: 0 }; // Return empty result for UI
    }
    throw new Error(error.response?.data?.message || "Failed to fetch credits");
  }
};


// Add a customer credit
export const addCustomerCredit = async (data) => {
  try {
    const response = await axiosFileInstance.post(`${API_URL}/credits`, data);
    console.log("Add Credit Response:", response.data);
    return response.data.credit;
  } catch (error) {
    console.error("Add Credit Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(error.response?.data?.message || "Failed to add credit");
  }
};

// Edit a customer credit
export const editCustomerCredit = async (id, data) => {
  try {
    const response = await axiosFileInstance.put(
      `${API_URL}/credits/${id}`,
      data
    );
    console.log("Edit Credit Response:", response.data);
    return response.data.credit;
  } catch (error) {
    console.error("Edit Credit Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(error.response?.data?.message || "Failed to update credit");
  }
};

// Delete a customer credit
export const deleteCustomerCredit = async (id) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/credits/${id}`);
    console.log("Delete Credit Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Delete Credit Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(error.response?.data?.message || "Failed to delete credit");
  }
};

// Fetch all medicines
export const getAllMedicines = async () => {
  console.log("Fetching all medicines...");
  try {
    const response = await axiosInstance.get("/medicines"); // Adjust if needed
    console.log("Get All Medicines Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get All Medicines Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(
      error.response?.data?.message || "Failed to fetch medicines"
    );
  }
};

// Fetch credit report with optional filters
export const getCreditReport = async ({
  start_date,
  end_date,
  customer_id,
  limit = 100,
  offset = 0,
}) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/credits/report`, {
      params: { start_date, end_date, customer_id, limit, offset },
    });
    console.log("Get Credit Report Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Credit Report Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(
      error.response?.data?.message || "Failed to fetch credit report"
    );
  }
};
