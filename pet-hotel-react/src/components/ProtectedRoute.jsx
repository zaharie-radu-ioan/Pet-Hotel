import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Wait for the startup session check before deciding, otherwise we would
  // bounce to /login before the cookie session is restored.
  if (loading) {
    return <div className="route-loading">Checking your session...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}