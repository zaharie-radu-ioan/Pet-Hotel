import { apiDownload, apiFetch } from "./client";

// payload: { start_date, end_date, stays: [{ animal_id, room_type, package_id }] }
export function createReservation(payload) {
  return apiFetch("/rezervari", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listReservations() {
  return apiFetch("/rezervari");
}

export function getReservation(code) {
  return apiFetch(`/rezervari/${code}`);
}

export function getInvoice(code) {
  return apiFetch(`/rezervari/${code}/factura`);
}

export function downloadInvoicePdf(code) {
  return apiDownload(`/rezervari/${code}/factura/pdf`, {
    headers: { Accept: "application/pdf" },
  });
}

export function payReservation(code, method) {
  return apiFetch(`/rezervari/${code}/plata`, {
    method: "POST",
    body: JSON.stringify({ method }),
  });
}