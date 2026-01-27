const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.get('/fetch-related-vehicle-bookings', async (req, res) => {
    const { date, requestor } = req.query;

    if (!date || !requestor) {
        return res.status(400).json({ success: false, message: 'Date and Requestor are required' });
    }

    try {
        const result = await pool.query(
            `SELECT v.id, v.plate_number, v.vehicle_type, v.passenger_capacity
             FROM "Vehicles" v
             JOIN "VehicleBookings" vb ON v.id = vb.vehicle_id
             WHERE vb.date = $1 AND vb.requestor = $2`,
            [date, requestor]
        );

        res.json({
            success: true,
            vehicles: result.rows
        });
    } catch (err) {
        console.error('Fetch related vehicle bookings error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;