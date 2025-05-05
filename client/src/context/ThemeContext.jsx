import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to 'red'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "red";
  });

  // Persist theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("theme", theme);
    // Apply theme class to document root
    document.documentElement.classList.remove("dark", "red");
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "red" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
