import React, { useState, useEffect } from 'react';

export default function VehicleBooking() {
    const [conflicts, setConflicts] = useState([]); // ⬅️ store conflicts
    const [showForm, setShowForm] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [form, setForm] = useState({
        vehicleType: '',
        requestor: '',
        date: '',
        department: '',
        purpose: ''
    });
    const [editingId, setEditingId] = useState(null);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const currentUserId = localStorage.getItem('currentUserId');

        const newBooking = {
            vehicle_Type: form.vehicleType,
            requestor: form.requestor,
            department: form.department,
            date: form.date,
            purpose: form.purpose,
            booker_id: Number(currentUserId),
        };

        let hasConflict = false;

        try {
            // check conflicts first
            const res = await fetch(
                `http://localhost:5000/api/vehicle-conflicts?vehicleType=${encodeURIComponent(form.vehicleType)}&date=${encodeURIComponent(form.date)}`
            );
            const data = await res.json();

            if (data.success && data.bookings.length > 0 && editingId === null) {
                hasConflict = true;
                setConflicts(data.bookings); // ⬅️ show them
            }
        } catch (err) {
            console.error("Error checking vehicle conflicts:", err);
        }

        if (hasConflict) {
            alert("Conflict detected: This vehicle is already booked on that date.");
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/create-vehicle-booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBooking),
            });

            const data = await res.json();
            if (data.success) {
                setBookings([...bookings, newBooking]);
                setForm({
                    vehicleType: '',
                    requestor: '',
                    date: '',
                    department: '',
                    purpose: ''
                });
                setShowForm(false);
                setConflicts([]); // clear
            } else {
                alert(data.message || 'Failed to create vehicle booking');
            }
        } catch (error) {
            console.error('Error submitting booking:', error);
            alert('Server error, could not create booking.');
        }
    };
    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/fetch-vehicles');
                const data = await res.json();
                const nonDeleted = data.filter(b => !b.deleted); // ← ignore deleted
                setBookings(nonDeleted);
                // Extract unique vehicle types and departments, sort alphabetically
                const uniqueTypes = Array.from(new Set(nonDeleted.map(b => b.vehicleType || b.vehicle_Type).filter(Boolean))).map(toTitleCase).sort((a, b) => a.localeCompare(b));
                setVehicleTypes(uniqueTypes);
                const uniqueDepts = Array.from(new Set(nonDeleted.map(b => b.department).filter(Boolean))).map(toTitleCase).sort((a, b) => a.localeCompare(b));
                setDepartments(uniqueDepts);
            } catch (error) {
                console.error('Error fetching bookings:', error);
            }
        };
        fetchBookings();
    }, []);

    function toTitleCase(str) {
        if (!str) return '';
        return str.replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/[-_]/g, ' ')
            .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }


    const handleEdit = (index) => {
        setEditingId(index);
        setForm(bookings[index]);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const [filter, setFilter] = useState({
        search: '',
        vehicleType: 'All',
        department: 'All',
        dateFrom: '',
        dateTo: ''
    });

    const handleFilterChange = (e) => {
        setFilter({ ...filter, [e.target.name]: e.target.value });
    };

    // const handleDelete = (index) => {
    //     if (!window.confirm('Delete this vehicle booking?')) return;
    //     setBookings(bookings.filter((_, i) => i !== index));
    // };
    const handleDelete = async (index) => {
        if (!window.confirm('Delete this vehicle booking?')) return;

        const booking = bookings[index];

        try {
            const res = await fetch(`http://localhost:5000/api/vehicle/delete/${booking.id}`, {
                method: 'PUT',
            });

            const data = await res.json();

            if (data.success) {
                const updated = bookings.filter((_, i) => i !== index);
                setBookings(updated);
            } else {
                alert(data.message || 'Failed to delete booking');
            }
        } catch (error) {
            console.error('Error deleting booking:', error);
            alert('Server error, could not delete booking.');
        }
    };

    return (
        <div className="w-full">
            {/* Collapsible Create Booking */}
            <div className="mb-6">
                <button
                    className="w-full flex items-center justify-between px-8 py-5 bg-[#96161C] text-white text-xl font-bold rounded-t-xl focus:outline-none"
                    onClick={() => setShowForm(!showForm)}
                >
                    <span>Vehicle Booking</span>
                    <svg
                        className={`w-7 h-7 transform transition-transform ${showForm ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {showForm && (
                    <form onSubmit={handleSubmit} className="bg-[#f9f9f9] px-8 py-8 rounded-b-xl shadow-md border border-t-0 border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Vehicle Type*</label>
                                <select
                                    name="vehicleType"
                                    value={form.vehicleType}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-4 py-2"
                                    required
                                >
                                    <option value="">Select...</option>
                                    <option value="isuzu">Isuzu</option>
                                    <option value="hi-ace">Hi-Ace</option>
                                    <option value="kia">Kia</option>
                                    <option value="small-bus">Small Bus</option>
                                    <option value="big-bus">Big Bus</option>
                                    <option value="tamaraw">Tamaraw</option>
                                    <option value="hilux">Hilux</option>
                                    <option value="innova-manual">Innova Manual</option>
                                    <option value="innova-automatic">Innova Automatic</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Requestor*</label>
                                <input
                                    type="text"
                                    name="requestor"
                                    placeholder='Juan Dela Cruz'
                                    value={form.requestor}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-4 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Department*</label>
                                <input
                                    type="text"
                                    name="department"
                                    placeholder='AGSO'
                                    value={form.department}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-4 py-2"
                                    required

                                />


                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Date*</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={form.date}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-4 py-2"
                                    required
                                />
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-1">Purpose*</label>
                            <textarea
                                name="purpose"
                                value={form.purpose}
                                placeholder='Community Outreach program'
                                onChange={handleChange}
                                className="w-full border rounded-lg px-4 py-2"
                                required
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button type="submit" className="bg-[#96161C] text-white px-8 py-2 rounded-lg">
                                {editingId !== null ? 'Save' : 'Create'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="bg-gray-200 px-8 py-2 rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>
                        {conflicts.length > 0 && (
                            <div className="bg-red-50 border border-red-400 p-4 rounded-lg mt-4">
                                <h3 className="text-lg font-bold text-red-700 mb-2">
                                    ⚠️ Conflict: Vehicle already booked on {form.date}
                                </h3>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-red-200">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-bold">Vehicle</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold">Requestor</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold">Department</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold">Purpose</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {conflicts.map((c, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-2">{c.vehicle_Type}</td>
                                                <td className="px-4 py-2">{c.requestor}</td>
                                                <td className="px-4 py-2">{c.department}</td>
                                                <td className="px-4 py-2">
                                                    {new Date(c.date).toLocaleDateString('en-US')}
                                                </td>
                                                <td className="px-4 py-2">{c.purpose}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </form>

                )}
            </div>

            {/* Bookings Table */}
            {/* Filters for Vehicle Booking */}
            <div className="bg-white rounded-xl shadow-md p-8 w-full mt-8">
                <div>
                    <h2 className="text-2xl font-bold text-[#96161C] flex items-center gap-2 justify-start mb-2 md:mb-0">
                        <svg className="w-7 h-7 text-[#96161C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Vehicle Booking Filters
                    </h2>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                    <div className="flex-1 w-full">
                        <div className="bg-white rounded-xl shadow-none p-0 w-full flex flex-wrap gap-4 items-end justify-between">
                            <div className="flex-1 min-w-[180px] max-w-xs">
                                <label className="block text-xs font-semibold mb-1 text-[#96161C]">Search Requestor</label>
                                <input
                                    type="text"
                                    name="search"
                                    value={filter.search}
                                    onChange={handleFilterChange}
                                    placeholder="Search by requestor name"
                                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                />
                            </div>
                            <div className="flex-1 min-w-[140px] max-w-xs">
                                <label className="block text-xs font-semibold mb-1 text-[#96161C]">Vehicle Type</label>
                                <select
                                    name="vehicleType"
                                    value={filter.vehicleType}
                                    onChange={handleFilterChange}
                                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                >
                                    <option value="All">All</option>
                                    {vehicleTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[140px] max-w-xs">
                                <label className="block text-xs font-semibold mb-1 text-[#96161C]">Department</label>
                                <select
                                    name="department"
                                    value={filter.department}
                                    onChange={handleFilterChange}
                                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                >
                                    <option value="All">All</option>
                                    {departments.map(dep => (
                                        <option key={dep} value={dep}>{dep}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[120px] max-w-xs">
                                <label className="block text-xs font-semibold mb-1 text-[#96161C]">Date From</label>
                                <input
                                    type="date"
                                    name="dateFrom"
                                    value={filter.dateFrom}
                                    onChange={handleFilterChange}
                                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                />
                            </div>
                            <div className="flex-1 min-w-[120px] max-w-xs">
                                <label className="block text-xs font-semibold mb-1 text-[#96161C]">Date To</label>
                                <input
                                    type="date"
                                    name="dateTo"
                                    value={filter.dateTo}
                                    onChange={handleFilterChange}
                                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                />
                            </div>
                            <button
                                className="bg-[#96161C] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#7a1217] transition"
                                onClick={() => setFilter({
                                    search: '',
                                    vehicleType: 'All',
                                    department: 'All',
                                    dateFrom: '',
                                    dateTo: ''
                                })}
                                type="button"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>


                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#96161C]">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase rounded-tl-xl">Vehicle</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Requestor</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Purpose</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase rounded-tr-xl">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {bookings.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-500">No vehicle bookings yet.</td>
                            </tr>
                        ) : (
                            bookings.filter(b =>
                                (filter.search === '' || (b.requestor && b.requestor.toLowerCase().includes(filter.search.toLowerCase()))) &&
                                (filter.vehicleType === 'All' || toTitleCase(b.vehicleType || b.vehicle_Type) === filter.vehicleType) &&
                                (filter.department === 'All' || toTitleCase(b.department) === filter.department) &&
                                (filter.dateFrom === '' || b.date >= filter.dateFrom) &&
                                (filter.dateTo === '' || b.date <= filter.dateTo)
                            ).map((b, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">{toTitleCase(b.vehicleType || b.vehicle_Type)}</td>
                                    <td className="px-6 py-4">{toTitleCase(b.requestor)}</td>
                                    <td className="px-6 py-4">{toTitleCase(b.department)}</td>
                                    <td className="px-6 py-4">{new Date(b.event_date || b.date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: '2-digit',
                                    })}</td>
                                    <td className="px-6 py-4">{b.purpose}</td>
                                    <td className="px-1 py-2 flex gap-2">
                                        <button
                                            onClick={() => handleEdit(index)}
                                            className="px-4 py-1 text-sm font-semibold rounded-full border border-[#96161C] text-[#96161C] hover:bg-[#f8eaea] transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(index)}
                                            className="px-4 py-1 text-sm font-semibold rounded-full border border-red-600 text-red-600 hover:bg-red-100 transition"
                                        >
                                            Delete
                                        </button>
                                    </td>

                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
