import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const CAMPAIGN_COLORS = ['#34d399', '#fbbf24', '#ef4444'];

export default function Dashboard({ bookings = [] }) {
    // Pie chart: status counts
    const statusCounts = bookings.reduce((acc, b) => {
        const status = (b.status || 'Pending').toLowerCase();
        if (status === 'approved') acc.Approved++;
        else if (status === 'pending') acc.Pending++;
        else acc.Declined++;
        return acc;
    }, { Approved: 0, Pending: 0, Declined: 0 });
    const campaignData = [
        { name: 'Approved', value: statusCounts.Approved },
        { name: 'Pending', value: statusCounts.Pending },
        { name: 'Declined', value: statusCounts.Declined },
    ];

    // Bar chart: bookings per month (current year)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const salesData = Array.from({ length: 12 }, (_, i) => ({ month: monthNames[i], bookings: 0 }));
    bookings.forEach(b => {
        const dateStr = b.event_date || b.datew;
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (d.getFullYear() === currentYear) {
            salesData[d.getMonth()].bookings++;
        }
    });
    const handleDownload = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/download-reports', { medthod: 'GET' });
            const blob = await res.blob();

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'bookings_report.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed', err);
        }
    };


    // Line chart: bookings per association/org
    const orgMap = {};
    bookings.forEach(b => {
        const org = (b.organization || b.org || 'Unknown').trim();
        if (!orgMap[org]) orgMap[org] = 0;
        orgMap[org]++;
    });
    const revenueData = Object.entries(orgMap).map(([org, count]) => ({ association: org, bookings: count }));

    // Show the 5 most recent bookings (sorted by date descending)
    const recentBookings = [...(bookings || [])]
        .sort((a, b) => new Date(b.event_date || b.date) - new Date(a.event_date || a.date))
        .slice(0, 5);

    return (
        <div className="bg-white min-h-screen p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-[#96161C]">DASHBOARD</h1>
                    <p className="text-green-600 mt-1">Welcome to your dashboard</p>
                </div>
                <button className="bg-[#96161C] hover:bg-red-700 text-white px-4 py-2 rounded font-semibold mt-4 md:mt-0 shadow-lg border-b-4 border-[#ffb3b3] transition"
                    onClick={handleDownload}>
                    DOWNLOAD REPORTS
                </button>
            </div>

            {/* Top Row: Booking Status | Bookings Per Month | Recent Bookings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Booking Status */}
                <div className="bg-gray-50 rounded-lg p-4 shadow flex flex-col items-center border-t-4 border-[#96161C]">
                    <div className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#96161C] inline-block"></span>
                        Booking Status
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={campaignData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) =>
                                    `${name} (${(percent * 100).toFixed(0)}%)`
                                }
                            >
                                {campaignData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CAMPAIGN_COLORS[index % CAMPAIGN_COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-2">
                        {campaignData.map((entry, idx) => (
                            <div key={entry.name} className="flex items-center gap-1 text-xs">
                                <span className="inline-block w-3 h-3 rounded-full" style={{ background: CAMPAIGN_COLORS[idx] }}></span>
                                <span className="font-semibold text-gray-700">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Bookings Per Month */}
                <div className="bg-gray-50 rounded-lg p-4 shadow flex flex-col items-center border-t-4 border-[#96161C]">
                    <div className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#96161C] inline-block"></span>
                        Bookings Per Month
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="bookings" fill="#6366f1" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {/* Recent Bookings */}
                <div className="bg-gray-50 rounded-lg p-4 shadow border-t-4 border-[#96161C]">
                    <div className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#96161C] inline-block"></span>
                        Recent Bookings
                    </div>
                    <div>
                        {/* Header Row */}
                        <div className="hidden md:grid grid-cols-4 font-semibold text-gray-600 text-xs pb-2 border-b">
                            <div>Booked By</div>
                            <div>Facility</div>
                            <div>Date</div>
                            <div>Status</div>
                        </div>
                        {/* Booking Rows */}
                        {recentBookings.length === 0 ? (
                            <div className="text-gray-400 text-center py-6">No recent bookings found.</div>
                        ) : (
                            recentBookings.map((b, i) => (
                                <div
                                    key={b.id || i}
                                    className={`grid grid-cols-1 md:grid-cols-4 items-center py-3 border-b last:border-b-0
                                        ${i % 2 === 0 ? 'bg-white md:bg-transparent' : 'bg-gray-100 md:bg-transparent'}`}
                                >
                                    {/* Booked By & Facility (stacked on mobile, inline on desktop) */}
                                    <div className="md:col-span-1">
                                        <span className="font-medium text-gray-800">{b.requested_by || b.requestedBy || '-'}</span>
                                        <span className="block md:hidden text-gray-500 text-xs">{b.event_facility || b.facility || '-'}</span>
                                    </div>
                                    <div className="hidden md:block md:col-span-1 text-gray-500">{b.event_facility || b.facility || '-'}</div>
                                    <div className="md:col-span-1 text-gray-700 text-sm">{new Date(b.event_date || b.date).toLocaleDateString()}</div>
                                    <div className="md:col-span-1">
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold
                                                ${b.status === 'Approved'
                                                    ? 'bg-green-100 text-green-700'
                                                    : b.status === 'Pending' || b.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-red-100 text-red-700 border border-[#96161C]'
                                                }`}
                                        >
                                            {b.status || 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom: Bookings Per Association */}
            <div className="bg-gray-50 rounded-lg p-4 shadow mb-6 border-l-4 border-[#96161C]">
                <div className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#96161C] inline-block"></span>
                    Bookings Per Association
                </div>
                <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="association" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="bookings" stroke="#96161C" strokeWidth={3} dot={{ r: 6, fill: "#96161C" }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}


// import React, { useEffect, useState } from 'react';
// import {
//     LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
//     BarChart, Bar, PieChart, Pie, Cell
// } from 'recharts';

// const CAMPAIGN_COLORS = ['#34d399', '#fbbf24', '#ef4444'];

// export default function Dashboard() {
//     const [statusCounts, setStatusCounts] = useState({
//         Approved: 0,
//         Pending: 0,
//         Disapproved: 0,
//     });
//     const [monthlyBookings, setMonthlyBookings] = useState([]);
//     const [collegeBookings, setCollegeBookings] = useState([]);
//     const [recentFacilityTransactions, setRecentFacilityTransactions] = useState([]);
//     const [recentVehicleTransactions, setRecentVehicleTransactions] = useState([]);

//     useEffect(() => {
//         fetch('/api/dashboard/status-counts')
//             .then(res => res.json())
//             .then(data => {
//                 const counts = { Approved: 0, Pending: 0, Disapproved: 0 };
//                 data.forEach(item => {
//                     counts[item.status] = parseInt(item.count, 10);
//                 });
//                 setStatusCounts(counts);
//             })
//             .catch(err => console.error('Failed to fetch status counts:', err));

//         fetch('/api/dashboard/monthly-bookings')
//             .then(res => res.json())
//             .then(data => setMonthlyBookings(data))
//             .catch(err => console.error('Failed to fetch monthly bookings:', err));

//         fetch('/api/dashboard/college-bookings')
//             .then(res => res.json())
//             .then(data => setCollegeBookings(data))
//             .catch(err => console.error('Failed to fetch college bookings:', err));

//         fetch('/api/dashboard/recent-facility-transactions')
//             .then(res => res.json())
//             .then(data => setRecentFacilityTransactions(data))
//             .catch(err => console.error('Failed to fetch facility bookings:', err));

//         fetch('/api/dashboard/recent-vehicle-transactions')
//             .then(res => res.json())
//             .then(data => setRecentVehicleTransactions(data))
//             .catch(err => console.error('Failed to fetch vehicle bookings:', err));
//     }, []);

//     const campaignData = [
//         { name: 'Approved', value: statusCounts.Approved },
//         { name: 'Pending', value: statusCounts.Pending },
//         { name: 'Disapproved', value: statusCounts.Disapproved },
//     ];

//     const renderTransactionsTable = (transactions) => (
//         <div>
//             <div className="hidden md:grid grid-cols-4 font-semibold text-gray-600 text-xs pb-2 border-b">
//                 <div>Booked By</div>
//                 <div>Resource</div>
//                 <div>Date</div>
//                 <div>Status</div>
//             </div>
//             {transactions.map((t, i) => (
//                 <div
//                     key={i}
//                     className={`grid grid-cols-1 md:grid-cols-4 items-center py-3 border-b last:border-b-0
//                         ${i % 2 === 0 ? 'bg-white md:bg-transparent' : 'bg-gray-100 md:bg-transparent'}`}
//                 >
//                     <div className="md:col-span-1">
//                         <span className="font-medium text-gray-800">{t.user}</span>
//                         <span className="block md:hidden text-gray-500 text-xs">{t.resource}</span>
//                     </div>
//                     <div className="hidden md:block md:col-span-1 text-gray-500">{t.resource}</div>
//                     <div className="md:col-span-1 text-gray-700 text-sm">{t.date}</div>
//                     <div className="md:col-span-1">
//                         <span
//                             className={`inline-block px-3 py-1 rounded-full text-xs font-bold
//                                 ${t.status === 'Approved'
//                                     ? 'bg-green-100 text-green-700'
//                                     : t.status === 'Pending'
//                                         ? 'bg-yellow-100 text-yellow-700'
//                                         : 'bg-red-100 text-red-700 border border-[#96161C]'}`
//                             }
//                         >
//                             {t.status}
//                         </span>
//                     </div>
//                 </div>
//             ))}
//         </div>
//     );

//     return (
//         <div className="bg-white min-h-screen p-6">
//             <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
//                 <div>
//                     <h1 className="text-3xl font-bold text-[#96161C]">DASHBOARD</h1>
//                     <p className="text-green-600 mt-1">Welcome to your dashboard</p>
//                 </div>
//                 <button className="bg-[#96161C] hover:bg-red-700 text-white px-4 py-2 rounded font-semibold mt-4 md:mt-0 shadow-lg border-b-4 border-[#ffb3b3] transition">
//                     DOWNLOAD REPORTS
//                 </button>
//             </div>

//             {/* Top Row */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//                 {/* Booking Status Pie */}
//                 <div className="bg-gray-50 rounded-lg p-4 shadow flex flex-col items-center border-t-4 border-[#96161C]">
//                     <div className="font-bold text-gray-800 mb-2">Booking Status</div>
//                     <ResponsiveContainer width="100%" height={180}>
//                         <PieChart>
//                             <Pie
//                                 data={campaignData}
//                                 cx="50%"
//                                 cy="50%"
//                                 innerRadius={50}
//                                 outerRadius={70}
//                                 paddingAngle={5}
//                                 dataKey="value"
//                                 label={({ name, percent }) =>
//                                     `${name} (${(percent * 100).toFixed(0)}%)`
//                                 }
//                             >
//                                 {campaignData.map((entry, index) => (
//                                     <Cell key={index} fill={CAMPAIGN_COLORS[index % CAMPAIGN_COLORS.length]} />
//                                 ))}
//                             </Pie>
//                         </PieChart>
//                     </ResponsiveContainer>
//                 </div>

//                 {/* Bookings Per Month */}
//                 <div className="bg-gray-50 rounded-lg p-4 shadow flex flex-col items-center border-t-4 border-[#96161C]">
//                     <div className="font-bold text-gray-800 mb-2">Bookings Per Month</div>
//                     <ResponsiveContainer width="100%" height={180}>
//                         <BarChart data={monthlyBookings}>
//                             <CartesianGrid strokeDasharray="3 3" />
//                             <XAxis dataKey="month" />
//                             <YAxis />
//                             <Tooltip />
//                             <Bar dataKey="bookings" fill="#6366f1" />
//                         </BarChart>
//                     </ResponsiveContainer>
//                 </div>

//                 {/* Bookings Per College */}
//                 <div className="bg-gray-50 rounded-lg p-4 shadow border-t-4 border-[#96161C]">
//                     <div className="font-bold text-gray-800 mb-2">Bookings Per College</div>
//                     <ResponsiveContainer width="100%" height={180}>
//                         <LineChart data={collegeBookings}>
//                             <CartesianGrid strokeDasharray="3 3" />
//                             <XAxis dataKey="college" />
//                             <YAxis />
//                             <Tooltip />
//                             <Legend />
//                             <Line type="monotone" dataKey="bookings" stroke="#96161C" strokeWidth={3} dot={{ r: 6, fill: "#96161C" }} />
//                         </LineChart>
//                     </ResponsiveContainer>
//                 </div>
//             </div>

//             {/* Recent Facility Bookings */}
//             <div className="bg-gray-50 rounded-lg p-4 shadow mb-6 border-l-4 border-[#96161C]">
//                 <div className="font-bold text-gray-800 mb-2">Recent Facility Bookings</div>
//                 {renderTransactionsTable(recentFacilityTransactions)}
//             </div>

//             {/* Recent Vehicle Bookings */}
//             <div className="bg-gray-50 rounded-lg p-4 shadow mb-6 border-l-4 border-[#96161C]">
//                 <div className="font-bold text-gray-800 mb-2">Recent Vehicle Bookings</div>
//                 {renderTransactionsTable(recentVehicleTransactions)}
//             </div>
//         </div>
//     );
// }
