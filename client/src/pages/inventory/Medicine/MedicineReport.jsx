import { useState, useEffect } from "react";
import { generateMedicineReport } from "../../../api/medicineApi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { FaCheckCircle, FaHourglassHalf } from "react-icons/fa";
import { useTheme } from "../../../context/ThemeContext";

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// Function to generate a random color
const generateRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const MedicineReport = () => {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const formatEAT = (date) => {
    const options = {
      timeZone: "Africa/Addis_Ababa",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    return new Date(date).toLocaleString("en-US", options);
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateMedicineReport();
      setReport(data);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "Report endpoint not found on server. Please check the backend."
          : `Failed to fetch medicine report: ${
              err.response?.data?.error?.message || err.message
            }`
      );
    } finally {
      setLoading(false);
    }
  };

  // Dynamically generate categories and colors from report.categoryDistribution
  const categories =
    report?.categoryDistribution.map((cat) => cat.category_name) || [];
  const categoryColors = categories.reduce((acc, category) => {
    acc[category] = generateRandomColor();
    return acc;
  }, {});

  // Prepare data for the pie chart
  const pieChartData = {
    labels: categories,
    datasets: [
      {
        label: "Medicine Categories",
        data: report?.categoryDistribution.map((cat) => cat.count) || [],
        backgroundColor: categories.map((category) => categoryColors[category]),
        hoverOffset: 4,
      },
    ],
  };

  const downloadReport = () => {
    if (!report) return;

    const doc = new jsPDF();
    autoTable(doc, {
      startY: 35,
      head: [
        ["NO", "Medicine Name", "Price", "Amount Sold", "Category", "Dosage"],
      ],
      body: report.winningProducts.map((med, index) => [
        index + 1,
        med.medicine_name,
        med.unit_price || "N/A",
        med.totalSales.toString(),
        med.category?.name || "N/A",
        med.dosage_form?.name || "N/A",
      ]),
      theme: "grid",
      styles: { fontSize: 10, font: "Inter" },
      didDrawPage: (data) => {
        doc.setFontSize(18);
        doc.text("Medicine Report", 10, 10);
        doc.setFontSize(14);
        doc.text(`Generated At: ${formatEAT(report.generatedAt)}`, 10, 20);
        doc.setFontSize(16);
        doc.text("Winning Products", 10, 30);
      },
    });

    let yPosition = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(16);
    doc.text("Worst Products", 10, yPosition);
    autoTable(doc, {
      startY: yPosition + 5,
      head: [
        ["NO", "Medicine Name", "Price", "Amount Sold", "Category", "Dosage"],
      ],
      body: report.worstPerformingProducts
        .slice(0, 5)
        .map((med, index) => [
          index + 1,
          med.medicine_name,
          med.unit_price || "N/A",
          med.totalSales.toString(),
          med.category?.name || "N/A",
          med.dosage_form?.name || "N/A",
        ]),
      theme: "grid",
      styles: { fontSize: 10, font: "Inter" },
    });

    yPosition = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(16);
    doc.text("Summary", 10, yPosition);
    doc.setFontSize(14);
    doc.text(
      `Total Stock Level: ${report.totalStockLevel}`,
      10,
      yPosition + 10
    );
    doc.text(
      `Total Asset Value: ${report.totalAssetValue.toFixed(2)} Birr`,
      10,
      yPosition + 20
    );

    doc.save(`Medicine_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) {
    return (
      <div
        className={`p-6 text-lg font-sans ${
          theme === "dark" ? "text-gray-200" : "text-gray-600"
        }`}
      >
        Loading report...
      </div>
    );
  }

  return (
    <div
      className={`p-6 rounded-lg shadow-lg font-sans ${
        theme === "dark" ? "bg-gray-900" : "bg-[#F7F7F7]"
      } max-w-full mx-auto`}
    >
      {/* Header */}
      <div className="mb-6">
        <h2
          className={`text-3xl font-semibold font-sans ${
            theme === "dark" ? "text-gray-100" : "text-gray-900"
          }`}
          style={{ color: "#10B981" }}
        >
          Medicine Report
        </h2>
        <p
          className={`text-sm font-sans ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Generated At: {formatEAT(new Date())}
        </p>
      </div>

      {error && (
        <div
          className={`${
            theme === "dark" ? "text-red-400" : "text-red-600"
          } mb-6 flex items-center text-lg font-sans`}
        >
          {error}
          <button
            onClick={fetchReport}
            className={`ml-4 text-white px-4 py-2 rounded text-base font-sans ${
              theme === "dark"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            Retry
          </button>
        </div>
      )}

      {report && (
        <>
          {/* Stock Level and Asset Value Cards */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Stock Level Card */}
            <div
              className={`flex-1 p-6 rounded-lg shadow-md flex items-center bg-green-100 w-[200px]`}
            >
              <FaCheckCircle className={`text-green-500 mr-3`} size={28} />
              <div>
                <p
                  className={`text-base font-sans ${
                    theme === "dark" ? "text-gray-800" : "text-gray-600"
                  }`}
                >
                  Stock Level
                </p>
                <p
                  className={`text-xl font-medium font-sans ${
                    theme === "dark" ? "text-gray-900" : "text-gray-800"
                  }`}
                >
                  {report.totalStockLevel}
                </p>
              </div>
            </div>

            {/* Asset Value Card */}
            <div
              className={`flex-1 p-6 rounded-lg shadow-md flex items-center bg-blue-100 w-[200px]`}
            >
              <FaHourglassHalf className={`text-blue-500 mr-3`} size={28} />
              <div>
                <p
                  className={`text-base font-sans ${
                    theme === "dark" ? "text-gray-800" : "text-gray-600"
                  }`}
                >
                  Asset Value
                </p>
                <p
                  className={`text-xl font-medium font-sans ${
                    theme === "dark" ? "text-gray-900" : "text-gray-800"
                  }`}
                >
                  {report.totalAssetValue.toFixed(2)} Birr
                </p>
              </div>
            </div>
          </div>

          {/* Main Content: Left (Tables) and Right (Pie Chart + Button) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side: Tables */}
            <div className="lg:col-span-2">
              {/* Winning Products */}
              <div className="mb-6">
                <h3
                  className={`text-xl font-semibold mb-2 font-sans ${
                    theme === "dark" ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Winning Products
                </h3>
                <div className="overflow-x-auto">
                  <table
                    className={`w-full border-collapse text-base font-sans ${
                      theme === "dark" ? "border-gray-700" : "border-gray-300"
                    }`}
                  >
                    <thead>
                      <tr
                        className={`${
                          theme === "dark" ? "bg-[#2D6A6A]" : "bg-[#5DB5B5]"
                        }`}
                      >
                        <th
                          className={`border p-2 text-left w-12 font-medium text-lg font-sans ${
                            theme === "dark" ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          NO
                        </th>
                        <th
                          className={`border p-2 text-left w-[150px] font-medium text-lg font-sans ${
                            theme === "dark" ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          Name
                        </th>
                        <th
                          className={`border p-2 text-left w-[80px] font-medium text-lg font-sans ${
                            theme === "dark" ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          Price
                        </th>
                        <th
                          className={`border p-2 text-left w-[100px] font-medium text-lg font-sans ${
                            theme === "dark" ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          Amount Sold
                        </th>
                        <th
                          className={`border p-2 text-left w-[120px] font-medium text-lg font-sans ${
                            theme === "dark" ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          Category
                        </th>
                        <th
                          className={`border p-2 text-left w-[100px] font-medium text-lg font-sans ${
                            theme === "dark" ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          Dosage
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.winningProducts.length > 0 ? (
                        report.winningProducts.map((med, index) => (
                          <tr
                            key={med.id}
                            className={`${
                              theme === "dark"
                                ? "hover:bg-gray-700"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            <td
                              className={`border p-2 w-12 text-base font-sans ${
                                theme === "dark"
                                  ? "text-gray-200"
                                  : "text-gray-600"
                              }`}
                            >
                              {index + 1}
                            </td>
                            <td
                              className={`border p-2 text-base font-sans ${
                                theme === "dark"
                                  ? "text-gray-200"
                                  : "text-gray-600"
                              }`}
                            >
                              {med.medicine_name}
                            </td>
                            <td
                              className={`border p-2 text-base font-sans ${
                                theme === "dark"
                                  ? "text-gray-200"
                                  : "text-gray-600"
                              }`}
                            >
                              {med.unit_price || "N/A"}
                            </td>
                            <td
                              className={`border p-2 text-base font-sans ${
                                theme === "dark"
                                  ? "text-gray-200"
                                  : "text-gray-600"
                              }`}
                            >
                              {med.totalSales}
                            </td>
                            <td
                              className={`border p-2 text-base font-sans ${
                                theme === "dark"
                                  ? "text-gray-200"
                                  : "text-gray-600"
                              }`}
                            >
                              {med.category?.name || "N/A"}
                            </td>
                            <td
                              className={`border p-2 text-base font-sans ${
                                theme === "dark"
                                  ? "text-gray-200"
                                  : "text-gray-600"
                              }`}
                            >
                              {med.dosage_form?.name || "N/A"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className={`border p-2 text-center text-base font-sans ${
                              theme === "dark"
                                ? "text-gray-200"
                                : "text-gray-600"
                            }`}
                          >
                            No sales recorded
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Worst Products */}
              <div className="mb-6">
                <h3
                  className={`text-xl font-semibold mb-2 font-sans ${
                    theme === "dark" ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Worst Products
                </h3>
                <div className="overflow-x-auto">
                  <table
                    className={`w-full border-collapse text-base font-sans ${
                      theme === "dark" ? "border-gray-700" : "border-gray-300"
                    }`}
                  >
                    <thead>
                      <tr
                        className={`${
                          theme === "dark" ? "bg-[#2D6A6A]" : "bg-[#5DB5B5]"
                        }`}
                      >
                        <th
                          className={`border p-2 text-left w-12 font-medium text-lg font-sans ${
                            theme === "dark" ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          NO
                        </th>
                        <th
                          className={`border p-2 text-left w-[150px] font-medium text-lg font-sans ${
                            theme === "dark" ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          Name
                        </th>
                        <th
                          className={`border p-2 text-left w-[80px] font-medium text-lg font-sans ${
                            theme === "dark" ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          Price
                        </th>
                        <th
                          className={`border p-2 text-left w-[100px] font-medium text-lg font-sans ${
                            theme === "dark" ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          Amount Sold
                        </th>
                        <th
                          className={`border p-2 text-left w-[120px] font-medium text-lg font-sans ${
                            theme === "dark" ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          Category
                        </th>
                        <th
                          className={`border p-2 text-left w-[100px] font-medium text-lg font-sans ${
                            theme === "dark" ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          Dosage
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.worstPerformingProducts.length > 0 ? (
                        report.worstPerformingProducts
                          .slice(0, 5)
                          .map((med, index) => (
                            <tr
                              key={med.id}
                              className={`${
                                theme === "dark"
                                  ? "hover:bg-gray-700"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              <td
                                className={`border p-2 w-12 text-base font-sans ${
                                  theme === "dark"
                                    ? "text-gray-200"
                                    : "text-gray-600"
                                }`}
                              >
                                {index + 1}
                              </td>
                              <td
                                className={`border p-2 text-base font-sans ${
                                  theme === "dark"
                                    ? "text-gray-200"
                                    : "text-gray-600"
                                }`}
                              >
                                {med.medicine_name}
                              </td>
                              <td
                                className={`border p-2 text-base font-sans ${
                                  theme === "dark"
                                    ? "text-gray-200"
                                    : "text-gray-600"
                                }`}
                              >
                                {med.unit_price || "N/A"}
                              </td>
                              <td
                                className={`border p-2 text-base font-sans ${
                                  theme === "dark"
                                    ? "text-gray-200"
                                    : "text-gray-600"
                                }`}
                              >
                                {med.totalSales}
                              </td>
                              <td
                                className={`border p-2 text-base font-sans ${
                                  theme === "dark"
                                    ? "text-gray-200"
                                    : "text-gray-600"
                                }`}
                              >
                                {med.category?.name || "N/A"}
                              </td>
                              <td
                                className={`border p-2 text-base font-sans ${
                                  theme === "dark"
                                    ? "text-gray-200"
                                    : "text-gray-600"
                                }`}
                              >
                                {med.dosage_form?.name || "N/A"}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className={`border p-2 text-center text-base font-sans ${
                              theme === "dark"
                                ? "text-gray-200"
                                : "text-gray-600"
                            }`}
                          >
                            No sales recorded
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Side: Pie Chart and Download Button */}
            <div className="lg:col-span-1 flex flex-col items-center">
              <div className="mb-6 w-full">
                <h3
                  className={`text-xl font-semibold mb-2 text-center font-sans ${
                    theme === "dark" ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Category Distribution
                </h3>
                <div className="w-full max-w-[450px] mx-auto">
                  <Pie
                    data={pieChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            font: { size: 14, family: "Inter" },
                            color: theme === "dark" ? "#E5E7EB" : "#374151",
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const label = context.label || "";
                              const value = context.raw || 0;
                              const total = context.dataset.data.reduce(
                                (a, b) => a + b,
                                0
                              );
                              const percentage = (
                                (value / total) *
                                100
                              ).toFixed(1);
                              return `${label}: ${percentage}%`;
                            },
                          },
                        },
                      },
                    }}
                    height={450}
                  />
                </div>
              </div>
              <div className="flex justify-center mt-4">
                <button
                  onClick={downloadReport}
                  className={`px-6 py-3 rounded text-lg text-white bg-[#5DB5B5] hover:bg-[#3e8888] font-sans max-w-[200px]`}
                >
                  Download Report
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MedicineReport;
