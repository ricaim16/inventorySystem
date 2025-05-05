import { axiosInstance } from "./axiosInstance";

export const getAllSales = async () => {
  const response = await axiosInstance.get("/sales");
  return response.data;
};

export const getSaleById = async (id) => {
  const response = await axiosInstance.get(`/sales/${id}`);
  return response.data;
};

export const addSale = async (saleData) => {
  const response = await axiosInstance.post("/sales", saleData);
  return response.data.sale;
};

export const editSale = async (id, saleData) => {
  const response = await axiosInstance.put(`/sales/${id}`, saleData);
  return response.data.sale;
};

export const deleteSale = async (id) => {
  await axiosInstance.delete(`/sales/${id}`);
};

export const generateSalesReport = async (filters) => {
  const response = await axiosInstance.get("/sales/report", {
    params: filters,
  });
  return response.data;
};
