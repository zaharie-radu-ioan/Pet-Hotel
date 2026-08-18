import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import AppHeader from "../components/AppHeader";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <AppHeader />
      <main className="dashboard-body">
        <h1>Welcome</h1>
        <p className="muted-text">
          You are signed in as <strong>{user?.rol}</strong>
        </p>

        <div className="hub-grid">
          <Link to="/rezervari" className="hub-card">
            <h2>My bookings</h2>
            <p>Request a new booking and follow the ones you already have.</p>
          </Link>
          <Link to="/cont" className="hub-card">
            <h2>My account</h2>
            <p>See the details of your account.</p>
          </Link>
          <Link to="/animale" className="hub-card">
            <h2>My pets</h2>
            <p>See the pets linked to your account.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}