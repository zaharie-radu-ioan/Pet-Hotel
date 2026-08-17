import { apiFetch } from "./client";

export function listMyActivities() {
  return apiFetch("/activitati/me");
}

export function updateActivityStatus(idActivitate, status) {
  return apiFetch(`/activitati/${idActivitate}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}