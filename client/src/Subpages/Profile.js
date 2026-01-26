import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Building, CalendarDays, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [vehicleBookings, setVehicleBookings] = useState([]);
    const [filter, setFilter] = useState({
        status: 'All',
        facility: 'All',
        date: ''
    });
    const [facilityOptions, setFacilityOptions] = useState([]);
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const bookingsPerPage = 5;
    const filteredBookings = bookings
        .filter(b =>
            (filter.status === 'All' || b.status?.toLowerCase() === filter.status.toLowerCase()) &&
            (filter.facility === 'All' || b.event_facility === filter.facility) &&
            (filter.date === '' || extractDate(b.event_date) === filter.date)
        );

    const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);
    const paginatedBookings = filteredBookings.slice(
        (currentPage - 1) * bookingsPerPage,
        currentPage * bookingsPerPage
    );
    useEffect(() => {
        const userId = Number(localStorage.getItem('currentUserId'));
        if (!userId) return;

        // Fetch User Details
        fetch(`http://localhost:5000/api/fetch-user/${userId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setUser(data.user);
                }
            });

        // Fetch Bookings for this user
        fetch('http://localhost:5000/api/fetch-bookings')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const userBookings = data.bookings.filter(b => b.creator_id === userId);
                    setBookings(userBookings);
                    // Extract unique facilities for filter
                    const uniqueFacilities = Array.from(new Set(userBookings.map(b => b.event_facility).filter(Boolean))).sort((a, b) => a.localeCompare(b));
                    setFacilityOptions(uniqueFacilities);
                }
            });

        // Fetch vehicle bookings for this user
        fetch('http://localhost:5000/api/fetch-vehicles')
            .then(res => res.json())
            .then(data => {
                const userId = Number(localStorage.getItem('currentUserId'));
                const userVehicleBookings = data.filter(
                    v => v.booker_id === userId && !v.deleted
                );
                setVehicleBookings(userVehicleBookings);
            });



    }, []);

    function formatTime(timeStr) {
        if (!timeStr) return '';
        const [hour, minute] = timeStr.split(':');
        let h = parseInt(hour, 10);
        const m = minute;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return `${h}:${m} ${ampm}`;
    }

    function extractDate(datetime) {
        if (!datetime) return '';
        return datetime.split('T')[0];
    }

    function handleEdit(booking) {
        // Navigate to FacilityBooking and pass the booking id in state
        navigate('/facility-bookings', { state: { editBookingId: booking.id } });
    }

    function handleDelete(bookingId) {
        if (window.confirm('Are you sure you want to delete this booking?')) {
            fetch(`http://localhost:5000/api/delete-booking/${bookingId}`, {
                method: 'PUT', // <-- Use PUT, not DELETE
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        // Remove the deleted booking from state
                        setBookings(bookings.filter(b => b.id !== bookingId));
                        alert('Booking deleted successfully.');
                    } else {
                        alert('Error deleting booking. Please try again.');
                    }
                });
        }
    }

    return (
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl mx-auto">
            {/* Left: Profile Card */}
            <div className="md:w-1/5 w-full">
                <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center mb-6">
                    <div className="bg-[#96161C] rounded-full p-3 mb-3">
                        <User className="text-white w-14 h-14" />
                    </div>
                    <h1 className="text-xl font-bold mb-1 text-center">{user?.name || 'Loading...'}</h1>
                    <div className="flex flex-col items-center gap-1 text-gray-700 text-sm">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-[#96161C]" />
                            <span>{user?.email || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-[#96161C]" />
                            <span>{user?.contact || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-[#96161C]" />
                            <span>{user?.affiliation || '-'}</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Center: Bookings */}
            <div className="md:w-full w-full">
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-sm font-bold mb-4 text-[#96161C] flex items-center gap-2">
                        <CalendarDays className="w-6 h-6" /> My Bookings
                    </h2>
                    {bookings.length === 0 ? (
                        <p className="text-gray-500">No bookings yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-[#96161C]">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase tracking-wider rounded-tl-xl">Event</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">Facility</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">Time</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                                        {/* <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase tracking-wider rounded-tr-xl">Actions</th> */}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {paginatedBookings.map((b, idx) => (
                                        <tr
                                            key={b.id}
                                            className={`transition hover:bg-[#f8eaea] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                        >
                                            <td className="px-4 py-2 font-semibold text-[#96161C] whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">{b.event_name}</td>
                                            <td className="px-4 py-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">{b.event_facility}</td>
                                            <td className="px-4 py-4 whitespace-nowrap">{extractDate(b.event_date)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap">{formatTime(b.starting_time)} - {formatTime(b.ending_time)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow
                                                    ${b.status?.toLowerCase() === 'approved'
                                                        ? 'bg-green-100 text-green-700 border border-green-300'
                                                        : b.status?.toLowerCase() === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                                            : b.status?.toLowerCase() === 'rejected'
                                                                ? 'bg-red-100 text-red-700 border border-red-300'
                                                                : b.status?.toLowerCase() === 'rescheduled'
                                                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                                                    }`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            {/* <td className="px-4 py-4 whitespace-nowrap flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(b)}
                                                    className="text-[#96161C] hover:text-[#7a1217] transition"
                                                    title="Edit Booking"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M17.414 2.586a2 2 0 010 2.828L8.414 14.414l-4.828 1.414 1.414-4.828L14.586 2.586a2 2 0 012.828 0z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(b.id)}
                                                    className="text-red-600 hover:text-red-800 transition"
                                                    title="Delete Booking"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M9 3v1H4v2h16V4h-5V3H9zm1 5v12h2V8h-2zm4 0v12h2V8h-2z" />
                                                    </svg>
                                                </button>
                                            </td> */}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                {/* My Vehicle Bookings */}
                <div className="bg-white rounded-xl shadow-md p-6 mt-6">
                    <h2 className="text-xl font-bold mb-4 text-[#96161C] flex items-center gap-2">
                        <CalendarDays className="w-6 h-6" /> My Vehicle Bookings
                    </h2>
                    {vehicleBookings.length === 0 ? (
                        <p className="text-gray-500">No vehicle bookings yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-[#96161C]">
                                    <tr>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider rounded-tl-xl">Purpose</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Vehicle Type</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider rounded-tr-xl">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {vehicleBookings.map((v, idx) => (
                                        <tr
                                            key={v.id}
                                            className={`transition hover:bg-[#f8eaea] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                        >
                                            <td className="px-4 py-4 font-semibold text-[#96161C]">{v.purpose}</td>
                                            <td className="px-4 py-4">{v.vehicle_Type || v.vehicle_type}</td>
                                            <td className="px-4 py-4">{extractDate(v.date)}</td>
                                            <td className="px-4 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow
                                ${v.status === 'Approved'
                                                        ? 'bg-green-100 text-green-700 border border-green-300'
                                                        : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                                    }`}>
                                                    {'approved'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div className="flex justify-center items-center gap-2 mt-4">
                    <button
                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Prev
                    </button>
                    <span className="font-semibold">{currentPage} / {totalPages}</span>
                    <button
                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Right: Filters/Actions */}
            <div className="md:w-1/5 w-full">
                <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <div className="font-semibold text-[#96161C] mb-4 flex items-center gap-2">
                        <Filter className="w-5 h-5" /> Filters
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold mb-1 text-gray-700">Status</label>
                            <select
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                name="status"
                                value={filter.status}
                                onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
                            >
                                <option value="All">All</option>
                                <option value="Approved">Approved</option>
                                <option value="Pending">Pending</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Rescheduled">Rescheduled</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1 text-gray-700">Facility</label>
                            <select
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                name="facility"
                                value={filter.facility}
                                onChange={e => setFilter(f => ({ ...f, facility: e.target.value }))}
                            >
                                <option value="All">All</option>
                                {facilityOptions.map(fac => (
                                    <option key={fac} value={fac}>{fac}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1 text-gray-700">Date</label>
                            <input
                                type="date"
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                name="date"
                                value={filter.date}
                                onChange={e => setFilter(f => ({ ...f, date: e.target.value }))}
                            />
                        </div>
                        <button
                            className="w-full mt-2 bg-[#96161C] text-white py-2 rounded-lg font-semibold hover:bg-[#7a1217] transition"
                            onClick={() => setFilter({ status: 'All', facility: 'All', date: '' })}
                            type="button"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
                {/* <div className="bg-white rounded-xl shadow p-4">
                    <div className="font-semibold text-[#96161C] mb-2">Quick Links</div>
                    <ul className="text-sm text-gray-700 space-y-2">
                        <li className="flex items-center gap-2">
                            <span>📄</span> My Settings
                        </li>
                        <li className="flex items-center gap-2">
                            <span>💬</span> Messages
                        </li>
                        <li className="flex items-center gap-2">
                            <span>📅</span> Calendar
                        </li>
                    </ul>
                </div> */}
            </div>
        </div>
    );
}
