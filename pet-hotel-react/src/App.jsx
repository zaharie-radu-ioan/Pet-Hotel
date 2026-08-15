import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import BookingPage from "./pages/BookingPage";
import AccountPage from "./pages/AccountPage";
<<<<<<< HEAD

=======
import PetsPage from "./pages/PetsPage";
>>>>>>> Alex
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rezervari"
        element={
          <ProtectedRoute>
            <BookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cont"
        element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        }
      />
<<<<<<< HEAD
=======
      <Route
        path="/animale"
        element={
          <ProtectedRoute>
            <PetsPage />
          </ProtectedRoute>
        }
      />
>>>>>>> Alex
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
