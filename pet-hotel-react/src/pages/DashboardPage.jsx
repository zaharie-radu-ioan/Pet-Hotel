import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import AppHeader from "../components/AppHeader";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <AppHeader />
      <main className="dashboard-body">
        <h1>Bun venit</h1>
        <p className="muted-text">
          Esti logat ca <strong>{user?.rol}</strong>
        </p>

        <div className="hub-grid">
          <Link to="/rezervari" className="hub-card">
            <h2>Rezervarile mele</h2>
            <p>Cere o rezervare noua si vezi statusul celor existente.</p>
          </Link>
          <Link to="/cont" className="hub-card">
            <h2>Contul meu</h2>
            <p>Vezi datele contului tau.</p>
          </Link>
<<<<<<< HEAD
=======
          <Link to="/animale" className="hub-card">
            <h2>Animalele mele</h2>
            <p>Vezi animalele asociate contului tau.</p>
          </Link>
>>>>>>> Alex
        </div>
      </main>
    </div>
  );
}