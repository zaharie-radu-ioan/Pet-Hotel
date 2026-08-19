import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

export default function ServicesChart({ data }) {
    return (
        <div className="bi-chart-card">
            <div className="bi-chart-header">
                <h2>Servicii populare</h2>
                <p>Serviciile cu cele mai multe utilizări</p>
            </div>

            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                        dataKey="service"
                        angle={-25}
                        textAnchor="end"
                        height={80}
                    />

                    <YAxis />

                    <Tooltip />

                    <Bar
                        dataKey="bookings"
                        name="Utilizări"
                        fill="#315d32"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}