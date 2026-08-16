import { useEffect, useState } from "react";
import { ApiError } from "../api/client";
import { createAnimal, listAnimals } from "../api/animale";
import AppHeader from "../components/AppHeader";

export default function PetsPage() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nume: "",
    specie: "",
    rasa: "",
    sex: "",
    data_nasterii: "",
    greutate: "",
    sterilizat: false,
    observatii: "",
  });

  useEffect(() => {
    async function loadAnimals() {
      try {
        setLoading(true);
        setError("");

        const data = await listAnimals();
        setAnimals(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Nu am putut încărca animalele.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadAnimals();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const data = {
        nume: form.nume,
        specie: form.specie,
        rasa: form.rasa || null,
        sex: form.sex || null,
        data_nasterii: form.data_nasterii || null,
        greutate: form.greutate ? Number(form.greutate) : null,
        sterilizat: form.sterilizat,
        observatii: form.observatii || null,
      };

      const newAnimal = await createAnimal(data);

      setAnimals((current) => [...current, newAnimal]);

      setForm({
        nume: "",
        specie: "",
        rasa: "",
        sex: "",
        data_nasterii: "",
        greutate: "",
        sterilizat: false,
        observatii: "",
      });

      setShowForm(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Nu am putut adăuga animalul.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dashboard">
      <AppHeader />

      <main className="dashboard-body">
        <h1>Customize your pet</h1>

        <p className="muted-text">
          Selectează animalul pe care vrei să îl personalizezi.
        </p>

        {loading && (
          <p className="muted-text">
            Se încarcă animalele...
          </p>
        )}

        {error && (
          <p className="error-text">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowForm((current) => !current)}
            >
              {showForm ? "Renunță" : "+ Adaugă animal"}
            </button>

            {showForm && (
              <div className="card" style={{ marginTop: "24px" }}>
                <h2>Adaugă un animal</h2>

                <form
                  className="profil-edit"
                  onSubmit={handleSubmit}
                >
                  <label className="field-label">
                    Nume
                    <input
                      type="text"
                      name="nume"
                      value={form.nume}
                      onChange={handleChange}
                      required
                    />
                  </label>

                  <label className="field-label">
                    Specie
                    <select
                      name="specie"
                      value={form.specie}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selectează specia</option>
                      <option value="Caine">Câine</option>
                       <option value="Pisica">Pisică</option>
                     </select>
                  </label>

                  <label className="field-label">
                    Rasă
                    <input
                      type="text"
                      name="rasa"
                      value={form.rasa}
                      onChange={handleChange}
                      placeholder="Ex. Labrador"
                    />
                  </label>

                  <label className="field-label">
                    Sex
                    <select
                      name="sex"
                      value={form.sex}
                      onChange={handleChange}
                    >
                      <option value="">Nespecificat</option>
                      <option value="M">Mascul</option>
                      <option value="F">Femelă</option>
                    </select>
                  </label>

                  <label className="field-label">
                    Data nașterii
                    <input
                      type="date"
                      name="data_nasterii"
                      value={form.data_nasterii}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="field-label">
                    Greutate (kg)
                    <input
                      type="number"
                      name="greutate"
                      value={form.greutate}
                      onChange={handleChange}
                      min="0.01"
                      step="0.01"
                    />
                  </label>

                  <label className="field-label">
                    Observații
                    <textarea
                      name="observatii"
                      value={form.observatii}
                      onChange={handleChange}
                      rows="4"
                    />
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      name="sterilizat"
                      checked={form.sterilizat}
                      onChange={handleChange}
                    />
                    {" "}Sterilizat
                  </label>

                  <div className="profil-actions">
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setShowForm(false)}
                    >
                      Anulează
                    </button>

                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={saving}
                    >
                      {saving ? "Se salvează..." : "Adaugă animal"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {animals.length === 0 && !showForm && (
              <div className="card" style={{ marginTop: "24px" }}>
                <h2>Nu ai animale adăugate</h2>

                <p className="muted-text">
                  Adaugă primul tău animal pentru a putea să îl personalizezi.
                </p>
              </div>
            )}

            {animals.length > 0 && (
              <div
                className="hub-grid"
                style={{ marginTop: "24px" }}
              >
                {animals.map((animal) => (
                  <div
                    className="hub-card"
                    key={animal.id_animal}
                  >
                    <h2>{animal.nume}</h2>

                    <p>
                      {animal.specie}
                      {animal.rasa ? ` • ${animal.rasa}` : ""}
                    </p>

                    {animal.sex && (
                      <p>
                        Sex: {animal.sex}
                      </p>
                    )}

                    {animal.greutate && (
                      <p>
                        Greutate: {animal.greutate} kg
                      </p>
                    )}

                    <button
                      type="button"
                      className="btn-primary"
                    >
                      Customize
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}