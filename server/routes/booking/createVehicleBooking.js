const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

router.post('/', async (req, res) => {
    const { message, bookings = {}, currentDateTime } = req.body;

    const facilityBookings = Array.isArray(bookings.facilities) ? bookings.facilities : [];
    const vehicleBookings = Array.isArray(bookings.vehicles) ? bookings.vehicles : [];

    // --- FORMAT FACILITY BOOKINGS ---
    const formattedFacilities = facilityBookings.map(b => {
        const [year, month, day] = (b.date || '').split('-');
        const dateObj = new Date(`${year}-${month}-${day}`);
        dateObj.setDate(dateObj.getDate() + 1);
        const newDate = dateObj.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        const formatTime = (time) => {
            if (!time) return "";
            const [h, m] = time.split(':');
            let hour = parseInt(h, 10);
            const ampm = hour >= 12 ? "PM" : "AM";
            hour = hour % 12 || 12;
            return `${hour}:${m} ${ampm}`;
        };

        return `- 📅 ${b.name} (${b.requestedBy}) at ${b.facility} on ${newDate} from ${formatTime(b.startTime)} to ${formatTime(b.endTime)}`;
    }).join('\n');

    // --- FORMAT VEHICLE BOOKINGS ---
    const formattedVehicles = vehicleBookings.map(v => {
        const [year, month, day] = (v.date || '').split('-');
        const dateObj = new Date(`${year}-${month}-${day}`);
        dateObj.setDate(dateObj.getDate() + 1);
        const newDate = dateObj.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        return `- 🚗 Vehicle ID ${v.vehicle_id} for ${v.purpose} on ${newDate} requested by ${v.requestor} (Department ID ${v.department_id})`;
    }).join('\n');

    const formattedResponse = [
        formattedFacilities ? `### Facility Bookings\n${formattedFacilities}` : '',
        formattedVehicles ? `### Vehicle Bookings\n${formattedVehicles}` : ''
    ].filter(Boolean).join('\n\n');

    // --- AI SYSTEM PROMPT ---
    const systemPrompt = `
You are a helpful assistant for a facility and vehicle booking system.

The current date and time is: ${currentDateTime}

You can both answer questions AND create new bookings.

If the user says “create booking” without specifying the type, ask:
"Would you like to book a **facility** or a **vehicle**?"

If they want a facility booking, respond ONLY with JSON in this format:
{
  "intent": "create_facility_booking",
  "event_name": "<string>",
  "event_date": "<YYYY-MM-DD>",
  "starting_time": "<HH:MM>",
  "ending_time": "<HH:MM>",
  "event_facility": "<string>",
  "requested_by": "<string>",
  "organization": "<string>",
  "contact": "<string>"
}

If they want a vehicle booking, respond ONLY with JSON in this format:
{
  "intent": "create_vehicle_booking",
  "vehicle_id": "<number>",
  "requestor": "<string>",
  "department_id": "<number>",
  "date": "<YYYY-MM-DD>",
  "purpose": "<string>"
}
Never use "create_booking" — always use either "create_facility_booking" or "create_vehicle_booking".
Otherwise, respond normally in Markdown.

Here are the current bookings:
${formattedResponse}
`;

    try {
        // 🧠 Send to Cohere
        const cohereResponse = await axios.post(
            'https://api.cohere.ai/v1/chat',
            {
                message,
                chat_history: [
                    { role: "SYSTEM", message: systemPrompt },
                    { role: "USER", message }
                ],
                stream: false,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        const aiReply = cohereResponse.data.text?.trim() || "";
        console.log("🤖 AI raw reply:", aiReply);

        // Try to detect JSON in AI response
        const jsonMatch = aiReply.match(/\{[\s\S]*\}/);
        let bookingData = null;
        if (jsonMatch) {
            try {
                bookingData = JSON.parse(jsonMatch[0]);
            } catch (err) {
                console.warn("⚠️ JSON parse failed:", err.message);
            }
        }

        // 🚀 Handle Facility Booking Creation
        if (bookingData?.intent === "create_facility_booking") {
            console.log("📦 Creating facility booking:", bookingData);

            const requiredFields = [
                "event_name",
                "event_date",
                "starting_time",
                "ending_time",
                "event_facility",
                "requested_by",
                "organization",
                "contact"
            ];

            const missing = requiredFields.filter(f => !bookingData[f]);
            if (missing.length > 0) {
                return res.json({
                    reply: `I still need these details to create your facility booking:\n${missing.map(f => `- ${f.replace(/_/g, " ")}`).join("\n")}`
                });
            }

            const backendURL = `${process.env.BASE_URL || "http://localhost:5000"}/api/create-booking`;
            try {
                const response = await axios.post(backendURL, {
                    event_name: bookingData.event_name,
                    event_date: bookingData.event_date,
                    starting_time: bookingData.starting_time,
                    ending_time: bookingData.ending_time,
                    event_facility: bookingData.event_facility,
                    requested_by: bookingData.requested_by,
                    organization: bookingData.organization,
                    contact: bookingData.contact,
                    creator_id: 1
                });
                return res.json({
                    reply: `✅ Facility booking created successfully!\n\n**Event:** ${bookingData.event_name}\n**Date:** ${bookingData.event_date}\n**Time:** ${bookingData.starting_time}–${bookingData.ending_time}\n**Facility:** ${bookingData.event_facility}`,
                    result: response.data
                });
            } catch (err) {
                console.error("❌ Facility booking failed:", err.message);
                return res.json({ reply: "❌ Failed to create facility booking. Please try again." });
            }
        }

        // 🚗 Handle Vehicle Booking Creation
        if (bookingData?.intent === "create_vehicle_booking") {
            console.log("🚗 Creating vehicle booking:", bookingData);

            const requiredFields = [
                "vehicle_Type",
                "requestor",
                "department",
                "date",
                "purpose"
            ];

            const missing = requiredFields.filter(f => !bookingData[f]);
            if (missing.length > 0) {
                return res.json({
                    reply: `I still need these details to create your vehicle booking:\n${missing.map(f => `- ${f.replace(/_/g, " ")}`).join("\n")}`
                });
            }

            const backendURL = `${process.env.BASE_URL || "http://localhost:5000"}/api/vehicle-booking`;
            try {
                const response = await axios.post(backendURL, {
                    vehicle_id: Number(bookingData.vehicle_id),
                    requestor: bookingData.requestor,
                    department_id: Number(bookingData.department_id),
                    date: bookingData.date,
                    purpose: bookingData.purpose,
                    booker_id: bookingData.booker_id || 1,
                    deleted: false
                    // ❌ DO NOT send status
                });

                return res.json({
                    reply: `✅ Vehicle booking created successfully!\n\n**Vehicle:** ${bookingData.vehicle_Type}\n**Date:** ${bookingData.date}\n**Purpose:** ${bookingData.purpose}\n**Requestor:** ${bookingData.requestor} (${bookingData.department})`,
                    result: response.data
                });
            } catch (err) {
                console.error("❌ Vehicle booking failed:", err.message);
                return res.json({ reply: "❌ Failed to create vehicle booking. Please try again." });
            }
        }

        // 🧠 Otherwise, just reply normally
        res.json({ reply: aiReply });

    } catch (error) {
        console.error('❌ Cohere API error:', error.message);
        res.status(500).json({ error: 'Failed to fetch reply from AI.' });
    }
});

module.exports = router;
