import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orgAbbreviations } from '../../constants/OrgAbbreviations';
import { orgAbbreviations as facilityList } from '../../constants/FacilitiesListing';
import { useLocation } from 'react-router-dom';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
// import BookingSummary from "../BookingSummary";
import {
    X,
    Calendar,
    Clock,
    Building,
    User,
    Users,
    Phone,
    Wrench,
    Car,
    Settings
} from "lucide-react";
function formatTime(timeStr) {
    if (!timeStr) return '';
    // Handles "HH:mm" or "HH:mm:ss"
    const [hour, minute] = timeStr.split(':');
    let h = parseInt(hour, 10);
    const m = minute;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
}

export default function Booking() {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [showForm, setShowForm] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [vehicleType, setVehicleType] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [affiliations, setAffiliations] = useState([]);
    const [equipmentMap, setEquipmentMap] = useState({});
    const [showVehicle, setShowVehicle] = useState(false);
    const [equipmentRows, setEquipmentRows] = useState([]);
    const [equipmentList, setEquipmentList] = useState([]);
    const [equipmentError, setEquipmentError] = useState('');
    const [facilitiesList, setFacilitiesList] = useState([]);
    const [facilitiesError, setFacilitiesError] = useState('');
    const [UserisNotAdmin, setUserisNotAdmin] = useState(false);
    const [editStatusIndex, setEditStatusIndex] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [conflictBooking, setConflictBooking] = useState(null);
    const [showVehicleForm, setShowVehicleForm] = useState(false);
    const [affiliationsError, setAffiliationsError] = useState('');
    const [equipmentLoading, setEquipmentLoading] = useState(false);
    const [editReservationId, setEditReservationId] = useState(null);
    const [showRequesterInfo, setShowRequesterInfo] = useState(false);
    const [loadingFacilities, setLoadingFacilities] = useState(false);
    const [deletedEquipmentIds, setDeletedEquipmentIds] = useState([]);
    const [showBookingSummary, setShowBookingSummary] = useState(false);
    const [loadingAffiliations, setLoadingAffiliations] = useState(true);
    const [showFacilityBreakdown, setShowFacilityBreakdown] = useState(false);
    // const [showVehicle, setShowVehicle] = useState(false);
    // const [vehicleType, setVehicleType] = useState('');
    const [vehicleList, setVehicleList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (showVehicle) {
            setLoading(true);
            fetch('http://localhost:5000/api/fetch-vehicle')
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setVehicleList(data.vehicles); // Assume array of { id, name, type, passenger_capacity }
                    } else {
                        setError('Failed to fetch vehicles');
                    }
                })
                .catch(err => {
                    console.error(err);
                    setError('Error fetching vehicles');
                })
                .finally(() => setLoading(false));
        }
    }, [showVehicle]);
    const [schedules, setSchedules] = useState([
        { date: '' || null, startTime: '' || null, endTime: '' || null }
    ]);

    const downloadReceipt = () => {
        if (!booking) return;

        const doc = new jsPDF("p", "mm", "a4");
        const left = 15; // left margin
        let y = 20; // starting vertical position

        doc.setFontSize(18);
        doc.text("Facility & Vehicle Booking Receipt", 105, y, { align: "center" });
        y += 10;

        doc.setFontSize(12);
        doc.text(`Event: ${booking.event_name || booking.title}`, left, y);
        y += 8;
        doc.text(`Facility: ${booking.event_facility || booking.facility}`, left, y);
        y += 8;
        doc.text(`Organization: ${booking.organization || booking.org}`, left, y);
        y += 8;
        doc.text(`Requested By: ${booking.requested_by || booking.requestedBy}`, left, y);
        y += 8;
        doc.text(`Contact: ${booking.contact}`, left, y);
        y += 8;
        doc.text(`Date: ${booking.event_date || booking.date}`, left, y);
        y += 8;
        doc.text(`Time: ${booking.starting_time || booking.start} – ${booking.ending_time || booking.end}`, left, y);
        y += 15;

        // Vehicles
        if (vehicles.length > 0) {
            doc.setFontSize(14);
            doc.text("Vehicle Reservations:", left, y);
            y += 8;
            doc.setFontSize(12);
            vehicles.forEach((v, idx) => {
                doc.text(`${idx + 1}. ${v.vehicle_type || "Unknown"} - ${v.plate_number || "N/A"}`, left + 5, y);
                y += 7;
            });
            y += 5;
        }

        // Equipment
        if (equipment.length > 0) {
            doc.setFontSize(14);
            doc.text("Equipment Reservations:", left, y);
            y += 8;
            doc.setFontSize(12);
            equipment.forEach((eq, idx) => {
                doc.text(`${idx + 1}. ${eq.type || "Unknown"} - ${eq.quantity || 0}×`, left + 5, y);
                y += 7;
            });
            y += 5;
        }

        // Signatures
        y += 10;
        doc.text("__________________________", left, y);
        doc.text("Requested By", left, y + 6);
        doc.text("__________________________", 130, y);
        doc.text("Approved By (President)", 130, y + 6);

        // Save PDF
        doc.save(`${booking.event_name || "booking"}-receipt.pdf`);
    };
    // const vehicleBookings = {
    //     [selectedBooking.id]: [''] // or array of vehicle bookings
    // };
    const booking = selectedBooking ?? null;
    const bookingId = booking?.id ?? null;
    const vehicles = booking?.vehicles ?? [];
    const equipment = bookingId ? equipmentMap?.[bookingId] ?? [] : [];
    const [referenceVehicles, setReferenceVehicles] = useState([]);
    useEffect(() => {
        const fetchReferenceVehicles = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/fetch-vehicles');
                if (!res.ok) throw new Error('Failed to fetch vehicles');
                const data = await res.json();
                setReferenceVehicles(data);
            } catch (error) {
                console.error('Error fetching vehicles:', error);
            }
        };
        fetchReferenceVehicles();
    }, []);
    const referenceVehicleMap = referenceVehicles.reduce((acc, vehicle) => {
        if (!vehicle.deleted) { // only include active vehicles
            if (!acc[vehicle.booker_id]) acc[vehicle.booker_id] = [];
            acc[vehicle.booker_id].push(vehicle);
        }
        return acc;
    }, {});
    // Make a function to attach related vehicles to each booking
    const bookingsWithVehicles = bookings.map(booking => {
        // Convert booking date to string YYYY-MM-DD for comparison
        const bookingDateStr = (booking.event_date || booking.date || '').split('T')[0];

        const matchedVehicles = referenceVehicles.filter(vehicle => {
            const vehicleDateStr = (vehicle.date || '').split('T')[0];
            return (
                !vehicle.deleted &&                  // skip deleted
                vehicleDateStr === bookingDateStr && // same date
                (vehicle.purpose || '').toLowerCase().includes((booking.event_name || '').toLowerCase())
            );
        });

        if (matchedVehicles.length > 0) {
            console.log(`MATCH FOUND FOR BOOKING: ${booking.event_name.toUpperCase()} ON ${bookingDateStr}`);
        }

        return {
            ...booking,
            matchedVehicles
        };
    });



    const handleReservationChange = async (bookingId, value) => {
        try {
            const res = await fetch(`http://localhost:5000/api/toggle-reservation/${bookingId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reservation: value === 'Reservation' }),
            });
            const data = await res.json();
            console.log('Updated booking:', data.booking); // debug
            if (data.success) {
                setBookings(prev =>
                    prev.map(b => (b.id === bookingId ? data.booking : b))
                );
                setEditReservationId(null);
            }
        } catch (err) {
            console.error('Failed to update reservation:', err);
        }
    };

    useEffect(() => {
        setEquipmentLoading(true);

        fetch('http://localhost:5000/api/fetch-equipments')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setEquipmentList(data.equipments || []);
                } else {
                    setEquipmentError('Failed to load equipment');
                }
            })
            .catch(() => setEquipmentError('Failed to load equipment'))
            .finally(() => setEquipmentLoading(false));
    }, []);

    useEffect(() => {
        const fetchFacilities = async () => {
            setLoadingFacilities(true);
            try {
                const res = await fetch('http://localhost:5000/api/fetch-facilities');
                const data = await res.json();

                if (data.success && Array.isArray(data.facilities)) {
                    setFacilitiesList(data.facilities);
                } else {
                    setFacilitiesError('Failed to load facilities');
                }
            } catch (err) {
                console.error(err);
                setFacilitiesError('Error fetching facilities');
            } finally {
                setLoadingFacilities(false);
            }
        };

        fetchFacilities();
    }, []);
    useEffect(() => {
        const fetchAffiliations = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/fetch-affiliation');
                const data = await res.json();

                if (data.success && data.affiliations) {
                    setAffiliations(data.affiliations); // expected [{ abbr, meaning }]
                } else {
                    setAffiliationsError('No affiliations found');
                }
            } catch (err) {
                console.error(err);
                setAffiliationsError('Failed to fetch affiliations');
            } finally {
                setLoadingAffiliations(false);
            }
        };

        fetchAffiliations();
    }, []);

    useEffect(() => {
        const storedRole = localStorage.getItem('currentUserRole');
        if (storedRole === 'admin') {
            setShowFacilityBreakdown(true);
        }
    }, []);
    const handleStatusClick = (index) => {
        setEditStatusIndex(index);
    };

    const handleStatusChange = (index, newStatus, bookingId) => {
        // -> EDIT AND SAVE THE BOOKING
        const updated = [...bookings];
        updated[index].status = newStatus;
        setBookings(updated);
        setEditStatusIndex(null);

        try {
            fetch(`http://localhost:5000/api/update-booking-status/${bookingId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            }).then((res) => res.json())
                .then((data) => {
                    if (!data.success) {
                        alert('Failed to update status');
                    }
                });
        } catch (err) {
            console.log(err)
        }
    };

    const fetchEquipmentForBooking = async (bookingId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/fetch-booking-equipment?booking_id=${bookingId}`);
            const data = await res.json();

            if (data.success) {
                setEquipmentMap(prev => ({
                    ...prev,
                    [bookingId]: data.equipment,
                }));
            }
        } catch (err) {
            console.error(`Error fetching equipment for booking ${bookingId}:`, err);
        }
    };

    const InfoItem = ({ icon, label, value }) => (
        <div className="flex gap-4">
            <div className="text-gray-500 mt-1">
                {React.cloneElement(icon, { size: 18 })}
            </div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-base font-medium text-gray-900">{value}</p>
            </div>
        </div>
    );





    // const [showEquipment, setshowEquipment] = useState(false);
    const [form, setForm] = useState({
        title: '',
        facility: '',
        date: '',
        startTime: '',
        endTime: '',
        requestedBy: '',
        org: '',
        contact: '',
        booking_fee: 0,
    });

    // Pagination state

    // Filter state
    const [filter, setFilter] = useState({
        search: '',
        status: 'All',
        facility: 'All',
        org: 'All',
        dateFrom: '',
        dateTo: ''
    });

    useEffect(() => {
        const storedUserId = localStorage.getItem('currentUserId');
        const storedUserRole = localStorage.getItem('currentUserRole');

        if (storedUserId && storedUserRole) {
            (async () => {
                try {
                    // try common API shapes
                    let res = await fetch(`http://localhost:5000/api/fetch-user/${storedUserId}`);
                    if (!res.ok) res = await fetch(`http://localhost:5000/api/fetch-user?id=${storedUserId}`);
                    if (!res.ok) res = await fetch(`http://localhost:5000/api/users/${storedUserId}`);

                    const data = await res.json();
                    if (data && data.success && data.user) {
                        const u = data.user;
                        const rawAff =
                            u.affiliations ||
                            u.affiliation ||
                            u.affiliation_list ||
                            u.affiliationIds ||
                            '';

                        let affiliations = [];
                        if (Array.isArray(rawAff)) {
                            affiliations = rawAff.map(String).map(s => s.trim()).filter(Boolean);
                        } else if (typeof rawAff === 'string' && rawAff.trim()) {
                            affiliations = rawAff.split(',').map(s => s.trim()).filter(Boolean);
                        }

                        const hydrated = { ...u, affiliations };
                        setUser(hydrated);
                        localStorage.setItem('currentUser', JSON.stringify(hydrated));
                    } else {
                        // fallback to minimal user with empty affiliations
                        setUser({ id: parseInt(storedUserId, 10), role: storedUserRole, affiliations: [] });
                    }
                } catch (err) {
                    console.error('Error fetching user:', err);
                    setUser({ id: parseInt(storedUserId, 10), role: storedUserRole, affiliations: [] });
                } finally {
                    setUserId(parseInt(storedUserId, 10));
                }
            })();
        }
    }, []);
    useEffect(() => {
        if (!user || !userId) return;

        fetch('http://localhost:5000/api/fetch-bookings')
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    console.log('Fetch bookings failed:', data.message || data.error);
                    return;
                }

                let visibleBookings = [];

                if (user.role === 'admin') {
                    visibleBookings = data.bookings.filter(b => b.deleted === false);
                    setUserisNotAdmin(false)
                } else if (user.role === 'user') {
                    setUserisNotAdmin(true);
                    // default false
                    visibleBookings = data.bookings.filter(b => b.deleted === false);
                }
                else if (user.role === 'owner') {
                    console.log(user);
                    visibleBookings = data.bookings.filter(
                        b => b.event_facility === user.affiliation && b.deleted === false
                        // facility should be Gym as the user affiliation is Gym
                    );
                }
                setBookings(visibleBookings);

                // Fetch equipment for each visible booking
                visibleBookings.forEach(b => {
                    fetchEquipmentForBooking(b.id);
                });
            })
            .catch(err => {
                console.log('Fetch bookings error:', err);
            });
    }, [user, userId]);



    // Filtering logic
    useEffect(() => {
        let result = bookings;

        // Search by event, facility, requested by, org, contact
        if (filter.search.trim()) {
            const q = filter.search.trim().toLowerCase();
            result = result.filter(b =>
                (b.event_name || b.title || '').toLowerCase().includes(q) ||
                (b.event_facility || b.facility || '').toLowerCase().includes(q) ||
                (b.requested_by || b.requestedBy || '').toLowerCase().includes(q) ||
                (b.organization || b.org || '').toLowerCase().includes(q) ||
                (b.contact || '').toLowerCase().includes(q)
            );
        }

        // Status filter
        if (filter.status !== 'All') {
            result = result.filter(b => (b.status || 'pending') === filter.status);
        }

        // Facility filter
        if (filter.facility !== 'All') {
            result = result.filter(b => (b.event_facility || b.facility || '') === filter.facility);
        }

        // Org filter
        if (filter.org !== 'All') {
            result = result.filter(b => (b.organization || b.org || '') === filter.org);
        }

        // Date range filter
        if (filter.dateFrom) {
            result = result.filter(b => (b.event_date || b.date) >= filter.dateFrom);
        }
        if (filter.dateTo) {
            result = result.filter(b => (b.event_date || b.date) <= filter.dateTo);
        }

        setFiltered(result);
        setCurrentPage(1); // Reset to first page on filter change
    }, [bookings, filter]);

    // Unique values for dropdowns
    const facilities = Array.from(new Set(bookings.map(b => b.event_facility || b.facility || '').filter(Boolean)));
    const orgs = Array.from(new Set(bookings.map(b => b.organization || b.org || '').filter(Boolean)));
    const statuses = ['All', 'approved', 'pending', 'declined', 'rescheduled'];
    const [editingId, setEditingId] = useState(null);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleFilterChange = e => setFilter({ ...filter, [e.target.name]: e.target.value });
    const currentUserId = localStorage.getItem('currentUserId');
    const currentUserRole = localStorage.getItem('currentUserRole');
    // const isConflict = false;
    let isConflict = false;
    let conflictingBooking = null;
    const handleToggleReservation = async (bookingId) => {
        try {
            const res = await fetch(`/api/toggle-reservation/${bookingId}`, {
                method: 'POST',
            });
            const data = await res.json();

            if (data.success) {
                // Update local state to reflect change immediately
                setBookings(prev =>
                    prev.map(b => (b.id === bookingId ? data.booking : b))
                );
            } else {
                console.error('Failed to toggle reservation:', data.message);
            }
        } catch (err) {
            console.error('Toggle reservation error:', err);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Venue from form:', form.facility);

        let isConflict = false;

        /* ===============================
           CONFLICT CHECK (CREATE ONLY)
        =============================== */
        if (!editingId) {
            try {
                const res = await fetch(
                    `http://localhost:5000/api/fetch-booking-conflicts?venue=${encodeURIComponent(form.facility)}`
                );
                const data = await res.json();

                if (data.success && Array.isArray(data.bookings)) {
                    const isTimeOverlap = (aStart, aEnd, bStart, bEnd) =>
                        aStart < bEnd && aEnd > bStart;

                    for (const newSchedule of schedules) {
                        for (const existing of data.bookings) {
                            const existingDate = (existing.event_date || '').split('T')[0];

                            if (existingDate === newSchedule.date) {
                                if (
                                    isTimeOverlap(
                                        newSchedule.startTime,
                                        newSchedule.endTime,
                                        existing.starting_time,
                                        existing.ending_time
                                    )
                                ) {
                                    isConflict = true;
                                    conflictingBooking = existing;
                                    break;
                                }
                            }
                        }
                        if (isConflict) break;
                    }
                }
            } catch (err) {
                console.error('Conflict check error:', err);
            }

            if (isConflict) {
                alert(
                    `Conflict detected!\n\n` +
                    `Event: ${conflictingBooking.event_name}\n` +
                    `Date: ${conflictingBooking.event_date.split('T')[0]}\n` +
                    `Time: ${conflictingBooking.starting_time} - ${conflictingBooking.ending_time}`
                );
                return;
            }
        }

        /* ===============================
           EQUIPMENT VALIDATION
        =============================== */
        const cleanEquipment = equipmentRows.filter(
            eq => eq.type && eq.quantity
        );

        if (cleanEquipment.length === 0) {
            const proceed = window.confirm(
                "Are you going to finish booking a venue without equipment?\n\nOK = Continue\nCancel = Go back"
            );
            if (!proceed) return;
        }

        /* ===============================
           CREATE / UPDATE BOOKING
        =============================== */
        try {
            const url = editingId
                ? `http://localhost:5000/api/edit-booking/${editingId}`
                : 'http://localhost:5000/api/create-booking';

            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    schedules,
                    event_name: form.title,
                    event_facility: form.facility,
                    requested_by: form.requestedBy,
                    organization: form.org,
                    contact: form.contact,
                    creator_id: currentUserId,
                    reservation: form.bookingType === 'reservation',
                    insider: form.insider,
                    booking_fee: form.booking_fee ?? 0
                })
            });

            const data = await response.json();

            if (!data.success) {
                alert(data.message || 'Booking failed');
                return;
            }

            /* ===============================
               SAFETY CHECK
            =============================== */
            // if (!data.booking?.id) {
            //     console.error('Missing booking ID:', data);
            //     alert('Booking saved, but equipment could not be attached.');
            //     return;
            // }
            if (!Array.isArray(data.bookings) || data.bookings.length === 0) {
                console.error('Missing booking IDs:', data);
                alert('Booking saved, but equipment could not be attached.');
                return;
            }
            /* ===============================
               CREATE EQUIPMENT (CREATE ONLY)
            =============================== */
            if (!editingId && cleanEquipment.length > 0) {
                for (const bookingId of data.bookings) {
                    const eqRes = await fetch('http://localhost:5000/api/create-equipment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            booking_id: bookingId,
                            equipment: cleanEquipment
                        })
                    });

                    const eqData = await eqRes.json();
                    if (!eqData.success) {
                        console.error(`Failed to attach equipment to booking ${bookingId}`);
                    }
                }
            }



            /* ===============================
               REFRESH & RESET
            =============================== */
            alert(editingId ? 'Booking updated successfully' : 'Booking created successfully');

            const refreshed = await fetch('http://localhost:5000/api/fetch-bookings');
            const refreshedData = await refreshed.json();
            if (refreshedData.success) {
                setBookings(refreshedData.bookings);
            }

            setForm({
                title: '',
                facility: '',
                date: '',
                startTime: '',
                endTime: '',
                requestedBy: '',
                org: '',
                contact: '',
                bookingType: 'booking',
                insider: 'student',
                booking_fee: 0,
            });

            setEquipmentRows([]);
            setEditingId(null);
            setShowForm(false);
            setSchedules([{ date: '', startTime: '', endTime: '' }]); // Reset schedules

        } catch (err) {
            console.error(err);
            alert('Server error');
        }
    };

    const handleScheduleChange = (index, field, value) => {
        const updatedSchedules = [...schedules];
        updatedSchedules[index][field] = value;
        setSchedules(updatedSchedules);
    };

    const handleAddSchedule = () => {
        setSchedules([...schedules, { date: '', startTime: '', endTime: '' }]);
    };

    const handleRemoveSchedule = (index) => {
        const updatedSchedules = schedules.filter((_, i) => i !== index);
        setSchedules(updatedSchedules);
    };

    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     console.log('Venue from form:', form.facility);

    //     let isConflict = false;

    //     /* ===============================
    //        CONFLICT CHECK (CREATE ONLY)
    //     =============================== */
    //     if (!editingId) {
    //         try {
    //             const res = await fetch(
    //                 `http://localhost:5000/api/fetch-booking-conflicts?venue=${encodeURIComponent(form.facility)}`
    //             );
    //             const data = await res.json();

    //             if (data.success) {
    //                 const newDate = form.date; // ✅ DO NOT SHIFT DATE
    //                 const newStart = form.startTime;
    //                 const newEnd = form.endTime;

    //                 const isTimeOverlap = (aStart, aEnd, bStart, bEnd) =>
    //                     aStart < bEnd && aEnd > bStart;

    //                 for (const b of data.bookings) {
    //                     const bDate = (b.event_date || b.date || '').split('T')[0];
    //                     const bStart = b.starting_time || '';
    //                     const bEnd = b.ending_time || '';

    //                     if (bDate === newDate && isTimeOverlap(newStart, newEnd, bStart, bEnd)) {
    //                         setConflictBooking(b);
    //                         isConflict = true;
    //                         break;
    //                     }
    //                 }
    //             }
    //         } catch (err) {
    //             console.error('Conflict check error:', err);
    //         }

    //         if (isConflict) {
    //             alert('Cannot create booking due to a conflict.');
    //             return;
    //         }
    //     }

    //     /* ===============================
    //        EQUIPMENT VALIDATION
    //     =============================== */
    //     const cleanEquipment = equipmentRows.filter(
    //         eq => eq.type && eq.quantity
    //     );

    //     if (cleanEquipment.length === 0) {
    //         const proceed = window.confirm(
    //             "Are you going to finish booking a venue without equipment?\n\nOK = Continue\nCancel = Go back"
    //         );
    //         if (!proceed) return;
    //     }

    //     /* ===============================
    //        CREATE / UPDATE BOOKING
    //     =============================== */
    //     try {
    //         const url = editingId
    //             ? `http://localhost:5000/api/edit-booking/${editingId}`
    //             : 'http://localhost:5000/api/create-booking';

    //         const method = editingId ? 'PUT' : 'POST';

    //         const response = await fetch(url, {
    //             method,
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({
    //                 schedules,
    //                 event_name: form.title,
    //                 event_facility: form.facility,
    //                 requested_by: form.requestedBy,
    //                 organization: form.org,
    //                 contact: form.contact,
    //                 creator_id: currentUserId,
    //                 reservation: form.bookingType === 'reservation',
    //                 insider: form.insider,
    //                 booking_fee: form.booking_fee ?? 0
    //             })
    //         });

    //         const data = await response.json();

    //         if (!data.success) {
    //             alert(data.message || 'Booking failed');
    //             return;
    //         }

    //         /* ===============================
    //            SAFETY CHECK
    //         =============================== */
    //         if (!data.booking?.id) {
    //             console.error('Missing booking ID:', data);
    //             alert('Booking saved, but equipment could not be attached.');
    //             return;
    //         }

    //         /* ===============================
    //            CREATE EQUIPMENT (CREATE ONLY)
    //         =============================== */
    //         if (!editingId && cleanEquipment.length > 0) {
    //             const eqRes = await fetch('http://localhost:5000/api/create-equipment', {
    //                 method: 'POST',
    //                 headers: { 'Content-Type': 'application/json' },
    //                 body: JSON.stringify({
    //                     booking_id: data.booking.id,
    //                     equipment: cleanEquipment
    //                 })
    //             });

    //             const eqData = await eqRes.json();
    //             if (!eqData.success) {
    //                 alert('Booking saved, but equipment failed to save.');
    //             }
    //         }

    //         /* ===============================
    //            REFRESH & RESET
    //         =============================== */
    //         alert(editingId ? 'Booking updated successfully' : 'Booking created successfully');

    //         const refreshed = await fetch('http://localhost:5000/api/fetch-bookings');
    //         const refreshedData = await refreshed.json();
    //         if (refreshedData.success) {
    //             setBookings(refreshedData.bookings);
    //         }

    //         setForm({
    //             title: '',
    //             facility: '',
    //             date: '',
    //             startTime: '',
    //             endTime: '',
    //             requestedBy: '',
    //             org: '',
    //             contact: '',
    //             bookingType: 'booking',
    //             insider: 'student',
    //             booking_fee: 0,
    //         });

    //         setEquipmentRows([]);
    //         setEditingId(null);
    //         setShowForm(false);
    //         setSchedules([{ date: '', startTime: '', endTime: '' }]); // Reset schedules

    //     } catch (err) {
    //         console.error(err);
    //         alert('Server error');
    //     }
    // };

    const ActionButton = ({ label, variant = "default", disabled }) => {
        const base = "px-4 py-1.5 rounded-md text-sm font-medium transition focus:outline-none";
        const styles = {
            default: "bg-blue-100 text-blue-800 hover:bg-blue-200",
            warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
            danger: "bg-red-100 text-red-800 hover:bg-red-200",
        };

        return (
            <button
                disabled={disabled}
                className={`${base} ${styles[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                {label}
            </button>
        );
    };



    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this booking?')) return;


        try {
            const res = await fetch(`http://localhost:5000/api/delete-booking/${id}`, {
                method: 'PUT'
            });
            const data = await res.json();

            if (data.success) {
                alert('Booking marked as deleted');
                // Refetch your bookings or remove from state
                window.location.reload(); // <-- reloads the page
                return;
            } else {
                alert('Failed to update status');
            }
        } catch (err) {
            console.error(err);
            alert('Server error');
        }
    };

    const cancelBooking = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this Booking??')) return;

        try {
            const res = await fetch(`http://localhost:5000/api/cancel-booking/${id}`, {
                method: 'PUT'
            });
            const data = await res.json();

            if (data.success) {
                alert('Booking marked as cancelled');
                // Refetch your bookings or remove from state
                window.location.reload(); // <-- reloads the page
                return;
            } else {
                alert('Failed to update status');
            }
        } catch (err) {
            console.error(err);
            alert('Server error');
        }
    }



    const extractDate = (datetime) => {
        if (!datetime) return '';
        return datetime.split('T')[0];
    };

    const handleEdit = (booking) => {
        console.log('Editing booking:', booking); // Debugging: Check the booking object
        console.log('Schedules before mapping:', booking.schedules); // Debugging: Check the schedules field

        setEditingId(booking.id);

        const bookingSchedules = (booking.schedules || []).map((schedule) => ({
            date: schedule.date || '', // Ensure date is not undefined
            startTime: schedule.startTime || '', // Ensure startTime is not undefined
            endTime: schedule.endTime || '', // Ensure endTime is not undefined
        }));

        console.log('Mapped schedules:', bookingSchedules); // Debugging: Check the mapped schedules

        setSchedules(bookingSchedules);

        setForm({
            title: booking.event_name || booking.title || '',
            facility: booking.event_facility || booking.facility || '',
            requestedBy: booking.requested_by || booking.requestedBy || '',
            org: booking.organization || booking.org || '',
            contact: booking.contact || '',
            bookingType: booking.reservation ? 'reservation' : 'booking',
            insider: booking.insider ? 'employee' : booking.userType || 'student',
            booking_fee: booking.booking_fee ?? 0,
        });

        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };



    useEffect(() => {
        // If navigated with an editBookingId, trigger handleEdit
        if (location.state && location.state.editBookingId && bookings.length > 0) {
            const bookingToEdit = bookings.find(b => b.id === location.state.editBookingId);
            if (bookingToEdit) {
                console.log('Found booking to edit:', bookingToEdit); // Debugging: Check the booking to edit
                handleEdit(bookingToEdit);
            }
        }
        // Optionally clear the state after using it
        // eslint-disable-next-line
    }, [location.state, bookings]);


    // Pagination logic
    const totalRows = filtered.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handleRowsPerPageChange = e => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };


    function getTomorrowDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    function calculateMinEndTime(startTime) {
        if (!startTime) return "06:00";

        const [hour, minute] = startTime.split(':').map(Number);
        const endHour = hour + 1;
        const resultHour = endHour < 10 ? `0${endHour}` : `${endHour}`;
        return `${resultHour}:${minute.toString().padStart(2, '0')}`;
    }
    function clearForm() {
        setForm({
            title: '',
            facility: '',
            date: '',
            startTime: '',
            endTime: '',
            requestedBy: '',
            org: '',
            contact: ''
        });
    }
    const handleCreateVehicleFromBooking = async () => {
        if (!vehicleType) {
            alert('Please select a vehicle');
            return;
        }

        // Ensure facility booking fields exist
        const required = ['event_name', 'event_date', 'requested_by', 'organization'];
        const missing = required.filter(f => !form[f]);

        const requiredMap = {
            title: 'Event Name',
            requestedBy: 'Requested By',
            org: 'Department / Organization',
        };

        // check form fields
        const missingFields = Object.entries(requiredMap)
            .filter(([key]) => !form[key] || form[key].trim() === '')
            .map(([_, label]) => label);

        // check date from schedules
        if (!schedules[0]?.date) {
            missingFields.push('Event Date');
        }

        if (missingFields.length > 0) {
            alert(
                `Please complete the following facility booking details first:\n\n` +
                missingFields.map(f => `• ${f}`).join('\n')
            );
            return;
        }



        const payload = {
            vehicle_id: Number(vehicleType),       // ✅ MUST be vehicle ID
            requestor: form.requestedBy,
            department_id: Number(form.org),        // ✅ MUST be department ID
            date: schedules[0].date,
            purpose: form.title,
            booker_id: Number(localStorage.getItem('currentUserId')),
        };


        try {
            const res = await fetch(
                'http://localhost:5000/api/create-raw-vehicle-booking',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            alert('Vehicle booking created successfully');

            setVehicleType('');
            setShowVehicle(false);

        } catch (err) {
            console.error(err);
            alert('Failed to create vehicle booking');
        }
    };

    const [relatedVehicleBookings, setRelatedVehicleBookings] = useState({});

    const fetchRelatedVehicleBookings = async (facilityBooking) => {
        try {
            const res = await fetch(
                `http://localhost:5000/api/related-vehicle-bookings?date=${encodeURIComponent(facilityBooking.date)}&purpose=${encodeURIComponent(facilityBooking.event_name || facilityBooking.title)}&requestor=${encodeURIComponent(facilityBooking.requested_by || facilityBooking.requestedBy)}`
            );
            const data = await res.json();

            if (data.success) {
                setRelatedVehicleBookings((prev) => ({
                    ...prev,
                    [facilityBooking.id]: data.vehicleBookings
                }));
            } else {
                console.error('Failed to fetch related vehicle bookings:', data.message);
            }
        } catch (err) {
            console.error('Error fetching related vehicle bookings:', err);
        }
    };

    // Fetch related vehicle bookings for all facility bookings
    useEffect(() => {
        bookings.forEach((booking) => {
            fetchRelatedVehicleBookings(booking);
        });
    }, [bookings]);

    return (
        <div className="w-full">
            {/* Collapsible Create Booking */}
            <div className="mb-6">
                <button
                    className="w-full flex items-center justify-between px-8 py-5 bg-[#96161C] text-white text-xl font-bold rounded-t-xl focus:outline-none transition"
                    onClick={() => setShowForm(!showForm)}
                >
                    <span>Create Booking</span>
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
                    <form
                        onSubmit={handleSubmit}
                        className="bg-[#f9f9f9] px-8 py-8 rounded-b-xl shadow-md border border-t-0 border-gray-200 w-full"
                    >
                        {/* Debugging: Check schedules before rendering */}
                        {console.log('Rendering form with schedules:', schedules)}

                        {/* Date & Time */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-3 text-[#96161C]">Date & Time</h3>

                            {schedules.map((s, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3 items-end">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Event date*</label>
                                        <input
                                            type="date"
                                            value={s.date || getTomorrowDate()}
                                            min={getTomorrowDate()}
                                            onChange={(e) => {
                                                const copy = [...schedules];
                                                copy[index].date = e.target.value;
                                                setSchedules(copy);
                                            }}
                                            className="w-full border rounded-lg px-4 py-2"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Start*</label>
                                        <input
                                            type="time"
                                            value={s.startTime} // Bind to schedules array
                                            onChange={(e) => {
                                                const copy = [...schedules];
                                                copy[index].startTime = e.target.value;
                                                setSchedules(copy);
                                            }}
                                            className="w-full border rounded-lg px-4 py-2"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">End*</label>
                                        <input
                                            type="time"
                                            value={s.endTime} // Bind to schedules array
                                            onChange={(e) => {
                                                const copy = [...schedules];
                                                copy[index].endTime = e.target.value;
                                                setSchedules(copy);
                                            }}
                                            className="w-full border rounded-lg px-4 py-2"
                                            required
                                        />
                                    </div>

                                    {/* Remove row (except first) */}
                                    {index > 0 && (
                                        <button
                                            type="button"
                                            className="text-red-600 text-sm"
                                            onClick={() =>
                                                setSchedules(schedules.filter((_, i) => i !== index))
                                            }
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}

                            {/* Duplicate button */}
                            <button
                                type="button"
                                className="mt-2 text-sm font-semibold text-[#96161C]"
                                onClick={() =>
                                    setSchedules([
                                        ...schedules,
                                        { date: '', startTime: '', endTime: '' }
                                    ])
                                }
                            >
                                + Add another date
                            </button>
                        </div>

                        {/* Event and Venue */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-3 text-[#96161C]">Event and Venue</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Event name*</label>
                                    <input
                                        type="text"
                                        name="title"
                                        maxLength={18}
                                        value={form.title}
                                        onChange={handleChange}
                                        placeholder="General Assembly"
                                        className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Facility*</label>
                                    <select
                                        name="facility"
                                        value={form.facility}
                                        onChange={(e) =>
                                            setForm(prev => ({ ...prev, facility: e.target.value }))
                                        }
                                        className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                        required
                                    >
                                        <option value="">Select a facility</option>
                                        {loadingFacilities && <option disabled>Loading...</option>}
                                        {facilitiesError && <option disabled>{facilitiesError}</option>}
                                        {facilitiesList.map((f) => (
                                            <option key={f.id} value={f.name}>
                                                {f.name} {/* render only the name, not the object */}
                                            </option>
                                        ))}
                                    </select>

                                </div>


                            </div>
                        </div>
                        {/* Booker */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-3 text-[#96161C]">Booker</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Requested by*</label>
                                    <input
                                        type="text"
                                        name="requestedBy"
                                        maxLength={18}
                                        value={form.requestedBy}
                                        onChange={handleChange}
                                        placeholder="Juan De la Cruz"
                                        className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Org / Dept*</label>
                                    <select
                                        name="org"
                                        value={form.org}
                                        onChange={(e) => setForm(prev => ({ ...prev, org: e.target.value }))}
                                        className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                        required
                                    >
                                        <option value="">Select Org / Dept</option>
                                        {affiliations.map((o) => (
                                            <option key={o.id} value={o.id}>
                                                {o.abbreviation} - {o.meaning}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Contact*</label>
                                    <input
                                        type="text"
                                        name="contact"
                                        value={form.contact}
                                        onChange={(e) => {
                                            let input = e.target.value.replace(/\D/g, ''); // Remove all non-digits
                                            if (input.length <= 11) {
                                                setForm(prev => ({ ...prev, contact: input }));
                                            }
                                        }}
                                        placeholder="09XXXXXXXXX"
                                        pattern="^09\d{9}$"
                                        className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                        required
                                    />


                                </div>
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (equipmentRows.length < 5) {
                                                setEquipmentRows([...equipmentRows, { type: '', quantity: '' }]);
                                            }
                                        }}
                                        className="bg-[#96161C] text-white px-8 py-2 rounded-lg font-semibold hover:bg-[#7a1217] transition"
                                    >
                                        Add Equipment +
                                    </button>
                                    {equipmentRows.map((row, index) => (
                                        <div key={index} className="flex gap-4 items-center my-2">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium mb-1">Equipment Type</label>
                                                <select
                                                    value={row.type}
                                                    onChange={(e) => {
                                                        const updated = [...equipmentRows];
                                                        updated[index].type = e.target.value;
                                                        setEquipmentRows(updated);
                                                    }}
                                                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                                    required
                                                >
                                                    <option value="">Select Equipment</option>

                                                    {equipmentLoading && (
                                                        <option disabled>Loading...</option>
                                                    )}

                                                    {equipmentError && (
                                                        <option disabled>{equipmentError}</option>
                                                    )}

                                                    {equipmentList.map(eq => (
                                                        <option key={eq.id} value={eq.name}>
                                                            {eq.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex-1">
                                                <label className="block text-sm font-medium mb-1">Quantity</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    value={row.quantity}
                                                    onChange={(e) => {
                                                        const updated = [...equipmentRows];
                                                        updated[index].quantity = e.target.value;
                                                        setEquipmentRows(updated);
                                                    }}
                                                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                                    required
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (equipmentRows[index].id) {
                                                        setDeletedEquipmentIds(prev => [...prev, equipmentRows[index].id]);
                                                    }
                                                    setEquipmentRows(equipmentRows.filter((_, i) => i !== index));
                                                }}
                                                className="text-red-600 hover:text-red-800 text-lg font-bold"
                                                title="Remove"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                    {/* <button
                                        type="button"
                                        onClick={() => setShowVehicle(true)}
                                        className="bg-[#96161C] text-white px-6 py-2 rounded-lg"
                                    >
                                        Add Vehicle +
                                    </button> */}

                                    {showVehicle && (
                                        <div className="mt-4 p-4 border rounded-lg bg-gray-50 relative">
                                            {/* Close Button */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowVehicle(false);
                                                    setVehicleType('');
                                                }}
                                                className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 font-bold text-lg"
                                                title="Close"
                                            >
                                                &times;
                                            </button>

                                            <label className="block text-sm font-medium mb-1">
                                                Vehicle*
                                            </label>

                                            <select
                                                value={vehicleType}
                                                onChange={(e) => setVehicleType(e.target.value)}
                                                className="w-full border rounded-lg px-4 py-2 mb-3"
                                                required
                                            >
                                                <option value="">Select a vehicle...</option>
                                                {loading && <option disabled>Loading...</option>}
                                                {error && <option disabled>{error}</option>}
                                                {vehicleList.map(v => (
                                                    <option key={v.id} value={v.id}>
                                                        {`${v.vehicle_name} | ${v.vehicle_type} | Capacity: ${v.passenger_capacity}`}
                                                    </option>
                                                ))}
                                            </select>

                                            <button
                                                type="button"
                                                onClick={() => handleCreateVehicleFromBooking(vehicleType)}
                                                disabled={!vehicleType}
                                                className="bg-[#96161C] text-white px-6 py-2 rounded-lg disabled:opacity-50"
                                            >
                                                Save Vehicle Booking
                                            </button>
                                        </div>
                                    )}





                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Type*</label>
                                    <div className="flex items-center gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="radio"
                                                name="bookingType"
                                                value="booking"
                                                checked={form.bookingType === 'booking'}
                                                onChange={(e) =>
                                                    setForm(prev => ({ ...prev, bookingType: e.target.value }))
                                                }
                                                className="h-5 w-5 accent-[#96161C] cursor-pointer"
                                            />
                                            <span className="text-sm text-gray-700">Booking</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="radio"
                                                name="bookingType"
                                                value="reservation"
                                                checked={form.bookingType === 'reservation'}
                                                onChange={(e) =>
                                                    setForm(prev => ({ ...prev, bookingType: e.target.value }))
                                                }
                                                className="h-5 w-5 accent-[#96161C] cursor-pointer"
                                            />
                                            <span className="text-sm text-gray-700">Reservation</span>
                                        </label>
                                    </div>
                                </div>


                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        <p className='font-medium'>Booker Type*</p>
                                    </label>

                                    <div className="flex flex-wrap gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="insider"
                                                value="student"
                                                checked={form.insider === 'student'}
                                                onChange={(e) =>
                                                    setForm(prev => ({ ...prev, insider: e.target.value }))
                                                }
                                                className="h-5 w-5 accent-[#96161C]"
                                                required
                                            />
                                            <span className="text-sm text-gray-700">Student</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="insider"
                                                value="employee"
                                                checked={form.insider === 'employee'}
                                                onChange={(e) =>
                                                    setForm(prev => ({ ...prev, insider: e.target.value }))
                                                }
                                                className="h-5 w-5 accent-[#96161C]"
                                            />
                                            <span className="text-sm text-gray-700">Employee</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="insider"
                                                value="outsider"
                                                checked={form.insider === 'outsider'}
                                                onChange={(e) =>
                                                    setForm(prev => ({ ...prev, insider: e.target.value }))
                                                }
                                                className="h-5 w-5 accent-[#96161C]"
                                            />
                                            <span className="text-sm text-gray-700">Outsider</span>
                                        </label>
                                    </div>
                                </div>

                                {!UserisNotAdmin && editingId && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Booking Fee
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.booking_fee}
                                            onChange={(e) =>
                                                setForm(prev => ({
                                                    ...prev,
                                                    booking_fee: Number(e.target.value)
                                                }))
                                            }
                                            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Actions */}
                        <div className="flex flex-wrap gap-3 justify-end">
                            <button
                                type="submit"
                                className="bg-[#96161C] text-white px-8 py-2 rounded-lg font-semibold hover:bg-[#7a1217] transition"
                            >
                                {editingId ? 'Save' : 'Create'}
                            </button>
                            <button
                                type="submit"
                                className="bg-[#727272] text-white px-8 py-2 rounded-lg font-semibold hover:bg-[#d4d4d4] transition"
                                onClick={() => clearForm()}
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                className="bg-gray-200 text-gray-800 px-8 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>

                )}
            </div>
            {conflictBooking && (
                <div className="mt-6 p-4 border-2 border-red-500 rounded-lg bg-red-50">
                    <h2 className="text-lg font-bold text-red-700 mb-2">
                        ⚠️ Conflict Detected
                    </h2>
                    <div className="p-3 border rounded bg-white shadow">
                        <p><strong>Event:</strong> {conflictBooking.event_name}</p>
                        <p><strong>Date:</strong> {(conflictBooking.event_date || '').split('T')[0]}</p>
                        <p><strong>Time:</strong> {conflictBooking.starting_time} - {conflictBooking.ending_time}</p>
                        <p><strong>Venue:</strong> {conflictBooking.event_facility}</p>
                        <p><strong>Organization:</strong> {conflictBooking.organization}</p>
                        <p><strong>Requested By:</strong> {conflictBooking.requested_by}</p>
                        <p><strong>Contact:</strong> {conflictBooking.contact}</p>
                        <p><strong>Status:</strong> {conflictBooking.status}</p>

                    </div>
                </div>
            )}

            {/* Bookings List */}
            <div className="bg-white rounded-xl shadow-md p-8 w-full mt-8">
                {/* My Bookings Title and Filter */}
                <div> <h2 className="text-2xl font-bold text-[#96161C] flex items-center gap-2 justify-start mb-2 md:mb-0">
                    <svg className="w-7 h-7 text-[#96161C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    My Bookings
                </h2></div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">

                    {/* Filter Controls - Full width on right */}
                    <div className="flex-1 w-full">
                        <div className="bg-white rounded-xl shadow-none p-0 w-full flex flex-wrap gap-4 items-end justify-between">
                            <div className="flex-1 min-w-[180px] max-w-xs">
                                <label className="block text-xs font-semibold mb-1 text-[#96161C]">Search</label>
                                <input
                                    type="text"
                                    name="search"
                                    value={filter.search}
                                    onChange={handleFilterChange}
                                    placeholder="Search event, facility, org, etc."
                                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                />
                            </div>
                            <div className="flex-1 min-w-[120px] max-w-xs">
                                <label className="block text-xs font-semibold mb-1 text-[#96161C]">Status</label>
                                <select
                                    name="status"
                                    value={filter.status}
                                    onChange={handleFilterChange}
                                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
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
                                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                >
                                    <option value="All">All</option>
                                    {facilities.map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Org/Dept*</label>
                                <select
                                    name="org"
                                    value={form.org}
                                    onChange={(e) => setForm(prev => ({ ...prev, org: e.target.value }))}
                                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                    required
                                >
                                    <option value="">Select an Org/Dept</option>
                                    {affiliations.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.abbreviation} {/* only the abbreviation is rendered */}
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
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                checked={showRequesterInfo}
                                onChange={() => setShowRequesterInfo(prev => !prev)}
                                id="toggle-requester"
                                className="accent-[#96161C]"
                            />
                            <label htmlFor="toggle-requester" className="text-sm text-[#96161C] font-medium">
                                Show Requested By & Contact
                            </label>
                        </div>

                    </div>
                </div>

                {/* Table Header */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#96161C] position-sticky z-10 top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider rounded-tl-xl">Event</th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">Facility</th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">Date</th>
                                <th className="px-2 py-3 text-sm font-bold text-white uppercase tracking-wider text-center">Time</th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">Org/Dept</th>
                                <th className="px-6 py-2 text-left text-sm font-bold text-white uppercase tracking-wider">Equipment</th>
                                <th className="px-6 py-2 text-left text-sm font-bold text-white uppercase tracking-wider">Type</th>
                                <th className="px-6 py-2 text-left text-sm font-bold text-white uppercase tracking-wider">Booker</th>
                                {showRequesterInfo && (
                                    <>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">Requested By</th>
                                        <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">Contact</th>
                                    </>
                                )}
                                <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">Status</th>
                                {UserisNotAdmin ?
                                    // TRUE - USER
                                    <></> : <th className="px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider">Payment</th>}
                                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider rounded-tr-xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-8 text-gray-500">No bookings found.</td>
                                </tr>
                            ) : (
                                paginated.map((b, idx) => (
                                    <React.Fragment key={b.id || idx}>
                                        <tr
                                            className={`transition hover:bg-[#f8eaea] cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fde8e8]'}`}
                                            onClick={() => {
                                                setSelectedBooking(b);      // set the booking
                                                setShowBookingSummary(true); // show modal
                                            }}
                                        >

                                            {/*  */}

                                            {/* CHECK USER ROLE */}
                                            {UserisNotAdmin ?
                                                // TRUE
                                                // USER IS NOT ADMIN
                                                ((parseInt(b.creator_id) === parseInt(currentUserId)) ?
                                                    // USER'S OWN BOOKING
                                                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#a31d23]" >{b.event_name || b.title}</td>
                                                    :
                                                    // OTHER USER ANONYMOUS BOOKINGS
                                                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#daa7aa]" >Hidden</td>
                                                )



                                                :
                                                // FALSE
                                                // IS ADMIN
                                                <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#a31d23]" >{b.event_name || b.title}</td>}

                                            {/* DEBUG USER ROLE AND ID AND BOOKING ID */}
                                            {/* <td>{b.creator_id + currentUserId + currentUserRole}</td> */}
                                            {/*  */}
                                            <td className="px-6 py-4 whitespace-nowrap">{b.event_facility || b.facility || '-'}</td>
                                            {/*  */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {(() => {
                                                    const d = (b.event_date || b.date || '').split('T')[0];
                                                    if (!d) return '';
                                                    const [year, month, day] = d.split('-');

                                                    // create a Date object
                                                    const dateObj = new Date(`${year}-${month}-${day}`);

                                                    // increment the day by 1
                                                    dateObj.setDate(dateObj.getDate() + 1);

                                                    // format as "October 1, 2025"
                                                    return dateObj.toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    });
                                                })()}
                                            </td>

                                            {/* <td className="px-6 py-4 whitespace-nowrap">
                                            {b.event_date ? b.event_date.split('T')[0] : ''}
                                        </td> */}
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {(b.starting_time && b.ending_time)
                                                    ? `${formatTime(b.starting_time)} - ${formatTime(b.ending_time)}`
                                                    : b.time}
                                            </td>

                                            {UserisNotAdmin
                                                ? (
                                                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#a31d23]">
                                                        {affiliations.find(a => a.id === Number(b.organization))?.abbreviation || ` ${b.organization}`}
                                                    </td>
                                                )
                                                : (
                                                    (parseInt(b.creator_id) === parseInt(currentUserId))
                                                        ? (
                                                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#a31d23]">
                                                                {affiliations.find(a => a.id === Number(b.organization))?.abbreviation || `${b.organization}`}
                                                            </td>
                                                        )
                                                        : (
                                                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#daa7aa]">Hidden</td>
                                                        )
                                                )
                                            }

                                            {/* <td className="px-6 py-4 whitespace-nowrap">{b.organization || b.org || '-'}</td> */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {equipmentMap[b.id]?.length > 0 ? (
                                                    <ul className="list-disc list-inside space-y-1">
                                                        {equipmentMap[b.id].map((item, idx) => (
                                                            <li key={idx}>{item.quantity}x {item.type}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="text-gray-400 italic">No equipment</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                                {editReservationId === b.id ? (
                                                    <select
                                                        value={b.reservation ? 'Reservation' : 'Booking'}
                                                        onChange={(e) => handleReservationChange(b.id, e.target.value)}
                                                        onBlur={() => setEditReservationId(null)}
                                                        autoFocus
                                                        className="text-xs px-3 py-1 border rounded-full focus:ring-2 focus:ring-[#96161C] font-bold shadow"
                                                        style={{ minWidth: 120 }}
                                                    >
                                                        <option value="Booking">Booking</option>
                                                        <option value="Reservation">Reservation</option>
                                                    </select>
                                                ) : (
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-bold shadow
        ${b.reservation
                                                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                                                : 'bg-green-100 text-green-800 border border-green-300'
                                                            }`}
                                                        onClick={() => setEditReservationId(b.id)}
                                                    >
                                                        {b.reservation ? 'Reservation' : 'Booking'}
                                                    </span>
                                                )}
                                            </td>




                                            {/* Insider / Employee / Student / Outsider Badge */}
                                            <td>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold
      ${b.insider === 'employee'
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : b.insider === 'student'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    {b.insider === 'employee' ? 'Employee' : b.insider === 'student' ? 'Student' : 'Outsider'}
                                                </span>
                                            </td>
                                            {showRequesterInfo && (
                                                <>
                                                    {UserisNotAdmin ?

                                                        ((parseInt(b.creator_id) === parseInt(currentUserId)) ?
                                                            <td className="px-6 py-4 whitespace-nowrap " >{b.requested_by}</td>
                                                            :
                                                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#daa7aa]" >Hidden</td>
                                                        )
                                                        :
                                                        <td className="px-6 py-4 whitespace-nowrap  " >{b.requested_by}</td>}
                                                    {/* <td className="px-6 py-4 whitespace-nowrap">{b.requested_by || b.requestedBy || '-'}</td> */}
                                                    {/* <td className="px-6 py-4 whitespace-nowrap">{b.contact || '-'}</td> */}

                                                    {UserisNotAdmin ?

                                                        ((parseInt(b.creator_id) === parseInt(currentUserId)) ?
                                                            <td className="px-6 py-4 whitespace-nowrap  " >{b.contact}</td>
                                                            :
                                                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#daa7aa]" >Hidden</td>
                                                        )
                                                        :
                                                        <td className="px-6 py-4 whitespace-nowrap " >{b.contact}</td>}
                                                </>
                                            )}
                                            {UserisNotAdmin ?
                                                <td onClick={(e) => e.stopPropagation()}> <span
                                                    className={`px-3 py-1 rounded-full text-xs font-bold shadow
                                                        ${b.status === 'approved'
                                                            ? 'bg-green-100 text-green-700 border border-green-300'
                                                            : b.status === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                                                : b.status === 'declined'
                                                                    ? 'bg-red-100 text-red-700 border border-red-300'
                                                                    : b.status === 'rescheduled'
                                                                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                                                        }`}
                                                >
                                                    {b.status || 'Pending'}
                                                </span></td>
                                                :
                                                <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={(e) => { handleStatusClick(idx); e.stopPropagation(); }}>
                                                    {editStatusIndex === idx ? (
                                                        <select
                                                            value={b.status}
                                                            onChange={(e) => handleStatusChange(idx, e.target.value, b.id)}
                                                            onBlur={() => setEditStatusIndex(null)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            autoFocus
                                                            className="text-xs px-3 py-1 border rounded-full focus:ring-2 focus:ring-[#96161C] font-bold shadow"
                                                            style={{ minWidth: 120 }}
                                                        >
                                                            <option value="" disabled className="text-gray-400">Select status</option>
                                                            <option value="Pending" style={{ background: '#FEF3C7', color: '#B45309', fontWeight: 'bold' }}>Pending</option>
                                                            <option value="Approved" style={{ background: '#D1FAE5', color: '#047857', fontWeight: 'bold' }}>Approved</option>
                                                            <option value="Declined" style={{ background: '#FECACA', color: '#B91C1C', fontWeight: 'bold' }}>Declined</option>
                                                            <option value="Rescheduled" style={{ background: '#DBEAFE', color: '#1D4ED8', fontWeight: 'bold' }}>Rescheduled</option>
                                                        </select>
                                                    ) : (
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-bold shadow
                                                        ${b.status === 'approved'
                                                                    ? 'bg-green-100 text-green-700 border border-green-300'
                                                                    : b.status === 'pending'
                                                                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                                                        : b.status === 'declined'
                                                                            ? 'bg-red-100 text-red-700 border border-red-300'
                                                                            : b.status === 'rescheduled'
                                                                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                                                : 'bg-gray-100 text-gray-700 border border-gray-300'
                                                                }`}
                                                        >
                                                            {b.status || 'Pending'}
                                                        </span>
                                                    )}
                                                </td>
                                            }
                                            {UserisNotAdmin ? null : (
                                                <td className='text-center'>
                                                    <div>
                                                        {b.booking_fee === null || b.booking_fee === 'default'
                                                            ? 0
                                                            : b.booking_fee}
                                                    </div>
                                                </td>
                                            )}

                                            <td className="px-6 py-4 whitespace-nowrap text-right flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                                                <div className='group relative inline-block'>
                                                    {UserisNotAdmin ?

                                                        ((parseInt(b.creator_id) === parseInt(currentUserId)) ?
                                                            <button
                                                                // onClick={(e) => e.stopPropagation()}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    cancelBooking(b.id);
                                                                }} // assuming b.id is the primary key
                                                                className="text-red-600 hover:text-red-800 transition"
                                                                title="Cancel Booking"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-off-icon lucide-circle-off"><path d="m2 2 20 20" /><path d="M8.35 2.69A10 10 0 0 1 21.3 15.65" /><path d="M19.08 19.08A10 10 0 1 1 4.92 4.92" /></svg>
                                                                <div className='opacity-0 bottom-full left-1/2 -translate-x-1/2 mb-2 absolute group-hover:opacity-100 text-sm'>
                                                                    Cancle Booking
                                                                </div>
                                                            </button>
                                                            :
                                                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#daa7aa]" >Hidden</td>
                                                        )
                                                        :
                                                        <button
                                                            onClick={(e) => {
                                                                cancelBooking(b.id);
                                                                e.stopPropagation();
                                                            }} // assuming b.id is the primary key
                                                            className="text-red-600 hover:text-red-800 transition"
                                                            title="Cancel Booking"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-off-icon lucide-circle-off"><path d="m2 2 20 20" /><path d="M8.35 2.69A10 10 0 0 1 21.3 15.65" /><path d="M19.08 19.08A10 10 0 1 1 4.92 4.92" /></svg>
                                                            <div className='opacity-0 bottom-full left-1/2 -translate-x-1/2 mb-2 absolute group-hover:opacity-100 text-sm'>
                                                                Cancle Booking
                                                            </div>
                                                        </button>}

                                                </div>
                                                {showFacilityBreakdown &&
                                                    (<button
                                                        onClick={() => handleEdit(b)}
                                                        className="text-[#96161C] hover:text-[#7a1217] transition"
                                                        title="Edit Booking"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M17.414 2.586a2 2 0 010 2.828L8.414 14.414l-4.828 1.414 1.414-4.828L14.586 2.586a2 2 0 012.828 0z" />
                                                        </svg>
                                                    </button>)
                                                }
                                                {showFacilityBreakdown &&
                                                    <button
                                                        onClick={() => handleDelete(b.id)} // assuming b.id is the primary key
                                                        className="text-red-600 hover:text-red-800 transition"
                                                        title="Delete Booking"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M9 3v1H4v2h16V4h-5V3H9zm1 5v12h2V8h-2zm4 0v12h2V8h-2z" />
                                                        </svg>
                                                    </button>
                                                }
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                )))}
                        </tbody>
                    </table>
                    <div
                        id="booking-summary-content"
                        className="relative w-[95vw] max-w-6xl bg-white rounded-2xl shadow-xl"
                    >
                        {showBookingSummary && booking && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                <div className="relative w-[95vw] max-w-6xl bg-white rounded-2xl shadow-xl">

                                    {/* Close */}
                                    <button
                                        onClick={() => setShowBookingSummary(false)}
                                        className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-100"
                                    >
                                        <X size={22} />
                                    </button>

                                    {/* Header */}
                                    <div className="px-10 py-6 border-b">
                                        <h2 className="text-3xl font-semibold text-gray-900">
                                            {booking.event_name || booking.title}
                                        </h2>
                                        <p className="text-gray-600 mt-1">
                                            Facility & Vehicle Booking Summary
                                        </p>
                                    </div>

                                    {/* Body */}
                                    <div className="px-10 py-8 grid grid-cols-1 lg:grid-cols-2 gap-10">

                                        {/* LEFT — FACILITY */}
                                        <section>
                                            <h3 className="text-xl font-semibold text-gray-900 mb-5">
                                                Facility Details
                                            </h3>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-10">
                                                <InfoItem icon={<Building />} label="Facility"
                                                    value={booking.event_facility || booking.facility} />

                                                <InfoItem icon={<Calendar />} label="Date"
                                                    value={booking.event_date || booking.date} />

                                                <InfoItem icon={<Clock />} label="Time"
                                                    value={`${booking.starting_time} – ${booking.ending_time}`} />

                                                <InfoItem icon={<User />} label="Requested By"
                                                    value={booking.requested_by} />

                                                <InfoItem icon={<Users />} label="Organization"
                                                    value={booking.organization || booking.org} />

                                                <InfoItem icon={<Phone />} label="Contact"
                                                    value={booking.contact} />
                                            </div>

                                            <div className="mt-8">
                                                <div className="flex items-center gap-2 mb-3 text-gray-800 font-semibold">
                                                    <Wrench size={20} />
                                                    Equipment
                                                </div>

                                                {equipment.length > 0 ? (
                                                    <div className="rounded-lg bg-gray-50 p-4">
                                                        {equipment.map((eq, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex justify-between py-2 border-b last:border-none"
                                                            >
                                                                <span>{eq?.type ?? "Unknown"}</span>
                                                                <span className="font-medium">{eq?.quantity ?? 0}×</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 italic">
                                                        No equipment booked
                                                    </p>
                                                )}
                                            </div>
                                        </section>

                                        {/* RIGHT — VEHICLES + ACTIONS */}
                                        <section className="flex flex-col gap-10">

                                            {/* Vehicles */}
                                            <div className="mt-8">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Vehicles</h3>

                                                {/* All vehicles from referenceVehicleMap
                                                {referenceVehicleMap[selectedBooking.id]?.length > 0 ? (
                                                    <ul className="list-disc list-inside">
                                                        {referenceVehicleMap[selectedBooking.id].map((v, idx) => (
                                                            <li key={idx}>
                                                                Vehicle ID: {v.vehicle_id}, Requestor: {v.requestor}, Date: {new Date(v.date).toLocaleString()}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-gray-500 italic">No vehicles booked</p>
                                                )} */}

                                                {/* Matched vehicles cross-referenced with booking */}
                                                <div className="mt-6">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Matched Vehicles</h3>
                                                    {selectedBooking?.matchedVehicles?.length > 0 ? (
                                                        <ul className="list-disc list-inside">
                                                            {selectedBooking.matchedVehicles.map((v, idx) => (
                                                                <li key={idx}>
                                                                    Vehicle ID: {v.vehicle_id}, Requestor: {v.requestor}, Purpose: {v.purpose}, Date: {new Date(v.date).toLocaleString()}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-gray-500 italic">No vehicles booked for this event</p>
                                                    )}

                                                    {/* LOG IN ALL CAPS */}
                                                    {selectedBooking?.matchedVehicles?.length > 0 && console.log(
                                                        `MATCH FOUND FOR BOOKING: ${selectedBooking.event_name.toUpperCase()} ON ${(selectedBooking.event_date || selectedBooking.date).split('T')[0]}`
                                                    )}
                                                </div>
                                            </div>





                                            {/* Actions */}
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <Settings size={20} />
                                                    Actions
                                                </h3>

                                                <div className="space-y-6">

                                                    {/* Facility Actions */}
                                                    <div>
                                                        <p className="font-medium text-gray-700 mb-2">
                                                            Facility Booking
                                                        </p>
                                                        <div className="flex gap-2">
                                                            <ActionButton label="Edit" />
                                                            <ActionButton label="Cancel" variant="warning" />
                                                            <ActionButton label="Delete" variant="danger" />
                                                        </div>
                                                    </div>

                                                    {/* Vehicle Actions */}
                                                    <div>
                                                        <p className="font-medium text-gray-700 mb-2">
                                                            Vehicle Booking
                                                        </p>
                                                        <div className="flex gap-2">
                                                            <ActionButton label="Edit" disabled={!vehicles.length} />
                                                            <ActionButton label="Cancel" variant="warning" disabled={!vehicles.length} />
                                                            <ActionButton label="Delete" variant="danger" disabled={!vehicles.length} />
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>

                                        </section>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-10 py-5 border-t flex justify-end">
                                        <button
                                            onClick={downloadReceipt}
                                            className="mr-5 px-6 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700"
                                        >
                                            Download Receipt
                                        </button>
                                        <button
                                            onClick={() => setShowBookingSummary(false)}
                                            className="px-6 py-2.5 rounded-lg bg-gray-900 text-white hover:bg-black"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* Pagination Controls & Rows Per Page - Centered at bottom */}
                {totalPages > 1 || filtered.length > 0 ? (
                    <div className="flex flex-col items-center gap-4 mt-6">
                        <div className="flex items-center gap-2 justify-center">
                            <label className="text-sm font-semibold text-[#96161C]">Rows per page:</label>
                            <select
                                value={rowsPerPage}
                                onChange={handleRowsPerPageChange}
                                className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                            >
                                {[5, 10, 15, 25, 50, 100].map(num => (
                                    <option key={num} value={num}>{num}</option>
                                ))}
                            </select>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2">
                                <button
                                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Prev
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        className={`px-3 py-1 rounded font-semibold ${currentPage === i + 1 ? 'bg-[#96161C] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                        onClick={() => handlePageChange(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}