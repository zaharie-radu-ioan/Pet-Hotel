import { useEffect, useState } from "react";
import { ApiError } from "../api/client";
import { createReservation, listReservations } from "../api/rezervari";
import AppHeader from "../components/AppHeader";

const STATUS_LABELS = {
  ceruta: "Ceruta",
  confirmata: "Confirmata",
  in_desfasurare: "In desfasurare",
  finalizata: "Finalizata",
  anulata: "Anulata",
};

function azi() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export default function BookingPage() {
  const today = azi();

  const [dataInceput, setDataInceput] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [rezervari, setRezervari] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadRezervari() {
    try {
      const data = await listReservations();
      setRezervari(data);
      setListError("");
    } catch {
      setListError("Nu am putut incarca rezervarile.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    (async () => {
      await loadRezervari();
    })();
  }, []);

  // Keep check-out consistent when check-in changes.
  function onChangeInceput(value) {
    setDataInceput(value);
    if (dataFinal && dataFinal < value) {
      setDataFinal("");
    }
  }

  // True when [start, end] overlaps any non-cancelled existing reservation.
  function seSuprapune(start, end) {
    return rezervari.some(
      (r) =>
        r.status !== "anulata" &&
        start <= r.data_final &&
        end >= r.data_inceput
    );
  }

  async function handleCreate(evt) {
    evt.preventDefault();
    setFormError("");
    setSuccess("");

    if (!dataInceput || !dataFinal) {
      setFormError("Alege ambele date.");
      return;
    }
    if (dataFinal < dataInceput) {
      setFormError("Data de final trebuie sa fie >= data de inceput.");
      return;
    }
    if (seSuprapune(dataInceput, dataFinal)) {
      setFormError("Ai deja o rezervare care se suprapune cu acest interval.");
      return;
    }

    setSubmitting(true);
    try {
      await createReservation(dataInceput, dataFinal);
      setSuccess("Cererea ta a fost inregistrata.");
      setDataInceput("");
      setDataFinal("");
      await loadRezervari();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Nu am putut crea rezervarea."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dashboard">
      <AppHeader />
      <main className="dashboard-body">
        <h1>Rezervarile mele</h1>
        <p className="muted-text">Cere o rezervare noua si urmareste statusul.</p>

        <section className="card">
          <h2>Rezervare noua</h2>
          <form onSubmit={handleCreate} className="rezervare-form" noValidate>
            <label className="date-label">
              Check-in
              <input
                type="date"
                min={today}
                value={dataInceput}
                onChange={(e) => onChangeInceput(e.target.value)}
              />
            </label>
            <label className="date-label">
              Check-out
              <input
                type="date"
                min={dataInceput || today}
                value={dataFinal}
                disabled={!dataInceput}
                onChange={(e) => setDataFinal(e.target.value)}
              />
            </label>
            <button className="register-button" type="submit" disabled={submitting}>
              {submitting ? "Se trimite..." : "Cere rezervare"}
            </button>
          </form>

          {formError && <p className="form-error">{formError}</p>}
          {success && <p className="success-message">{success}</p>}
        </section>

        <section className="card list-card">
          <h2>Istoric</h2>
          {loadingList ? (
            <p className="muted-text">Se incarca...</p>
          ) : listError ? (
            <p className="form-error">{listError}</p>
          ) : rezervari.length === 0 ? (
            <p className="muted-text">Nu ai nicio rezervare inca.</p>
          ) : (
            <ul className="rezervari-list">
              {rezervari.map((r, i) => (
                <li key={`${r.created_at}-${i}`} className="rezervare-item">
                  <div className="rezervare-dates">
                    {r.data_inceput} &rarr; {r.data_final}
                  </div>
                  <span className={`status-badge status-${r.status}`}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}