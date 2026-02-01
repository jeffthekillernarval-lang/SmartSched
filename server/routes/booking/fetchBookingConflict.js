const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

/**
 * GET /api/fetch-booking-conflicts
 * Required query params:
 *  - facility_id
 *  - event_date (YYYY-MM-DD)
 *  - start_time (HH:mm)
 *  - end_time (HH:mm)
 * Optional:
 *  - exclude_id (for edit mode)
 */
router.get('/', async (req, res) => {
    const {
        facility_id,
        event_date,
        start_time,
        end_time,
        exclude_id
    } = req.query;

    // 🔒 Validate required params
    if (!facility_id || !event_date || !start_time || !end_time) {
        return res.status(400).json({
            success: false,
            message: 'facility_id, event_date, start_time, and end_time are required',
        });
    }

    try {
        const params = [
            facility_id,
            event_date,
            start_time,
            end_time
        ];

        let excludeSql = '';
        if (exclude_id) {
            excludeSql = 'AND id != $5';
            params.push(exclude_id);
        }

        const result = await pool.query(
            `
            SELECT *
            FROM "Booking"
            WHERE deleted = false
              AND event_facility = $1
              AND event_date = $2
              AND (
                    starting_time < $4
                AND ending_time   > $3
              )
              ${excludeSql}
            ORDER BY starting_time ASC
            `,
            params
        );

        res.json({
            success: true,
            conflicts: result.rows,
        });
    } catch (err) {
        console.error('Fetch booking conflicts error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to check booking conflicts',
            error: err.message,
        });
    }
});

module.exports = router;
