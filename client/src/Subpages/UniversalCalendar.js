import React, { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function UniversalCalendar() {
    const [rawEvents, setRawEvents] = useState([]);

    const [filters, setFilters] = useState({
        vehicle: true,
        facility: true,
        equipment: true
    });
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);

    /* =========================
       FETCH ALL SOURCES
    ========================== */
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [
                    vehicleRes,
                    facilityRes,
                    equipmentRes
                ] = await Promise.all([
                    fetch("http://localhost:5000/api/fetch-vehicles"),
                    fetch("http://localhost:5000/api/fetch-bookings"),
                    fetch("http://localhost:5000/api/fetch-equipment-bookings")
                ]);

                const vehicleData = await vehicleRes.json();
                const facilityData = await facilityRes.json();
                const equipmentData = await equipmentRes.json();

                /* ========= VEHICLE EVENTS ========= */
                const vehicleEvents = (vehicleData || [])
                    .filter(b => !b.deleted && Array.isArray(b.dates) && b.dates.length > 0)
                    .map(b => ({
                        id: `vehicle-${b.id}`,
                        title: `🚗 Vehicle #${b.vehicle_id} → ${b.destination}`,
                        start: b.dates[0],          // ✅ REQUIRED
                        allDay: true,
                        backgroundColor: "#b5d8f6",
                        borderColor: "#b5d8f6",
                        textColor: "#000",
                        extendedProps: {
                            source: "vehicle",
                            ...b
                        }
                    }));



                /* ========= FACILITY EVENTS ========= */
                const facilityEvents = (facilityData.bookings || []).map(b => {
                    const dateOnly = b.event_date?.split("T")[0];
                    return {
                        id: `facility-${b.id}`,
                        title: `🏢 ${b.event_name}`,
                        start: `${dateOnly}T${b.starting_time || "08:00"}`,
                        end: `${dateOnly}T${b.ending_time || "17:00"}`,
                        backgroundColor:
                            b.status === "approved"
                                ? "#A8E6CF"
                                : b.status === "rejected"
                                    ? "#FFB3B3"
                                    : "#FFF9B0",
                        borderColor: "#ccc",
                        textColor: "#000",
                        extendedProps: {
                            source: "facility",
                            ...b
                        }
                    };
                });

                /* ========= EQUIPMENT EVENTS ========= */
                const equipmentEvents = (equipmentData.bookings || []).flatMap(b =>
                    (b.dates || []).map(d => {
                        const dateOnly = d.split("T")[0];
                        return {
                            id: `equipment-${b.id}-${dateOnly}`,
                            title: `🧰 Equipment #${b.equipment_type_id}`,
                            start: `${dateOnly}T${(b.time_start || "08:00").slice(0, 5)}`,
                            end: `${dateOnly}T${(b.time_end || "17:00").slice(0, 5)}`,
                            backgroundColor: "#f3e5f5",
                            borderColor: "#f3e5f5",
                            textColor: "#000",
                            extendedProps: {
                                source: "equipment",
                                ...b
                            }
                        };
                    })
                );

                setRawEvents([
                    ...vehicleEvents,
                    ...facilityEvents,
                    ...equipmentEvents
                ]);
            } catch (err) {
                console.error("Universal calendar fetch error:", err);
            }
        };

        fetchAll();
    }, []);

    /* =========================
       FILTER EVENTS
    ========================== */
    const visibleEvents = useMemo(() => {
        return rawEvents.filter(ev => filters[ev.extendedProps.source]);
    }, [rawEvents, filters]);

    /* =========================
       UI
    ========================== */
    return (
        <div className="flex flex-col gap-4">
            {/* TOGGLES */}
            <div className="flex gap-6 bg-white p-4 rounded-xl border">
                <label className="flex items-center gap-2 font-semibold">
                    <input
                        type="checkbox"
                        checked={filters.vehicle}
                        onChange={() =>
                            setFilters(f => ({ ...f, vehicle: !f.vehicle }))
                        }
                    />
                    Vehicles
                </label>

                <label className="flex items-center gap-2 font-semibold">
                    <input
                        type="checkbox"
                        checked={filters.facility}
                        onChange={() =>
                            setFilters(f => ({ ...f, facility: !f.facility }))
                        }
                    />
                    Facilities
                </label>

                <label className="flex items-center gap-2 font-semibold">
                    <input
                        type="checkbox"
                        checked={filters.equipment}
                        onChange={() =>
                            setFilters(f => ({ ...f, equipment: !f.equipment }))
                        }
                    />
                    Equipment
                </label>
            </div>
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

                        {/* ===== VEHICLE ===== */}
                        {selectedEvent.extendedProps.source === 'vehicle' && (
                            <div className="space-y-2 text-gray-700">
                                <p><strong>Requestor:</strong> {selectedEvent.extendedProps.requestor}</p>
                                <p><strong>Department:</strong> {selectedEvent.extendedProps.department}</p>
                                <p><strong>Purpose:</strong> {selectedEvent.extendedProps.purpose}</p>
                                <p><strong>Date:</strong> {new Date(selectedEvent.start).toLocaleDateString()}</p>
                                {selectedEvent.extendedProps.destination && (
                                    <p><strong>Destination:</strong> {selectedEvent.extendedProps.destination}</p>
                                )}
                            </div>
                        )}

                        {/* ===== FACILITY ===== */}
                        {selectedEvent.extendedProps.source === 'facility' && (
                            <div className="space-y-2 text-gray-700">
                                <p><strong>Facility:</strong> {selectedEvent.extendedProps.event_facility}</p>
                                <p><strong>Event:</strong> {selectedEvent.extendedProps.event_name}</p>
                                <p><strong>Status:</strong> {selectedEvent.extendedProps.status}</p>
                                <p>
                                    <strong>Time:</strong>{" "}
                                    {selectedEvent.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {" – "}
                                    {selectedEvent.end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        )}

                        {/* ===== EQUIPMENT ===== */}
                        {selectedEvent.extendedProps.source === 'equipment' && (
                            <div className="space-y-2 text-gray-700">
                                <p><strong>Equipment ID:</strong> {selectedEvent.extendedProps.equipment_type_id}</p>
                                <p><strong>Date:</strong> {new Date(selectedEvent.start).toLocaleDateString()}</p>
                                <p>
                                    <strong>Time:</strong>{" "}
                                    {selectedEvent.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {" – "}
                                    {selectedEvent.end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
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

            {/* CALENDAR */}
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                headerToolbar={{
                    start: "prev,next today",
                    center: "title",
                    end: "dayGridMonth,timeGridWeek,timeGridDay"
                }}
                initialView="dayGridMonth"
                events={visibleEvents}
                eventClick={(info) => {
                    info.jsEvent.preventDefault();
                    setSelectedEvent(info.event);
                    setShowEventModal(true);
                }}

            />
        </div>
    );
}
