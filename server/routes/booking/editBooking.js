const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.put('/:id', async (req, res) => {
    const {
        schedules,
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

    if (!Array.isArray(schedules) || schedules.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Schedules are required'
        });
    }

    const first = schedules[0];

    try {
        await pool.query(
            `
            UPDATE "Booking"
            SET
                event_name = $1,
                event_facility = $2,
                requested_by = $3,
                organization = $4,
                contact = $5,
                booking_fee = $6,
                reservation = $7,
                insider = $8,
                event_date = $9,
                starting_time = $10,
                ending_time = $11,
                schedules = $12
            WHERE id = $13
            `,
            [
                event_name,
                Number(event_facility),
                requested_by,
                organization,
                contact,
                booking_fee,
                bookingType === 'reservation',
                userType === 'employee',
                first.date,
                first.startTime,
                first.endTime,
                JSON.stringify(schedules),
                id
            ]
        );

        res.json({
            success: true,
            message: 'Booking updated successfully'
        });
    } catch (err) {
        console.error('Edit booking error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});




module.exports = router;
