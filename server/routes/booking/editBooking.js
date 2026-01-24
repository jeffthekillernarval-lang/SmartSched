const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.put('/:id', async (req, res) => {
    const {
        schedules, // Expecting an array of schedules
        event_name,
        event_facility,
        requested_by,
        organization,
        contact,
        booking_fee,
        bookingType,
        userType
    } = req.body;
    const { id } = req.params;
    console.log('Schedules received in request:', schedules); // Debugging: Check schedules in the request

    try {
        // Update the booking with the schedules stored as JSONB
        await pool.query(
            `UPDATE "Booking"
             SET event_name = $1, 
                 event_facility = $2,
                 requested_by = $3,
                 organization = $4,
                 contact = $5,
                 booking_fee = $6,
                 reservation = $7,
                 insider = $8,
                 schedules = $9
             WHERE id = $10`,
            [
                event_name,
                event_facility,
                requested_by,
                organization,
                contact,
                booking_fee,
                bookingType === 'reservation',
                userType === 'employee', // insider
                JSON.stringify(schedules), // Store schedules as JSONB
                id
            ]
        );

        res.json({ success: true, message: 'Booking updated successfully' });
    } catch (err) {
        console.error('Edit booking error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});



module.exports = router;
