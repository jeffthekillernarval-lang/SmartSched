import React, { useState, useEffect } from 'react'; import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function VehicleBooking() {
    const [conflicts, setConflicts] = useState([]); // ⬅️ store conflicts
    const [showForm, setShowForm] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [availableVehicles, setAvailableVehicles] = useState([]);
    const [affiliations, setAffiliations] = useState([]);
    const [availableDrivers, setAvailableDrivers] = useState([]);
    useEffect(() => {
        const fetchAffiliations = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/fetch-affiliation');
                const data = await res.json();
                if (data.success) {
                    setAffiliations(data.affiliations); // array of {id, abbreviation, meaning, moderator}
                    console.log("THIS FCKING DATA", JSON.stringify(data, null, 2));
                }
            } catch (err) {
                console.error('Error fetching affiliations:', err);
            }
        };

        fetchAffiliations();
    }, []);
    const getAbbreviation = (id) => {
        console.log('Department ID:', id); // Log department_id
        console.log('Affiliations:', affiliations); // Log the full affiliations array

        // Convert the department_id (string) to a number
        const affiliation = affiliations.find(a => a.id === Number(id.trim())); // Convert department_id to a number

        console.log('Found Affiliation:', affiliation); // Log the result of the search

        return affiliation ? affiliation.abbreviation : `ID: ${id}`;
    };


    function getTomorrowDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }
    const formatVehicleDatesInline = (dates) => {
        if (!Array.isArray(dates) || dates.length === 0) return '—';

        const parsed = dates
            .map(d => new Date(d))
            .filter(d => !isNaN(d))
            .sort((a, b) => a - b);

        if (parsed.length === 0) return '—';

        return parsed.length === 1
            ? parsed[0].toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
            : `${parsed[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${parsed[parsed.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }, ${parsed[0].getFullYear()}`;
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch bookings
                const resBookings = await fetch('http://localhost:5000/api/fetch-vehicle');
                const dataBookings = await resBookings.json();
                const nonDeleted = dataBookings.vehicles.filter(b => !b.deleted);
                setBookings(nonDeleted);

                // Extract unique vehicle types for filters
                const uniqueTypes = Array.from(new Set(nonDeleted.map(b => b.vehicleType || b.vehicle_Type).filter(Boolean)))
                    .map(toTitleCase)
                    .sort((a, b) => a.localeCompare(b));
                setVehicleTypes(uniqueTypes);

                const uniqueDepts = Array.from(new Set(nonDeleted.map(b => b.department).filter(Boolean)))
                    .map(toTitleCase)
                    .sort((a, b) => a.localeCompare(b));
                setDepartments(uniqueDepts);

                // Fetch all vehicles (for select options)
                const resVehicles = await fetch('http://localhost:5000/api/fetch-vehicle'); // same endpoint, could be separate if needed
                const dataVehicles = await resVehicles.json();
                setAvailableVehicles(dataVehicles.vehicles); // assuming your API returns { success: true, vehicles: [...] }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const currentUserId = localStorage.getItem('currentUserId');
    useEffect(() => {
        const storedRole = localStorage.getItem('currentUserRole');
        setIsAdmin(storedRole === 'admin');
    }, []);
    const [expandedRow, setExpandedRow] = useState(null);
    // const [form, setForm] = useState({
    //     vehicleId: "",
    //     requestor: "",
    //     affiliationId: "",
    //     date: "",
    //     purpose: "",
    //     driverId: "",
    //     destination: "",
    // });
    const [form, setForm] = useState({
        vehicleId: "",
        requestor: "",
        affiliationId: "",
        mode: "single", // "single", "specific", "range"
        date: "",       // for single
        specificDates: ["", "", "", ""], // up to 4
        rangeStart: "",
        rangeEnd: "",
        purpose: "",
        driverId: "",
        destination: ""
    });


    useEffect(() => {
        if (!form.vehicleId) {
            setAvailableDrivers([]);
            return;
        }

        const fetchDriversForVehicle = async () => {
            try {
                const res = await fetch(
                    `http://localhost:5000/api/drivers-by-vehicle/${form.vehicleId}`
                );
                const data = await res.json();

                if (data.success) {
                    setAvailableDrivers(data.drivers);
                }
            } catch (err) {
                console.error('Fetch drivers failed:', err);
            }
        };

        fetchDriversForVehicle();
    }, [form.vehicleId]);

    const formatVehicleDates = (dates) => {
        if (!Array.isArray(dates) || dates.length === 0) return '—';

        const parsed = dates.map(d => new Date(d)).sort((a, b) => a - b);

        return parsed.length === 1
            ? parsed[0].toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
            : `${parsed[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${parsed[parsed.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }, ${parsed[0].getFullYear()}`;
    };

    const getDepartmentName = (booking, affiliations) =>
        affiliations.find(a => a.id === Number(booking.department_id))
            ?.abbreviation || 'Unknown Department';

    const getVehicleDetails = (booking, availableVehicles) =>
        availableVehicles.find(v => v.id === Number(booking.vehicle_id));

    const [editingId, setEditingId] = useState(null);
    const downloadReceipt = async (booking) => {
        // 1. Create a temporary div to render receipt
        const receiptDiv = document.createElement("div");
        receiptDiv.style.width = "800px"; // set width for PDF layout
        receiptDiv.style.padding = "2rem";
        receiptDiv.style.backgroundColor = "white";
        receiptDiv.style.fontFamily = "Arial, sans-serif";
        const vehicle = getVehicleDetails(booking, availableVehicles);

        receiptDiv.innerHTML = `
<h1 style="color:#96161C; text-align:center;">School Vehicle Booking Receipt</h1>
<h3 style="text-align:center; font-weight:normal;">
  ${new Date().toLocaleDateString()}
</h3>

<h3 style="color:#96161C; margin-top:2rem;">Booking Details</h3>

<table style="width:100%; border-collapse: collapse;">
  <tr>
    <th style="border:1px solid #333; padding:8px;">Vehicle Type</th>
    <td style="border:1px solid #333; padding:8px;">
      ${vehicle ? vehicle.vehicle_name : 'Unknown Vehicle'}
    </td>
  </tr>

  <tr>
    <th style="border:1px solid #333; padding:8px;">Vehicle Plate</th>
    <td style="border:1px solid #333; padding:8px;">
      ${vehicle?.plate_number || '—'}
    </td>
  </tr>

  <tr>
    <th style="border:1px solid #333; padding:8px;">Requestor</th>
    <td style="border:1px solid #333; padding:8px;">
      ${booking.requestor}
    </td>
  </tr>

  <tr>
    <th style="border:1px solid #333; padding:8px;">Department</th>
    <td style="border:1px solid #333; padding:8px;">
      ${getDepartmentName(booking, affiliations)}
    </td>
  </tr>

  <tr>
    <th style="border:1px solid #333; padding:8px;">Driver</th>
    <td style="border:1px solid #333; padding:8px;">
      ${booking.driver_name || '—'}
    </td>
  </tr>

  <tr>
    <th style="border:1px solid #333; padding:8px;">Date</th>
    <td style="border:1px solid #333; padding:8px;">
      ${formatVehicleDates(booking.dates)}
    </td>
  </tr>

  <tr>
    <th style="border:1px solid #333; padding:8px;">Purpose</th>
    <td style="border:1px solid #333; padding:8px;">
      ${booking.purpose}
    </td>
  </tr>

  <tr>
    <th style="border:1px solid #333; padding:8px;">Destination</th>
    <td style="border:1px solid #333; padding:8px;">
      ${booking.destination}
    </td>
  </tr>

  <tr>
    <th style="border:1px solid #333; padding:8px;">Payment</th>
    <td style="border:1px solid #333; padding:8px;">
      ${booking.payment ? `₱${booking.payment}` : '—'}
    </td>
  </tr>
</table>

<div style="display:flex; justify-content:space-between; margin-top:3rem;">
  <div style="text-align:center; width:45%;">
    <div style="border-top:1px solid #333; margin-top:2rem;"></div>
    <p>Requested By</p>
  </div>

  <div style="text-align:center; width:45%;">
    <div style="border-top:1px solid #333; margin-top:2rem;"></div>
    <p>Approved By</p>
  </div>
</div>
`;

        document.body.appendChild(receiptDiv);

        // 2. Use html2canvas to render as canvas
        const canvas = await html2canvas(receiptDiv, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");

        // 3. Generate PDF
        const pdf = new jsPDF("p", "pt", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

        // 4. Download PDF
        pdf.save(`VehicleBooking_Receipt_${booking.id || booking.date}.pdf`);

        // 5. Cleanup temporary div
        document.body.removeChild(receiptDiv);
    };

    // 
    // 
    // 
    // 
    const [paymentValue, setPaymentValue] = useState(0); // Track the payment value
    const [showPaymentModal, setShowPaymentModal] = useState(false); // Track modal visibility
    const [editingBookingId, setEditingBookingId] = useState(null); // Track the bookingId for editing

    // Show the modal with the correct booking ID
    const openPaymentModal = (bookingId, currentPayment) => {
        setEditingBookingId(bookingId); // Set the booking ID for the payment update
        setPaymentValue(currentPayment); // Optionally set the current payment value for the input field
        setShowPaymentModal(true); // Show the modal
    };

    // Update the payment value
    const updatePayment = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:5000/api/edit-payment/${editingBookingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payment: Number(paymentValue) }),
            });

            const data = await res.json();
            if (data.success) {
                setBookings(prev => prev.map(b => b.id === editingBookingId ? data.booking : b));
                setShowPaymentModal(false);
            } else {
                alert(data.message || 'Failed to update payment');
            }
        } catch (err) {
            console.error('Payment update error:', err);
            alert('Error updating payment.');
        }
    };



    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const currentUserId = localStorage.getItem("currentUserId");

        let datesArray = [];
        if (form.mode === "single") datesArray = [form.date];
        if (form.mode === "specific") datesArray = form.specificDates.filter(d => d);
        if (form.mode === "range") {
            let start = new Date(form.rangeStart);
            let end = new Date(form.rangeEnd);
            if ((end - start) / (1000 * 60 * 60 * 24) > 6) {
                alert("Date range cannot exceed 1 week.");
                return;
            }
            for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
                datesArray.push(d.toISOString().split('T')[0]);
            }
        }

        const newBooking = {
            vehicle_id: Number(form.vehicleId),
            driver_id: form.driverId ? Number(form.driverId) : null,
            requestor: form.requestor,
            department_id: Number(form.affiliationId),
            dates: datesArray,
            purpose: form.purpose,
            booker_id: Number(currentUserId),
            destination: form.destination,
        };


        // EDIT MODE
        if (editingId !== null) {
            try {
                const res = await fetch(
                    `http://localhost:5000/api/edit-vehicle-booking/${editingId}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(newBooking),
                    }
                );

                const data = await res.json();

                if (data.success) {
                    // ✅ best: update using returned booking
                    setBookings((prev) =>
                        prev.map((b) => (b.id === editingId ? data.booking : b))
                    );

                    setShowForm(false);
                    setConflicts([]);
                    setEditingId(null);

                    // optional reset form
                    setForm({
                        vehicleId: "",
                        driverId: "",
                        requestor: "",
                        affiliationId: "",
                        date: "",
                        purpose: "",
                        destination: "",
                    });
                } else {
                    alert(data.message || "Failed to update vehicle booking");
                }
            } catch (error) {
                console.error("Error updating booking:", error);
                alert("Server error, could not update booking.");
            }

            return;
        }

        // CREATE MODE
        let hasConflict = false;

        try {
            const res = await fetch(
                `http://localhost:5000/api/vehicle-conflicts?vehicleId=${encodeURIComponent(
                    form.vehicleId
                )}&date=${encodeURIComponent(form.date)}`
            );

            const data = await res.json();

            if (data.success && data.bookings.length > 0) {
                hasConflict = true;
                setConflicts(data.bookings);
            }
        } catch (err) {
            console.error("Error checking vehicle conflicts:", err);
        }

        if (hasConflict) {
            alert("Conflict detected: This vehicle is already booked on that date.");
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/create-vehicle-booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newBooking),
            });

            const data = await res.json();

            if (data.success) {
                // ✅ append returned booking (contains id)
                setBookings((prev) => [...prev, data.booking]);

                setForm({
                    vehicleId: "",
                    driverId: "",
                    requestor: "",
                    affiliationId: "",
                    date: "",
                    purpose: "",
                    destination: "",
                });

                setShowForm(false);
                setConflicts([]);
            } else {
                alert(data.message || "Failed to create vehicle booking");
            }
        } catch (error) {
            console.error("Error submitting booking:", error);
            alert("Server error, could not create booking.");
        }
    };


    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/fetch-vehicles');
                const data = await res.json();

                const nonDeleted = data.filter(b => !b.deleted); // ignore deleted
                // Map to add a formatted dates string
                const bookingsWithDates = nonDeleted.map(b => ({
                    ...b,
                    formattedDates: Array.isArray(b.dates) ?
                        b.dates.map(d => new Date(d).toLocaleDateString()).join(', ')
                        : new Date(b.dates).toLocaleDateString()
                }));

                setBookings(bookingsWithDates);

                // Extract unique vehicle types and departments
                const uniqueTypes = Array.from(
                    new Set(bookingsWithDates.map(b => b.vehicleType || b.vehicle_Type).filter(Boolean))
                ).map(toTitleCase).sort((a, b) => a.localeCompare(b));
                setVehicleTypes(uniqueTypes);

                const uniqueDepts = Array.from(
                    new Set(bookingsWithDates.map(b => b.department).filter(Boolean))
                ).map(toTitleCase).sort((a, b) => a.localeCompare(b));
                setDepartments(uniqueDepts);

            } catch (error) {
                console.error('Error fetching bookings:', error);
            }
        };

        fetchBookings();
    }, []);


    const [editStatusId, setEditStatusId] = useState(null); // Track the booking ID being edited

    const handleStatusChange = async (bookingId, newStatus) => {
        try {
            const res = await fetch(`http://localhost:5000/api/update-status/${bookingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await res.json();
            if (data.success) {
                // Update the booking status in the state
                setBookings((prevBookings) =>
                    prevBookings.map((b) =>
                        b.id === bookingId ? { ...b, status: data.booking.status } : b
                    )
                );
                setEditStatusId(null); // Exit edit mode
            } else {
                alert(data.message || 'Failed to update status');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Server error, could not update status.');
        }
    };


    const statuses = ['Pending', 'Approved', 'Declined']; // Define available statuses

    function toTitleCase(str) {
        if (!str) return '';
        return str.replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/[-_]/g, ' ')
            .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }

    // const handleEdit = (index) => {
    //     setEditingId(index);
    //     setForm(bookings[index]);
    //     setShowForm(true);
    //     window.scrollTo({ top: 0, behavior: 'smooth' });
    // };
    const handleEdit = (index) => {
        const b = bookings[index];
        setEditingId(b.id);

        // Default form values
        let mode = "single";
        let date = "";
        let specificDates = ["", "", "", ""];
        let rangeStart = "";
        let rangeEnd = "";

        if (Array.isArray(b.dates) && b.dates.length > 0) {
            const dates = b.dates.map(d => new Date(d)).sort((a, b) => a - b);

            if (dates.length === 1) {
                mode = "single";
                date = dates[0].toISOString().split("T")[0];
            } else {
                // Check if consecutive
                const isConsecutive = dates.every((d, i) => {
                    if (i === 0) return true;
                    const diffDays = (d - dates[i - 1]) / (1000 * 60 * 60 * 24);
                    return diffDays === 1;
                });

                if (isConsecutive) {
                    mode = "range";
                    rangeStart = dates[0].toISOString().split("T")[0];
                    rangeEnd = dates[dates.length - 1].toISOString().split("T")[0];
                } else {
                    mode = "specific";
                    // Fill specificDates array (max 4)
                    specificDates = dates.slice(0, 4).map(d => d.toISOString().split("T")[0]);
                    while (specificDates.length < 4) specificDates.push("");
                }
            }
        }

        setForm({
            vehicleId: b.vehicle_id ? String(b.vehicle_id) : "",
            requestor: b.requestor || "",
            affiliationId: b.department_id ? String(b.department_id) : "",
            mode,
            date,
            specificDates,
            rangeStart,
            rangeEnd,
            purpose: b.purpose || "",
            driverId: b.driver_id ? String(b.driver_id) : "",
            destination: b.destination || "",
        });

        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
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
    // const currentUserId = localStorage.getItem("currentUserId");
    const [userVehicleIds, setUserVehicleIds] = useState([]);
    const fetchUserVehicles = async () => {
        const res = await fetch(
            `http://localhost:5000/api/user-vehicles-fetch/${currentUserId}`
        );
        const data = await res.json();
        return data.vehicles || []; // array of vehicle IDs
    };
    useEffect(() => {
        if (!bookings.length || !currentUserId) return;

        const fetchUserVehicles = async () => {
            const res = await fetch(
                `http://localhost:5000/api/user-vehicles-fetch/${currentUserId}`
            );
            const data = await res.json();
            return (data.vehicles || []).map(Number);
        };

        const logVehicleBookingPivotStatus = async () => {
            const userVehicleIds = await fetchUserVehicles();

            console.group("VEHICLE BOOKINGS — PIVOT CHECK");
            console.log("User ID:", currentUserId);
            console.log("Vehicles in Pivot:", userVehicleIds);
            console.log("--------------------------------");

            bookings.forEach((booking, index) => {
                const bookingVehicleId = Number(booking.vehicle_id);
                const inPivot = userVehicleIds.includes(bookingVehicleId);

                console.group(`Booking #${index + 1}`);
                console.log("Booking Vehicle ID:", bookingVehicleId);

                if (!inPivot) {
                    console.warn("Pivot Status: ❌ NOT IN PIVOT");
                    console.log("Vehicles in Pivot for this User:", userVehicleIds);
                } else {
                    console.log("Pivot Status: ✅ IN PIVOT");
                }

                console.groupEnd();
            });

            console.log("--------------------------------");
            console.groupEnd();
        };

        logVehicleBookingPivotStatus();
    }, [bookings, currentUserId]);
    useEffect(() => {
        if (!currentUserId) return;

        const fetchUserVehicles = async () => {
            const res = await fetch(
                `http://localhost:5000/api/user-vehicles-fetch/${currentUserId}`
            );
            const data = await res.json();
            setUserVehicleIds((data.vehicles || []).map(Number));
        };

        fetchUserVehicles();
    }, [currentUserId]);



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
                                {/* Vehicle Type */}
                                <select
                                    name="vehicleId"
                                    value={form.vehicleId}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-4 py-2"
                                    required
                                >
                                    <option value="">Select...</option>
                                    {availableVehicles.map(v => (
                                        <option
                                            key={v.id}
                                            value={v.id} // ID stored
                                        >
                                            {toTitleCase(v.vehicle_name)} - {v.vehicle_type} - {v.passenger_capacity} capacity
                                        </option>
                                    ))}
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
                                    maxLength={19}
                                    className="w-full border rounded-lg px-4 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Affiliation*</label>
                                {/* Affiliation / Department */}
                                <select
                                    name="affiliationId"
                                    value={form.affiliationId}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-4 py-2"
                                    required
                                >
                                    <option value="">Select...</option>
                                    {affiliations.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.abbreviation} - {a.meaning}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Date*</label>
                                {/* <input
                                    type="date"
                                    min={getTomorrowDate()}
                                    name="date"
                                    value={form.date}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-4 py-2"
                                    required
                                /> */}
                                {form.mode === "single" && (
                                    <input
                                        type="date"
                                        name="date"
                                        min={minDate}
                                        value={form.date}
                                        onChange={handleChange}
                                        className="border rounded px-3 py-2 w-full"
                                        required
                                    />
                                )}

                                {form.mode === "specific" &&
                                    form.specificDates.map((d, i) => (
                                        <input
                                            key={i}
                                            type="date"
                                            min={minDate}
                                            value={d}
                                            onChange={(e) => {
                                                const newDates = [...form.specificDates];
                                                newDates[i] = e.target.value;
                                                setForm({ ...form, specificDates: newDates });
                                            }}
                                            className="border rounded px-3 py-2 w-full"
                                        />
                                    ))}

                                {form.mode === "range" && (
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            name="rangeStart"
                                            min={minDate}
                                            value={form.rangeStart}
                                            onChange={handleChange}
                                            className="border rounded px-3 py-2 w-full"
                                        />
                                        <input
                                            type="date"
                                            name="rangeEnd"
                                            min={form.rangeStart || minDate}
                                            value={form.rangeEnd}
                                            onChange={handleChange}
                                            className="border rounded px-3 py-2 w-full"
                                        />
                                    </div>
                                )}

                                <div className="mb-4">
                                    <label className="block mb-1 font-semibold">Date Mode*</label>
                                    <select name="mode" value={form.mode} onChange={handleChange} className="border rounded px-3 py-2 w-full">
                                        <option value="single">Single Date</option>
                                        <option value="specific">Specific Dates (max 4)</option>
                                        <option value="range">Date Range (max 1 week)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className='flex '>
                            <div className="mb-6 w-full mr-5">
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
                            <div className="mb-6 w-full ml-5">
                                <label className="block text-sm font-medium mb-1">Desination*</label>
                                <textarea
                                    name="destination"
                                    value={form.destination}
                                    placeholder={'Milala National Highschool, Bataan wew \n Create a list for multiple destinations'}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-4 py-2"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Driver*</label>
                            <select
                                name="driverId"
                                value={form.driverId}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-4 py-2"
                                required
                                disabled={!availableDrivers.length}
                            >
                                <option value="">
                                    {availableDrivers.length
                                        ? 'Select driver...'
                                        : 'No drivers available'}
                                </option>

                                {availableDrivers.map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
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
                                                <td className="px-4 py-2">{c.vehicle_id}</td>
                                                <td className="px-4 py-2">{c.requestor}</td>
                                                <td className="px-4 py-2">{c.department_id}</td>
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
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Destination</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Driver</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Payment</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase rounded-tr-xl">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {bookings.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-8 text-gray-500">No vehicle bookings yet.</td>
                            </tr>
                        ) : (
                            bookings.filter(b =>
                                (filter.search === '' || (b.requestor && b.requestor.toLowerCase().includes(filter.search.toLowerCase()))) &&
                                (filter.vehicleType === 'All' || toTitleCase(b.vehicleType || b.vehicle_Type) === filter.vehicleType) &&
                                (filter.department === 'All' || toTitleCase(b.department) === filter.department) &&
                                (filter.dateFrom === '' || b.date >= filter.dateFrom) &&
                                (filter.dateTo === '' || b.date <= filter.dateTo)
                            ).map((b, index) => {
                                const bookingVehicleId = Number(b.vehicle_id);
                                const hasPivotAccess = userVehicleIds.includes(bookingVehicleId);
                                const vehicle = availableVehicles.find(
                                    v => v.id === Number(b.vehicle_id)
                                );
                                return (
                                    <React.Fragment key={index}>
                                        <tr
                                            className="hover:bg-gray-50 transition cursor-pointer"
                                            onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                                        >
                                            {/* Vehicle Name */}
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {(() => {
                                                    if (!b.vehicle_id) {
                                                        console.error("Vehicle ID is missing:", b.vehicle_id);
                                                        return `ID: ${b.vehicle_id}`;
                                                    }

                                                    const vehicle = availableVehicles?.find(v => v.id === Number(b.vehicle_id));
                                                    return vehicle ? toTitleCase(vehicle.vehicle_name) : 'Unknown Vehicle'; // Updated fallback
                                                })()}
                                            </td>

                                            {/* Requestor */}
                                            <td className="px-6 py-4">{toTitleCase(b.requestor)}</td>

                                            {/* Department Abbreviation */}
                                            <td className="px-6 py-4">
                                                {(() => {
                                                    if (!b.department_id) {
                                                        console.error("Department ID is missing:", b.department_id);
                                                        return `ID: ${b.department_id}`;
                                                    }

                                                    const affiliation = affiliations?.find(a => a.id === Number(b.department_id));
                                                    return affiliation
                                                        ? `${affiliation.abbreviation}`
                                                        : 'Unknown Affiliation'; // Updated fallback
                                                })()}
                                            </td>

                                            {/* Event Date */}
                                            <td className="px-6 py-4">
                                                {Array.isArray(b.dates) && b.dates.length > 0
                                                    ? (() => {
                                                        // Convert to Date objects and sort
                                                        const dates = b.dates.map(d => new Date(d)).sort((a, b) => a - b);

                                                        // Check if dates are consecutive
                                                        const isConsecutive = dates.every((d, i) => {
                                                            if (i === 0) return true;
                                                            const diffDays = (d - dates[i - 1]) / (1000 * 60 * 60 * 24);
                                                            return diffDays === 1;
                                                        });

                                                        // Format month/day
                                                        const options = { month: 'short', day: 'numeric' };
                                                        const year = dates[0].getFullYear();

                                                        if (dates.length === 1) {
                                                            return `${dates[0].toLocaleDateString('en-US', options)}, ${year}`;
                                                        }

                                                        if (isConsecutive) {
                                                            // Feb 1–3, 2026
                                                            return `${dates[0].toLocaleDateString('en-US', options)}–${dates[dates.length - 1].getDate()}, ${year}`;
                                                        } else {
                                                            // Feb 1 & 3, 2026
                                                            const formatted = dates.map(d => d.toLocaleDateString('en-US', options));
                                                            const last = formatted.pop();
                                                            return `${formatted.join(' & ')} & ${last}, ${year}`;
                                                        }
                                                    })()
                                                    : 'No date'}
                                            </td>




                                            {/* Purpose */}
                                            <td className="px-6 py-4">{b.purpose}</td>
                                            <td className="px-6 py-4">{b.destination}</td>
                                            <td className="px-6 py-4">{b.driver_name || '—'}</td>
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                {!hasPivotAccess ? (
                                                    <span className="text-gray-400 italic">No Access</span>
                                                ) : editStatusId === b.id ? (
                                                    <select
                                                        value={b.status}
                                                        onChange={(e) => handleStatusChange(b.id, e.target.value)}
                                                        onBlur={() => setEditStatusId(null)}
                                                        autoFocus
                                                        className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#96161C]"
                                                    >
                                                        {statuses.map((status) => (
                                                            <option key={status} value={status}>
                                                                {status}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-bold shadow
        ${b.status === 'Approved'
                                                                ? 'bg-green-100 text-green-700 border border-green-300'
                                                                : b.status === 'Pending'
                                                                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                                                    : 'bg-red-100 text-red-700 border border-red-300'
                                                            }`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditStatusId(b.id);
                                                        }}
                                                    >
                                                        {b.status}
                                                    </span>
                                                )}
                                            </td>

                                            <td>{b.payment}</td>



                                            {/* Admin or User-specific Actions */}
                                            {isAdmin ? (
                                                <>
                                                    <td className="px-6 py-4 font-semibold">
                                                        {!hasPivotAccess ? (
                                                            <span className="text-gray-400 italic">No Access</span>
                                                        ) : isAdmin ? (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleEdit(index); }}
                                                                    className="px-4 py-1 text-sm font-semibold rounded-full border border-[#96161C] text-[#96161C]"
                                                                >
                                                                    Edit
                                                                </button>

                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(index); }}
                                                                    className="px-4 py-1 text-sm font-semibold rounded-full border border-red-600 text-red-600"
                                                                >
                                                                    Delete
                                                                </button>

                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openPaymentModal(b.id, b.payment);
                                                                    }}
                                                                    className="px-4 py-1 text-sm font-semibold rounded-full border border-blue-600 text-blue-600"
                                                                >
                                                                    Payment
                                                                </button>
                                                            </div>
                                                        ) : parseInt(b.booker_id) === parseInt(currentUserId) ? (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleEdit(index); }}
                                                                    className="px-4 py-1 text-sm font-semibold rounded-full border border-[#96161C] text-[#96161C]"
                                                                >
                                                                    Edit
                                                                </button>

                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(index); }}
                                                                    className="px-4 py-1 text-sm font-semibold rounded-full border border-red-600 text-red-600"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[#daa7aa]">Hidden</span>
                                                        )}
                                                    </td>


                                                    {/* Payment Edit Modal */}
                                                    {showPaymentModal && (
                                                        <div className="fixed inset-0 z-50 flex items-center justify-center"
                                                            style={{ backgroundColor: 'rgba(128, 128, 128, 0.3)' }}>
                                                            {/* Modal box */}
                                                            <div className="bg-white rounded-lg shadow-lg w-80 max-w-full p-6 relative space-y-4">
                                                                <h3 className="text-xl font-semibold">Edit Payment</h3>

                                                                {/* Explanation / Guide */}
                                                                <div className="bg-gray-100 p-3 rounded border border-gray-200 text-sm text-gray-700">
                                                                    <p><strong>Payment Calculation Guide:</strong></p>
                                                                    <p>- Standard rate: <span className="font-semibold">₱10 / km</span></p>
                                                                    <p>- Example: 50 km → 50 x 10 = ₱500</p>
                                                                    <p>- Additional charges may apply for extra hours or tolls.</p>
                                                                </div>

                                                                {/* Payment Input */}
                                                                <form onSubmit={updatePayment} className="space-y-3">
                                                                    <div>
                                                                        <label className="block text-sm font-medium mb-1">Payment Amount*</label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={paymentValue}
                                                                            onChange={(e) => setPaymentValue(e.target.value)}
                                                                            className="w-full border rounded-lg px-4 py-2"
                                                                            required
                                                                        />
                                                                    </div>

                                                                    {/* Buttons */}
                                                                    <div className="flex justify-end gap-3">
                                                                        <button
                                                                            type="submit"
                                                                            className="bg-[#96161C] text-white px-6 py-2 rounded-lg"
                                                                        >
                                                                            Save
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowPaymentModal(false)}
                                                                            className="bg-gray-200 px-6 py-2 rounded-lg"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </form>
                                                            </div>
                                                        </div>
                                                    )}

                                                </>
                                            ) : (
                                                parseInt(b.booker_id) === parseInt(currentUserId) ? (
                                                    <td className="px-1 py-2 flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEdit(index); }}
                                                            className="px-4 py-1 text-sm font-semibold rounded-full border border-[#96161C] text-[#96161C]"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(index); }}
                                                            className="px-4 py-1 text-sm font-semibold rounded-full border border-red-600 text-red-600"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                ) : (
                                                    <td className="px-6 py-4 font-semibold text-[#daa7aa]">Hidden</td>
                                                )
                                            )}

                                        </tr>


                                        {/* Expanded Detail Row */}
                                        {expandedRow === index && (
                                            <tr className="bg-gray-50">
                                                <td colSpan={8} className="px-6 py-4">
                                                    <div className="p-4 rounded-lg border border-gray-200 bg-white flex flex-col md:flex-row md:justify-between gap-4 items-start">

                                                        {/* Booking Details */}
                                                        <div className="space-y-2">
                                                            <p><strong>Vehicle Type:</strong> {vehicle?.vehicle_name || 'Unknown Vehicle'}</p>
                                                            <p><strong>Requestor:</strong> {toTitleCase(b.requestor)}</p>
                                                            <p>
                                                                <strong>Department:</strong>{" "}
                                                                {affiliations.find(a => a.id === Number(b.department_id))
                                                                    ?.abbreviation || '—'}
                                                            </p>
                                                            <p><strong>Date:</strong> {formatVehicleDatesInline(b.dates)}</p>
                                                            <p><strong>Purpose:</strong> {b.purpose}</p>
                                                        </div>


                                                        {/* Download Receipt */}
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => downloadReceipt(b)}
                                                                className="px-4 py-2 text-sm font-medium rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200"
                                                            >
                                                                Download Receipt
                                                            </button>
                                                        </div>

                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>

                </table>
            </div >
        </div >
    );
}
