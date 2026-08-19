import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
} from "recharts";

const COLORS = [
    "#315d32",
    "#172bd0",
    "#d6a84f",
    "#8b5cf6",
];

export default function PaymentsChart({ data }) {
    return (
        <div className="bi-chart-card">
            <div className="bi-chart-header">
                <h2>Metode de plată</h2>
                <p>Distribuția plăților confirmate</p>
            </div>

            <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="total"
                        nameKey="metoda"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={
                                    COLORS[
                                        index % COLORS.length
                                    ]
                                }
                            />
                        ))}
                    </Pie>

                    <Tooltip />

                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}