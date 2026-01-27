const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.get('/:vehicleId', async (req, res) => {
    const { vehicleId } = req.params;

    try {
        const result = await pool.query(`
            SELECT
                d.id,
                d.name
            FROM "Drivers" d
            JOIN "DriverVehicles" dv
                ON dv.driver_id = d.id
            WHERE
                dv.vehicle_id = $1
                AND dv.enabled = true
                AND d.enabled = true
            ORDER BY d.name
        `, [vehicleId]);

        res.json({
            success: true,
            drivers: result.rows
        });
    } catch (err) {
        console.error('Fetch drivers by vehicle error:', err);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
