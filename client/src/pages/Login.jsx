import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { loginUser } from "../utils/auth";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme } = useTheme();

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const submitButtonRef = useRef(null);

  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      if (!username || !password || !role) {
        setError("Please fill all fields!");
        setIsLoading(false);
        return;
      }

      try {
        const { token, user } = await loginUser(username, password, role);
        if (!token || !user?.role || !user?.username || !user?.id) {
          setError("Invalid response from server. Please try again.");
          setIsLoading(false);
          return;
        }
        login(token, { id: user.id, username: user.username, role: user.role });
        navigate("/dashboard");
      } catch (err) {
        if (err === "Invalid credentials") {
          setError("Invalid username or password.");
        } else if (err.response?.status === 401) {
          setError("Invalid credentials.");
        } else if (err.response?.status === 403) {
          setError("Account is inactive. Contact support.");
        } else if (err.response?.status === 400) {
          setError("Invalid request. Please check your inputs.");
        } else if (err.response?.status === 404) {
          setError("Login service unavailable. Please try again later.");
        } else {
          setError("Login failed. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [username, password, role, login, navigate]
  );

  const handleKeyDown = useCallback((e, nextFieldRef) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextFieldRef?.current?.focus();
    }
  }, []);

  const handlePasswordKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitButtonRef.current?.click();
    }
  }, []);

  const clearError = useCallback(() => {
    setError("");
    usernameRef.current?.focus();
  }, []);

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-900" : "bg-[#f7f7f7]"
      }`}
    >
      <div className="flex flex-col md:flex-row w-full max-w-4xl h-[500px] max-h-[90vh] rounded-xl overflow-hidden shadow-lg">
        <div
          className={`flex-1 border-2 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700 text-[#5DB5B5]"
              : "bg-[#1a2a44] border-[#1a2a44] text-[#5DB5B5]"
          } flex flex-col items-center justify-center p-6`}
        >
          <h2 className="text-3xl font-bold mb-2 font-['Arial']">Welcome to</h2>
          <h2 className="text-3xl font-bold font-['Arial']">Yusra Pharmacy</h2>
        </div>

        <div
          className={`flex-1 flex flex-col items-center justify-center p-6 relative ${
            theme === "dark" ? "bg-gray-900" : "bg-white"
          }`}
        >
          <div className="w-full max-w-md z-10">
            <p className="text-center mb-6 font-['Arial'] text-xl font-bold text-[#5DB5B5]">
              Log in to your account to continue
            </p>

            {error && (
              <div
                className={`w-full ${
                  theme === "dark"
                    ? "bg-gray-700 text-[#5DB5B5]"
                    : "bg-[#1a2a44] text-[#5DB5B5]"
                } rounded-t-lg p-2 flex justify-between items-center shadow-md mb-4`}
                aria-live="polite"
              >
                <span className="ml-4 font-['Arial']">{error}</span>
                <button
                  onClick={clearError}
                  className={`font-bold text-lg focus:outline-none mr-4 text-[#5DB5B5]`}
                  aria-label="Close error message"
                >
                  ×
                </button>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, passwordRef)}
                  className={`w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5DB5B5] font-['Arial'] ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-800 placeholder-gray-400"
                  }`}
                  placeholder="Username"
                  autoComplete="username"
                  ref={usernameRef}
                  aria-label="Username"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handlePasswordKeyDown}
                  className={`w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5DB5B5] font-['Arial'] ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-800 placeholder-gray-400"
                  }`}
                  placeholder="Password"
                  autoComplete="current-password"
                  ref={passwordRef}
                  aria-label="Password"
                />
              </div>
              <div className="flex justify-center">
                <div
                  className={`flex border rounded-full p-1 ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-600"
                      : "bg-white border-[#5DB5B5]"
                  }`}
                  role="radiogroup"
                  aria-label="Select role"
                >
                  <button
                    type="button"
                    onClick={() => setRole("EMPLOYEE")}
                    className={`px-6 py-2 rounded-full font-['Arial'] transition duration-300 ${
                      role === "EMPLOYEE"
                        ? theme === "dark"
                          ? "bg-gray-700 border-2 border-gray-600 text-gray-200"
                          : "bg-[#1a2a44] border-2 border-[#1a2a44] text-[#5DB5B5]"
                        : theme === "dark"
                        ? "bg-gray-800 text-gray-400"
                        : "bg-white text-[#1a2a44]"
                    }`}
                    aria-checked={role === "EMPLOYEE"}
                    role="radio"
                  >
                    Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("MANAGER")}
                    className={`px-6 py-2 rounded-full font-['Arial'] transition duration-300 ${
                      role === "MANAGER"
                        ? theme === "dark"
                          ? "bg-gray-700 border-2 border-gray-600 text-gray-200"
                          : "bg-[#1a2a44] border-2 border-[#1a2a44] text-[#5DB5B5]"
                        : theme === "dark"
                        ? "bg-gray-800 text-gray-400"
                        : "bg-white text-[#1a2a44]"
                    }`}
                    aria-checked={role === "MANAGER"}
                    role="radio"
                  >
                    Manager
                  </button>
                </div>
              </div>
              <div className="text-right">
                <a
                  href="/forgot-password"
                  className={`text-sm border-b-2 hover:underline font-['Arial'] text-[#5DB5B5] border-[#5DB5B5]`}
                  aria-label="Forgot password"
                >
                  Forgot Password?
                </a>
              </div>
              <button
                type="submit"
                className={`w-full py-2 border-2 rounded-full font-semibold font-['Arial'] transition duration-300 ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-[#5DB5B5] hover:bg-gray-600"
                    : "bg-[#1a2a44] border-[#1a2a44] text-[#5DB5B5] hover:bg-[#0f1c33]"
                }`}
                ref={submitButtonRef}
                aria-label="Log in"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  "LOG IN"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
