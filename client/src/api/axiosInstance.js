import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: { "Content-Type": "application/json" },
});

export const axiosFileInstance = axios.create({
  baseURL: "http://localhost:8080/api",
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log("Request:", config.method, config.url, "Token:", token);
  return config;
});

axiosFileInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(
    "File Request:",
    config.method,
    config.url,
    "Headers:",
    config.headers,
    "Data:",
    config.data instanceof FormData ? [...config.data.entries()] : config.data
  );
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config.url !== "/users/login") {
      console.log("Unauthorized - Logging out...");
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

axiosFileInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config.url !== "/users/login") {
      console.log("Unauthorized - Logging out...");
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
