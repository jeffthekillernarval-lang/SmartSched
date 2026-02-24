const express = require("express");
const router = express.Router();
const axios = require("axios");
const { Pool } = require("pg");

require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.post("/", async (req, res) => {
    const { message, bookings = {}, currentDateTime } = req.body;
    // PREVENT , AI resend
    const cleanMessage = message?.trim();

    if (!cleanMessage || cleanMessage === "," || cleanMessage.length < 2) {
        return res.json({ reply: "" });
    }
    const formattedBookings = [];
    function formatTime12(timeStr) {
        const [hour, minute] = timeStr.split(":").map(Number);
        const ampm = hour >= 12 ? "PM" : "AM";
        const h = hour % 12 === 0 ? 12 : hour % 12;
        return `${h}:${minute.toString().padStart(2, "0")} ${ampm}`;
    }

    function formatPrettyDate(isoDate) {
        const d = new Date(isoDate);
        return d.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    }
    function parseMonthDayToISO(text, year = 2026) {
        const months = {
            january: "01",
            february: "02",
            march: "03",
            april: "04",
            may: "05",
            june: "06",
            july: "07",
            august: "08",
            september: "09",
            october: "10",
            november: "11",
            december: "12"
        };

        const [monthWord, day] = text.toLowerCase().split(" ");
        return `${year}-${months[monthWord]}-${day.padStart(2, "0")}`;
    }
    function toLocalISO(dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    // const { message, bookings = {}, currentDateTime } = req.body;
    // const formattedBookings = [];

    /* ==================================================
       VEHICLE AVAILABILITY (ARRAY-SAFE, FACILITY-LIKE)
    ================================================== */

    const dateMatch = message.match(
        /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i
    );

    const vehicleMatch = message.match(/\b(bus|hilux|van|car)\b/i);

    if (dateMatch && vehicleMatch) {

        const dateISO = parseMonthDayToISO(dateMatch[0]);
        const keyword = vehicleMatch[0].toLowerCase();

        const vehiclesResult = await pool.query(
            `
        SELECT id, vehicle_name
        FROM "Vehicles"
        WHERE enabled = true
          AND LOWER(vehicle_name) LIKE '%' || $1 || '%'
        `,
            [keyword]
        );

        for (const v of vehiclesResult.rows) {
            const bookingResult = await pool.query(
                `
            SELECT purpose, destination
            FROM "VehicleBooking"
            WHERE vehicle_id = $1
              AND deleted = false
              AND DATE(start_datetime) = $2
            LIMIT 1
            `,
                [String(v.id), dateISO]
            );

            if (bookingResult.rowCount > 0) {
                formattedBookings.push(
                    `- ${v.vehicle_name} is ❌ UNAVAILABLE on ${dateISO}
  Purpose: ${bookingResult.rows[0].purpose}`
                );
            } else {
                formattedBookings.push(
                    `- ${v.vehicle_name} is ✅ AVAILABLE on ${dateISO}`
                );
            }
        }
    }
    /* ==================================================
       EQUIPMENT AVAILABILITY (ARRAY-SAFE, FACILITY-LIKE)
    ================================================== */

    const equipmentDateMatch = message.match(
        /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i
    );

    if (equipmentDateMatch) {
        const dateISO = parseMonthDayToISO(equipmentDateMatch[0]);
        const messageLower = message.toLowerCase();

        const equipmentsResult = await pool.query(
            `SELECT id, name FROM "Equipments" WHERE enabled = true`
        );

        for (const eq of equipmentsResult.rows) {
            if (!messageLower.includes(eq.name.toLowerCase())) continue;

            const bookingResult = await pool.query(
                `
            SELECT purpose, time_start, time_end
            FROM "Equipment"
            WHERE equipment_type_id = $1
              AND $2 = ANY(dates)
            LIMIT 1
            `,
                [eq.id, dateISO]
            );

            if (bookingResult.rowCount > 0) {
                formattedBookings.push(
                    `- ${eq.name} is ❌ UNAVAILABLE on ${dateISO}
  Time: ${bookingResult.rows[0].time_start?.slice(0, 5)}–${bookingResult.rows[0].time_end?.slice(0, 5)}
  Purpose: ${bookingResult.rows[0].purpose}`
                );
            } else {
                formattedBookings.push(
                    `- ${eq.name} is ✅ AVAILABLE on ${dateISO}`
                );
            }
        }
    }


    /* ==================================================
       LOOKUPS (FOR CONTEXT)
    ================================================== */

    const vehicleResult = await pool.query(
        `SELECT id, vehicle_name FROM "Vehicles" WHERE enabled = true`
    );

    const vehicleMap = {};
    vehicleResult.rows.forEach(v => {
        vehicleMap[v.id] = v.vehicle_name;
    });

    const facilityResult = await pool.query(
        `SELECT id, name, capacity FROM "Facilities" WHERE enabled = true`
    );

    const facilityMap = {};
    facilityResult.rows.forEach(f => {
        facilityMap[f.id] = {
            id: f.id,
            name: f.name,
            capacity: f.capacity
        };
    });


    /* ==================================================
       LATEST VEHICLE BOOKING (CONTEXT)
    ================================================== */

    const latestVehicleBookingResult = await pool.query(`
        SELECT vb.*, v.vehicle_name
        FROM "VehicleBooking" vb
        LEFT JOIN "Vehicles" v
          ON v.id = vb.vehicle_id::INTEGER
        WHERE vb.deleted = false
        ORDER BY vb.id DESC
        LIMIT 1
    `);

    if (latestVehicleBookingResult.rows.length > 0) {
        const b = latestVehicleBookingResult.rows[0];

        formattedBookings.push(
            `- Latest Vehicle Booking:
  Vehicle: ${b.vehicle_name || `Vehicle ${b.vehicle_id}`}
  Date: ${b.start_datetime?.toISOString().split("T")[0] || "N/A"}
Time: ${b.start_datetime?.toISOString().slice(11, 16)}–${b.end_datetime?.toISOString().slice(11, 16)}
  Purpose: ${b.purpose || "N/A"}
  Destination: ${b.destination || "N/A"}`
        );
    }

    /* ==================================================
       EXISTING BOOKINGS FROM FRONTEND
    ================================================== */

    if (Array.isArray(bookings.facilities)) {
        bookings.facilities.forEach(b => {
            const facilityName =
                facilityMap[b.facility]?.name || `Facility ${b.facility}`;


            formattedBookings.push(
                `- Facility: ${facilityName}
  Date: ${b.date}
  Time: ${b.startTime}–${b.endTime}
  Event: ${b.name}`
            );
        });
    }

    if (Array.isArray(bookings.vehicles)) {
        bookings.vehicles.forEach(v => {
            const vehicleName =
                vehicleMap[v.vehicle_id] || `Vehicle ${v.vehicle_id}`;

            const dateText = Array.isArray(v.dates)
                ? v.dates.join(", ")
                : "Unknown date";

            formattedBookings.push(
                `- Vehicle: ${vehicleName}
  Date(s): ${dateText}
  Purpose: ${v.purpose || "N/A"}
  Destination: ${v.destination || "N/A"}`
            );
        });
    }
    // ==================================================
    // FACILITY AVAILABILITY (REAL DB CHECK)
    // ==================================================

    if (dateMatch) {

        const dateISO = parseMonthDayToISO(dateMatch[0]);
        const messageLower = message.toLowerCase();

        for (const f of Object.values(facilityMap)) {

            if (!messageLower.includes(f.name.toLowerCase())) continue;

            const bookingResult = await pool.query(
                `
            SELECT event_name, starting_time, ending_time
            FROM "Booking"
            WHERE event_facility = $1
              AND event_date = $2
              AND deleted = false
            `,
                [f.id, dateISO]
            );

            if (bookingResult.rowCount > 0) {
                const b = bookingResult.rows[0];

                formattedBookings.push(
                    `- ${f.name} is ❌ BOOKED on ${dateISO}
  Time: ${b.starting_time.slice(0, 5)}–${b.ending_time.slice(0, 5)}
  Event: ${b.event_name}`
                );
            } else {
                formattedBookings.push(
                    `- ${f.name} is ✅ AVAILABLE on ${dateISO}`
                );
            }
        }
    }

    /* ==================================================
       SYSTEM PROMPT
    ================================================== */

    const systemPrompt = `
You are a helpful booking assistant.

You can chat naturally.

ONLY when the user clearly wants to create a booking,
respond with JSON ONLY using ONE of these formats.

Facility names are provided alongside their IDs.
Always refer to facilities by name when replying to users.

FACILITY:
{
  "intent": "create_booking",
  "resource_type": "facility",
  "schedules": [{ "date": "YYYY-MM-DD", "startTime": "HH:MM", "endTime": "HH:MM" }],
  "event_name": "",
  "event_facility": "number",
  "requested_by": "",
  "organization": "",
  "contact": "",
  "reservation": false,
  "insider": false
}

VEHICLE:
{
  "intent": "create_booking",
  "resource_type": "vehicle",
  "vehicle_id": "number",
  "driver_id": null,
  "requestor": "",
  "department_id": "number",
  "schedule": {
     "date": "YYYY-MM-DD",
     "startTime": "HH:MM",
     "endTime": "HH:MM"
  },
  "purpose": "",
  "destination": ""
}
EQUIPMENT:
{
  "intent": "create_booking",
  "resource_type": "equipment",
  "equipments": [
    { "equipmentId": "number" }
  ],
  "quantity": "number",
  "department_id": "number",
  "facility_id": "number",
  "dates": ["YYYY-MM-DD"],
  "time_start": "HH:MM",
  "time_end": "HH:MM",
  "purpose": ""
}


Current time: ${currentDateTime}

Existing bookings:
${formattedBookings.join("\n") || "None"}
`;
    // ==================================================
    // EQUIPMENT BOOKING TEMPLATE WITH SUGGESTIONS
    // ==================================================
    if (message.toLowerCase().includes("equipment booking")) {

        const suggestionResult = await pool.query(
            `SELECT id, name, model_id 
     FROM "Equipments" 
     WHERE enabled = true 
     LIMIT 6`
        );

        const suggestions = suggestionResult.rows
            .map(e => `• ${e.name} (${e.model_id})`)
            .join("\n");

        return res.json({
            reply:
                `I can assist you with booking equipment.\n\n` +
                `Here are some available equipments:\n${suggestions}\n\n` +
                `Please provide the following details:\n\n` +
                `1. Equipment Name(s)\n` +
                `2. Quantity\n` +
                `3. Department\n` +
                `4. Facility\n` +
                `5. Date(s)\n` +
                `6. Start and End Time\n` +
                `7. Purpose`
        });
    }
    /* ==================================================
       COHERE CHAT
    ================================================== */

    let aiReply = "";

    try {
        const cohereResponse = await axios.post(
            "https://api.cohere.ai/v1/chat",
            { message, preamble: systemPrompt },
            {
                headers: {
                    Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        aiReply = cohereResponse.data.text?.trim() || "";
    } catch (err) {
        console.error("Cohere error:", err.message);
        return res.json({ reply: "AI service unavailable." });
    }


    /* ==================================================
       PARSE JSON
    ================================================== */

    const jsonMatch = aiReply.match(/\{[\s\S]*\}/);
    let bookingData = null;

    if (jsonMatch) {
        try {
            bookingData = JSON.parse(jsonMatch[0]);
        } catch { }
    }
    /* ==================================================
       CREATE BOOKING
    ================================================== */

    if (bookingData?.intent === "create_booking") {
        // ==================================================
        // EQUIPMENT NAME → EQUIPMENT ID (FACILITY STYLE)
        // ==================================================
        if (bookingData.resource_type === "equipment") {

            const equipmentsResult = await pool.query(
                `SELECT id, name FROM "Equipments" WHERE enabled = true`
            );

            const messageLower = message.toLowerCase();

            const matchedEquipments = [];

            for (const eq of equipmentsResult.rows) {

                const eqName = eq.name.toLowerCase();

                const regex = new RegExp(
                    `\\b${eqName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`,
                    "i"
                );

                if (regex.test(messageLower)) {
                    matchedEquipments.push({
                        equipmentId: eq.id,
                        quantity: bookingData.quantity || 1
                    });
                }
            }

            if (matchedEquipments.length === 0) {
                return res.json({
                    reply:
                        "❌ Equipment could not be identified.\n\n" +
                        "Please provide the exact equipment name."
                });
            }

            bookingData.equipments = matchedEquipments;
        }
        // ==================================================
        // VEHICLE NAME → VEHICLE ID (FACILITY STYLE)
        // ==================================================
        if (bookingData.resource_type === "vehicle") {

            const vehiclesResult = await pool.query(
                `SELECT id, vehicle_name FROM "Vehicles" WHERE enabled = true`
            );

            const messageLower = message.toLowerCase();

            let matchedVehicle = null;

            for (const v of vehiclesResult.rows) {

                const vehicleName = v.vehicle_name.toLowerCase();

                const regex = new RegExp(
                    `\\b${vehicleName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`,
                    "i"
                );

                if (regex.test(messageLower)) {
                    matchedVehicle = v;
                    break;
                }
            }

            if (!matchedVehicle) {
                return res.json({
                    reply:
                        "❌ Vehicle could not be identified.\n\n" +
                        "Please provide the exact vehicle name (e.g., Hilux, Bus, Van)."
                });
            }

            // 🔥 ALWAYS override AI value
            bookingData.vehicle_id = matchedVehicle.id;
        }
        // ==================================================
        // DEPARTMENT NAME → DEPARTMENT ID (FACILITY STYLE)
        // ==================================================
        if (bookingData.resource_type === "vehicle") {

            const deptResult = await pool.query(
                `SELECT id, meaning FROM "Affiliations"`
            );

            const messageLower = message.toLowerCase();

            let matchedDept = null;

            for (const d of deptResult.rows) {

                const abbrev = d.abbreviation?.toLowerCase() || "";
                const meaning = d.meaning?.toLowerCase() || "";

                if (
                    messageLower.includes(abbrev) ||
                    messageLower.includes(meaning)
                ) {
                    matchedDept = d;
                    break;
                }

                if (regex.test(messageLower)) {
                    matchedDept = d;
                    break;
                }
            }

            if (!matchedDept) {
                return res.json({
                    reply:
                        "❌ Department could not be identified.\n\n" +
                        "Please provide the exact department name."
                });
            }

            bookingData.department_id = matchedDept.id;
        }
        // ==================================================
        // DEPARTMENT NAME → DEPARTMENT ID (FOR EQUIPMENT)
        // ==================================================
        if (bookingData.resource_type === "equipment") {

            const deptResult = await pool.query(
                `SELECT id, abbreviation, meaning FROM "Affiliations" WHERE enabled = true`
            );

            const messageLower = message.toLowerCase();

            let matchedDept = null;

            for (const d of deptResult.rows) {

                const abbrev = d.abbreviation?.toLowerCase() || "";
                const meaning = d.meaning?.toLowerCase() || "";

                if (
                    messageLower.includes(abbrev) ||
                    messageLower.includes(meaning)
                ) {
                    matchedDept = d;
                    break;
                }
            }

            if (!matchedDept) {
                return res.json({
                    reply:
                        "❌ Department could not be identified.\n\n" +
                        "Please provide the exact department name."
                });
            }

            bookingData.department_id = matchedDept.id;
        }
        // ==================================================
        // FACILITY NAME → FACILITY ID (FOR EQUIPMENT)
        // ==================================================
        if (bookingData.resource_type === "equipment") {

            const facilitiesResult = await pool.query(
                `SELECT id, name FROM "Facilities" WHERE enabled = true`
            );

            const messageLower = message.toLowerCase();

            let matchedFacility = null;

            for (const f of facilitiesResult.rows) {

                const facilityName = f.name.toLowerCase();

                const regex = new RegExp(
                    `\\b${facilityName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`,
                    "i"
                );

                if (regex.test(messageLower)) {
                    matchedFacility = f;
                    break;
                }
            }

            if (!matchedFacility) {
                return res.json({
                    reply:
                        "❌ Facility could not be identified.\n\n" +
                        "Please provide the exact facility name."
                });
            }

            bookingData.facility_id = matchedFacility.id;
        }
        // ==================================================
        // STRICT FIELD VALIDATION
        // ==================================================

        let missingFields = [];

        if (bookingData.resource_type === "facility") {

            if (!bookingData.event_name) missingFields.push("Event Name");
            if (!bookingData.event_facility) missingFields.push("Facility");
            if (!bookingData.requested_by) missingFields.push("Requested By");
            if (!bookingData.organization) missingFields.push("Organization / Department");
            if (!bookingData.contact) missingFields.push("Contact");

            if (!Array.isArray(bookingData.schedules) || bookingData.schedules.length === 0) {
                missingFields.push("Schedule (Date and Time)");
            } else {
                bookingData.schedules.forEach((s, index) => {
                    if (!s.date) missingFields.push(`Schedule ${index + 1} Date`);
                    if (!s.startTime) missingFields.push(`Schedule ${index + 1} Start Time`);
                    if (!s.endTime) missingFields.push(`Schedule ${index + 1} End Time`);
                });
            }
        }

        if (bookingData.resource_type === "vehicle") {

            if (!bookingData.vehicle_id) missingFields.push("Vehicle");
            if (!bookingData.requestor) missingFields.push("Requestor");
            if (!bookingData.department_id) missingFields.push("Department");
            if (!bookingData.schedule?.date)
                missingFields.push("Date");

            if (!bookingData.schedule?.startTime)
                missingFields.push("Start Time");

            if (!bookingData.schedule?.endTime)
                missingFields.push("End Time");
            if (!bookingData.purpose) missingFields.push("Purpose");
            if (!bookingData.destination) missingFields.push("Destination");
        }
        if (bookingData.resource_type === "equipment") {
            bookingData.departmentId = bookingData.department_id;
            bookingData.facilityId = bookingData.facility_id;
            bookingData.timeStart = bookingData.time_start;
            bookingData.timeEnd = bookingData.time_end;

            delete bookingData.department_id;
            delete bookingData.facility_id;
            delete bookingData.time_start;
            delete bookingData.time_end;
        }
        if (bookingData.resource_type === "equipment") {

            if (!Array.isArray(bookingData.equipments) || bookingData.equipments.length === 0)
                missingFields.push("Equipment Selection");

            if (!bookingData.departmentId)
                missingFields.push("Department");

            if (!bookingData.facilityId)
                missingFields.push("Facility");

            if (!Array.isArray(bookingData.dates) || bookingData.dates.length === 0)
                missingFields.push("Date");

            if (!bookingData.timeStart)
                missingFields.push("Start Time");

            if (!bookingData.timeEnd)
                missingFields.push("End Time");

            if (!bookingData.purpose)
                missingFields.push("Purpose");
        }

        // If anything missing → STOP
        if (missingFields.length > 0) {
            return res.json({
                reply:
                    `❌ Your booking request is incomplete.\n\n` +
                    `Missing fields:\n` +
                    missingFields.map(f => `• ${f}`).join("\n") +
                    `\n\nPlease resend the FULL booking request including all required details.`
            });
        }
        // ==================================================
        // FACILITY CONFLICT PRE-CHECK (BEFORE BACKEND CALL)
        // ==================================================

        if (bookingData.resource_type === "facility") {

            for (const s of bookingData.schedules) {

                const conflictCheck = await pool.query(
                    `
            SELECT event_name, starting_time, ending_time
            FROM "Booking"
            WHERE event_facility = $1
              AND event_date = $2
              AND deleted = false
              AND (
                starting_time < $4
                AND ending_time > $3
              )
            LIMIT 1
            `,
                    [
                        bookingData.event_facility,
                        s.date,
                        s.startTime,
                        s.endTime
                    ]
                );

                if (conflictCheck.rowCount > 0) {

                    const conflict = conflictCheck.rows[0];

                    /* ========================================
                       1️⃣ FIND NEXT AVAILABLE DATES (14 DAYS)
                    ======================================== */

                    const availableDates = [];
                    const baseDate = new Date(s.date);

                    for (let i = 1; i <= 14; i++) {
                        const checkDate = new Date(baseDate);
                        checkDate.setDate(baseDate.getDate() + i);

                        const day = checkDate.getDay();

                        // Monday–Friday only
                        if (day === 0 || day === 6) continue;

                        const dateStr = checkDate.toISOString().split("T")[0];

                        const existing = await pool.query(
                            `
            SELECT 1 FROM "Booking"
            WHERE event_facility = $1
              AND event_date = $2
              AND deleted = false
            `,
                            [bookingData.event_facility, dateStr]
                        );

                        if (existing.rowCount === 0) {
                            availableDates.push(
                                `• ${formatPrettyDate(dateStr)} (7:00 AM – 7:00 PM)`
                            );
                        }

                        if (availableDates.length >= 5) break;
                    }

                    /* ========================================
                       2️⃣ FIND ALTERNATE FACILITIES
                    ======================================== */

                    const currentFacility = facilityMap[bookingData.event_facility];

                    let alternateFacilities = [];

                    if (currentFacility) {

                        const altResult = await pool.query(
                            `
            SELECT id, name, capacity
            FROM "Facilities"
            WHERE enabled = true
              AND id != $1
              AND capacity >= $2
            LIMIT 5
            `,
                            [
                                bookingData.event_facility,
                                currentFacility.capacity || 0
                            ]
                        );

                        alternateFacilities = altResult.rows.map(
                            f => `• ${f.name} (capacity ${f.capacity})`
                        );
                    }

                    /* ========================================
                       3️⃣ RETURN SMART RESPONSE
                    ======================================== */

                    return res.json({
                        reply:
                            `❌ Booking conflict detected.\n\n` +
                            `🏢 Facility: ${currentFacility?.name || bookingData.event_facility}\n` +
                            `📅 Date: ${formatPrettyDate(s.date)}\n` +
                            `⏰ Requested Time: ${formatTime12(s.startTime)} – ${formatTime12(s.endTime)}\n\n` +

                            `🔴 Conflicts With:\n` +
                            `• Event: ${conflict.event_name}\n` +
                            `• Time: ${formatTime12(conflict.starting_time.slice(0, 5))} – ${formatTime12(conflict.ending_time.slice(0, 5))}\n\n` +

                            (availableDates.length
                                ? `📆 Other Available Dates (Mon–Fri, 6AM–7PM):\n${availableDates.join("\n")}\n\n`
                                : ``) +

                            (alternateFacilities.length
                                ? `🏢 Other Available Facilities:\n${alternateFacilities.join("\n")}\n\n`
                                : ``) +

                            `Please resend the FULL booking with your preferred option.`
                    });
                }
            }
        }
        // ==================================================
        // VEHICLE CONFLICT PRE-CHECK (BEFORE BACKEND CALL)
        // ==================================================
        if (bookingData.resource_type === "vehicle") {

            const { date, startTime, endTime } = bookingData.schedule;

            const conflictCheck = await pool.query(
                `
                SELECT 1
                FROM "VehicleBooking"
                WHERE vehicle_id = $1
                AND deleted = false
                AND DATE(start_datetime) = $2
                AND (
                    start_datetime::time < $4
                    AND end_datetime::time > $3
                )
                LIMIT 1
                `,
                [
                    bookingData.vehicle_id,
                    date,
                    startTime,
                    endTime
                ]
            );

            if (conflictCheck.rowCount > 0) {

                /* ========================================
                   1️⃣ FIND ALTERNATE DATES (NEXT 14 DAYS)
                ======================================== */

                const availableDates = [];
                const baseDate = new Date(date);

                for (let i = 1; i <= 14; i++) {

                    const checkDate = new Date(baseDate);
                    checkDate.setDate(baseDate.getDate() + i);

                    const day = checkDate.getDay();
                    if (day === 0 || day === 6) continue; // Mon–Fri

                    const isoDate = checkDate.toISOString().split("T")[0];

                    const conflictDateCheck = await pool.query(
                        `
            SELECT 1
            FROM "VehicleBooking"
            WHERE vehicle_id = $1
              AND deleted = false
              AND DATE(start_datetime) = $2
              AND (
                start_datetime::time < $4
                AND end_datetime::time > $3
              )
            LIMIT 1
            `,
                        [bookingData.vehicle_id, isoDate, startTime, endTime]
                    );

                    if (conflictDateCheck.rowCount === 0) {
                        availableDates.push(
                            `• ${formatPrettyDate(isoDate)} (${formatTime12(startTime)} – ${formatTime12(endTime)})`
                        );
                    }

                    if (availableDates.length >= 5) break;
                }

                /* ========================================
                   2️⃣ FIND ALTERNATE VEHICLES
                ======================================== */

                const alternateVehicles = [];

                const allVehicles = await pool.query(
                    `SELECT id, vehicle_name FROM "Vehicles" WHERE enabled = true`
                );

                for (const v of allVehicles.rows) {

                    if (v.id === bookingData.vehicle_id) continue;

                    const vehicleConflict = await pool.query(
                        `
            SELECT 1
            FROM "VehicleBooking"
            WHERE vehicle_id = $1
              AND deleted = false
              AND DATE(start_datetime) = $2
              AND (
                start_datetime::time < $4
                AND end_datetime::time > $3
              )
            LIMIT 1
            `,
                        [v.id, date, startTime, endTime]
                    );

                    if (vehicleConflict.rowCount === 0) {
                        alternateVehicles.push(`• ${v.vehicle_name}`);
                    }

                    if (alternateVehicles.length >= 5) break;
                }

                /* ========================================
                   3️⃣ RETURN CLEAN RESPONSE
                ======================================== */

                const vehicleName = vehicleMap[bookingData.vehicle_id] || `Vehicle ${bookingData.vehicle_id}`;

                return res.json({
                    reply:
                        `❌ Vehicle booking conflict detected.\n\n` +

                        `🚗 Vehicle: ${vehicleName}\n` +
                        `📅 Date: ${formatPrettyDate(date)}\n` +
                        `⏰ Requested Time: ${formatTime12(startTime)} – ${formatTime12(endTime)}\n\n` +

                        (availableDates.length
                            ? `📆 Other Available Dates:\n${availableDates.join("\n")}\n\n`
                            : ``) +

                        (alternateVehicles.length
                            ? `🚗 Other Available Vehicles:\n${alternateVehicles.join("\n")}\n\n`
                            : ``) +

                        `Please resend the FULL booking with your preferred option.`
                });
            }
        }
        // ==================================================
        // EQUIPMENT CONFLICT PRE-CHECK
        // ==================================================
        if (bookingData.resource_type === "equipment") {

            const { dates, timeStart, timeEnd } = bookingData;

            for (const eq of bookingData.equipments) {

                for (const date of dates) {

                    const conflictCheck = await pool.query(
                        `
                SELECT 1
                FROM "Equipment"
                WHERE equipment_type_id = $1
                  AND $2 = ANY(dates)
                  AND (
                      time_start < $4
                      AND time_end > $3
                  )
                LIMIT 1
                `,
                        [eq.equipmentId, date, timeStart, timeEnd]
                    );

                    if (conflictCheck.rowCount > 0) {

                        /* ========================================
                           1️⃣ FIND ALTERNATE DATES
                        ======================================== */

                        const availableDates = [];
                        const baseDate = new Date(date);

                        for (let i = 1; i <= 14; i++) {

                            const checkDate = new Date(baseDate);
                            checkDate.setDate(baseDate.getDate() + i);

                            const isoDate = checkDate.toISOString().split("T")[0];

                            const checkConflict = await pool.query(
                                `
                        SELECT 1
                        FROM "Equipment"
                        WHERE equipment_type_id = $1
                          AND $2 = ANY(dates)
                        LIMIT 1
                        `,
                                [eq.equipmentId, isoDate]
                            );

                            if (checkConflict.rowCount === 0) {
                                availableDates.push(
                                    `• ${formatPrettyDate(isoDate)} (${formatTime12(timeStart)} – ${formatTime12(timeEnd)})`
                                );
                            }

                            if (availableDates.length >= 5) break;
                        }

                        /* ========================================
                           2️⃣ FIND ALTERNATE EQUIPMENTS
                        ======================================== */

                        const alternateEquipments = [];

                        const allEquipments = await pool.query(
                            `SELECT id, name FROM "Equipments" WHERE enabled = true`
                        );

                        for (const e of allEquipments.rows) {

                            if (e.id === eq.equipmentId) continue;

                            const altConflict = await pool.query(
                                `
                        SELECT 1
                        FROM "Equipment"
                        WHERE equipment_type_id = $1
                          AND $2 = ANY(dates)
                          AND (
                              time_start < $4
                              AND time_end > $3
                          )
                        LIMIT 1
                        `,
                                [e.id, date, timeStart, timeEnd]
                            );

                            if (altConflict.rowCount === 0) {
                                alternateEquipments.push(`• ${e.name}`);
                            }

                            if (alternateEquipments.length >= 5) break;
                        }

                        const equipmentNameResult = await pool.query(
                            `SELECT name FROM "Equipments" WHERE id = $1`,
                            [eq.equipmentId]
                        );

                        const equipmentName =
                            equipmentNameResult.rows[0]?.name || "Selected Equipment";

                        return res.json({
                            reply:
                                `❌ Booking conflict detected.\n\n` +

                                `🎥 Equipment: ${equipmentName}\n` +
                                `📅 Date: ${formatPrettyDate(date)}\n` +
                                `⏰ Requested Time: ${formatTime12(timeStart)} – ${formatTime12(timeEnd)}\n\n` +

                                `🔴 Conflicts With:\n` +
                                `• Time: ${formatTime12(timeStart)} – ${formatTime12(timeEnd)}\n\n` +

                                (availableDates.length
                                    ? `📆 Other Available Dates:\n${availableDates.join("\n")}\n\n`
                                    : ``) +

                                (alternateEquipments.length
                                    ? `🎛 Other Available Equipments:\n${alternateEquipments.join("\n")}\n\n`
                                    : ``) +

                                `Please resend the FULL booking with your preferred option.`
                        });
                    }
                }
            }
        }

        try {
            let endpoint = "";

            if (bookingData.resource_type === "facility")
                endpoint = "/api/create-booking";
            if (bookingData.resource_type === "vehicle")
                endpoint = "/api/create-vehicle-booking";
            if (bookingData.resource_type === "equipment")
                endpoint = "/api/create-equipment-booking";
            if (!endpoint) throw new Error("Unknown resource type");
            /* ==================================================
               EQUIPMENT NAME → EQUIPMENT ID (DYNAMIC)
            ================================================== */

            // if (
            //     bookingData.resource_type === "equipment" &&
            //     (!bookingData.equipment_type_id || isNaN(Number(bookingData.equipment_type_id)))
            // ) {
            //     const equipmentsResult = await pool.query(
            //         `SELECT id, name FROM "Equipments" WHERE enabled = true`
            //     );

            //     const messageLower = message.toLowerCase();

            //     for (const eq of equipmentsResult.rows) {
            //         if (messageLower.includes(eq.name.toLowerCase())) {
            //             bookingData.equipment_type_id = eq.id;
            //             break;
            //         }
            //     }
            // }

            // if (
            //     bookingData.resource_type === "equipment" &&
            //     (!bookingData.equipment_type_id || isNaN(Number(bookingData.equipment_type_id)))
            // ) {
            //     throw new Error(
            //         "Equipment could not be identified. Please specify the equipment name."
            //     );
            // }
            /* ==================================================
               FACILITY NAME → FACILITY ID (DYNAMIC, SUPPORTS NUMBERS)
            ================================================== */
            if (bookingData.resource_type === "facility") {

                const facilitiesResult = await pool.query(
                    `SELECT id, name FROM "Facilities" WHERE enabled = true`
                );

                const messageLower = message.toLowerCase();

                let matchedFacility = null;

                for (const f of facilitiesResult.rows) {

                    const facilityName = f.name.toLowerCase();

                    const regex = new RegExp(
                        `\\b${facilityName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`,
                        "i"
                    );

                    if (regex.test(messageLower)) {
                        matchedFacility = f;
                        break;
                    }
                }

                if (!matchedFacility) {
                    return res.json({
                        reply:
                            "❌ Facility could not be identified.\n\n" +
                            "Please provide the exact facility name (e.g., M116, HE Hall, Gymnasium)."
                    });
                }

                // 🔥 ALWAYS override AI value
                bookingData.event_facility = matchedFacility.id;
            }

            if (
                bookingData.resource_type === "facility" &&
                (!bookingData.event_facility)
            ) {
                throw new Error(
                    "Facility could not be identified. Please specify the exact facility name (e.g., M116, N-206, Gymnasium)."
                );
            }

            if (bookingData.resource_type === "facility") {
                bookingData.creator_id = 1;
                bookingData.requested_by ||= "AI";
                if (!bookingData.organization) bookingData.organization = "N/A";
                if (!bookingData.contact) bookingData.contact = "N/A";
            }
            /* ==================================================
               VEHICLE NAME → VEHICLE ID (DYNAMIC, NO HARD-CODE)
            ================================================== */


            if (
                bookingData?.resource_type === "vehicle" &&
                (!bookingData.vehicle_id || isNaN(Number(bookingData.vehicle_id)))
            ) {
                throw new Error(
                    "Vehicle could not be identified. Please specify the vehicle name."
                );
            }
            if (bookingData.resource_type === "vehicle") {

                const { date, startTime, endTime } = bookingData.schedule;

                bookingData.start_datetime = `${date}T${startTime}`;
                bookingData.end_datetime = `${date}T${endTime}`;

                delete bookingData.schedule;
            }
            const response = await axios.post(
                `http://localhost:5000${endpoint}`,
                bookingData
            );

            return res.json({
                reply: "✅ Booking successfully created.",
                result: response.data
            });
        } catch (err) {
            const data = err.response?.data || {};
            let reply = `❌ ${data.message || err.message}`;

            // 1️⃣ Suggest other time slots (same date)
            if (Array.isArray(data.suggestedSlots) && data.suggestedSlots.length) {
                reply += `\n\n⏰ Other available time slots:`;
                data.suggestedSlots.forEach(s => {
                    reply += `\n• ${s.start} – ${s.end}`;
                });
            }

            // 2️⃣ Suggest next available date
            if (data.nextAvailableDate) {
                reply += `\n\n📅 Next available date: ${data.nextAvailableDate}`;
            }

            // 3️⃣ Suggest similar-capacity facilities
            if (bookingData?.resource_type === "facility" && bookingData.event_facility) {
                const target = facilityMap[bookingData.event_facility];

                if (target) {
                    const alternatives = Object.values(facilityMap)
                        .filter(f =>
                            f.id !== target.id &&
                            Math.abs(f.capacity - target.capacity) <= 150
                        )
                        .slice(0, 3);

                    if (alternatives.length) {
                        reply += `\n\n🏢 Similar facilities you can try:`;
                        alternatives.forEach(f => {
                            reply += `\n• ${f.name} (capacity ${f.capacity})`;
                        });
                    }
                }
            }
            // 4️⃣ Check alternative facilities with similar capacity (same date & time)
            if (
                bookingData?.resource_type === "facility" &&
                bookingData.event_facility &&
                err.response?.data?.requested
            ) {
                const { date, start, end } = err.response.data.requested;
                const target = facilityMap[bookingData.event_facility];

                if (target) {
                    const candidates = Object.values(facilityMap).filter(f =>
                        f.id !== target.id &&
                        Math.abs(f.capacity - target.capacity) <= 150
                    );

                    const availableAlternatives = [];

                    for (const f of candidates) {
                        const conflictCheck = await pool.query(
                            `
        SELECT 1
        FROM "Booking"
        WHERE event_facility = $1
          AND event_date = $2
          AND deleted = false
          AND (
            starting_time < $4
            AND ending_time > $3
          )
        LIMIT 1
        `,
                            [f.id, date, start, end]
                        );

                        if (conflictCheck.rowCount === 0) {
                            availableAlternatives.push(f);
                        }
                    }

                    if (availableAlternatives.length > 0) {
                        reply += `\n\n🏢 Other available facilities with similar capacity:`;
                        availableAlternatives.slice(0, 3).forEach(f => {
                            reply += `\n• ${f.name} (capacity ${f.capacity})`;
                        });
                    } else {
                        reply += `\n\nℹ️ No other facilities with similar capacity are available at this time.`;
                    }
                }
            }
            // 5️⃣ Suggest other dates where the SAME facility is available
            if (
                bookingData?.resource_type === "facility" &&
                bookingData.event_facility &&
                err.response?.data?.requested
            ) {
                const { date, start, end } = err.response.data.requested;
                const facilityId = bookingData.event_facility;

                // Look ahead N days (keep small to avoid heavy queries)
                const LOOKAHEAD_DAYS = 7;
                const baseDate = new Date(date);
                const availableDates = [];

                for (let i = 1; i <= LOOKAHEAD_DAYS; i++) {

                    const d = new Date(baseDate);   // ✅ recreate each time
                    d.setDate(d.getDate() + i);     // ✅ increment properly

                    const isoDate = toLocalISO(d);  // ✅ safe local date

                    const conflictCheck = await pool.query(
                        `
        SELECT 1
        FROM "Booking"
        WHERE event_facility = $1
          AND event_date = $2
          AND deleted = false
          AND (
            starting_time < $4
            AND ending_time > $3
          )
        LIMIT 1
        `,
                        [facilityId, isoDate, start, end]
                    );

                    if (conflictCheck.rowCount === 0) {
                        availableDates.push(isoDate);
                    }

                    if (availableDates.length >= 3) break;
                }


                if (availableDates.length > 0) {
                    reply += `\n\n📅 Other available dates for this facility:`;
                    availableDates.forEach(d => {
                        // Since we checked conflicts using the SAME requested time,
                        // the facility is guaranteed free for that time range
                        reply += `\n• ${d} (available for ${start} – ${end})`;
                    });
                } else {
                    reply += `\n\nℹ️ No other available dates for this facility in the next ${LOOKAHEAD_DAYS} days.`;
                }
            }

            return res.json({ reply });
        }

    }

    /* ==================================================
       NORMAL CHAT
    ================================================== */

    return res.json({ reply: aiReply });
});

module.exports = router;
