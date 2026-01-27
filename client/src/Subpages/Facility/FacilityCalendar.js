import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import '../../styles/calendar-theme.css';

export default function MyCalendar() {
    const [filter, setFilter] = useState({
        search: '',
        status: 'All',
        facility: 'All',
        org: 'All',
        dateFrom: '',
        dateTo: ''
    });
    const [bookings, setBookings] = useState([]);
    const [events, setEvents] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [orgs, setOrgs] = useState([]);


    const [selectedBooking, setSelectedBooking] = useState(null);

    const statuses = ['All', 'approved', 'pending', 'rejected', 'rescheduled'];
    function renderEventContent(eventInfo) {
        const bgColor = eventInfo.event.backgroundColor || '#FFD6A5';
        const textColor = eventInfo.event.textColor || '#000';
        const facility = eventInfo.event.extendedProps.facility;
        return (
            <div
                className='w-full'
                style={{
                    backgroundColor: bgColor,
                    padding: '2px 4px',
                    borderRadius: '6px',
                    color: textColor,
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    border: `1px solid ${eventInfo.event.borderColor || bgColor}`
                }}
            >
                <b>{eventInfo.timeText && eventInfo.timeText}</b> {eventInfo.event.title}
                {facility && (
                    <span className="ml-2 text-xs font-semibold text-[#96161C]">({facility})</span>
                )}
            </div>
        );
    }

    useEffect(() => {
        fetch('http://localhost:5000/api/fetch-bookings')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const formatted = data.bookings
                        .filter(b => b.event_date) // only keep bookings with a valid date
                        .map(b => {
                            const addOneDay = (dateStr) => {
                                const d = new Date(dateStr);
                                d.setDate(d.getDate() + 1);
                                return d.toISOString().split('T')[0];
                            };

                            const dateOnly = addOneDay(b.event_date);
                            const startTime = b.starting_time || '00:00';
                            const endTime = b.ending_time || '23:59';

                            // Set colors
                            let bgColor = '#FFD6A5';
                            if (b.status === 'approved') bgColor = '#A8E6CF';
                            else if (b.status === 'pending') bgColor = '#FFF9B0';
                            else if (b.status === 'rejected') bgColor = '#FFB3B3';
                            else if (b.status === 'rescheduled') bgColor = '#B3E5FC';

                            return {
                                title: b.event_name || 'Untitled Event',
                                start: `${dateOnly}T${startTime}`,
                                end: `${dateOnly}T${endTime}`,
                                backgroundColor: bgColor,
                                borderColor: bgColor,
                                textColor: '#000',
                                extendedProps: {
                                    status: b.status,
                                    facility: b.event_facility || '',
                                    org: b.organization || '',
                                    requestedBy: b.requested_by || '',
                                    contact: b.contact || ''
                                }
                            };
                        });

                    setBookings(formatted);
                    setEvents(formatted);

                    // Extract unique facilities and orgs, sort alphabetically
                    const uniqueFacilities = Array.from(new Set(data.bookings.map(b => b.event_facility || '').filter(Boolean))).sort((a, b) => a.localeCompare(b));
                    setFacilities(uniqueFacilities);
                    const uniqueOrgs = Array.from(new Set(data.bookings.map(b => b.organization || '').filter(Boolean))).sort((a, b) => a.localeCompare(b));
                    setOrgs(uniqueOrgs);
                } else {
                    console.log('Fetch bookings failed:', data.message || data.error);
                }
            })
            .catch(err => {
                console.log('Fetch bookings error:', err);
            });
    }, []);




    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilter(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        let filtered = bookings;
        if (filter.search) {
            filtered = filtered.filter(ev =>
                ev.title.toLowerCase().includes(filter.search.toLowerCase())
            );
        }
        if (filter.status !== 'All') {
            filtered = filtered.filter(ev =>
                ev.extendedProps.status === filter.status
            );
        }
        if (filter.facility !== 'All') {
            filtered = filtered.filter(ev =>
                ev.extendedProps.facility === filter.facility
            );
        }
        if (filter.org !== 'All') {
            filtered = filtered.filter(ev =>
                ev.extendedProps.org === filter.org
            );
        }
        if (filter.dateFrom) {
            filtered = filtered.filter(ev => ev.start >= filter.dateFrom);
        }
        if (filter.dateTo) {
            filtered = filtered.filter(ev => ev.start <= filter.dateTo);
        }
        setEvents(filtered);
    }, [filter, bookings]);
    // Unique values for dropdowns
    // const facilities = Array.from(new Set(bookings.map b => b.event_facility || b.facility || '').filter(Boolean)));

    return (
        <div className="flex flex-col gap-4">
            <div className="flex-1 w-full">
                <div className="bg-white rounded-xl shadow-none p-4 w-full flex flex-wrap gap-4 items-end justify-between border border-[#888888]">
                    <div className="flex-1 min-w-[180px] max-w-xs">
                        <label className="block text-xs font-semibold mb-1 text-[#96161C]">Search</label>
                        <input
                            type="text"
                            name="search"
                            value={filter.search}
                            onChange={handleFilterChange}
                            placeholder="Search event, facility, org, etc."
                            className="border border-[#888888] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                        />
                    </div>
                    <div className="flex-1 min-w-[120px] max-w-xs">
                        <label className="block text-xs font-semibold mb-1 text-[#96161C]">Status</label>
                        <select
                            name="status"
                            value={filter.status}
                            onChange={handleFilterChange}
                            className="border border-[#888888] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                        >
                            {statuses.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[140px] max-w-xs">
                        <label className="block text-xs font-semibold mb-1 text-[#96161C]">Facility</label>
                        <select
                            name="facility"
                            value={filter.facility}
                            onChange={handleFilterChange}
                            className="border border-[#888888] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                        >
                            <option value="All">All</option>
                            {facilities.map(f => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[140px] max-w-xs">
                        <label className="block text-xs font-semibold mb-1 text-[#96161C]">Org/Dept</label>
                        <select
                            name="org"
                            value={filter.org}
                            onChange={handleFilterChange}
                            className="border border-[#888888] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                        >
                            <option value="All">All</option>
                            {orgs.map(o => (
                                <option key={o} value={o}>{o}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[120px] max-w-xs">
                        <label className="block text-xs font-semibold mb-1 text-[#96161C]">Date     From</label>
                        <input
                            type="date"
                            name="dateFrom"
                            value={filter.dateFrom}
                            onChange={handleFilterChange}
                            className="border border-[#888888] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                        />
                    </div>
                    <div className="flex-1 min-w-[120px] max-w-xs">
                        <label className="block text-xs font-semibold mb-1 text-[#96161C]">Date To</label>
                        <input
                            type="date"
                            name="dateTo"
                            value={filter.dateTo}
                            onChange={handleFilterChange}
                            className="border border-[#888888] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                        />
                    </div>
                    <button
                        className="bg-[#96161C] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#7a1217] transition"
                        onClick={() => setFilter({
                            search: '',
                            status: 'All',
                            facility: 'All',
                            org: 'All',
                            dateFrom: '',
                            dateTo: ''
                        })}
                        type="button"
                    >
                        Reset
                    </button>
                </div>
                {/* Legend for event colors */}
                <div className="flex flex-wrap gap-3 items-center justify-center mt-3 mb-3 px-4 py-2 bg-[#f7f7f7] rounded-lg border border-[#e0e0e0]">
                    <span className="font-semibold text-sm text-[#96161C] mr-2">Legend:</span>
                    <span className="flex items-center gap-2 text-sm">
                        <span style={{
                            display: 'inline-block',
                            width: 18,
                            height: 18,
                            background: '#A8E6CF', // pastel green
                            borderRadius: 6,
                            border: '1px solid #b2dfdb'
                        }}></span>
                        <span className="text-[#388e3c] font-medium">Approved</span>
                    </span>
                    <span className="flex items-center gap-2 text-sm">
                        <span style={{
                            display: 'inline-block',
                            width: 18,
                            height: 18,
                            background: '#FFF9B0', // pastel yellow
                            borderRadius: 6,
                            border: '1px solid #ffe082'
                        }}></span>
                        <span className="text-[#fbc02d] font-medium">Pending</span>
                    </span>
                    <span className="flex items-center gap-2 text-sm">
                        <span style={{
                            display: 'inline-block',
                            width: 18,
                            height: 18,
                            background: '#FFB3B3', // pastel red
                            borderRadius: 6,
                            border: '1px solid #ef9a9a'
                        }}></span>
                        <span className="text-[#d32f2f] font-medium">Rejected</span>
                    </span>
                    <span className="flex items-center gap-2 text-sm">
                        <span style={{
                            display: 'inline-block',
                            width: 18,
                            height: 18,
                            background: '#B3E5FC', // pastel blue
                            borderRadius: 6,
                            border: '1px solid #81d4fa'
                        }}></span>
                        <span className="text-[#1976d2] font-medium">Rescheduled</span>
                    </span>
                    <span className="flex items-center gap-2 text-sm">
                        <span style={{
                            display: 'inline-block',
                            width: 18,
                            height: 18,
                            background: '#FFD6A5', // pastel orange
                            borderRadius: 6,
                            border: '1px solid #ffcc80'
                        }}></span>
                        <span className="text-[#ff9800] font-medium">Other</span>
                    </span>
                </div>
            </div>

            <div className="w-full">
                <FullCalendar
                    eventColor="#96161C"
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={{
                        start: 'prev,next today',
                        center: 'title',
                        end: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    initialView="dayGridMonth"
                    editable={true}
                    selectable={true}
                    events={events}
                    eventContent={renderEventContent}
                    eventClick={(info) => {
                        info.jsEvent.preventDefault(); // stop navigation
                        setSelectedBooking({
                            id: info.event.extendedProps.id,
                            title: info.event.title,
                            date: info.event.startStr.split('T')[0],
                            start: info.event.startStr.split('T')[1],
                            end: info.event.endStr.split('T')[1],
                            facility: info.event.extendedProps.facility,
                            org: info.event.extendedProps.org,
                            status: info.event.extendedProps.status,
                            requestedBy: info.event.extendedProps.requested_by,
                            contact: info.event.extendedProps.contact,
                        });
                    }}

                />
                {selectedBooking && (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                        <div className="bg-white rounded-xl shadow-lg w-[380px] p-5 relative">

                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>

                            <h2 className="text-lg font-semibold mb-3">
                                {selectedBooking.title}
                            </h2>

                            <div className="space-y-2 text-sm">
                                <p><span className="font-medium">Date:</span> {selectedBooking.date}</p>
                                <p>
                                    <span className="font-medium">Time:</span>{' '}
                                    {selectedBooking.start} – {selectedBooking.end}
                                </p>
                                <p><span className="font-medium">Facility:</span> {selectedBooking.facility}</p>
                                <p><span className="font-medium">Organization:</span> {selectedBooking.org}</p>
                                <p><span className="font-medium">Requested by:</span> {selectedBooking.requestedBy}</p>
                                <p><span className="font-medium">Contact:</span> {selectedBooking.contact}</p>

                                <span
                                    className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold
                                    ${selectedBooking.status === 'approved'
                                            ? 'bg-green-100 text-green-700'
                                            : selectedBooking.status === 'rejected'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-yellow-100 text-yellow-700'}
                                `}
                                >
                                    {selectedBooking.status}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>

    );
}
