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
        const facilityId = Number(event_facility);

        for (const s of schedules) {
            if (!s.date || s.date.trim() === '') {
                throw new Error('Invalid or missing date in schedule.');
            }

            /* ===============================
               🚨 CONFLICT CHECK (SERVER-SIDE)
            ================================ */
            const conflictCheck = await client.query(
                `
                SELECT 1
                FROM "Booking"
                WHERE event_facility = $1
                  AND event_date = $2
                  AND deleted = false
                  AND status IN ('Pending', 'Approved')
                  AND (
                        $3 < ending_time
                    AND $4 > starting_time
                  )
                LIMIT 1
                `,
                [
                    facilityId,
                    s.date,
                    s.startTime,
                    s.endTime
                ]
            );

            if (conflictCheck.rowCount > 0) {
                throw new Error(
                    `Conflict detected for facility ${facilityId} on ${s.date} from ${s.startTime} to ${s.endTime}`
                );
            }

            /* ===============================
               ✅ INSERT (SAFE)
            ================================ */
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
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,'Pending',$10,$11,0
                )
                RETURNING id
                `,
                [
                    s.date,
                    s.startTime,
                    s.endTime,
                    event_name,
                    facilityId,
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
            bookings: insertedIds,
            message: `${insertedIds.length} bookings created`
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create booking error:', err);

        res.status(409).json({
            success: false,
            message: err.message
        });
    } finally {
        client.release();
    }
});

module.exports = router;
