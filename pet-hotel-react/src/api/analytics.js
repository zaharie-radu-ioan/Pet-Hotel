import { apiFetch } from "./client";

export function getAnalyticsKpis() {
    return apiFetch("/analytics/kpis");
}

export function getReservationsAnalytics() {
    return apiFetch("/analytics/reservations");
}

export function getServicesAnalytics() {
    return apiFetch("/analytics/services");
}

export function getPaymentsAnalytics() {
    return apiFetch("/analytics/payments");
}