import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { apiFetch, ApiError } from "../api/client";
import BrandLink from "../components/BrandLink";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dataInceput, setDataInceput] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  async function handleCreateRezervare(evt) {
    evt.preventDefault();
    setError("");
    setResult(null);

    if (!dataInceput || !dataFinal) {
      setError("Alege ambele date.");
      return;
    }
    if (dataFinal < dataInceput) {
      setError("Data de final trebuie sa fie >= data de inceput.");
      return;
    }

    setSubmitting(true);
    try {
      const rez = await apiFetch("/rezervari", {
        method: "POST",
        body: JSON.stringify({ data_inceput: dataInceput, data_final: dataFinal }),
      });
      setResult(rez);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Nu am putut crea rezervarea."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <BrandLink className="brand" />
        <button className="link-button" type="button" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <main className="dashboard-body">
        <h1>Bun venit</h1>
        <p className="muted-text">
          Esti logat ca <strong>{user?.rol}</strong> (utilizator #
          {user?.id_utilizator}).
        </p>

        <div className="hub-grid">
          <Link to="/rezervari" className="hub-card">
            <h2>Rezervarile mele</h2>
            <p>Cere o rezervare noua si vezi statusul celor existente.</p>
          </Link>
          <Link to="/animale" className="hub-card">
            <h2>Customize your pet</h2>
            <p>Vezi si personalizeaza animalele tale.</p>
          </Link>
          <Link to="/cont" className="hub-card">
            <h2>Contul meu</h2>
            <p>Vezi datele contului tau.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
