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
    const formattedBookings = [];

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
              AND $2 = ANY(dates)
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
  Date(s): ${Array.isArray(b.dates) ? b.dates.join(", ") : "N/A"}
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
  "dates": ["YYYY-MM-DD"],
  "purpose": "",
  "destination": ""
}
  EQUIPMENT:
{
  "intent": "create_booking",
  "resource_type": "equipment",
  "equipments": [{ "equipmentId": "number", "quantity": 1 }]
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
        try {
            let endpoint = "";

            if (bookingData.resource_type === "facility")
                endpoint = "/api/create-booking";
            if (bookingData.resource_type === "vehicle")
                endpoint = "/api/create-vehicle-booking";

            if (!endpoint) throw new Error("Unknown resource type");
            /* ==================================================
               EQUIPMENT NAME → EQUIPMENT ID (DYNAMIC)
            ================================================== */

            if (
                bookingData.resource_type === "equipment" &&
                (!bookingData.equipment_type_id || isNaN(Number(bookingData.equipment_type_id)))
            ) {
                const equipmentsResult = await pool.query(
                    `SELECT id, name FROM "Equipments" WHERE enabled = true`
                );

                const messageLower = message.toLowerCase();

                for (const eq of equipmentsResult.rows) {
                    if (messageLower.includes(eq.name.toLowerCase())) {
                        bookingData.equipment_type_id = eq.id;
                        break;
                    }
                }
            }

            if (
                bookingData.resource_type === "equipment" &&
                (!bookingData.equipment_type_id || isNaN(Number(bookingData.equipment_type_id)))
            ) {
                throw new Error(
                    "Equipment could not be identified. Please specify the equipment name."
                );
            }
            /* ==================================================
               FACILITY NAME → FACILITY ID (DYNAMIC, SUPPORTS NUMBERS)
            ================================================== */
            if (
                bookingData.resource_type === "facility" &&
                (!bookingData.event_facility || isNaN(Number(bookingData.event_facility)))
            ) {
                const facilitiesResult = await pool.query(
                    `SELECT id, name FROM "Facilities" WHERE enabled = true`
                );

                const messageLower = message.toLowerCase();

                for (const f of facilitiesResult.rows) {
                    const facilityName = f.name.toLowerCase();

                    // Exact match OR word-boundary-safe match
                    const regex = new RegExp(`\\b${facilityName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");

                    if (regex.test(messageLower)) {
                        bookingData.event_facility = f.id;
                        break;
                    }
                }
            }
            if (
                bookingData.resource_type === "facility" &&
                (!bookingData.event_facility || isNaN(Number(bookingData.event_facility)))
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
                bookingData.resource_type === "vehicle" &&
                (!bookingData.vehicle_id || isNaN(Number(bookingData.vehicle_id)))
            ) {
                // Fetch all enabled vehicles
                const vehiclesResult = await pool.query(
                    `SELECT id, vehicle_name FROM "Vehicles" WHERE enabled = true`
                );

                const messageLower = message.toLowerCase();

                for (const v of vehiclesResult.rows) {
                    const name = v.vehicle_name.toLowerCase();

                    // Simple but effective name match
                    if (messageLower.includes(name)) {
                        bookingData.vehicle_id = v.id;
                        break;
                    }
                }
            }
            if (
                bookingData.resource_type === "vehicle" &&
                (!bookingData.vehicle_id || isNaN(Number(bookingData.vehicle_id)))
            ) {
                throw new Error(
                    "Vehicle could not be identified. Please specify the vehicle name."
                );
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
                    const d = new Date(baseDate);
                    d.setDate(d.getDate() + i);
                    const isoDate = d.toISOString().slice(0, 10);

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
