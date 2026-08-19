import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import BookingPage from "./pages/BookingPage";
import FacturaPage from "./pages/FacturaPage";
import AccountPage from "./pages/AccountPage";
import PetsPage from "./pages/PetsPage";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeTasksPage from "./pages/EmployeeTasksPage";
import BusinessIntelligence from "./pages/BusinessIntelligence";

import { AuthContext } from "./auth/AuthContext";

export default function App() {

  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<RegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {user?.rol === "admin" ? (
              <RoleRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </RoleRoute>
            ) : user?.rol === "angajat" ? (
              <RoleRoute allowedRoles={["angajat"]}>
                <EmployeeDashboard />
              </RoleRoute>
            ) : (
              <DashboardPage />
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/employees/:id"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["admin"]}>
              <EmployeeTasksPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rezervari"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["client"]}>
              <BookingPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rezervari/:code/factura"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["client"]}>
              <FacturaPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cont"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["client", "angajat"]}>
              <AccountPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/animale"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["client"]}>
              <PetsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route
        path="/admin/business-intelligence"
        element={
            <ProtectedRoute>
            <RoleRoute allowedRoles={["admin"]}>
                <BusinessIntelligence />
            </RoleRoute>
            </ProtectedRoute>
        }
      />
    </Routes>
  );
}