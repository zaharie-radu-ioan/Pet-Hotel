import { useEffect, useState } from "react";

import StatCard from "../components/StatCard";
import ReservationsChart from "../components/ReservationsChart";
import ServicesChart from "../components/ServicesChart";
import PaymentsChart from "../components/PaymentsChart";
import "./BusinessIntelligence.css";

import {
    getAnalyticsKpis,
    getReservationsAnalytics,
    getServicesAnalytics,
    getPaymentsAnalytics,
} from "../api/analytics";

export default function BusinessIntelligence() {
    const [kpis, setKpis] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [services, setServices] = useState([]);
    const [payments, setPayments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadAnalytics() {
            try {
                setLoading(true);
                setError("");

                const [
                    kpisData,
                    reservationsData,
                    servicesData,
                    paymentsData,
                ] = await Promise.all([
                    getAnalyticsKpis(),
                    getReservationsAnalytics(),
                    getServicesAnalytics(),
                    getPaymentsAnalytics(),
                ]);

                setKpis(kpisData);
                setReservations(reservationsData);
                setServices(servicesData);
                setPayments(paymentsData);
            } catch (err) {
                console.error(err);
                setError("Unable to load Business Intelligence data.");
            } finally {
                setLoading(false);
            }
        }

        loadAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="bi-loading">
                <div className="bi-loading-spinner"></div>
                <p>Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bi-error">
                <h2>Something went wrong</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="bi-page">
            <div className="bi-header">
                <div>
                    <span className="bi-eyebrow">
                        PET HOTEL · ANALYTICS
                    </span>
                    <h1>Business Intelligence</h1>
                    <p>
                        Monitor hotel performance and gain insights from your business data.
                    </p>
                </div>
            </div>

            <div className="bi-stats">
                <StatCard
                    title="Total Reservations"
                    value={kpis?.totalReservations ?? 0}
                    description="Active reservations"
                />
                <StatCard
                    title="Total Revenue"
                    value={`${(kpis?.totalRevenue ?? 0).toFixed(2)} RON`}
                    description="Revenue generated from reservations"
                />
                <StatCard
                    title="Average Reservation"
                    value={`${(kpis?.averageReservation ?? 0).toFixed(2)} RON`}
                    description="Average reservation value"
                />
            </div>

            <div className="bi-grid">
                <div className="bi-chart-container">
                    <ReservationsChart data={reservations} />
                </div>

                <div className="bi-chart-container">
                    <ServicesChart data={services} />
                </div>
            </div>

            <div className="bi-grid">
                <div className="bi-chart-container">
                    <PaymentsChart data={payments} />
                </div>

                <div className="bi-info-card">
                    <div className="bi-card-header">
                        <span className="bi-card-label">OVERVIEW</span>
                        <h2>Key Indicators</h2>
                    </div>

                    <div className="bi-insight">
                        <span>Reservations</span>
                        <strong>{kpis?.totalReservations ?? 0}</strong>
                    </div>

                    <div className="bi-insight">
                        <span>Revenue</span>
                        <strong>{(kpis?.totalRevenue ?? 0).toFixed(2)} RON</strong>
                    </div>

                    <div className="bi-insight">
                        <span>Average value</span>
                        <strong>{(kpis?.averageReservation ?? 0).toFixed(2)} RON</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}
