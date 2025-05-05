import { axiosInstance, axiosFileInstance } from "./axiosInstance.js";

const API_URL = "/suppliers";

export const getAllSuppliers = async () => {
  console.log("Fetching all suppliers...");
  try {
    const response = await axiosInstance.get(API_URL);
    console.log("Get All Suppliers Response:", response.data);
    return response.data; // Array of suppliers
  } catch (error) {
    console.error("Get All Suppliers Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const getSupplierById = async (id) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/${id}`);
    return response.data; // Single supplier object
  } catch (error) {
    console.error("Get Supplier By ID Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const addSupplier = async (data) => {
  try {
    console.log("Adding supplier with data:", data);
    const response = await axiosInstance.post(API_URL, data);
    console.log("Add Supplier Response:", response.data);
    return response.data.supplier; // Return the created supplier
  } catch (error) {
    console.error("Add Supplier Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const editSupplier = async (id, data) => {
  try {
    const response = await axiosInstance.put(`${API_URL}/${id}`, data);
    console.log("Edit Supplier Response:", response.data);
    return response.data.supplier; // Return the updated supplier
  } catch (error) {
    console.error("Edit Supplier Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const deleteSupplier = async (id) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/${id}`);
    return response.data; // Success message
  } catch (error) {
    console.error("Delete Supplier Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const getSupplierCredits = async (supplierId) => {
  console.log("Fetching credits for supplierId:", supplierId);
  try {
    const response = await axiosInstance.get(
      `${API_URL}/${supplierId}/credits`
    );
    console.log("Get Credits Response:", response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log("No credits found for supplier:", supplierId);
      return { credits: [], creditCount: 0 };
    }
    console.error("Get Credits Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const addSupplierCredit = async (data) => {
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
    throw error;
  }
};

export const editSupplierCredit = async (id, data) => {
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
    throw error;
  }
};

export const deleteSupplierCredit = async (id) => {
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
    throw error;
  }
};

export const getAllMedicines = async () => {
  console.log("Fetching all medicines...");
  try {
    const response = await axiosInstance.get("/medicines");
    console.log("Get All Medicines Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get All Medicines Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const getCreditReport = async ({
  start_date,
  end_date,
  supplier_id,
  limit = 100,
  offset = 0,
}) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/credits/report`, {
      params: { start_date, end_date, supplier_id, limit, offset },
    });
    console.log("Get Credit Report Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get Credit Report Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};
