import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "sonner";
import Layout from "./components/layout/Layout";
import AdminLayout from "./components/layout/AdminLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Referrals from "./pages/Referrals";
import Transactions from "./pages/Transactions";
import Withdraw from "./pages/Withdraw";
import AddFunds from "./pages/AddFunds";
import Analytics from "./pages/Analytics";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageTransactions from "./pages/admin/ManageTransactions";
import WithdrawalRequests from "./pages/admin/WithdrawalRequests";
import SystemSettings from "./pages/admin/SystemSettings";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected User Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Outlet />
              </Layout>
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="referrals" element={<Referrals />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="withdraw" element={<Withdraw />} />
          <Route path="add-funds" element={<AddFunds />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="transactions" element={<ManageTransactions />} />
          <Route path="withdrawals" element={<WithdrawalRequests />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
