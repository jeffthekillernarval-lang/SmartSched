import React, { useState, useEffect } from 'react';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function EquipmentBooking() {
    const [showEquipmentForm, setShowEquipmentForm] = useState(false);
    const [equipmentForm, setEquipmentForm] = useState({
        equipments: [''],
        facilityId: '',
        departmentId: '',
        purpose: '',
        mode: 'single',          // 👈 NEW
        date: '',                // single
        specificDates: ['', '', '', ''], // specific (max 4)
        rangeStart: '',          // range
        rangeEnd: '',
        timeStart: '',
        timeEnd: ''
    });

    const currentUserId = localStorage.getItem("currentUserId");
    const [userEquipmentIds, setUserEquipmentIds] = useState([]);
    const [availableEquipments, setAvailableEquipments] = useState([]);
    const [filteredEquipments, setFilteredEquipments] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [editStatusId, setEditStatusId] = useState(null);
    const [editingBookingId, setEditingBookingId] = useState(null);
    const equipmentStatuses = ['Pending', 'Approved', 'Rejected', 'Returned'];
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [filter, setFilter] = useState({
        search: '',
        equipment: 'All',
        department: 'All',
        facility: 'All',
        dateFrom: '',
        dateTo: ''
    });
    const handleFilterChange = (e) => {
        setFilter({ ...filter, [e.target.name]: e.target.value });
    };
    const buildDatesArray = () => {
        let dates = [];

        if (equipmentForm.mode === 'single') {
            if (equipmentForm.date) dates = [equipmentForm.date];
        }

        if (equipmentForm.mode === 'specific') {
            dates = equipmentForm.specificDates.filter(Boolean);
        }

        if (equipmentForm.mode === 'range') {
            if (!equipmentForm.rangeStart || !equipmentForm.rangeEnd) return [];
            const start = new Date(equipmentForm.rangeStart);
            const end = new Date(equipmentForm.rangeEnd);

            for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
                dates.push(d.toISOString().split('T')[0]);
            }
        }

        return dates;
    };


    const isAdmin = true;
    useEffect(() => {
        if (!currentUserId) return;

        const fetchUserEquipments = async () => {
            const res = await fetch(
                `http://localhost:5000/api/user-equipments-fetch/${currentUserId}`
            );
            const data = await res.json();
            setUserEquipmentIds((data.equipments || []).map(Number));
        };

        fetchUserEquipments();
    }, [currentUserId]);
    useEffect(() => {
        const datesArray = buildDatesArray();
        const { timeStart, timeEnd, facilityId } = equipmentForm;

        if (!datesArray.length || !timeStart || !timeEnd || !facilityId) {
            setFilteredEquipments([]);
            return;
        }

        const fetchAvailableEquipments = async () => {
            const res = await fetch(
                'http://localhost:5000/api/available-equipments',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        dates: datesArray,
                        timeStart,
                        timeEnd,
                        facilityId
                    })
                }
            );

            const data = await res.json();
            if (data.success) {
                setFilteredEquipments(data.equipments);
            }
        };

        fetchAvailableEquipments();
    }, [
        equipmentForm.mode,
        equipmentForm.date,
        equipmentForm.specificDates,
        equipmentForm.rangeStart,
        equipmentForm.rangeEnd,
        equipmentForm.timeStart,
        equipmentForm.timeEnd,
        equipmentForm.facilityId
    ]);

    const handleEquipmentStatusChange = async (bookingId, newStatus) => {
        try {
            const res = await fetch(
                `http://localhost:5000/api/update-equipment-status/${bookingId}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                }
            );

            const data = await res.json();

            if (data.success) {
                setBookings(prev =>
                    prev.map(b =>
                        b.id === bookingId ? { ...b, status: data.booking.status } : b
                    )
                );
            } else {
                alert(data.message || 'Failed to update status');
            }
        } catch (err) {
            console.error(err);
            alert('Error updating status');
        } finally {
            setEditStatusId(null);
        }
    };

    useEffect(() => {
        if (!bookings.length || !currentUserId) return;

        console.group("EQUIPMENT BOOKINGS — PIVOT CHECK");
        console.log("User ID:", currentUserId);
        console.log("Equipments in Pivot:", userEquipmentIds);
        console.log("--------------------------------");

        bookings.forEach((booking, index) => {
            const bookingEquipmentId = Number(booking.equipment_type_id);
            const inPivot = userEquipmentIds.includes(bookingEquipmentId);

            console.group(`Booking #${index + 1}`);
            console.log("Booking Equipment ID:", bookingEquipmentId);

            if (!inPivot) {
                console.warn("Pivot Status: ❌ NOT IN PIVOT");
                console.log("Equipments in Pivot for this User:", userEquipmentIds);
            } else {
                console.log("Pivot Status: ✅ IN PIVOT");
            }

            console.groupEnd();
        });

        console.log("--------------------------------");
        console.groupEnd();
    }, [bookings, currentUserId, userEquipmentIds]);


    // ========================== FETCH DATA ==========================
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [equipRes, facRes, depRes, bookRes] = await Promise.all([
                    fetch('http://localhost:5000/api/fetch-equipments'),
                    fetch('http://localhost:5000/api/fetch-facilities'),
                    fetch('http://localhost:5000/api/fetch-affiliation'),
                    fetch('http://localhost:5000/api/fetch-equipment-bookings')
                ]);

                const equipmentsData = await equipRes.json();
                if (equipmentsData.success) setAvailableEquipments(equipmentsData.equipments);

                const facilitiesData = await facRes.json();
                if (facilitiesData.success) setFacilities(facilitiesData.facilities);

                const departmentsData = await depRes.json();
                if (departmentsData.success) setDepartments(departmentsData.affiliations);

                const bookingsData = await bookRes.json();
                if (bookingsData.success) setBookings(bookingsData.bookings);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    // ========================== HANDLE FORM CHANGES ==========================
    const handleEquipmentChange = (value, index) => {
        const updated = [...equipmentForm.equipments];
        updated[index] = value;
        setEquipmentForm({ ...equipmentForm, equipments: updated });
    };

    const addEquipment = () => {
        setEquipmentForm(prev => ({ ...prev, equipments: [...prev.equipments, ''] }));
    };

    const removeEquipment = (index) => {
        const updated = equipmentForm.equipments.filter((_, i) => i !== index);
        setEquipmentForm({ ...equipmentForm, equipments: updated });
    };

    const getFilteredEquipmentsForDropdown = (index) => {
        const selectedIds = equipmentForm.equipments.filter((_, i) => i !== index);
        return filteredEquipments.filter(eq => !selectedIds.includes(eq.id.toString()));
    };

    // ========================== SUBMIT HANDLER ==========================
    const handleSubmit = async (e) => {

        e.preventDefault();
        if (
            equipmentForm.timeStart < '06:00' ||
            equipmentForm.timeEnd > '22:00'
        ) {
            alert('Bookings are only allowed between 6:00 AM and 10:00 PM');
            return;
        }

        if (equipmentForm.timeEnd < equipmentForm.timeStart) {
            alert('End time cannot be earlier than start time');
            return;
        }
        // if (!equipmentForm.date || !equipmentForm.timeStart || !equipmentForm.timeEnd) {
        //     alert("Please select date and time first.");
        //     return;
        // }

        let datesArray = [];

        if (equipmentForm.mode === 'single') {
            if (!equipmentForm.date) return alert('Please select a date');
            datesArray = [equipmentForm.date];
        }

        if (equipmentForm.mode === 'specific') {
            datesArray = equipmentForm.specificDates.filter(Boolean);
            if (!datesArray.length) return alert('Select at least one date');
        }

        if (equipmentForm.mode === 'range') {
            const start = new Date(equipmentForm.rangeStart);
            const end = new Date(equipmentForm.rangeEnd);

            if (!start || !end) return alert('Select range dates');

            const diffDays = (end - start) / (1000 * 60 * 60 * 24);
            if (diffDays > 6) return alert('Date range cannot exceed 1 week');

            for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
                datesArray.push(d.toISOString().split('T')[0]);
            }
        }

        const payload = {
            equipments: equipmentForm.equipments.map(id => ({
                equipmentId: Number(id),
                quantity: 1
            })),
            departmentId: equipmentForm.departmentId,
            facilityId: equipmentForm.facilityId,
            purpose: equipmentForm.purpose,
            mode: equipmentForm.mode,
            dates: datesArray,              // 👈 IMPORTANT
            timeStart: equipmentForm.timeStart,
            timeEnd: equipmentForm.timeEnd
        };


        const isEditing = Boolean(editingBookingId);
        const url = isEditing
            ? `http://localhost:5000/api/update-equipment-booking/${editingBookingId}`
            : 'http://localhost:5000/api/create-equipment-booking';

        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!data.success) {
                alert(data.message || 'Failed to save booking');
                return;
            }

            alert(isEditing ? 'Booking updated!' : 'Booking created!');

            // 🔄 refresh bookings
            const bookRes = await fetch('http://localhost:5000/api/fetch-equipment-bookings');
            const bookingsData = await bookRes.json();
            if (bookingsData.success) {
                setBookings(bookingsData.bookings);
            }

            // ♻️ reset form + exit edit mode
            setEquipmentForm({
                equipments: [''],
                facilityId: '',
                departmentId: '',
                purpose: '',
                date: '',
                timeStart: '',
                timeEnd: ''
            });

            setEditingBookingId(null);
            setShowEquipmentForm(false);

        } catch (err) {
            console.error(err);
            alert('Error saving booking');
        }
    };



    // ========================== HELPERS ==========================
    const getEquipmentName = (id) => availableEquipments.find(eq => eq.id === id)?.name || 'Unknown';
    const getDepartmentName = (id) => departments.find(d => d.id === id)?.abbreviation || 'Unknown';
    const getFacilityName = (id) => facilities.find(f => f.id === id)?.name || 'Unknown';

    const formatBookingDates = (dates) => {
        if (!dates || dates.length === 0) return 'No date';
        const dateObjs = dates.map(d => new Date(d)).sort((a, b) => a - b);
        const options = { month: 'short', day: '2-digit' };
        const year = dateObjs[0].getFullYear();

        if (dateObjs.length === 1) {
            return `${dateObjs[0].toLocaleDateString('en-US', options)}, ${year}`;
        }

        // consecutive check
        let isConsecutive = true;
        for (let i = 1; i < dateObjs.length; i++) {
            if ((dateObjs[i] - dateObjs[i - 1]) / (1000 * 60 * 60 * 24) !== 1) {
                isConsecutive = false;
                break;
            }
        }

        if (isConsecutive) {
            return `${dateObjs[0].toLocaleDateString('en-US', options)}-${dateObjs[dateObjs.length - 1].toLocaleDateString('en-US', options)}, ${year}`;
        } else {
            const formatted = dateObjs.map(d => d.toLocaleDateString('en-US', options));
            const last = formatted.pop();
            return `${formatted.join(' & ')} & ${last}, ${year}`;
        }
    };

    const handleEdit = (booking) => {
        setEquipmentForm({
            equipments: [booking.equipment_type_id.toString()],
            departmentId: booking.affiliation_id.toString(),
            facilityId: booking.facility_id.toString(),
            purpose: booking.purpose,
            date: booking.dates[0].split('T')[0],
            timeStart: booking.time_start?.slice(0, 5) || '',
            timeEnd: booking.time_end?.slice(0, 5) || ''
        });

        setEditingBookingId(booking.id);
        setShowEquipmentForm(true);
    };


    // ========================== ✅ DELETE BOOKING ==========================
    const handleDelete = async (bookingId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this booking?");
        if (!confirmDelete) return;

        try {
            const res = await fetch(`http://localhost:5000/api/delete-equipment-booking/${bookingId}`, {
                method: "DELETE"
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                alert(data.message || "Failed to delete booking");
                return;
            }

            alert("Booking deleted!");

            // remove from UI immediately
            setBookings(prev => prev.filter(b => b.id !== bookingId));
        } catch (err) {
            console.error(err);
            alert("Error deleting booking");
        }
    };
    useEffect(() => {
        const { timeStart, timeEnd } = equipmentForm;

        if (timeStart && timeEnd && timeEnd < timeStart) {
            setEquipmentForm(prev => ({
                ...prev,
                timeEnd: timeStart
            }));
        }
    }, [equipmentForm.timeStart]);
    const downloadEquipmentReceipt = async (booking) => {
        const receiptDiv = document.createElement("div");
        receiptDiv.style.width = "800px";
        receiptDiv.style.padding = "2rem";
        receiptDiv.style.backgroundColor = "white";
        receiptDiv.style.fontFamily = "Arial, sans-serif";

        receiptDiv.innerHTML = `
        <h1 style="color:#96161C; text-align:center;">Equipment Booking Receipt</h1>
        <p style="text-align:center;">Generated on ${new Date().toLocaleDateString()}</p>

        <h3 style="margin-top:2rem;">Booking Details</h3>
        <table style="width:100%; border-collapse:collapse;">
            <tr>
                <th style="border:1px solid #333; padding:8px;">Equipment</th>
                <td style="border:1px solid #333; padding:8px;">
                    ${getEquipmentName(booking.equipment_type_id)}
                </td>
            </tr>
            <tr>
                <th style="border:1px solid #333; padding:8px;">Department</th>
                <td style="border:1px solid #333; padding:8px;">
                    ${getDepartmentName(booking.affiliation_id)}
                </td>
            </tr>
            <tr>
                <th style="border:1px solid #333; padding:8px;">Facility</th>
                <td style="border:1px solid #333; padding:8px;">
                    ${getFacilityName(booking.facility_id)}
                </td>
            </tr>
            <tr>
                <th style="border:1px solid #333; padding:8px;">Date(s)</th>
                <td style="border:1px solid #333; padding:8px;">
                    ${formatBookingDates(booking.dates)}
                </td>
            </tr>
            <tr>
                <th style="border:1px solid #333; padding:8px;">Time</th>
                <td style="border:1px solid #333; padding:8px;">
                    ${booking.time_start?.slice(0, 5)} - ${booking.time_end?.slice(0, 5)}
                </td>
            </tr>
            <tr>
                <th style="border:1px solid #333; padding:8px;">Purpose</th>
                <td style="border:1px solid #333; padding:8px;">
                    ${booking.purpose}
                </td>
            </tr>
            <tr>
                <th style="border:1px solid #333; padding:8px;">Status</th>
                <td style="border:1px solid #333; padding:8px;">
                    ${booking.status}
                </td>
            </tr>
        </table>

        <div style="display:flex; justify-content:space-between; margin-top:3rem;">
            <div style="width:45%; text-align:center;">
                <p>Requested By</p>
                <div style="border-top:1px solid #333; margin-top:2rem;"></div>
            </div>
            <div style="width:45%; text-align:center;">
                <p>Approved By</p>
                <div style="border-top:1px solid #333; margin-top:2rem;"></div>
            </div>
        </div>
    `;

        document.body.appendChild(receiptDiv);

        const canvas = await html2canvas(receiptDiv, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "pt", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`EquipmentBooking_Receipt_${booking.id}.pdf`);

        document.body.removeChild(receiptDiv);
    };

    // ========================== RENDER ==========================
    return (
        <div>
            <div className="mb-6">
                <button
                    className="w-full flex items-center justify-between px-8 py-5 bg-[#96161C] text-white text-xl font-bold rounded-t-xl focus:outline-none"
                    onClick={() => setShowEquipmentForm(!showEquipmentForm)}
                >
                    <span>Equipment Booking</span>
                    <svg
                        className={`w-7 h-7 transform transition-transform ${showEquipmentForm ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {showEquipmentForm && (
                    <form onSubmit={handleSubmit} className="bg-[#f9f9f9] px-8 py-8 rounded-b-xl shadow-md border border-t-0 border-gray-200">
                        {/* EQUIPMENT SELECTION */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-bold text-[#96161C]">Equipments</h2>
                                <button type="button" onClick={addEquipment} className="bg-[#96161C] text-white px-5 py-2 rounded-lg hover:bg-[#7a1217] transition">
                                    + Add Equipment
                                </button>
                            </div>
                            <div className="space-y-3">
                                {equipmentForm.equipments.map((eq, index) => (
                                    <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex gap-2 items-center">
                                            <select
                                                value={eq}
                                                onChange={e => handleEquipmentChange(e.target.value, index)}
                                                className="w-full border rounded-lg px-4 py-2"
                                                required
                                                disabled={
                                                    !equipmentForm.timeStart ||
                                                    !equipmentForm.timeEnd ||
                                                    (
                                                        equipmentForm.mode === 'single' && !equipmentForm.date
                                                    ) ||
                                                    (
                                                        equipmentForm.mode === 'specific' &&
                                                        !equipmentForm.specificDates.some(Boolean)
                                                    ) ||
                                                    (
                                                        equipmentForm.mode === 'range' &&
                                                        (!equipmentForm.rangeStart || !equipmentForm.rangeEnd)
                                                    )
                                                }

                                            >
                                                <option value="">
                                                    {!equipmentForm.date || !equipmentForm.timeStart || !equipmentForm.timeEnd
                                                        ? "Select date & time first"
                                                        : "Select Equipment"}
                                                </option>
                                                {getFilteredEquipmentsForDropdown(index).map(e => (
                                                    <option key={e.id} value={e.id}>
                                                        {e.name} ({e.model_id})
                                                    </option>
                                                ))}
                                            </select>
                                            {equipmentForm.equipments.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeEquipment(index)}
                                                    className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* DEPARTMENT / FACILITY / TIME / DATE */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Department*</label>
                                <select
                                    value={equipmentForm.departmentId}
                                    onChange={e => setEquipmentForm({ ...equipmentForm, departmentId: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2"
                                    required
                                >
                                    <option value="">Select...</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>
                                            {d.abbreviation} - {d.meaning}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Facility*</label>
                                <select
                                    value={equipmentForm.facilityId}
                                    onChange={e => setEquipmentForm({ ...equipmentForm, facilityId: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2"
                                    required
                                >
                                    <option value="">Select...</option>
                                    {facilities.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Time Start*</label>
                                <input
                                    type="time"
                                    value={equipmentForm.timeStart}
                                    min="06:00"
                                    max="22:00"
                                    onChange={(e) =>
                                        setEquipmentForm({ ...equipmentForm, timeStart: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Time End*</label>
                                <input
                                    type="time"
                                    value={equipmentForm.timeEnd}
                                    min={equipmentForm.timeStart || '06:00'}
                                    max="22:00"
                                    onChange={(e) =>
                                        setEquipmentForm({ ...equipmentForm, timeEnd: e.target.value })
                                    }
                                />
                            </div>

                            {/* <div>
                                <label className="block text-sm font-medium mb-1">Date*</label>
                                <input
                                    type="date"
                                    value={equipmentForm.date}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) =>
                                        setEquipmentForm({ ...equipmentForm, date: e.target.value })
                                    }
                                />
                            </div> */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Date Mode*</label>
                                <select
                                    value={equipmentForm.mode}
                                    onChange={(e) =>
                                        setEquipmentForm({ ...equipmentForm, mode: e.target.value })
                                    }
                                    className="w-full border rounded-lg px-4 py-2 mb-2"
                                >
                                    <option value="single">Single Date</option>
                                    <option value="specific">Specific Dates (max 4)</option>
                                    <option value="range">Date Range (max 1 week)</option>
                                </select>

                                {/* SINGLE */}
                                {equipmentForm.mode === 'single' && (
                                    <input
                                        type="date"
                                        value={equipmentForm.date}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) =>
                                            setEquipmentForm({ ...equipmentForm, date: e.target.value })
                                        }
                                        className="w-full border rounded-lg px-4 py-2"
                                        required
                                    />
                                )}

                                {/* SPECIFIC */}
                                {equipmentForm.mode === 'specific' &&
                                    equipmentForm.specificDates.map((d, i) => (
                                        <input
                                            key={i}
                                            type="date"
                                            value={d}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => {
                                                const updated = [...equipmentForm.specificDates];
                                                updated[i] = e.target.value;
                                                setEquipmentForm({ ...equipmentForm, specificDates: updated });
                                            }}
                                            className="w-full border rounded-lg px-4 py-2 mb-1"
                                        />
                                    ))}

                                {/* RANGE */}
                                {equipmentForm.mode === 'range' && (
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={equipmentForm.rangeStart}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) =>
                                                setEquipmentForm({ ...equipmentForm, rangeStart: e.target.value })
                                            }
                                            className="w-full border rounded-lg px-4 py-2"
                                        />
                                        <input
                                            type="date"
                                            value={equipmentForm.rangeEnd}
                                            min={equipmentForm.rangeStart}
                                            onChange={(e) =>
                                                setEquipmentForm({ ...equipmentForm, rangeEnd: e.target.value })
                                            }
                                            className="w-full border rounded-lg px-4 py-2"
                                        />
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* PURPOSE */}
                        <div className="mb-6 w-full">
                            <label className="block text-sm font-medium mb-1">Purpose*</label>
                            <textarea
                                value={equipmentForm.purpose}
                                placeholder="Equipment needed for seminar / event..."
                                onChange={e => setEquipmentForm({ ...equipmentForm, purpose: e.target.value })}
                                className="w-full border rounded-lg px-4 py-2"
                                required
                            />
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex gap-3 justify-end">
                            <button type="submit" className="bg-[#96161C] text-white px-8 py-2 rounded-lg">
                                Create
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowEquipmentForm(false)}
                                className="bg-gray-200 px-8 py-2 rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* BOOKINGS TABLE */}
            <div className="bg-white rounded-xl shadow-md overflow-x-auto">
                <div className="bg-white rounded-xl shadow-md p-8 w-full mt-8">
                    <h2 className="text-2xl font-bold text-[#96161C] mb-4">
                        Equipment Booking Filters
                    </h2>

                    <div className="flex flex-wrap gap-4 items-end">
                        {/* Search Purpose */}
                        <div className="flex-1 min-w-[180px]">
                            <label className="block text-xs font-semibold mb-1 text-[#96161C]">
                                Search Purpose
                            </label>
                            <input
                                type="text"
                                name="search"
                                value={filter.search}
                                onChange={handleFilterChange}
                                placeholder="Search by purpose"
                                className="border rounded-lg px-3 py-2 w-full"
                            />
                        </div>

                        {/* Equipment */}
                        <div className="flex-1 min-w-[160px]">
                            <label className="block text-xs font-semibold mb-1 text-[#96161C]">
                                Equipment
                            </label>
                            <select
                                name="equipment"
                                value={filter.equipment}
                                onChange={handleFilterChange}
                                className="border rounded-lg px-3 py-2 w-full"
                            >
                                <option value="All">All</option>
                                {availableEquipments.map(eq => (
                                    <option key={eq.id} value={eq.id}>
                                        {eq.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Department */}
                        <div className="flex-1 min-w-[160px]">
                            <label className="block text-xs font-semibold mb-1 text-[#96161C]">
                                Department
                            </label>
                            <select
                                name="department"
                                value={filter.department}
                                onChange={handleFilterChange}
                                className="border rounded-lg px-3 py-2 w-full"
                            >
                                <option value="All">All</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.abbreviation}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Facility */}
                        <div className="flex-1 min-w-[160px]">
                            <label className="block text-xs font-semibold mb-1 text-[#96161C]">
                                Facility
                            </label>
                            <select
                                name="facility"
                                value={filter.facility}
                                onChange={handleFilterChange}
                                className="border rounded-lg px-3 py-2 w-full"
                            >
                                <option value="All">All</option>
                                {facilities.map(f => (
                                    <option key={f.id} value={f.id}>
                                        {f.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date From */}
                        <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs font-semibold mb-1 text-[#96161C]">
                                Date From
                            </label>
                            <input
                                type="date"
                                name="dateFrom"
                                value={filter.dateFrom}
                                onChange={handleFilterChange}
                                className="border rounded-lg px-3 py-2 w-full"
                            />
                        </div>

                        {/* Date To */}
                        <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs font-semibold mb-1 text-[#96161C]">
                                Date To
                            </label>
                            <input
                                type="date"
                                name="dateTo"
                                value={filter.dateTo}
                                onChange={handleFilterChange}
                                className="border rounded-lg px-3 py-2 w-full"
                            />
                        </div>

                        {/* Reset */}
                        <button
                            type="button"
                            onClick={() =>
                                setFilter({
                                    search: '',
                                    equipment: 'All',
                                    department: 'All',
                                    facility: 'All',
                                    dateFrom: '',
                                    dateTo: ''
                                })
                            }
                            className="bg-[#96161C] text-white px-6 py-2 rounded-lg font-semibold"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#96161C]">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase rounded-tl-xl">Equipment</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Facility</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Date(s)</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Purpose</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase rounded-tr-xl">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {bookings
                            .filter(b =>
                                (filter.search === '' ||
                                    b.purpose?.toLowerCase().includes(filter.search.toLowerCase())) &&

                                (filter.equipment === 'All' ||
                                    String(b.equipment_type_id) === String(filter.equipment)) &&

                                (filter.department === 'All' ||
                                    String(b.affiliation_id) === String(filter.department)) &&

                                (filter.facility === 'All' ||
                                    String(b.facility_id) === String(filter.facility)) &&

                                (filter.dateFrom === '' ||
                                    b.dates?.[0] >= filter.dateFrom) &&

                                (filter.dateTo === '' ||
                                    b.dates?.[0] <= filter.dateTo)
                            )
                            .map((b, index) => {
                                const bookingEquipmentId = Number(b.equipment_type_id);
                                const hasPivotAccess = userEquipmentIds.includes(bookingEquipmentId);

                                return (
                                    <tr key={b.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => {
                                        setSelectedBooking(b);
                                        setShowReceiptModal(true);
                                    }}>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {(() => {
                                                const equipment = availableEquipments.find(eq => eq.id === b.equipment_type_id);
                                                return equipment ? `${equipment.name} (${equipment.model_id})` : 'Unknown';
                                            })()}
                                        </td>
                                        <td className="px-6 py-4">{getDepartmentName(b.affiliation_id)}</td>
                                        <td className="px-6 py-4">{getFacilityName(b.facility_id)}</td>
                                        <td className="px-6 py-4">{formatBookingDates(b.dates)}</td>
                                        <td className="px-6 py-4">
                                            {b.time_start && b.time_end
                                                ? `${b.time_start.slice(0, 5)} - ${b.time_end.slice(0, 5)}`
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4">{b.purpose}</td>
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            {!hasPivotAccess ? (
                                                <span className="text-gray-400 italic">No Access</span>
                                            ) : editStatusId === b.id ? (
                                                <select
                                                    value={b.status}
                                                    onChange={(e) =>
                                                        handleEquipmentStatusChange(b.id, e.target.value)
                                                    }
                                                    onBlur={() => setEditStatusId(null)}
                                                    autoFocus
                                                    className="border rounded-lg px-3 py-2 text-sm"
                                                >
                                                    {equipmentStatuses.map(status => (
                                                        <option key={status} value={status}>
                                                            {status}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer
        ${b.status === 'Approved'
                                                            ? 'bg-green-100 text-green-700 border border-green-300'
                                                            : b.status === 'Rejected'
                                                                ? 'bg-red-100 text-red-700 border border-red-300'
                                                                : b.status === 'Returned'
                                                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                                    : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                                        }`}
                                                    onClick={() => setEditStatusId(b.id)}
                                                >
                                                    {b.status}
                                                </span>
                                            )}
                                        </td>


                                        <td className="px-6 py-4 flex gap-2">
                                            {!hasPivotAccess ? (
                                                <span className="text-gray-400 italic">No Access</span>
                                            ) : isAdmin ? (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(b); }}
                                                        className="px-4 py-1 text-sm font-semibold rounded-full border border-[#96161C] text-[#96161C]"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                                                        className="px-4 py-1 text-sm font-semibold rounded-full border border-red-600 text-red-600"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-gray-400 text-sm">No Actions</span>
                                            )}
                                        </td>

                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>
            {showReceiptModal && selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative">
                        <h2 className="text-xl font-bold text-[#96161C] mb-4">
                            Equipment Booking Summary
                        </h2>

                        <div className="space-y-2 text-sm">
                            <p><strong>Equipment:</strong> {getEquipmentName(selectedBooking.equipment_type_id)}</p>
                            <p><strong>Department:</strong> {getDepartmentName(selectedBooking.affiliation_id)}</p>
                            <p><strong>Facility:</strong> {getFacilityName(selectedBooking.facility_id)}</p>
                            <p><strong>Date(s):</strong> {formatBookingDates(selectedBooking.dates)}</p>
                            <p><strong>Time:</strong> {selectedBooking.time_start?.slice(0, 5)} - {selectedBooking.time_end?.slice(0, 5)}</p>
                            <p><strong>Purpose:</strong> {selectedBooking.purpose}</p>
                            <p><strong>Status:</strong> {selectedBooking.status}</p>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => downloadEquipmentReceipt(selectedBooking)}
                                className="px-6 py-2 rounded-lg bg-[#96161C] text-white"
                            >
                                Download Receipt
                            </button>
                            <button
                                onClick={() => setShowReceiptModal(false)}
                                className="px-6 py-2 rounded-lg bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
