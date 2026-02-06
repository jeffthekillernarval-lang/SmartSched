const express = require("express");
const router = express.Router();
const axios = require("axios");
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});
// ONLY CREATE IS AVAILABLE  for system limitations and to avoid system malfunctions with data mishandling
require("dotenv").config();

router.post("/", async (req, res) => {
    const { message, bookings = {}, currentDateTime } = req.body;

    /* ------------------------------------
       FORMAT EXISTING BOOKINGS (OLD STYLE)
    ------------------------------------ */
    // Fetch facility lookup (id → name)
    const facilityResult = await pool.query(
        `SELECT id, name FROM "Facilities" WHERE enabled = true`
    );

    const facilityMap = {};
    facilityResult.rows.forEach(f => {
        facilityMap[f.id] = f.name;
    });

    const formattedBookings = [];

    if (Array.isArray(bookings.facilities)) {
        bookings.facilities.forEach(b => {
            const facilityName =
                facilityMap[b.facility] || `Facility ${b.facility}`;

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
            formattedBookings.push(
                `- Vehicle: ${v.vehicle_Type} on ${v.date} (${v.purpose})`
            );
        });
    }

    if (Array.isArray(bookings.equipments)) {
        bookings.equipments.forEach(e => {
            formattedBookings.push(
                `- Equipment: ${e.equipment_name} on ${e.date} (qty ${e.quantity})`
            );
        });
    }

    /* ------------------------------------
       SYSTEM PROMPT (MINIMAL, STABLE)
    ------------------------------------ */
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
  "equipments": [{ "equipmentId": "number", "quantity": "number" }],
  "departmentId": "number",
  "facilityId": "number",
  "dates": ["YYYY-MM-DD"],
  "purpose": "",
  "timeStart": "HH:MM",
  "timeEnd": "HH:MM"
}

Current time: ${currentDateTime}

Existing bookings:
${formattedBookings.join("\n") || "None"}
`;

    /* ------------------------------------
       COHERE CHAT (OLD WORKING STYLE)
    ------------------------------------ */
    let aiReply = "";
    try {
        const cohereResponse = await axios.post(
            "https://api.cohere.ai/v1/chat",
            {
                message,
                preamble: systemPrompt
            },
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

    /* ------------------------------------
       PARSE JSON (OLD SAFE METHOD)
    ------------------------------------ */
    const jsonMatch = aiReply.match(/\{[\s\S]*\}/);
    let bookingData = null;

    if (jsonMatch) {
        try {
            bookingData = JSON.parse(jsonMatch[0]);
        } catch { }
    }

    /* ------------------------------------
       HANDLE REAL BOOKING CREATION
    ------------------------------------ */
    if (bookingData?.intent === "create_booking") {
        try {
            let endpoint = "";

            if (bookingData.resource_type === "facility")
                endpoint = "/api/create-booking";

            if (bookingData.resource_type === "vehicle")
                endpoint = "/api/create-vehicle-booking";

            if (bookingData.resource_type === "equipment")
                endpoint = "/api/create-equipment-booking";

            if (!endpoint) throw new Error("Unknown resource type");

            if (bookingData.resource_type === "facility") {
                bookingData.creator_id = 1;
                bookingData.requested_by = bookingData.requested_by || "AI";
                bookingData.organization = bookingData.organization || "N/A";
                bookingData.contact = bookingData.contact || "N/A";
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
            return res.json({
                reply:
                    "❌ Failed to create booking.\n" +
                    (err.response?.data?.message || err.message)
            });
        }
    }

    /* ------------------------------------
       NORMAL CHAT (UNCHANGED)
    ------------------------------------ */
    return res.json({ reply: aiReply });
});

module.exports = router;
