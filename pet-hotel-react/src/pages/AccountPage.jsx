import { useEffect, useState } from "react";
import { getProfil, updateProfil } from "../api/profile";
import { ApiError } from "../api/client";
import AppHeader from "../components/AppHeader";

export default function AccountPage() {
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nume: "", prenume: "", telefon: "", adresa: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setProfil(await getProfil());
      } catch {
        setError("Nu am putut incarca datele contului.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function startEdit() {
    setFormError("");
    setForm({
      nume: profil.nume ?? "",
      prenume: profil.prenume ?? "",
      telefon: profil.telefon ?? "",
      adresa: profil.adresa ?? "",
    });
    setEditing(true);
  }

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(evt) {
    evt.preventDefault();
    setFormError("");

    if (!form.nume.trim() || !form.prenume.trim()) {
      setFormError("Numele si prenumele sunt obligatorii.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfil({
        nume: form.nume.trim(),
        prenume: form.prenume.trim(),
        telefon: form.telefon.trim() || null,
        adresa: form.adresa.trim() || null,
      });
      setProfil(updated);
      setEditing(false);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Nu am putut salva modificarile."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dashboard">
      <AppHeader />
      <main className="dashboard-body">
        <h1>Contul meu</h1>
        <p className="muted-text">Datele contului tau.</p>

        <section className="card">
          {loading ? (
            <p className="muted-text">Se incarca...</p>
          ) : error ? (
            <p className="form-error">{error}</p>
          ) : editing ? (
            <form onSubmit={handleSave} className="profil-edit" noValidate>
              <label className="field-label">
                Nume
                <input
                  value={form.nume}
                  onChange={(e) => updateField("nume", e.target.value)}
                />
              </label>
              <label className="field-label">
                Prenume
                <input
                  value={form.prenume}
                  onChange={(e) => updateField("prenume", e.target.value)}
                />
              </label>
              <label className="field-label">
                Telefon
                <input
                  value={form.telefon}
                  onChange={(e) => updateField("telefon", e.target.value)}
                />
              </label>
              <label className="field-label">
                Adresa
                <input
                  value={form.adresa}
                  onChange={(e) => updateField("adresa", e.target.value)}
                />
              </label>

              {formError && <p className="form-error">{formError}</p>}

              <div className="profil-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Anuleaza
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Se salveaza..." : "Salveaza"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <dl className="profil-list">
                <div className="profil-row">
                  <dt>Nume</dt>
                  <dd>
                    {profil.prenume} {profil.nume}
                  </dd>
                </div>
                <div className="profil-row">
                  <dt>Email</dt>
                  <dd>{profil.email}</dd>
                </div>
                <div className="profil-row">
                  <dt>Telefon</dt>
                  <dd>{profil.telefon || "-"}</dd>
                </div>
                <div className="profil-row">
                  <dt>Adresa</dt>
                  <dd>{profil.adresa || "-"}</dd>
                </div>
              </dl>

              <div className="profil-actions">
                <button type="button" className="btn-primary" onClick={startEdit}>
                  Editeaza
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}