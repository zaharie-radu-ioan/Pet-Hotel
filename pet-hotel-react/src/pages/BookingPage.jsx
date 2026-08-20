import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client";
import { listAnimals } from "../api/animale";
import { getAvailability, listPackages } from "../api/catalog";
import { createReservation, listReservations } from "../api/rezervari";
import AppHeader from "../components/AppHeader";

const STATUS_LABELS = {
  ceruta: "Requested",
  confirmata: "Confirmed",
  in_desfasurare: "In progress",
  finalizata: "Completed",
  anulata: "Cancelled",
};

function today() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function countNights(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function money(value) {
  return `${Number(value).toFixed(2)} RON`;
}


function day(value) {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const EMPTY_STAY = { animal_id: "", room_type: "", package_id: "", feeding_time_1: "08:00", feeding_time_2: "13:00", feeding_time_3: "19:00" };

export default function BookingPage() {
  const minDate = today();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stays, setStays] = useState([{ ...EMPTY_STAY }]);

  const [animals, setAnimals] = useState([]);
  const [packages, setPackages] = useState([]);
  const [availability, setAvailability] = useState([]);

  const [reservations, setReservations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nights = countNights(startDate, endDate);

  async function loadReservations() {
    try {
      setReservations(await listReservations());
      setListError("");
    } catch {
      setListError("We could not load your bookings.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    async function loadEverything() {
      try {
        const [animalList, packageList] = await Promise.all([
          listAnimals(),
          listPackages(),
        ]);
        setAnimals(animalList);
        setPackages(packageList);
      } catch {
        setFormError("We could not load your pets and the packages.");
      }
      await loadReservations();
    }

    loadEverything();
  }, []);

  // Availability depends on the dates, so it is refetched whenever they change.
  useEffect(() => {
    if (nights <= 0) {
      setAvailability([]);
      return;
    }

    let cancelled = false;
    async function loadAvailability() {
      try {
        const data = await getAvailability(startDate, endDate);
        if (!cancelled) setAvailability(data);
      } catch {
        if (!cancelled) setAvailability([]);
      }
    }

    loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, nights]);

  function handleStartDateChange(value) {
    setStartDate(value);
    if (endDate && endDate <= value) {
      setEndDate("");
    }
  }

  function updateStay(index, field, value) {
    setStays((current) =>
      current.map((stay, i) => (i === index ? { ...stay, [field]: value } : stay))
    );
  }

  function addStay() {
    setStays((current) => [...current, { ...EMPTY_STAY }]);
  }

  function removeStay(index) {
    setStays((current) => current.filter((_, i) => i !== index));
  }

  function roomPrice(roomType) {
    const room = availability.find((r) => r.room_type === roomType);
    return room ? Number(room.price_per_night) : 0;
  }

  function packagePrice(packageId) {
    const chosen = packages.find((p) => String(p.id) === String(packageId));
    return chosen ? Number(chosen.price_per_night) : 0;
  }

  // Mirrors what the backend charges: nights x (room + package), per animal.
  function estimatedTotal() {
    return stays.reduce(
      (sum, stay) =>
        sum + (roomPrice(stay.room_type) + packagePrice(stay.package_id)) * nights,
      0
    );
  }

  function validate() {
    if (!startDate || !endDate) return "Pick both dates.";
    if (nights <= 0) return "A booking needs at least one night.";
    if (stays.length === 0) return "Add at least one pet.";

    for (const stay of stays) {
      if (!stay.animal_id) return "Pick a pet on every row.";
      if (!stay.room_type) return "Pick a room type for every pet.";
      if (!stay.package_id) return "Pick a package for every pet.";
      
      const feedingTimes = [
        stay.feeding_time_1,
        stay.feeding_time_2,
        stay.feeding_time_3,
      ];

      if (feedingTimes.some((time) => !time)) {
        return "Pick all three feeding times for every pet.";
      }

      if (new Set(feedingTimes).size !== 3) {
        return "The three feeding times must be different.";
      }
    }

    const chosenAnimals = stays.map((stay) => stay.animal_id);
    if (new Set(chosenAnimals).size !== chosenAnimals.length) {
      return "You picked the same pet twice.";
    }

    // Catch the obvious case client-side; the backend checks again under a lock.
    const perRoomType = {};
    for (const stay of stays) {
      perRoomType[stay.room_type] = (perRoomType[stay.room_type] ?? 0) + 1;
    }
    for (const [roomType, wanted] of Object.entries(perRoomType)) {
      const room = availability.find((r) => r.room_type === roomType);
      if (!room || room.rooms_free < wanted) {
        return `Not enough ${roomType} rooms are free for these dates.`;
      }
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }

    setSubmitting(true);
    try {
      await createReservation({
        start_date: startDate,
        end_date: endDate,
        stays: stays.map((stay) => ({
          animal_id: Number(stay.animal_id),
          room_type: stay.room_type,
          package_id: Number(stay.package_id),
          feeding_times: [
          stay.feeding_time_1,
          stay.feeding_time_2,
          stay.feeding_time_3,
        ],
        })),
      });

      setSuccess("Booking saved. Your invoice has been issued.");
      setStartDate("");
      setEndDate("");
      setStays([{ ...EMPTY_STAY }]);
      await loadReservations();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "We could not create the booking."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dashboard">
      <AppHeader />
      <main className="dashboard-body booking-body">
        <h1>My bookings</h1>
        <p className="muted-text">
          Pick your dates, then a room and a package for each pet.
        </p>

        <section className="card">
          <h2>New booking</h2>
          <form onSubmit={handleSubmit} className="bk-form" noValidate>
            <div className="bk-dates">
              <label className="bk-field">
                <span className="bk-field-label">Check-in</span>
                <input
                  type="date"
                  min={minDate}
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                />
              </label>
              <label className="bk-field">
                <span className="bk-field-label">Check-out</span>
                <input
                  type="date"
                  min={startDate || minDate}
                  value={endDate}
                  disabled={!startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </div>

            {nights > 0 && (
              <div className="bk-availability">
                <span className="bk-nights">
                  {nights} {nights === 1 ? "night" : "nights"}
                </span>
                {availability.map((room) => (
                  <span
                    key={room.room_type}
                    className={`bk-chip${room.rooms_free === 0 ? " bk-chip-empty" : ""}`}
                  >
                    {room.room_type} · {room.rooms_free} free ·{" "}
                    {money(room.price_per_night)}/night
                  </span>
                ))}
              </div>
            )}

            {stays.map((stay, index) => (
              <div key={index} className="bk-stay">
                {stays.length > 1 && (
                  <button
                    type="button"
                    className="bk-remove"
                    onClick={() => removeStay(index)}
                  >
                    Remove
                  </button>
                )}

                <label className="bk-field">
                  <span className="bk-field-label">Pet</span>
                  <select
                    value={stay.animal_id}
                    onChange={(e) => updateStay(index, "animal_id", e.target.value)}
                  >
                    <option value="">Select...</option>
                    {animals.map((animal) => (
                      <option key={animal.id_animal} value={animal.id_animal}>
                        {animal.nume}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="bk-field">
                  <span className="bk-field-label">Room</span>
                  <select
                    value={stay.room_type}
                    disabled={nights <= 0}
                    onChange={(e) => updateStay(index, "room_type", e.target.value)}
                  >
                    <option value="">
                      {nights > 0 ? "Select..." : "Pick your dates first"}
                    </option>
                    {availability.map((room) => (
                      <option key={room.room_type} value={room.room_type}>
                        {room.room_type} — {money(room.price_per_night)}/night
                      </option>
                    ))}
                  </select>
                </label>

                <label className="bk-field">
                  <span className="bk-field-label">Package</span>
                  <select
                    value={stay.package_id}
                    onChange={(e) => updateStay(index, "package_id", e.target.value)}
                  >
                    <option value="">Select...</option>
                    {packages.map((pack) => (
                      <option key={pack.id} value={pack.id}>
                        {pack.name} — {money(pack.price_per_night)}/night
                      </option>
                    ))}
                  </select>
                </label>

                <div className="bk-feeding ">
                  <span className="bk-field-label">Feeding times</span>

                  <div className="bk-feeding-times">
                    <label className="bk-field">
                      <span className="bk-field-label">Meal 1</span>
                      <input
                        type="time"
                        value={stay.feeding_time_1}
                        onChange={(e) =>
                          updateStay(index, "feeding_time_1", e.target.value)
                        }
                      />
                    </label>

                    <label className="bk-field">
                      <span className="bk-field-label">Meal 2</span>
                      <input
                        type="time"
                        value={stay.feeding_time_2}
                        onChange={(e) =>
                          updateStay(index, "feeding_time_2", e.target.value)
                        }
                      />
                    </label>

                    <label className="bk-field">
                      <span className="bk-field-label">Meal 3</span>
                      <input
                        type="time"
                        value={stay.feeding_time_3}
                        onChange={(e) =>
                          updateStay(index, "feeding_time_3", e.target.value
                        )}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}

            {packageSummary(stays, packages)}

            <button type="button" className="bk-add" onClick={addStay}>
              + Add another pet
            </button>

            {nights > 0 && (
              <div className="bk-total">
                <span className="bk-total-label">Estimated total</span>
                <span className="bk-total-value">{money(estimatedTotal())}</span>
              </div>
            )}

            <button className="bk-submit" type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Request booking"}
            </button>
          </form>

          {formError && <p className="bk-message bk-message-error">{formError}</p>}
          {success && <p className="bk-message bk-message-success">{success}</p>}
        </section>

        <section className="card list-card">
          <h2>History</h2>
          {loadingList ? (
            <p className="muted-text">Loading...</p>
          ) : listError ? (
            <p className="bk-message bk-message-error">{listError}</p>
          ) : reservations.length === 0 ? (
            <p className="muted-text">You have no bookings yet.</p>
          ) : (
            <ul className="bk-list">
              {reservations.map((reservation) => (
                <li key={reservation.code} className="bk-item">
                  <div className="bk-item-main">
                    <div className="bk-item-dates">
                      {day(reservation.start_date)} &rarr; {day(reservation.end_date)}
                    </div>
                    <p className="bk-item-pets">
                      {reservation.stays
                        .map(
                          (stay) =>
                            `${stay.animal} (${stay.room_type}${
                              stay.package ? `, ${stay.package}` : ""
                            })`
                        )
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="bk-item-side">
                    <span className={`status-badge status-${reservation.status}`}>
                      {STATUS_LABELS[reservation.status] ?? reservation.status}
                    </span>
                    <span className="bk-item-price">{money(reservation.total)}</span>
                    <Link
                      className="bk-item-link"
                      to={`/rezervari/${reservation.code}/factura`}
                    >
                      View invoice
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

// Shows what the selected packages include, so the price has a visible reason.
function packageSummary(stays, packages) {
  const chosen = packages.filter((pack) =>
    stays.some((stay) => String(stay.package_id) === String(pack.id))
  );
  if (chosen.length === 0) return null;

  return (
    <ul className="bk-help">
      {chosen.map((pack) => (
        <li key={pack.id}>
          <strong>{pack.name}:</strong>{" "}
          {pack.included_services.length > 0
            ? pack.included_services
                .map((service) => `${service.name} x${service.per_night}/night`)
                .join(", ")
            : "no services included"}
        </li>
      ))}
    </ul>
  );
}