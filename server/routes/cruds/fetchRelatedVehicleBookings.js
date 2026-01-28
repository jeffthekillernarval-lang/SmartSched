const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.get('/', async (req, res) => {
    const { date, purpose, requestor } = req.query;

    if (!date || !purpose || !requestor) {
        return res.status(400).json({
            success: false,
            message: 'Missing required query parameters: date, purpose, or requestor'
        });
    }

    try {
        const result = await pool.query(
            `SELECT *
             FROM "vehiclebookings"
             WHERE date = $1
               AND purpose = $2
               AND requestor = $3`,
            [date, purpose, requestor]
        );

        res.json({
            success: true,
            vehicleBookings: result.rows
        });
    } catch (err) {
        console.error('Error fetching related vehicle bookings:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
