import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Medicine from "./pages/inventory/Medicine/Medicine";
import Category from "./pages/inventory/Category/Category";
import Dosage from "./pages/inventory/Dosage/Dosage";
import Supplier from "./pages/supplier/Supplier";
import Expire from "./pages/expired-date/Expire";
import Sales from "./pages/sales/Sales";
import Return from "./pages/returns/Return";
import Expense from "./pages/expense/Expense"; // Import the Expense component
import Customer from "./pages/customers/Customer";
import OwedByCustomer from "./pages/credit-management/OwedByCustomer/OwedByCustomer.jsx";
import OwedToSupplier from "./pages/credit-management/OwedToSupplier/OwedToSupplier";
import UserManagement from "./pages/members/UserManagement/UserManagement";
import EmployeeManagement from "./pages/members/EmployeeManagement/EmployeeManagement";
import OkrAdd from "./pages/okr/OkrAdd";
import OkrTrackProgress from "./pages/okr/OkrTrackProgress";
import OkrGenerateReport from "./pages/okr/OkrGenerateReport";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import VerifyOtp from "./pages/VerifyOtp.jsx";
import NewPassword from "./pages/NewPassword.jsx";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// Logout component
const Logout = () => {
  const { logout } = useAuth();
  logout();
  return <Navigate to="/" replace />;
};

// Layout component for protected routes
const Layout = ({ children, showToast }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`flex min-h-screen ${
        theme === "dark" ? "bg-gray-900" : "bg-[#F7F7F7]"
      }`}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 ml-64 mt-16">{children}</main>
      </div>
    </div>
  );
};

function App() {
  const showToast = (message, options = {}) => {
    toast.dismiss();
    toast.success(message, { ...options, autoClose: 3000 });
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss={false}
            draggable
            pauseOnHover={false}
            limit={1}
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/medicine/*"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <Medicine />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/category"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <Category />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/dosage-forms"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <Dosage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/expired-date/*"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <Expire />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/*"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <Sales showToast={showToast} />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/returns/*"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <Return showToast={showToast} />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/expense/*"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <Expense showToast={showToast} />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier/*"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <Supplier />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers/*"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <Customer />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/credit-management/owed-by-customer/*"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <OwedByCustomer />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/credit-management/owed-to-supplier/*"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <OwedToSupplier />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/members/user-management"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <UserManagement showToast={showToast} />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/members/employee-management"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <EmployeeManagement showToast={showToast} />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/okr/add"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <OkrAdd />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/okr/track-progress"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <OkrTrackProgress />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/okr/generate-report"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <OkrGenerateReport />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <Notifications />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout showToast={showToast}>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/change-password" element={<NewPassword />} />
            
            <Route path="/logout" element={<Logout />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
