import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { loginUser } from "../utils/auth";
import { toast } from "react-toastify";
import axios from "axios";

const NewPassword = () =>
{
    const [password, setPassword] = useState("");
    const [confPassword, setConfPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();
    const { theme } = useTheme();

    const handleForgetPassword = async (e) =>
    {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            try {
                if (password !== confPassword) {
                    setError("Passwords do not match");
                    return
                }
                const response = await axios.post("http://localhost:8080/api/auth/updatePassword", {
                    email: sessionStorage.getItem("email"),
                    password
                });

                setIsLoading(false);
                setPassword("");
                setConfPassword("");
                toast.success("Password updated successfully");
                // sessionStorage.removeItem("email");
                navigate("/");
            } catch (error) {
                setIsLoading(false);
                if (error.response && error.response.data && error.response.data.error) {
                    throw new Error(error.response.data.error);
                } else {
                    throw new Error("Something went wrong");
                }
            }
        }
        catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };
    const clearError = useCallback(() =>
    {
        setError("");
    }, []);
    return (
        <div
            className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-gray-900" : "bg-[#f7f7f7]"
                }`}
        >
            <div className="flex flex-col md:flex-row w-full max-w-4xl h-[500px] max-h-[90vh] rounded-xl overflow-hidden shadow-lg">
                <div
                    className={`flex-1 border-2 ${theme === "dark"
                        ? "bg-gray-800 border-gray-700 text-[#5DB5B5]"
                        : "bg-[#1a2a44] border-[#1a2a44] text-[#5DB5B5]"
                        } flex flex-col items-center justify-center p-6`}
                >
                    <h2 className="text-3xl font-bold font-['Arial']">UPDATE PASSWORD</h2>
                </div>

                <div
                    className={`flex-1 flex flex-col items-center justify-center p-6 relative ${theme === "dark" ? "bg-gray-900" : "bg-white"
                        }`}
                >
                    <div className="w-full max-w-md z-10">
                        <p className="text-center mb-6 font-['Arial'] text-xl font-bold text-[#5DB5B5]">

                        </p>

                        {error && (
                            <div
                                className={`w-full ${theme === "dark"
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

                        <form onSubmit={handleForgetPassword} className="space-y-4">

                            <div>
                                <label htmlFor="password" className="sr-only">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}

                                    className={`w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5DB5B5] font-['Arial'] ${theme === "dark"
                                        ? "bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400"
                                        : "bg-white border-gray-300 text-gray-800 placeholder-gray-400"
                                        }`}
                                    placeholder="Enter your password"
                                    autoComplete="password"

                                    aria-label="Password"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={confPassword}
                                    onChange={(e) => setConfPassword(e.target.value)}

                                    className={`w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5DB5B5] font-['Arial'] ${theme === "dark"
                                        ? "bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400"
                                        : "bg-white border-gray-300 text-gray-800 placeholder-gray-400"
                                        }`}
                                    placeholder="Confirm your password"
                                    autoComplete="password"

                                    aria-label="Password"
                                />
                            </div>
                            <button
                                type="submit"
                                className={`w-full py-2 border-2 rounded-full font-semibold font-['Arial'] transition duration-300 ${theme === "dark"
                                    ? "bg-gray-700 border-gray-600 text-[#5DB5B5] hover:bg-gray-600 cursor-pointer"
                                    : "bg-[#1a2a44] border-[#1a2a44] text-[#5DB5B5] hover:bg-[#0f1c33] cursor-pointer"
                                    }`}
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
                                        Loading...
                                    </span>
                                ) : (
                                    "RESET"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewPassword;
