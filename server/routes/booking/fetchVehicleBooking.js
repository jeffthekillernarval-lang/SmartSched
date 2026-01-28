// server/routes/booking/fetchVehicleBooking.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `
                  SELECT
                vb.*,
                d.name AS driver_name
            FROM "VehicleBooking" vb
            LEFT JOIN "Drivers" d
                ON d.id = vb.driver_id
            ORDER BY vb.date DESC
            `
            // SELECT * FROM "VehicleBooking" ORDER BY date DESC
        );

        console.log("Fetched vehicle rows:", result.rows); // ✅ FIXED
        res.json(result.rows);

    } catch (err) {
        console.error('Fetch vehicle bookings error:', err);
        res.status(500).json({ message: 'Server error fetching vehicle bookings' });
    }
});

module.exports = router;
