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