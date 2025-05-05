// utils/auth.js
import { login } from "../api/authApi"; // Import the login function

export const getToken = () => localStorage.getItem("token");
export const getUserRole = () => localStorage.getItem("userRole");
export const getUserId = () => localStorage.getItem("userId");
export const getUsername = () => localStorage.getItem("username");

export const loginUser = async (username, password, role) => {
  try {
    // Use the login function from authApi.js
    const responseData = await login({ username, password, role });
    const { token, user } = responseData; // Destructure as before
    localStorage.setItem("token", token);
    localStorage.setItem("userRole", user.role);
    localStorage.setItem("userId", user.id);
    localStorage.setItem("username", user.username);
    return { token, user };
  } catch (error) {
    console.error("Login failed:", error.error || error.message || error);
    throw error.error || "Invalid credentials"; // Match authApi.js error structure
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userId");
  localStorage.removeItem("username");
};
