import React, { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function EquipmentBookingCalendar() {
    const [filter, setFilter] = useState({
        search: "",
        equipmentType: "All",
        department: "All",
        facility: "All",
        dateFrom: "",
        dateTo: "",
    });

    const [bookings, setBookings] = useState([]); // raw formatted bookings
    const [events, setEvents] = useState([]);

    const [equipments, setEquipments] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [equipmentTypes, setEquipmentTypes] = useState(["All"]);
    const [departmentOptions, setDepartmentOptions] = useState(["All"]);
    const [facilityOptions, setFacilityOptions] = useState(["All"]);

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);

    // ========= Helpers =========
    function toTitleCase(str) {
        if (!str) return "";
        return str
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/[-_]/g, " ")
            .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }

    const formatTime = (t) => {
        if (!t) return "";
        const [hh, mm] = t.split(":");
        let h = parseInt(hh, 10);
        const m = mm || "00";
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    };

    const normalize = (v) => (v ?? "").toString().trim().toLowerCase();

    // ========= Lookups =========
    const equipmentMap = useMemo(() => {
        const map = new Map();
        equipments.forEach((e) => {
            const id = e.id ?? e.equipment_type_id;
            const name = e.name ?? e.equipment_name ?? e.meaning ?? "";
            const modelId = e.model_id ?? e.modelId ?? "";
            map.set(Number(id), { name: toTitleCase(name), modelId });
        });
        return map;
    }, [equipments]);

    const facilityMap = useMemo(() => {
        const map = new Map();
        facilities.forEach((f) => {
            const id = f.id ?? f.facility_id;
            const name = f.name ?? f.facility ?? f.meaning ?? f.abbreviation ?? "";
            map.set(Number(id), toTitleCase(name));
        });
        return map;
    }, [facilities]);

    const departmentMap = useMemo(() => {
        const map = new Map();
        departments.forEach((d) => {
            const id = d.id ?? d.affiliation_id;
            const name = d.meaning ?? d.name ?? d.affiliation ?? d.abbreviation ?? "";
            map.set(Number(id), toTitleCase(name));
        });
        return map;
    }, [departments]);

    // ✅ FIXED: uses equipmentMap (NOT availableEquipments)
    const getEquipmentLabel = (id) => {
        const eq = equipmentMap.get(Number(id));
        if (!eq) return `Equipment #${id}`;
        return `${eq.name} (${eq.modelId})`;
    };

    const getFacilityName = (facilityId) => facilityMap.get(Number(facilityId)) || `Facility #${facilityId}`;
    const getDepartmentName = (affiliationId) =>
        departmentMap.get(Number(affiliationId)) || `Department #${affiliationId}`;

    // ========= Calendar Rendering =========
    const renderEventContent = (eventInfo) => {
        return (
            <div
                className="w-full"
                style={{
                    backgroundColor: eventInfo.event.backgroundColor || "#96161C",
                    padding: "2px 4px",
                    borderRadius: "4px",
                    color: eventInfo.event.textColor || "#000",
                    fontSize: "0.75rem",
                }}
            >
                <b>{eventInfo.timeText && eventInfo.timeText}</b> {eventInfo.event.title}
            </div>
        );
    };

    const handleEventClick = (clickInfo) => {
        setSelectedEvent(clickInfo.event);
        setShowEventModal(true);
    };

    // ========= Fetch =========
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [equipRes, facRes, depRes, bookRes] = await Promise.all([
                    fetch("http://localhost:5000/api/fetch-equipments"),
                    fetch("http://localhost:5000/api/fetch-facilities"),
                    fetch("http://localhost:5000/api/fetch-affiliation"),
                    fetch("http://localhost:5000/api/fetch-equipment-bookings"),
                ]);

                const equipData = await equipRes.json();
                const facData = await facRes.json();
                const depData = await depRes.json();
                const bookData = await bookRes.json();

                const equipmentsArr = Array.isArray(equipData) ? equipData : equipData.equipments || [];
                const facilitiesArr = Array.isArray(facData) ? facData : facData.facilities || [];
                const departmentsArr = Array.isArray(depData) ? depData : depData.affiliations || [];
                const bookingsArr = Array.isArray(bookData) ? bookData : bookData.bookings || [];

                setEquipments(equipmentsArr);
                setFacilities(facilitiesArr);
                setDepartments(departmentsArr);

                // Expand each booking into multiple events per date
                const formatted = [];
                bookingsArr.forEach((b) => {
                    const bookingDates = Array.isArray(b.dates) ? b.dates : [];

                    bookingDates.forEach((d) => {
                        const dateOnly = new Date(d).toISOString().slice(0, 10); // YYYY-MM-DD

                        const timeStart = (b.time_start || b.timeStart || "08:00").slice(0, 5);
                        const timeEnd = (b.time_end || b.timeEnd || "17:00").slice(0, 5);

                        const startISO = `${dateOnly}T${timeStart}:00`;
                        const endISO = `${dateOnly}T${timeEnd}:00`;

                        const equipmentLabel = getEquipmentLabel(b.equipment_type_id);

                        const hue = (Number(b.equipment_type_id || 1) * 47) % 360;
                        const bgColor = `hsl(${hue} 70% 85%)`;

                        formatted.push({
                            id: `${b.id}-${dateOnly}`,
                            title: equipmentLabel,
                            start: startISO,
                            end: endISO,
                            backgroundColor: bgColor,
                            borderColor: bgColor,
                            textColor: "#000000",
                            extendedProps: {
                                bookingId: b.id,
                                equipmentTypeId: b.equipment_type_id,
                                affiliationId: b.affiliation_id,
                                facilityId: b.facility_id,
                                purpose: b.purpose,
                                createdAt: b.created_at,
                                date: d, // original
                                dateOnly, // ✅ add for filtering
                                timeStart,
                                timeEnd,
                                equipmentLabel,
                                department: getDepartmentName(b.affiliation_id),
                                facility: getFacilityName(b.facility_id),
                            },
                        });
                    });
                });

                setBookings(formatted);
                setEvents(formatted);

                // Filter dropdown options
                const uniqueEquip = Array.from(
                    new Set(formatted.map((ev) => ev.extendedProps.equipmentLabel).filter(Boolean))
                ).sort((a, b) => a.localeCompare(b));

                const uniqueDept = Array.from(
                    new Set(formatted.map((ev) => ev.extendedProps.department).filter(Boolean))
                ).sort((a, b) => a.localeCompare(b));

                const uniqueFac = Array.from(
                    new Set(formatted.map((ev) => ev.extendedProps.facility).filter(Boolean))
                ).sort((a, b) => a.localeCompare(b));

                setEquipmentTypes(["All", ...uniqueEquip]);
                setDepartmentOptions(["All", ...uniqueDept]);
                setFacilityOptions(["All", ...uniqueFac]);
            } catch (err) {
                console.error("Error fetching equipment bookings:", err);
            }
        };

        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [equipmentMap, facilityMap, departmentMap]);

    // ========= Filters =========
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilter((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        let filtered = bookings;

        if (filter.search) {
            const s = normalize(filter.search);
            filtered = filtered.filter((ev) => {
                const p = normalize(ev.extendedProps.purpose);
                const dep = normalize(ev.extendedProps.department);
                const fac = normalize(ev.extendedProps.facility);
                const eq = normalize(ev.extendedProps.equipmentLabel);
                return p.includes(s) || dep.includes(s) || fac.includes(s) || eq.includes(s);
            });
        }

        if (filter.equipmentType !== "All") {
            filtered = filtered.filter((ev) => ev.extendedProps.equipmentLabel === filter.equipmentType);
        }

        if (filter.department !== "All") {
            filtered = filtered.filter((ev) => ev.extendedProps.department === filter.department);
        }

        if (filter.facility !== "All") {
            filtered = filtered.filter((ev) => ev.extendedProps.facility === filter.facility);
        }

        // ✅ FIXED: compare using dateOnly not raw ISO with time
        if (filter.dateFrom) {
            filtered = filtered.filter((ev) => ev.extendedProps.dateOnly >= filter.dateFrom);
        }

        if (filter.dateTo) {
            filtered = filtered.filter((ev) => ev.extendedProps.dateOnly <= filter.dateTo);
        }

        setEvents(filtered);
    }, [filter, bookings]);

    // ========= Actions =========
    const handleTempEdit = () => {
        alert("Temp Edit: connect this to your edit booking modal/page.");
    };

    const handleTempDelete = async () => {
        if (!selectedEvent) return;
        const bookingId = selectedEvent.extendedProps.bookingId;

        const confirmDelete = window.confirm(`Delete Equipment Booking #${bookingId}?`);
        if (!confirmDelete) return;

        try {
            const res = await fetch(`http://localhost:5000/api/booking/delete-equipment-booking/${bookingId}`, {
                method: "DELETE",
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                alert(data.message || "Failed to delete booking.");
                return;
            }

            setBookings((prev) => prev.filter((ev) => ev.extendedProps.bookingId !== bookingId));
            setShowEventModal(false);
            setSelectedEvent(null);
        } catch (err) {
            console.error("Delete booking error:", err);
            alert("Failed to delete booking.");
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* FILTER BAR */}
            <div className="flex-1 w-full">
                <div className="bg-white rounded-xl shadow-none p-4 w-full flex flex-wrap gap-4 items-end justify-between border border-[#888888]">
                    <div className="flex-1 min-w-[180px] max-w-xs">
                        <label className="block text-xs font-semibold mb-1 text-[#96161C]">
                            Search (Equipment/Dept/Facility/Purpose)
                        </label>
                        <input
                            type="text"
                            placeholder="Projector / Nursing / AVR / Seminar"
                            name="search"
                            value={filter.search}
                            onChange={handleFilterChange}
                            className="border border-[#888888] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                        />
                    </div>

                    <div className="flex-1 min-w-[160px] max-w-xs">
                        <label className="block text-xs font-semibold mb-1 text-[#96161C]">Equipment</label>
                        <select
                            name="equipmentType"
                            value={filter.equipmentType}
                            onChange={handleFilterChange}
                            className="border border-[#888888] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                        >
                            {equipmentTypes.map((eq) => (
                                <option key={eq} value={eq}>
                                    {eq}
                                </option>
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
                            {departmentOptions.map((dep) => (
                                <option key={dep} value={dep}>
                                    {dep}
                                </option>
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
                            {facilityOptions.map((fac) => (
                                <option key={fac} value={fac}>
                                    {fac}
                                </option>
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
                        onClick={() =>
                            setFilter({
                                search: "",
                                equipmentType: "All",
                                department: "All",
                                facility: "All",
                                dateFrom: "",
                                dateTo: "",
                            })
                        }
                        type="button"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* CALENDAR */}
            <div className="w-full">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={{
                        start: "prev,next today",
                        center: "title",
                        end: "dayGridMonth,timeGridWeek,timeGridDay",
                    }}
                    initialView="dayGridMonth"
                    editable={false}
                    selectable={false}
                    events={events}
                    eventContent={renderEventContent}
                    eventClick={handleEventClick}
                />

                {/* EVENT MODAL */}
                {showEventModal && selectedEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-11/12 max-w-xl p-6 relative">
                            <button
                                onClick={() => setShowEventModal(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
                            >
                                ✕
                            </button>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedEvent.title}</h2>

                            <div className="space-y-2 text-gray-700">
                                <p>
                                    <strong>Equipment:</strong> {selectedEvent.extendedProps.equipmentLabel}
                                </p>
                                <p>
                                    <strong>Department:</strong> {selectedEvent.extendedProps.department}
                                </p>
                                <p>
                                    <strong>Facility:</strong> {selectedEvent.extendedProps.facility}
                                </p>
                                <p>
                                    <strong>Purpose:</strong> {selectedEvent.extendedProps.purpose}
                                </p>
                                <p>
                                    <strong>Date:</strong> {formatDate(selectedEvent.extendedProps.date)}
                                </p>
                                <p>
                                    <strong>Time:</strong> {formatTime(selectedEvent.extendedProps.timeStart)} -{" "}
                                    {formatTime(selectedEvent.extendedProps.timeEnd)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    <strong>Booking ID:</strong> {selectedEvent.extendedProps.bookingId}
                                </p>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                {/* <button
                                    onClick={handleTempEdit}
                                    className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold hover:bg-blue-200"
                                >
                                    Edit (Temp)
                                </button>

                                <button
                                    onClick={handleTempDelete}
                                    className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-semibold hover:bg-red-200"
                                >
                                    Delete
                                </button> */}

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
