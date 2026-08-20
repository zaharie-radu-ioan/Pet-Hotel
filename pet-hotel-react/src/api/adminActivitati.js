import { apiFetch } from "./client";

export function listEmployees() {
  return apiFetch("/activitati/admin/angajati");
}

export function getEmployeeActivities(idAngajat) {
  return apiFetch(`/activitati/admin/angajat/${idAngajat}`);
}

export function createActivity(data) {
  return apiFetch("/activitati/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateActivity(idActivitate, data) {
  return apiFetch(`/activitati/admin/${idActivitate}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteActivity(idActivitate) {
  return apiFetch(`/activitati/admin/${idActivitate}`, {
    method: "DELETE",
  });
}

export function listAllActivities() {
  return apiFetch("/activitati/admin");
}