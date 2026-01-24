const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.post('/', async (req, res) => {
    const {
        name,
        plateNumber,
        vin,
        type,
        capacity
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO "Vehicles"
            (vehicle_name, plate_number, vin, vehicle_type, passenger_capacity, enabled)
            VALUES ($1, $2, $3, $4, $5, true)
            RETURNING id, vehicle_name, plate_number, vin, vehicle_type, passenger_capacity`,
            [name, plateNumber, vin, type, capacity]
        );

        res.json({
            success: true,
            vehicle: result.rows[0]
        });
    } catch (err) {
        console.error('Create Vehicle error:', err);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
