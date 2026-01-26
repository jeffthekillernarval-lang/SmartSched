const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.post('/', async (req, res) => {
    const {
        schedules,
        event_name,
        event_facility,
        requested_by,
        organization,
        contact,
        creator_id,
        reservation,
        insider,
    } = req.body;

    if (!Array.isArray(schedules) || schedules.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No schedules provided'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const insertedIds = [];

        for (const s of schedules) {
            if (!s.date || s.date.trim() === '') {
                throw new Error('Invalid or missing date in schedule.');
            }

            console.log('Debug: Schedule date:', s.date); // Debug log to check the date value

            const result = await client.query(
                `
                INSERT INTO "Booking" (
                    event_date,
                    starting_time,
                    ending_time,
                    event_name,
                    event_facility,
                    requested_by,
                    organization,
                    contact,
                    creator_id,
                    status,
                    reservation,
                    insider,
                    booking_fee
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9,
                    'pending',
                    $10,
                    $11,
                    0
                )
                RETURNING id
                `,
                [
                    s.date, // Ensure this is in the correct format (YYYY-MM-DD)
                    s.startTime,
                    s.endTime,
                    event_name,
                    event_facility,
                    requested_by,
                    organization,
                    contact,
                    creator_id,
                    reservation,
                    insider
                ]
            );

            insertedIds.push(result.rows[0].id);
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            ids: insertedIds,
            message: `${insertedIds.length} bookings created`,
            booking: {
                id: insertedIds[0] // ✅ first booking ID
            }

        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create booking error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    } finally {
        client.release();
    }
});

module.exports = router;
