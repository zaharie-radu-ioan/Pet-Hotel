import { useState } from "react";

function toInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

const STATUS_OPTIONS = [
  { value: "planificata", label: "Planned" },
  { value: "in_curs", label: "In Progress" },
  { value: "finalizata", label: "Completed" },
  { value: "anulata", label: "Cancelled" },
];

export default function Task({
  title,
  initialValues,
  employees,
  showStatus = false,
  submitLabel,
  saving,
  error,
  onCancel,
  onSubmit,
}) {
  const [form, setForm] = useState({
    tip_activitate: initialValues?.tip_activitate ?? "",
    ora_inceput: toInputValue(initialValues?.ora_inceput),
    ora_final: toInputValue(initialValues?.ora_final),
    status: initialValues?.status ?? "planificata",
    observatii: initialValues?.observatii ?? "",
    id_cazare: initialValues?.id_cazare ?? "",
    id_angajat: initialValues?.id_angajat ?? employees[0]?.id_angajat ?? "",
  });

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(evt) {
    evt.preventDefault();

    onSubmit({
      tip_activitate: form.tip_activitate.trim(),
      ora_inceput: form.ora_inceput ? new Date(form.ora_inceput).toISOString() : null,
      ora_final: form.ora_final ? new Date(form.ora_final).toISOString() : null,
      status: form.status,
      observatii: form.observatii.trim() || null,
      id_cazare: form.id_cazare === "" ? null : Number(form.id_cazare),
      id_angajat: Number(form.id_angajat),
    });
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>{title}</h2>

        <form className="profil-edit" onSubmit={handleSubmit}>
          <label className="field-label">
            Activity type
            <input
              type="text"
              value={form.tip_activitate}
              onChange={(e) => update("tip_activitate", e.target.value)}
              placeholder="e.g. Feeding, Walk, Grooming"
              required
            />
          </label>

          <label className="field-label">
            Employee
            <select
              value={form.id_angajat}
              onChange={(e) => update("id_angajat", e.target.value)}
              required
            >
              {employees.map((emp) => (
                <option key={emp.id_angajat} value={emp.id_angajat}>
                  {emp.prenume} {emp.nume}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label">
            Start time
            <input
              type="datetime-local"
              value={form.ora_inceput}
              onChange={(e) => update("ora_inceput", e.target.value)}
              required
            />
          </label>

          <label className="field-label">
            End time (optional)
            <input
              type="datetime-local"
              value={form.ora_final}
              onChange={(e) => update("ora_final", e.target.value)}
            />
          </label>

          {showStatus && (
            <label className="field-label">
              Status
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="field-label">
            Stay ID (optional)
            <input
              type="number"
              min="1"
              value={form.id_cazare}
              onChange={(e) => update("id_cazare", e.target.value)}
              placeholder="Linked stay ID, if any"
            />
          </label>

          <label className="field-label">
            Notes
            <textarea
              rows="3"
              value={form.observatii}
              onChange={(e) => update("observatii", e.target.value)}
              placeholder="e.g. Feeding according to schedule"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="profil-actions">
            <button type="button" className="btn-ghost" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}