import React, { useEffect, useState } from "react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts";

const COLORS = ["#34d399", "#60a5fa", "#fbbf24", "#ef4444", "#a78bfa"];

const pieLabel = ({ name, value }) => `${name} - ${value}`;

// Helper: week number (same as facility dashboard)
const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

export default function EquipmentDashboard() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("http://localhost:5000/api/fetch-equipment-bookings")
            .then((res) => res.json())
            .then((data) => {
                setBookings(data.bookings || []);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="p-6 text-gray-600">Loading equipment dashboard...</div>;
    }

    /* =========================
       DATA PROCESSING
    ========================== */

    // STATUS PIE
    const statusCounts = bookings.reduce((acc, b) => {
        const status = b.status || "Pending";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value
    }));

    // MONTHLY BOOKINGS
    const monthMap = {};
    bookings.forEach((b) => {
        if (!b.dates?.length) return;
        const month = new Date(b.dates[0]).toLocaleString("default", {
            month: "short"
        });
        monthMap[month] = (monthMap[month] || 0) + 1;
    });
    const monthlyData = Object.entries(monthMap).map(([month, count]) => ({
        month,
        count
    }));

    // WEEKLY BOOKINGS
    const weekMap = {};
    bookings.forEach((b) => {
        if (!b.dates?.length) return;
        const date = new Date(b.dates[0]);
        const week = `Week ${getWeekNumber(date)}`;
        weekMap[week] = (weekMap[week] || 0) + 1;
    });
    const weeklyData = Object.entries(weekMap)
        .map(([week, bookings]) => ({ week, bookings }))
        .sort((a, b) => {
            const wa = parseInt(a.week.replace("Week ", ""));
            const wb = parseInt(b.week.replace("Week ", ""));
            return wa - wb;
        });

    // RECENT BOOKINGS
    const recentBookings = [...bookings]
        .sort(
            (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
        )
        .slice(0, 5);

    /* =========================
       UI
    ========================== */

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">
                    Equipment Booking Dashboard
                </h1>
                <p className="text-gray-500 text-sm">
                    Overview of all equipment reservations
                </p>
            </div>

            {/* TOP ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* STATUS */}
                <div className="bg-gray-50 rounded-lg p-4 shadow border-t-4 border-[#96161C]">
                    <div className="font-bold mb-2">Booking Status</div>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                dataKey="value"
                                nameKey="name"
                                label={pieLabel}
                                innerRadius={45}
                                outerRadius={85}
                            >
                                {statusData.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* MONTHLY */}
                <div className="bg-gray-50 rounded-lg p-4 shadow border-t-4 border-[#96161C]">
                    <div className="font-bold mb-2">Bookings Per Month</div>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#34d399" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* WEEKLY */}
            <div className="bg-gray-50 rounded-lg p-4 shadow border-l-4 border-[#96161C]">
                <div className="font-bold mb-2">Bookings Per Week</div>
                <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="bookings"
                            stroke="#96161C"
                            strokeWidth={3}
                            dot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* RECENT BOOKINGS */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="font-bold mb-3">Recent Equipment Bookings</div>
                <table className="w-full text-sm border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 text-left">Equipment ID</th>
                            <th className="p-2 text-center">Date</th>
                            <th className="p-2 text-center">Time</th>
                            <th className="p-2 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentBookings.map((b) => (
                            <tr key={b.id} className="border-t">
                                <td className="p-2">{b.equipment_type_id}</td>
                                <td className="p-2 text-center">
                                    {b.dates?.length
                                        ? b.dates[0].split("T")[0]
                                        : "-"}
                                </td>
                                <td className="p-2 text-center">
                                    {b.time_start?.slice(0, 5)} - {b.time_end?.slice(0, 5)}
                                </td>
                                <td className="p-2 text-center font-semibold">
                                    {b.status}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
