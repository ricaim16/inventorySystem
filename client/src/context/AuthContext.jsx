import { createContext, useContext, useState, useEffect } from "react";
import { getToken, getUserRole, getUserId, getUsername } from "../utils/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = getToken();
    if (!token) return null;
    return {
      id: getUserId(),
      username: getUsername(),
      role: getUserRole() || "EMPLOYEE",
    };
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);

  useEffect(() => {
    const handleStorageChange = () => {
      const token = getToken();
      const newUser = token
        ? {
            id: getUserId(),
            username: getUsername(),
            role: getUserRole() || "EMPLOYEE",
          }
        : null;
      setUser(newUser);
      setIsAuthenticated(!!newUser);
      console.log("Storage change detected. User:", newUser, "Token:", token);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = (token, userData) => {
    console.log("AuthContext login:", { token, userData });
    setUser(userData); // { id, username, role }
    setIsAuthenticated(true);
  };

  const logout = () => {
    console.log("AuthContext logout called");
    setUser(null);
    setIsAuthenticated(false);
    console.log("AuthContext logout complete. isAuthenticated:", false);
  };

  const value = {
    user, // { id, username, role }
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
