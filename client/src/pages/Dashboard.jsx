import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { generateSalesReport } from "../api/salesApi";
import {
  getExpirationAlerts,
  getLowStockMedicines,
  generateMedicineReport,
  getExpiredMedicines,
} from "../api/medicineApi";
import { fetchObjectives } from "../api/okrApi";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [totalSales, setTotalSales] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [expiringItems, setExpiringItems] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [winningProducts, setWinningProducts] = useState([]);
  const [expiredMedicines, setExpiredMedicines] = useState([]);
  const [okrValue, setOkrValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedWeekRange, setSelectedWeekRange] = useState(null);
  const [weekDisplay, setWeekDisplay] = useState("");
  const [currentMonthName, setCurrentMonthName] = useState("");
  const [weeklySalesData, setWeeklySalesData] = useState([]);
  const [yearlySalesData, setYearlySalesData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // Ethiopian time helper
  const getEthiopianTime = (date = new Date()) => {
    const utcDate = new Date(date);
    const etOffset = 3 * 60 * 60 * 1000;
    return new Date(utcDate.getTime() + etOffset);
  };

  const formatEAT = (date) => {
    return new Date(date).toLocaleString("en-US", {
      timeZone: "Africa/Addis_Ababa",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Date range helpers
  const getCurrentMonthRange = () => {
    const now = getEthiopianTime();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    return {
      start_date: start.toISOString().split("T")[0],
      end_date: end.toISOString().split("T")[0],
      month: now.getMonth(),
      year: now.getFullYear(),
      monthName: now.toLocaleString("en-US", { month: "long" }),
      monthKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}`,
    };
  };

  const getSelectedMonthRange = (monthString) => {
    if (!monthString) return null;
    const [year, month] = monthString.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return {
      start_date: start.toISOString().split("T")[0],
      end_date: end.toISOString().split("T")[0],
      monthName: new Date(year, month - 1, 1).toLocaleString("en-US", {
        month: "long",
      }),
    };
  };

  const getYearRange = (yearString) => {
    const year = parseInt(yearString);
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    return {
      start_date: start.toISOString().split("T")[0],
      end_date: end.toISOString().split("T")[0],
    };
  };

  const getCurrentWeekRange = () => {
    const now = getEthiopianTime();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return {
      start_date: start.toISOString().split("T")[0],
      end_date: end.toISOString().split("T")[0],
    };
  };

  const getWeekRangeFromDate = (dateString) => {
    if (!dateString) return getCurrentWeekRange();
    const selected = new Date(dateString);
    const dayOfWeek = selected.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const start = new Date(selected);
    start.setDate(selected.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return {
      start_date: start.toISOString().split("T")[0],
      end_date: end.toISOString().split("T")[0],
    };
  };

  const formatWeekDisplay = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startStr = start.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endStr = end.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${startStr} - ${endStr}`;
  };

  // OKR progress calculation
  const calculateObjectiveProgress = (keyResults) => {
    if (!keyResults || keyResults.length === 0) return 0;
    const totalWeight = keyResults.reduce(
      (sum, kr) => sum + (Number(kr.weight) || 1),
      0
    );
    if (totalWeight === 0) return 0;

    const weightedProgress = keyResults.reduce((sum, kr) => {
      const progress = Number(kr.progress) || 0;
      const startValue = Number(kr.start_value) || 0;
      const targetValue = Number(kr.target_value) || 100;
      if (targetValue <= startValue) return sum;
      const progressPercentage =
        ((progress - startValue) / (targetValue - startValue)) * 100;
      const cappedProgress = Math.min(100, Math.max(0, progressPercentage));
      return sum + cappedProgress * (Number(kr.weight) || 1);
    }, 0);

    return Math.min(100, Math.max(0, weightedProgress / totalWeight));
  };

  // Fetch data including OKR
  useEffect(() => {
    if (!user) {
      setError("Please log in to view the dashboard.");
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const {
          start_date: monthStart,
          end_date: monthEnd,
          year,
          monthName,
        } = getCurrentMonthRange();

        // Initialize default date if not set
        if (!selectedDate) {
          const today = getEthiopianTime();
          setSelectedDate(today.toISOString().split("T")[0]);
          const currentWeek = getCurrentWeekRange();
          setSelectedWeekRange(currentWeek);
          setWeekDisplay(
            formatWeekDisplay(currentWeek.start_date, currentWeek.end_date)
          );
        }

        // Derive month and year from selectedDate
        const derivedDate = selectedDate
          ? new Date(selectedDate)
          : getEthiopianTime();
        const derivedYear = derivedDate.getFullYear().toString();
        const derivedMonth = `${derivedYear}-${String(
          derivedDate.getMonth() + 1
        ).padStart(2, "0")}`;
        setSelectedYear(derivedYear);
        setSelectedMonth(derivedMonth);
        setCurrentMonthName(
          derivedDate.toLocaleString("en-US", { month: "long" })
        );

        // Fetch sales and medicine data
        const monthRange = getSelectedMonthRange(derivedMonth) || {
          start_date: monthStart,
          end_date: monthEnd,
          monthName,
        };
        let monthlySalesData;
        try {
          monthlySalesData = await generateSalesReport({
            start_date: monthRange.start_date,
            end_date: monthRange.end_date,
          });
        } catch (err) {
          console.error(
            "Failed to fetch sales report:",
            err.message,
            err.response?.status
          );
          throw new Error("Unable to fetch sales data");
        }
        setMonthlySales(monthlySalesData?.summary?.totalSales || 0);
        setCurrentMonthName(monthRange.monthName);

        const yearRange = getYearRange(derivedYear);
        let totalSalesData;
        try {
          totalSalesData = await generateSalesReport({
            start_date: yearRange.start_date,
            end_date: yearRange.end_date,
          });
        } catch (err) {
          console.error(
            "Failed to fetch total sales:",
            err.message,
            err.response?.status
          );
          throw new Error("Unable to fetch total sales data");
        }
        setTotalSales(totalSalesData?.summary?.totalSales || 0);

        let expiringData;
        try {
          expiringData = await getExpirationAlerts();
        } catch (err) {
          console.error(
            "Failed to fetch expiration alerts:",
            err.message,
            err.response?.status
          );
          throw new Error("Unable to fetch expiration alerts");
        }
        setExpiringItems(expiringData?.length || 0);

        let expiredData;
        try {
          expiredData = await getExpiredMedicines();
        } catch (err) {
          console.error(
            "Failed to fetch expired medicines:",
            err.message,
            err.response?.status
          );
          throw new Error("Unable to fetch expired medicines");
        }
        const expiredItems = expiredData?.medicines || [];
        setExpiredMedicines(
          expiredItems.sort(
            (a, b) => new Date(b.expire_date) - new Date(a.expire_date)
          )
        );

        let lowStockData;
        try {
          lowStockData = await getLowStockMedicines();
        } catch (err) {
          console.error(
            "Failed to fetch low stock medicines:",
            err.message,
            err.response?.status
          );
          throw new Error("Unable to fetch low stock medicines");
        }
        setLowStockItems(lowStockData?.length || 0);

        let medicineReport;
        try {
          medicineReport = await generateMedicineReport();
        } catch (err) {
          console.error(
            "Failed to fetch medicine report:",
            err.message,
            err.response?.status
          );
          throw new Error("Unable to fetch medicine report");
        }
        setWinningProducts(medicineReport?.winningProducts || []);

        // Fetch OKR data
        let okrProgress = 0;
        if (user.role === "MANAGER") {
          let objectives;
          try {
            objectives = await fetchObjectives();
          } catch (err) {
            console.error(
              "Failed to fetch OKR objectives:",
              err.message,
              err.response?.status
            );
            throw new Error("Unable to fetch OKR data");
          }
          if (objectives && objectives.length > 0) {
            const totalProgress = objectives.reduce((sum, obj) => {
              const progress = calculateObjectiveProgress(obj.KeyResults);
              return sum + progress;
            }, 0);
            okrProgress = totalProgress / objectives.length;
          }
        }
        setOkrValue(okrProgress);

        // Weekly sales data
        if (selectedWeekRange) {
          let weekSalesData;
          try {
            weekSalesData = await generateSalesReport({
              start_date: selectedWeekRange.start_date,
              end_date: selectedWeekRange.end_date,
            });
          } catch (err) {
            console.error(
              "Failed to fetch weekly sales:",
              err.message,
              err.response?.status
            );
            throw new Error("Unable to fetch weekly sales data");
          }
          const sales = weekSalesData?.sales || [];
          const dailySales = Array(7).fill(0);
          sales.forEach((sale) => {
            const saleDate = new Date(sale.sealed_date);
            const dayIndex = (saleDate.getDay() + 6) % 7;
            dailySales[dayIndex] += sale.total_amount || 0;
          });
          setWeeklySalesData(dailySales);
        }

        // Yearly sales data
        const yearlySales = Array(12).fill(0);
        const yearToFetch = derivedYear;
        const yearStart = new Date(yearToFetch, 0, 1);
        const yearEnd = new Date(yearToFetch, 11, 31, 23, 59, 59, 999);
        let yearlySalesDataResponse;
        try {
          yearlySalesDataResponse = await generateSalesReport({
            start_date: yearStart.toISOString().split("T")[0],
            end_date: yearEnd.toISOString().split("T")[0],
          });
        } catch (err) {
          console.error(
            "Failed to fetch yearly sales:",
            err.message,
            err.response?.status
          );
          throw new Error("Unable to fetch yearly sales data");
        }
        const sales = yearlySalesDataResponse?.sales || [];
        sales.forEach((sale) => {
          const saleDate = new Date(sale.sealed_date);
          const monthIndex = saleDate.getMonth();
          yearlySales[monthIndex] += sale.total_amount || 0;
        });
        setYearlySalesData(yearlySales);
      } catch (err) {
        console.error("Error fetching dashboard data:", err.message);
        setError(
          `Failed to load dashboard data: ${err.message}. Please try again later.`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, selectedDate, selectedWeekRange]);

  const handleDateChange = (e) => {
    const dateString = e.target.value;
    setSelectedDate(dateString);
    const weekRange = getWeekRangeFromDate(dateString);
    setSelectedWeekRange(weekRange);
    setWeekDisplay(formatWeekDisplay(weekRange.start_date, weekRange.end_date));
  };

  // Chart configurations
  const weeklyChartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Daily Sales (ETB)",
        data: weeklySalesData.length ? weeklySalesData : [0, 0, 0, 0, 0, 0, 0],
        backgroundColor:
          theme === "dark"
            ? "rgba(54, 162, 235, 0.7)"
            : "rgba(54, 162, 235, 0.5)",
        borderColor:
          theme === "dark" ? "rgba(54, 162, 235, 1)" : "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const weeklyChartOptions = {
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100000,
        title: { display: true, text: "Sales (ETB)" },
        ticks: { color: theme === "dark" ? "#D1D5DB" : "#4B5563" },
        grid: {
          color:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        title: { display: true, text: "Day of Week" },
        ticks: { color: theme === "dark" ? "#D1D5DB" : "#4B5563" },
        grid: {
          color:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
        },
      },
    },
    plugins: {
      legend: { labels: { color: theme === "dark" ? "#D1D5DB" : "#4B5563" } },
      title: {
        display: true,
        text: `Weekly Sales (${weekDisplay || "Current Week"})`,
        color: theme === "dark" ? "#3B82F6" : "#3B82F6",
        font: { weight: "bold" },
      },
    },
  };

  const yearlyChartData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Monthly Sales (ETB)",
        data: yearlySalesData.length ? yearlySalesData : Array(12).fill(0),
        fill: false,
        borderColor:
          theme === "dark" ? "rgba(54, 162, 235, 1)" : "rgba(54, 162, 235, 1)",
        backgroundColor:
          theme === "dark"
            ? "rgba(54, 162, 235, 0.7)"
            : "rgba(54, 162, 235, 0.5)",
        tension: 0.1,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const yearlyChartOptions = {
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 500000,
        title: { display: true, text: "Sales (ETB)" },
        ticks: { color: theme === "dark" ? "#D1D5DB" : "#4B5563" },
        grid: {
          color:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        title: { display: true, text: "Month" },
        ticks: { color: theme === "dark" ? "#D1D5DB" : "#4B5563" },
        grid: {
          color:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
        },
      },
    },
    plugins: {
      legend: { labels: { color: theme === "dark" ? "#D1D5DB" : "#4B5563" } },
      title: {
        display: true,
        text: `Yearly Sales (${
          selectedYear || getEthiopianTime().getFullYear()
        })`,
        color: theme === "dark" ? "#3B82F6" : "#3B82F6",
        font: { weight: "bold" },
      },
    },
  };

  // OKR Gauge component
  const OKRGauge = ({ value }) => {
    const percentage = Math.min(Math.max(value, 0), 100);
    const angle = (percentage / 100) * 180 - 90;

    return (
      <div className="relative w-48 h-24 mx-auto">
        <svg width="100%" height="100%" viewBox="0 0 120 60">
          <path
            d="M 12 60 A 48 48 0 0 1 108 60"
            fill="none"
            stroke={theme === "dark" ? "#4B5563" : "#D1D5DB"}
            strokeWidth="10"
          />
          <path
            d="M 12 60 A 48 48 0 0 1 108 60"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="10"
            strokeDasharray={`${(percentage / 100) * 150.72}, 150.72`}
          />
          <line
            x1="60"
            y1="60"
            x2="60"
            y2="12"
            stroke="#EF4444"
            strokeWidth="3"
            transform={`rotate(${angle}, 60, 60)`}
          />
        </svg>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
          <p
            className={`text-base font-bold ${
              theme === "dark" ? "text-white" : "text-black"
            }`}
          >
            {percentage.toFixed(1)}%
          </p>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            OKR Progress
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`p-4 sm:p-6 max-w-full mx-auto ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-[#F7F7F7] text-black"
      } min-h-screen`}
    >
      <h1
        className="text-2xl sm:text-3xl font-bold mb-6 text-center"
        style={{ color: "#10B981" }}
      >
        Welcome to Yusra Pharmacy, {user?.username || "User"}!
      </h1>

      {loading && (
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div
          className={`border px-4 py-3 rounded mb-6 flex flex-col sm:flex-row items-center justify-between ${
            theme === "dark"
              ? "bg-red-900 border-red-700 text-red-200"
              : "bg-red-100 border-red-400 text-red-700"
          }`}
        >
          <span className="text-center sm:text-left text-sm">{error}</span>
          <button
            onClick={() => fetchDashboardData()}
            className={`mt-2 sm:mt-0 px-3 py-1 rounded text-white text-sm ${
              theme === "dark"
                ? "bg-blue-700 hover:bg-blue-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-[#10B981]" : "bg-[#10B981]"
              }`}
            >
              <div className="flex items-center mb-2">
                <span className="text-red-500 mr-3 text-xl">⏰</span>
                <h3
                  className={`text-base sm:text-lg font-semibold ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                >
                  Total Sales (
                  {selectedYear || getEthiopianTime().getFullYear()})
                </h3>
              </div>
              <p
                className={`text-xl sm:text-2xl font-bold ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                {totalSales.toFixed(2)} ETB
              </p>
            </div>

            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-blue-900" : "bg-blue-200"
              }`}
            >
              <div className="flex items-center mb-2">
                <span className="text-blue-500 mr-3 text-xl">💵</span>
                <h3
                  className={`text-base sm:text-lg font-semibold ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                >
                  Monthly Sales {currentMonthName || "Current Month"}
                </h3>
              </div>
              <p
                className={`text-xl sm:text-2xl font-bold ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                {monthlySales.toFixed(2)} ETB
              </p>
            </div>

            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-yellow-900" : "bg-yellow-200"
              }`}
            >
              <div className="flex items-center mb-2">
                <span className="text-yellow-500 mr-3 text-xl">⚠️</span>
                <h3
                  className={`text-base sm:text-lg font-semibold ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                >
                  Near Expiring Items
                </h3>
              </div>
              <p
                className={`text-xl sm:text-2xl font-bold ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                {expiringItems}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-red-900" : "bg-red-200"
              }`}
            >
              <div className="flex items-center mb-2">
                <span className="text-green-500 mr-3 text-xl">📉</span>
                <h3
                  className={`text-base sm:text-lg font-semibold ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                >
                  Low Stock Items
                </h3>
              </div>
              <p
                className={`text-xl sm:text-2xl font-bold ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                {lowStockItems}
              </p>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg shadow ${
              theme === "dark" ? "bg-gray-800" : "bg-[#F7F7F7]"
            } mb-6`}
          >
            <h3
              className={`text-lg sm:text-xl font-semibold mb-4 ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            >
              Sales Filter
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                max={new Date().toISOString().split("T")[0]}
                className={`p-2 border rounded text-sm ${
                  theme === "dark"
                    ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                    : "bg-[#F7F7F7] text-black border-gray-300 hover:bg-[#E0E0E0]"
                }`}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-gray-800" : "bg-[#F7F7F7]"
              } h-96`}
            >
              {weeklySalesData.length &&
              weeklySalesData.some((val) => val > 0) ? (
                <Bar data={weeklyChartData} options={weeklyChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p
                    className={`text-center text-sm ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    No weekly sales data available for{" "}
                    {weekDisplay || "this week"}
                  </p>
                </div>
              )}
            </div>

            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-gray-800" : "bg-[#F7F7F7]"
              } h-96`}
            >
              {yearlySalesData.length &&
              yearlySalesData.some((val) => val > 0) ? (
                <Line data={yearlyChartData} options={yearlyChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p
                    className={`text-center text-sm ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    No yearly sales data available for{" "}
                    {selectedYear || getEthiopianTime().getFullYear()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-gray-800" : "bg-[#F7F7F7]"
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-2 ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
                style={{ color: "#10B981" }}
              >
                Winning Products
              </h3>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr
                    className={`${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                    }`}
                  >
                    <th
                      className={`border p-2 text-left ${
                        theme === "dark" ? "text-gray-200" : "text-gray-800"
                      }`}
                      style={{ color: "#10B981" }}
                    >
                      No.
                    </th>
                    <th
                      className={`border p-2 text-left ${
                        theme === "dark" ? "text-gray-200" : "text-gray-800"
                      }`}
                      style={{ color: "#10B981" }}
                    >
                      Medicine Name
                    </th>
                    <th
                      className={`border p-2 text-left ${
                        theme === "dark" ? "text-gray-200" : "text-gray-800"
                      }`}
                      style={{ color: "#10B981" }}
                    >
                      Total Quantity
                    </th>
                    <th
                      className={`border p-2 text-left ${
                        theme === "dark" ? "text-gray-200" : "text-gray-800"
                      }`}
                      style={{ color: "#10B981" }}
                    >
                      Sales %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {winningProducts.length > 0 ? (
                    winningProducts.slice(0, 5).map((product, index) => (
                      <tr
                        key={index}
                        className={`${
                          theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-[#E0E0E0]"
                        }`}
                      >
                        <td
                          className={`border p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </td>
                        <td
                          className={`border p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {product.medicine_name || "N/A"}
                        </td>
                        <td
                          className={`border p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {product.totalSales || 0}
                        </td>
                        <td
                          className={`border p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {product.salesPercent || 0}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className={`border p-2 text-center ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        No winning products available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div
              className={`p-4 rounded-lg shadow ${
                theme === "dark" ? "bg-gray-800" : "bg-[#F7F7F7]"
              } flex justify-center items-center`}
            >
              <div className="text-center">
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                >
                  OKR Progress
                </h3>
                <OKRGauge value={okrValue} />
                {user.role !== "MANAGER" && (
                  <p
                    className={`text-xs mt-2 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    OKR tracking available for managers only
                  </p>
                )}
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg shadow ${
              theme === "dark" ? "bg-gray-800" : "bg-[#F7F7F7]"
            }`}
          >
            <h3 className="text-lg font-semibold mb-2 text-red-500">
              Expired Medicines
            </h3>
            <div className="overflow-x-auto overflow-y-auto max-h-64">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0">
                  <tr
                    className={`${
                      theme === "dark" ? "bg-red-800" : "bg-red-100"
                    }`}
                  >
                    <th
                      className={`border p-2 text-left ${
                        theme === "dark" ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      No.
                    </th>
                    <th
                      className={`border p-2 text-left ${
                        theme === "dark" ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      Medicine Name
                    </th>
                    <th
                      className={`border p-2 text-left ${
                        theme === "dark" ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      Batch No.
                    </th>
                    <th
                      className={`border p-2 text-left ${
                        theme === "dark" ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      Brand
                    </th>
                    <th
                      className={`border p-2 text-left ${
                        theme === "dark" ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      Dosage
                    </th>
                    <th
                      className={`border p-2 text-left ${
                        theme === "dark" ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      Category
                    </th>
                    <th
                      className={`border p-2 text-left ${
                        theme === "dark" ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      Supplier
                    </th>
                    <th
                      className={`border p-2 text-left ${
                        theme === "dark" ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      Expired Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expiredMedicines.length > 0 ? (
                    expiredMedicines.map((med, index) => (
                      <tr
                        key={index}
                        className={`${
                          theme === "dark"
                            ? "hover:bg-red-900"
                            : "hover:bg-red-200"
                        }`}
                      >
                        <td
                          className={`border p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </td>
                        <td
                          className={`border p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {med.medicine_name || "N/A"}
                        </td>
                        <td
                          className={`border p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {med.batch_number || "N/A"}
                        </td>
                        <td
                          className={`border p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {med.brand_name || "N/A"}
                        </td>
                        <td
                          className={`border p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {med.dosage_form?.name || "N/A"}
                        </td>
                        <td
                          className={`border p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {med.category?.name || "N/A"}
                        </td>
                        <td
                          className={`border p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {med.supplier?.supplier_name || "N/A"}
                        </td>
                        <td
                          className={`border p-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {formatEAT(med.expire_date)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        className={`border p-2 text-center ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        No expired medicines found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
