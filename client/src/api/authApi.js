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
    console.log("Response error:", {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });
    if (error.response?.status === 401 && error.config?.url !== "/auth/login") {
      console.log("Unauthorized - Logging out and redirecting to /...");
      localStorage.clear();
      window.location.href = "/";
    } else if (error.response?.status === 401) {
      console.log("401 error for /auth/login - Handling in component");
    }
    return Promise.reject(error);
  }
);

axiosFileInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("File response error:", {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });
    if (error.response?.status === 401 && error.config?.url !== "/auth/login") {
      console.log("Unauthorized - Logging out and redirecting to /...");
      localStorage.clear();
      window.location.href = "/";
    } else if (error.response?.status === 401) {
      console.log("401 error for /auth/login - Handling in component");
    }
    return Promise.reject(error);
  }
);

export const login = async (credentials) => {
  try {
    const response = await axiosInstance.post("/auth/login", credentials);
    return response.data;
  } catch (error) {
    console.log("Login error:", error.response?.data || error.message);
    throw error.response?.data || { error: "An error occurred during login" };
  }
};
