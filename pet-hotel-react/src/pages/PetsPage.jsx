import { useEffect, useState } from "react";
import { ApiError } from "../api/client";
import { createAnimal, listAnimals, updateAnimal, deleteAnimal } from "../api/animale";
import AppHeader from "../components/AppHeader";

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
          setError("We could not load your pets.");
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
            ? "We could not update this pet."
            : "We could not add this pet."
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
        setError("We could not delete this pet.");
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
          Pick the pet you want to customize.
        </p>

        {loading && (
          <p className="muted-text">
            Loading your pets...
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

              {showForm ? "Cancel" : "+ Add pet"}
            </button>

            {animals.length === 0 && !showForm && (
              <div className="card" style={{ marginTop: "24px" }}>
                <h2>You have no pets yet</h2>

                <p className="muted-text">
                  Add your first pet so you can customize it.
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
                        Weight: {animal.greutate} kg
                      </p>
                    )}

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
                      Delete
                    </button>
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
              {editingAnimal ? "Customize pet" : "Add a pet"}
            </h2>

            <form
              className="profil-edit"
              onSubmit={handleSubmit}
            >
              <label className="field-label">
                Name
                <input
                  type="text"
                  name="nume"
                  value={form.nume}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="field-label">
                Species
                <select
                  name="specie"
                  value={form.specie}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a species</option>
                  <option value="Caine">Dog</option>
                  <option value="Pisica">Cat</option>
                </select>
              </label>

              <label className="field-label">
                Breed
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
                  <option value="">Not specified</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </label>

              <label className="field-label">
                Date of birth
                <input
                  type="date"
                  name="data_nasterii"
                  value={form.data_nasterii}
                  onChange={handleChange}
                />
              </label>

              <label className="field-label">
                Weight (kg)
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
                Notes
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
                {" "}Neutered
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
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingAnimal
                      ? "Save changes"
                      : "Add pet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {animalToDelete && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Delete this pet?</h2>

              <p>
                Are you sure you want to delete{" "}
                <strong>{animalToDelete.nume}</strong>?
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setAnimalToDelete(null)}
                  disabled={deleting}
                >
                  No
                </button>

                <button
                  type="button"
                  className="btn-danger"
                  onClick={confirmDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Yes, delete"}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}