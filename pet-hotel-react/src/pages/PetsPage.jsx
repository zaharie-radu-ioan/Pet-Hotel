import { useEffect, useState } from "react";
import { ApiError } from "../api/client";
import { createAnimal, listAnimals, updateAnimal, deleteAnimal } from "../api/animale";
import AppHeader from "../components/AppHeader";

const dogBreeds = [
  "Labrador Retriever",
  "Golden Retriever",
  "Ciobănesc German",
  "Bulldog",
  "Beagle",
  "Husky Siberian",
  "Rottweiler",
  "Chihuahua",
  "Pudel",
  "Cocker Spaniel",
  "Border Collie",
  "Teckel",
  "Alta",
];

const catBreeds = [
  "British Shorthair",
  "Persană",
  "Siameză",
  "Maine Coon",
  "Bengaleză",
  "Ragdoll",
  "Sfinx",
  "Scottish Fold",
  "Angora Turcească",
  "Albastru de Rusia",
  "Norvegiană de Pădure",
  "Alta",
];

export default function PetsPage() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [editingAnimal, setEditingAnimal] = useState(null);

  const [animalToDelete, setAnimalToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
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

      ...(name === "specie" && {
        rasa: "",
      }),
    }));
  }

  function resetForm() {
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

  setEditingAnimal(null);
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

      if (editingAnimal) {
        const updatedAnimal = await updateAnimal(
          editingAnimal.id_animal,
          data
        );

        setAnimals((current) =>
          current.map((animal) =>
            animal.id_animal === updatedAnimal.id_animal
              ? updatedAnimal
              : animal
          )
        );
      } else {
        const newAnimal = await createAnimal(data);

        setAnimals((current) => [...current, newAnimal]);
      }

      resetForm();
      setShowForm(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(
          editingAnimal
            ? "Nu am putut modifica animalul."
            : "Nu am putut adăuga animalul."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(animal) {
  setAnimalToDelete(animal);
  }

  async function confirmDelete() {
    if (!animalToDelete) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteAnimal(animalToDelete.id_animal);

      setAnimals((current) =>
        current.filter(
          (animal) => animal.id_animal !== animalToDelete.id_animal
        )
      );

      setAnimalToDelete(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Nu am putut șterge animalul.");
      }
    } finally {
      setDeleting(false);
    }
  }

  function handleCustomize(animal) {
    setEditingAnimal(animal);

    setForm({
      nume: animal.nume ?? "",
      specie: animal.specie ?? "",
      rasa: animal.rasa ?? "",
      sex: animal.sex ?? "",
      data_nasterii: animal.data_nasterii ?? "",
      greutate: animal.greutate ?? "",
      sterilizat: Boolean(animal.sterilizat),
      observatii: animal.observatii ?? "",
    });

  setShowForm(true);
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
              onClick={() => {
                if (showForm) {
                  setShowForm(false);
                 resetForm();
                } else {
                  resetForm();
                  setShowForm(true);
                }
              }}
            >

              {showForm ? "Renunță" : "+ Adaugă animal"}
            </button>
            
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
                className="pets-grid"
                style={{ marginTop: "24px" }}
              >
                {animals.map((animal) => (
                  <div
                    className="pet-card"
                    key={animal.id_animal}
                  >
                    <div className="pet-card-image">
                      <span>
                        {animal.specie === "Caine" ? "🐶" : "🐱"}
                      </span>
                    </div>

                    <div className="pet-card-content">
                      <h2>{animal.nume}</h2>

                      <p className="pet-card-breed">
                        {animal.specie}
                        {animal.rasa ? ` • ${animal.rasa}` : ""}
                      </p>

                      <div className="pet-card-details">
                        {animal.sex && (
                          <span>
                            {animal.sex === "M" ? "Mascul" : "Femelă"}
                          </span>
                        )}

                        {animal.greutate && (
                          <span>
                            {animal.greutate} kg
                          </span>
                        )}
                      </div>

                      <div className="pet-card-actions">
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handleCustomize(animal)}
                        >
                          Customize
                        </button>

                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => handleDelete(animal)}
                        >
                          Șterge
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-card pet-form-modal">
            <h2>
              {editingAnimal ? "Personalizează animalul" : "Adaugă un animal"}
            </h2>

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
                <select
                  name="rasa"
                  value={form.rasa}
                  onChange={handleChange}
                  disabled={!form.specie}
                >
                  <option value="">
                    {form.specie
                      ? "Selectează rasa"
                      : "Selectează mai întâi specia"}
                  </option>

                  {(form.specie === "Caine"
                    ? dogBreeds
                    : form.specie === "Pisica"
                      ? catBreeds
                      : []
                  ).map((breed) => (
                    <option key={breed} value={breed}>
                      {breed}
                    </option>
                  ))}
                </select>
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
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Anulează
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Se salvează..."
                    : editingAnimal
                      ? "Salvează modificările"
                      : "Adaugă animal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {animalToDelete && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Ștergi animalul?</h2>

              <p>
                Ești sigur că vrei să ștergi animalul{" "}
                <strong>{animalToDelete.nume}</strong>?
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setAnimalToDelete(null)}
                  disabled={deleting}
                >
                  Nu
                </button>

                <button
                  type="button"
                  className="btn-danger"
                  onClick={confirmDelete}
                  disabled={deleting}
                >
                  {deleting ? "Se șterge..." : "Da, șterge"}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}