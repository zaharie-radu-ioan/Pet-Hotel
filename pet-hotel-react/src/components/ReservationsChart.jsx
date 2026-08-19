import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

export default function ReservationsChart({ data }) {
    return (
        <div className="bi-chart-card">
            <div className="bi-chart-header">
                <h2>Evoluția rezervărilor</h2>
                <p>Numărul de rezervări și veniturile lunare</p>
            </div>

            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="month" />

                    <YAxis />

                    <Tooltip />

                    <Line
                        type="monotone"
                        dataKey="reservations"
                        name="Rezervări"
                        stroke="#315d32"
                        strokeWidth={3}
                    />

                    <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Venit"
                        stroke="#172bd0"
                        strokeWidth={3}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}