import { apiFetch } from "./client";

export function getProfil() {
  return apiFetch("/profil");
}

export function updateProfil(data) {
  return apiFetch("/profil", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}