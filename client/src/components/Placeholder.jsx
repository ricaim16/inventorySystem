import { useTheme } from "../context/ThemeContext";

const Placeholder = ({ title }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`p-6 rounded-lg shadow-md ${
        theme === "dark" ? "bg-gray-800" : "bg-[#E8D7A5]"
      }`}
    >
      <h1
        className={`text-3xl font-bold mb-4 ${
          theme === "dark" ? "text-gray-200" : "text-gray-800"
        }`}
      >
        {title}
      </h1>
      <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
        This is a placeholder for the {title} page. Implement the actual
        functionality here.
      </p>
    </div>
  );
};

export default Placeholder;
