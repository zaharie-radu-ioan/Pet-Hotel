import { useEffect, useState } from "react";
import { ApiError } from "../api/client";
import { createAnimal, listAnimals, updateAnimal, deleteAnimal } from "../api/animale";
import AppHeader from "../components/AppHeader";

const dogBreeds = [
  "Labrador Retriever",
  "Golden Retriever",
  "German Shepherd",
  "Bulldog",
  "Beagle",
  "Siberian Husky",
  "Rottweiler",
  "Chihuahua",
  "Poodle",
  "Cocker Spaniel",
  "Border Collie",
  "Dachshund",
  "Bichon",
  "Other",
];

const catBreeds = [
  "British Shorthair",
  "Persian",
  "Siamese",
  "Maine Coon",
  "Bengal",
  "Ragdoll",
  "Sphynx",
  "Scottish Fold",
  "Turkish Angora",
  "Russian Blue",
  "Norwegian Forest Cat",
  "Other",
];

const breedImages = {
  "Labrador Retriever": "./pet-avatars/labrador-photo.jpg",
  "Golden Retriever": "./pet-avatars/golden-photo.jpg",
  "German Shepherd": "./pet-avatars/german-shepherd-photo.jpg",
  "Bulldog": "./pet-avatars/bulldog-photo.jpg",
  "Beagle": "./pet-avatars/beagle-photo.jpg",
  "Siberian Husky": "./pet-avatars/husky-photo.jpg",
  "Rottweiler": "./pet-avatars/rottweiler-photo.jpg",
  "Chihuahua": "./pet-avatars/chihuahua-photo.jpg",
  "Poodle": "./pet-avatars/poodle-photo.jpg",
  "Cocker Spaniel": "./pet-avatars/cocker-photo.jpg",
  "Border Collie": "./pet-avatars/border-collie-photo.jpg",
  "Dachshund": "./pet-avatars/dachshund-photo.jpg",
  "Bichon": "./pet-avatars/bichon-photo.jpg",

  "British Shorthair": "./pet-avatars/british-shorthair-photo.jpg",
  "Persian": "./pet-avatars/persian-photo.jpg",
  "Siamese": "./pet-avatars/siamese-photo.jpg",
  "Maine Coon": "./pet-avatars/maine-coon-photo.jpg",
  "Bengal": "./pet-avatars/bengal-photo.jpg",
  "Ragdoll": "./pet-avatars/ragdoll-photo.jpg",
  "Sphynx": "./pet-avatars/sphynx-photo.jpg",
  "Scottish Fold": "./pet-avatars/scottish-fold-photo.jpg",
  "Turkish Angora": "./pet-avatars/turkish-angora-photo.jpg",
  "Russian Blue": "./pet-avatars/russian-blue-photo.jpg",
  "Norwegian Forest Cat": "./pet-avatars/norwegian-forest-photo.jpg",
};

function getPetImage(animal) {
  return breedImages[animal.rasa] || null;
}

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
          setError("We could not load the pets.");
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
            ? "We could not update the pet."
            : "We could not add the pet."
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
        setError("We could not delete the pet.");
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
          Select the pet you want to customize.
        </p>

        {loading && (
          <p className="muted-text">
            Loading pets...
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

              {showForm ? "Cancel" : "+ Add Pet"}
            </button>

            {animals.length === 0 && !showForm && (
              <div className="card" style={{ marginTop: "24px" }}>
                <h2>No pets added yet.</h2>

                <p className="muted-text">
                  Add your first pet to get started.
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
                      {getPetImage(animal) ? (
                        <img
                          src={getPetImage(animal)}
                          alt={`${animal.rasa} - ${animal.nume}`}
                        />
                      ) : (
                        <span>
                          {animal.specie === "Caine" ? "🐶" : "🐱"}
                        </span>
                      )}
                    </div>

                    <div className="pet-card-content">
                      <h2>{animal.nume}</h2>

                      <p className="pet-card-breed">
                        {animal.specie === "Caine"
                          ? "Dog"
                          : animal.specie === "Pisica"
                            ? "Cat"
                            : animal.specie}
                        {animal.rasa ? ` • ${animal.rasa}` : ""}
                      </p>

                      <div className="pet-card-details">
                        {animal.sex && (
                          <span>
                            {animal.sex === "M" ? "Male" : "Female"}
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
                          Delete
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
                  <option value="">Select species</option>
                  <option value="Caine">Dog</option>
                  <option value="Pisica">Cat</option>
                </select>
              </label>

              <label className="field-label">
                Breed
                <select
                  name="rasa"
                  value={form.rasa}
                  onChange={handleChange}
                  disabled={!form.specie}
                >
                  <option value="">
                    {form.specie
                      ? "Select breed"
                      : "Select species first"}
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
                  max="100"
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
                {" "}Neutered / Spayed
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
              <h2>Delete pet?</h2>

              <p>
                Are you sure you want to delete {" "}
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