import {
    ResponsiveContainer,
    BarChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
} from "recharts";

const mockData = [
    { dia: "Lun", unidades: 8 },
    { dia: "Mar", unidades: 5 },
    { dia: "Mié", unidades: 9 },
    { dia: "Jue", unidades: 12 },
    { dia: "Vie", unidades: 7 },
    { dia: "Sáb", unidades: 14 },
    { dia: "Dom", unidades: 10 },
];

export default function VentasChart() {
    return (
        <ResponsiveContainer width="100%" height={320} minWidth={0}>

            <BarChart data={mockData}>
                <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                <XAxis dataKey="dia" stroke="#e5e7eb" tick={{ fill: "#e5e7eb" }} />
                <YAxis stroke="#e5e7eb" tick={{ fill: "#e5e7eb" }} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "#111",
                        border: "1px solid #333",
                        borderRadius: "8px",
                        color: "#e5e7eb",
                    }}
                    labelStyle={{ color: "#e5e7eb" }}
                />
                <Legend wrapperStyle={{ color: "#e5e7eb" }} />

                <Bar dataKey="unidades" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Line
                    type="monotone"
                    dataKey="unidades"
                    stroke="#60a5fa"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#60a5fa" }}
                />
            </BarChart>
        </ResponsiveContainer>
    );

}
