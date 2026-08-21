import { apiFetch } from "./client";

export function fetchNotifications() {
  return apiFetch("/notificari");
}

export function fetchUnreadCount() {
  return apiFetch("/notificari/necitite");
}

export function markNotificationsSeen() {
  return apiFetch("/notificari/vazute", {
    method: "POST",
  });
}