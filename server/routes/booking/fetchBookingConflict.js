const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// GET /api/fetch-booking-conflicts?venue=Gymnasium
router.get('/', async (req, res) => {
    const { facility_id } = req.query;

    try {
        let result;

        if (facility_id) {
            result = await pool.query(
                `
                SELECT *
                FROM "Booking"
                WHERE event_facility = $1
                  AND deleted = false
                  AND (status = 'pending' OR status = 'approved')
                ORDER BY event_date DESC, starting_time DESC
                `,
                [Number(facility_id)]
            );
        } else {
            result = await pool.query(
                `
                SELECT *
                FROM "Booking"
                WHERE deleted = false
                ORDER BY event_date DESC, starting_time DESC
                `
            );
        }

        res.json({ success: true, bookings: result.rows });
    } catch (err) {
        console.error('Fetch bookings error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: err.message
        });
    }
});

module.exports = router;