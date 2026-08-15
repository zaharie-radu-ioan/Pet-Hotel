import { apiFetch } from "./client";

export function createReservation(dataInceput, dataFinal) {
  return apiFetch("/rezervari", {
    method: "POST",
    body: JSON.stringify({ data_inceput: dataInceput, data_final: dataFinal }),
  });
}

export function listReservations() {
  return apiFetch("/rezervari");
}

