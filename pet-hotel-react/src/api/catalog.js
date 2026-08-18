import { apiFetch } from "./client";

export function listPackages() {
  return apiFetch("/pachete");
}

export function getAvailability(startDate, endDate) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });
  return apiFetch(`/disponibilitate?${params}`);
}