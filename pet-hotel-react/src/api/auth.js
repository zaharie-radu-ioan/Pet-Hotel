import { apiFetch, setAccessToken } from "./client";

export function register(payload) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Backend returns access_token in the body; the refresh token is set as an
// httponly cookie we never touch.
export async function login(email, password) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(data.access_token);
  return data;
}

export function logout() {
  return apiFetch("/auth/logout", { method: "POST" });
}

export function me() {
  return apiFetch("/auth/me");
}
