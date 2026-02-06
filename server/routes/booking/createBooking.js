const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

/* ----------------------------------
   TIME HELPERS
---------------------------------- */
function toMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

function toTime(m) {
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

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
            if (!s.date || !s.startTime || !s.endTime) {
                throw new Error('Invalid or missing schedule data.');
            }

            /* ===============================
               FETCH DAY BOOKINGS (FOR SUGGESTION)
            ================================ */
            const dayBookings = await client.query(
                `
                SELECT starting_time, ending_time
                FROM "Booking"
                WHERE event_facility = $1
                  AND event_date = $2
                  AND deleted = false
                  AND status IN ('Pending', 'Approved')
                ORDER BY starting_time
                `,
                [facilityId, s.date]
            );

            /* ===============================
               CONFLICT CHECK
            ================================ */
            const conflictCheck = await client.query(
                `
                SELECT 1
                FROM "Booking"
                WHERE event_facility = $1
                  AND event_date = $2
                  AND deleted = false
                  AND status IN ('Pending', 'Approved')
                  AND ($3 < ending_time AND $4 > starting_time)
                LIMIT 1
                `,
                [facilityId, s.date, s.startTime, s.endTime]
            );

            /* ===============================
               COMPUTE AVAILABLE SLOT (IF CONFLICT)
            ================================ */
            if (conflictCheck.rowCount > 0) {
                const OPEN = 6 * 60;   // 06:00
                const CLOSE = 22 * 60; // 22:00

                const requestedDuration =
                    toMinutes(s.endTime) - toMinutes(s.startTime);

                let cursor = OPEN;
                let suggestion = null;

                for (const b of dayBookings.rows) {
                    const start = toMinutes(b.starting_time);
                    const end = toMinutes(b.ending_time);

                    if (start - cursor >= requestedDuration) {
                        suggestion = {
                            start: toTime(cursor),
                            end: toTime(cursor + requestedDuration)
                        };
                        break;
                    }

                    cursor = Math.max(cursor, end);
                }

                if (!suggestion && CLOSE - cursor >= requestedDuration) {
                    suggestion = {
                        start: toTime(cursor),
                        end: toTime(cursor + requestedDuration)
                    };
                }

                const facilityResult = await client.query(
                    `SELECT name FROM "Facilities" WHERE id = $1`,
                    [facilityId]
                );

                const facilityName =
                    facilityResult.rows[0]?.name || `Facility ${facilityId}`;

                let suggestionText = suggestion
                    ? `\n✅ Available time: ${suggestion.start} to ${suggestion.end}`
                    : `\n❌ No other available time slots on this date.`;

                throw new Error(
                    `Conflict detected for ${facilityName} on ${s.date} from ${s.startTime} to ${s.endTime}.${suggestionText}`
                );
            }
            /* ===============================
          ORGANIZATION → AFFILIATION ID
       ================================ */
            let organizationValue = organization;

            // If organization is NOT numeric, resolve it from Affiliations
            if (organization && isNaN(Number(organization))) {
                const affiliationResult = await client.query(
                    `
        SELECT id
        FROM "Affiliations"
        WHERE enabled = true
          AND (
              LOWER(abbreviation) = LOWER($1)
              OR LOWER(meaning) = LOWER($1)
          )
        LIMIT 1
        `,
                    [organization]
                );

                if (affiliationResult.rowCount > 0) {
                    organizationValue = affiliationResult.rows[0].id;
                }
            }


            /* ===============================
               INSERT BOOKING
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
                    organizationValue,
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
            message: `${insertedIds.length} booking(s) created`
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
