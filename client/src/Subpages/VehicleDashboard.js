import React, { useEffect, useState } from 'react';
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
} from 'recharts';

const COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#ef4444', '#a78bfa'];

const pieLabel = ({ name, value }) => `${name} - ${value}`;

// Week helper
const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

export default function VehicleDashboard() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5000/api/fetch-vehicles')
            .then(res => res.json())
            .then(data => {
                const rows =
                    Array.isArray(data) ? data :
                        Array.isArray(data.rows) ? data.rows :
                            Array.isArray(data.bookings) ? data.bookings :
                                [];

                setBookings(rows.filter(b => !b.deleted));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);


    if (loading) {
        return <div className="p-6 text-gray-500">Loading vehicle dashboard...</div>;
    }

    /* =========================
       DATA PROCESSING
    ========================== */

    // VEHICLE TYPE PIE
    const vehicleTypeMap = {};
    bookings.forEach(b => {
        const type = b.vehicle_Type || 'Unknown';
        vehicleTypeMap[type] = (vehicleTypeMap[type] || 0) + 1;
    });
    const vehicleTypeData = Object.entries(vehicleTypeMap).map(([name, value]) => ({ name, value }));

    // BOOKINGS PER MONTH
    const monthMap = {};
    bookings.forEach(b => {
        if (!b.date) return;
        const month = new Date(b.date).toLocaleString('default', { month: 'short' });
        monthMap[month] = (monthMap[month] || 0) + 1;
    });
    const monthlyData = Object.entries(monthMap).map(([month, count]) => ({
        month,
        count
    }));

    // BOOKINGS PER WEEK
    const weekMap = {};
    bookings.forEach(b => {
        if (!b.date) return;
        const week = `Week ${getWeekNumber(new Date(b.date))}`;
        weekMap[week] = (weekMap[week] || 0) + 1;
    });
    const weeklyData = Object.entries(weekMap)
        .map(([week, bookings]) => ({ week, bookings }))
        .sort((a, b) => parseInt(a.week.replace('Week ', '')) - parseInt(b.week.replace('Week ', '')));

    // BOOKINGS PER DEPARTMENT
    const deptMap = {};
    bookings.forEach(b => {
        const dept = b.department || 'Unknown';
        deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const departmentData = Object.entries(deptMap).map(([department, bookings]) => ({
        department,
        bookings
    }));

    // RECENT BOOKINGS
    const recentBookings = [...bookings]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    /* =========================
       UI
    ========================== */

    return (
        <div className="p-6 space-y-6">

            <div>
                <h1 className="text-2xl font-bold text-gray-800">
                    Vehicle Booking Dashboard
                </h1>
                <p className="text-gray-500 text-sm">
                    Overview of all vehicle reservations
                </p>
            </div>

            {/* TOP ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* VEHICLE TYPE */}
                <div className="bg-gray-50 rounded-lg p-4 shadow border-t-4 border-[#96161C]">
                    <div className="font-bold mb-2">Vehicle Type Distribution</div>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={vehicleTypeData}
                                dataKey="value"
                                nameKey="name"
                                label={pieLabel}
                                innerRadius={45}
                                outerRadius={85}
                            >
                                {vehicleTypeData.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* MONTHLY */}
                <div className="bg-gray-50 rounded-lg p-4 shadow border-t-4 border-[#96161C]">
                    <div className="font-bold mb-2">Vehicle Bookings Per Month</div>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#60a5fa" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* WEEKLY */}
            <div className="bg-gray-50 rounded-lg p-4 shadow border-l-4 border-[#96161C]">
                <div className="font-bold mb-2">Vehicle Bookings Per Week</div>
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

            {/* DEPARTMENT */}
            <div className="bg-gray-50 rounded-lg p-4 shadow">
                <div className="font-bold mb-2">Bookings Per Department</div>
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={departmentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="department" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="bookings" fill="#34d399" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* RECENT BOOKINGS */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="font-bold mb-3">Recent Vehicle Bookings</div>
                <table className="w-full text-sm border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 text-left">Requestor</th>
                            <th className="p-2 text-left">Vehicle</th>
                            <th className="p-2 text-left">Department</th>
                            <th className="p-2 text-center">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentBookings.map((b, i) => (
                            <tr key={i} className="border-t">
                                <td className="p-2">{b.requestor}</td>
                                <td className="p-2">{b.vehicle_Type}</td>
                                <td className="p-2">{b.department}</td>
                                <td className="p-2 text-center">
                                    {b.date ? new Date(b.date).toLocaleDateString() : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
