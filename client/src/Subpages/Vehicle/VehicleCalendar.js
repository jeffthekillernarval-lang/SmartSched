import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const vehicleTypeColors = {
    'isuzu': '#b5d8f6',             // pastel blue
    'hi-ace': '#ffe0b2',            // pastel orange
    'kia': '#c8e6c9',               // pastel green
    'small-bus': '#f8bbd0',         // pastel pink
    'big-bus': '#d1c4e9',           // pastel purple
    'tamaraw': '#fff9c4',           // pastel yellow
    'hilux': '#b2dfdb',             // pastel teal
    'innova-manual': '#f0f4c3',     // pastel lime
    'innova-automatic': '#f3e5f5',  // pastel lavender
    'unregistered vehicle': '#e0e0e0' // pastel gray
};

export default function VehicleBookingCalendar() {
    const [filter, setFilter] = useState({
        search: '',
        vehicleType: 'All',
        department: 'All',
        dateFrom: '',
        dateTo: ''
    });
    const [bookings, setBookings] = useState([]);
    const [events, setEvents] = useState([]);

    const [vehicleTypes, setVehicleTypes] = useState(['All']);
    const [departments, setDepartments] = useState(['All']);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const handleEventClick = (clickInfo) => {
        setSelectedEvent(clickInfo.event);
        setShowEventModal(true);
    };

    const renderEventContent = (eventInfo) => {
        // Use the event's backgroundColor and textColor
        return (
            <div
                className='w-full'
                style={{
                    backgroundColor: eventInfo.event.backgroundColor || '#96161C',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    color: eventInfo.event.textColor || '#000',
                    fontSize: '0.75rem'
                }}
            >
                <b>{eventInfo.timeText && eventInfo.timeText}</b> {eventInfo.event.title}
            </div>
        );
    };
    const downloadReceipt = (booking) => {
        const receiptHtml = `
  <html>
    <head>
      <title>Vehicle Booking Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 2rem; color: #333; }
        .header { text-align: center; margin-bottom: 2rem; }
        .header h1 { color: #96161C; margin: 0; font-size: 28px; }
        .header h2 { margin: 0; font-size: 18px; font-weight: normal; }
        .section { border: 1px solid #333; padding: 1rem; margin-bottom: 1rem; border-radius: 6px; }
        .section h3 { margin: 0 0 0.5rem 0; font-size: 18px; color: #96161C; }
        .field { margin-bottom: 0.5rem; display: flex; justify-content: space-between; }
        .field span { display: inline-block; min-width: 150px; font-weight: bold; }
        .signature { margin-top: 2rem; display: flex; justify-content: space-between; }
        .signature div { text-align: center; }
        .signature-line { margin-top: 3rem; border-top: 1px solid #333; width: 200px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>School Vehicle Booking Receipt</h1>
        <h2>${new Date(booking.date).toLocaleDateString()}</h2>
      </div>

      <div class="section">
        <h3>Booking Details</h3>
        <div class="field"><span>Vehicle Type:</span> ${booking.vehicleType}</div>
        <div class="field"><span>Requestor:</span> ${booking.requestor}</div>
        <div class="field"><span>Department:</span> ${booking.department}</div>
        <div class="field"><span>Purpose:</span> ${booking.purpose}</div>
        <div class="field"><span>Date:</span> ${new Date(booking.date).toLocaleDateString()}</div>
        <div class="field"><span>Destination:</span> ${booking.destination || '________________'}</div>
        <div class="field"><span>Departure Time:</span> ${booking.departureTime || '____:__'}</div>
        <div class="field"><span>Arrival Time:</span> ${booking.arrivalTime || '____:__'}</div>
        <div class="field"><span>No. of Passengers:</span> ${booking.passengers || '___'}</div>
      </div>

      <div class="signature">
        <div>
          <p>School President</p>
          <div class="signature-line"></div>
        </div>
        <div>
          <p>Driver</p>
          <div class="signature-line"></div>
        </div>
      </div>
    </body>
  </html>
  `;

        const blob = new Blob([receiptHtml], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `VehicleBooking_Receipt_${booking.id || Date.now()}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadReceiptFromEvent = (event) => {
        const booking = {
            vehicleType: event.extendedProps.vehicleType,
            requestor: event.extendedProps.requestor,
            department: event.extendedProps.department,
            purpose: event.extendedProps.purpose,
            date: event.start,
            destination: event.extendedProps.destination,
            departureTime: event.extendedProps.departureTime,
            arrivalTime: event.extendedProps.arrivalTime,
            passengers: event.extendedProps.passengers,
            id: event.id || Date.now()
        };
        downloadReceipt(booking); // use your existing receipt function
    };

    useEffect(() => {
        fetch('http://localhost:5000/api/fetch-vehicles')
            .then(res => res.json())
            .then(data => {
                // If backend returns { success, bookings }, use bookings array
                const bookingsArr = Array.isArray(data) ? data : data.bookings || [];
                const formatted = bookingsArr.map(b => {
                    // Use the lowercase, hyphenated value for color lookup
                    const typeKey = (b.vehicleType || b.vehicle_Type || 'unregistered vehicle').toLowerCase();
                    const bgColor = vehicleTypeColors[typeKey] || '#e0e0e0';
                    return {
                        title: `${toTitleCase(b.vehicleType || b.vehicle_Type)} | ${toTitleCase(b.requestor)}`,
                        start: b.date,
                        end: b.date,
                        backgroundColor: bgColor,
                        borderColor: bgColor,
                        textColor: '#000000',
                        extendedProps: {
                            vehicleType: toTitleCase(b.vehicleType || b.vehicle_Type),
                            department: toTitleCase(b.department),
                            purpose: b.purpose,
                            requestor: toTitleCase(b.requestor)
                        }
                    };
                });
                setBookings(formatted);
                setEvents(formatted);
                // Extract unique vehicle types and departments, sort alphabetically
                const uniqueTypes = Array.from(new Set(bookingsArr.map(b => toTitleCase(b.vehicle_Type)).filter(Boolean))).sort((a, b) => a.localeCompare(b));
                setVehicleTypes(['All', ...uniqueTypes]);
                const uniqueDepts = Array.from(new Set(bookingsArr.map(b => toTitleCase(b.department)).filter(Boolean))).sort((a, b) => a.localeCompare(b));
                setDepartments(['All', ...uniqueDepts]);
            })
            .catch(err => console.error('Error fetching vehicle bookings:', err));
    }, []);

    function toTitleCase(str) {
        if (!str) return '';
        return str.replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/[-_]/g, ' ')
            .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilter(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        let filtered = bookings;

        if (filter.search) {
            filtered = filtered.filter(ev =>
            (ev.extendedProps.requestor.toLowerCase().includes(filter.search.toLowerCase()) ||
                ev.extendedProps.purpose.toLowerCase().includes(filter.search.toLowerCase()))
            );
        }
        if (filter.vehicleType !== 'All') {
            filtered = filtered.filter(ev =>
                ev.extendedProps.vehicleType === filter.vehicleType
            );
        }
        if (filter.department !== 'All') {
            filtered = filtered.filter(ev =>
                ev.extendedProps.department === filter.department
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

    return (
        <div className="flex flex-col gap-4">
            <div className="flex-1 w-full">
                <div className="bg-white rounded-xl shadow-none p-4 w-full flex flex-wrap gap-4 items-end justify-between border border-[#888888]">
                    <div className="flex-1 min-w-[180px] max-w-xs">
                        <label className="block text-xs font-semibold mb-1 text-[#96161C]">Search (Requestor/Purpose)</label>
                        <input
                            type="text"
                            placeholder='Juan dela Cruz'
                            name="search"
                            value={filter.search}
                            onChange={handleFilterChange}
                            className="border border-[#888888] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                        />
                    </div>
                    <div className="flex-1 min-w-[120px] max-w-xs">
                        <label className="block text-xs font-semibold mb-1 text-[#96161C]">Vehicle Type</label>
                        <select
                            name="vehicleType"
                            value={filter.vehicleType}
                            onChange={handleFilterChange}
                            className="border border-[#888888] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                        >
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
                            className="border border-[#888888] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                        >
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

            <div className="w-full">
                {/* <div className="bg-gray-100 border border-gray-300 p-4 rounded-md mb-4">
                    <h2 className="font-bold text-sm mb-2">Fetched Vehicle Bookings (Raw Preview)</h2>
                    <pre className="text-xs overflow-x-auto max-h-[200px]">{JSON.stringify(bookings, null, 2)}</pre>
                </div> */}

                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={{
                        start: 'prev,next today',
                        center: 'title',
                        end: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    initialView="dayGridMonth"
                    editable={false}
                    selectable={false}
                    events={events}
                    eventContent={renderEventContent}
                    eventClick={handleEventClick}  // <-- Add this
                />
                {showEventModal && selectedEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-11/12 max-w-xl p-6 relative">
                            <button
                                onClick={() => setShowEventModal(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
                            >
                                ✕
                            </button>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {selectedEvent.title}
                            </h2>

                            <div className="space-y-2 text-gray-700">
                                <p><strong>Vehicle Type:</strong> {selectedEvent.extendedProps.vehicleType}</p>
                                <p><strong>Requestor:</strong> {selectedEvent.extendedProps.requestor}</p>
                                <p><strong>Department:</strong> {selectedEvent.extendedProps.department}</p>
                                <p><strong>Purpose:</strong> {selectedEvent.extendedProps.purpose}</p>
                                <p><strong>Date:</strong> {new Date(selectedEvent.start).toLocaleDateString()}</p>
                                {selectedEvent.extendedProps.destination && (
                                    <p><strong>Destination:</strong> {selectedEvent.extendedProps.destination}</p>
                                )}
                                {selectedEvent.extendedProps.departureTime && (
                                    <p><strong>Departure Time:</strong> {selectedEvent.extendedProps.departureTime}</p>
                                )}
                                {selectedEvent.extendedProps.arrivalTime && (
                                    <p><strong>Arrival Time:</strong> {selectedEvent.extendedProps.arrivalTime}</p>
                                )}
                                {selectedEvent.extendedProps.passengers && (
                                    <p><strong>No. of Passengers:</strong> {selectedEvent.extendedProps.passengers}</p>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => downloadReceiptFromEvent(selectedEvent)}
                                    className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold hover:bg-blue-200"
                                >
                                    Download Receipt
                                </button>
                                <button
                                    onClick={() => setShowEventModal(false)}
                                    className="bg-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
