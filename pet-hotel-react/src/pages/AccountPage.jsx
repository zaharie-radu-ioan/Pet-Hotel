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
        setError("We could not load your account details.");
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
      setFormError("First name and last name are required.");
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
        err instanceof ApiError ? err.message : "We could not save your changes."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dashboard">
      <AppHeader />
      <main className="dashboard-body">
        <h1>My account</h1>
        <p className="muted-text">The details of your account.</p>

        <section className="card">
          {loading ? (
            <p className="muted-text">Loading...</p>
          ) : error ? (
            <p className="form-error">{error}</p>
          ) : editing ? (
            <form onSubmit={handleSave} className="profil-edit" noValidate>
              <label className="field-label">
                Last name
                <input
                  value={form.nume}
                  onChange={(e) => updateField("nume", e.target.value)}
                />
              </label>
              <label className="field-label">
                First name
                <input
                  value={form.prenume}
                  onChange={(e) => updateField("prenume", e.target.value)}
                />
              </label>
              <label className="field-label">
                Phone
                <input
                  value={form.telefon}
                  onChange={(e) => updateField("telefon", e.target.value)}
                />
              </label>
              <label className="field-label">
                Address
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
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <dl className="profil-list">
                <div className="profil-row">
                  <dt>Name</dt>
                  <dd>
                    {profil.prenume} {profil.nume}
                  </dd>
                </div>
                <div className="profil-row">
                  <dt>Email</dt>
                  <dd>{profil.email}</dd>
                </div>
                <div className="profil-row">
                  <dt>Phone</dt>
                  <dd>{profil.telefon || "-"}</dd>
                </div>
                <div className="profil-row">
                  <dt>Address</dt>
                  <dd>{profil.adresa || "-"}</dd>
                </div>
              </dl>

              <div className="profil-actions">
                <button type="button" className="btn-primary" onClick={startEdit}>
                  Edit
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}