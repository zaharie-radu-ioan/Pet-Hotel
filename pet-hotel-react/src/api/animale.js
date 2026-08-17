import { apiFetch } from "./client";

export function listAnimals() {
  return apiFetch("/animale");
}

export function createAnimal(data){
    return apiFetch("/animale",{
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function updateAnimal(idAnimal, data) {
  return apiFetch(`/animale/${idAnimal}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteAnimal(idAnimal) {
  return apiFetch(`/animale/${idAnimal}`, {
    method: "DELETE",
  });
}