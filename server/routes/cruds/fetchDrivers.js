const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                d.id,
                d.name,
                d.age,
                d.gender,
                d.contact_number,
                d.liscence_id_number,
                ARRAY_REMOVE(ARRAY_AGG(v.vehicle_name), NULL) AS vehicle_names,
                ARRAY_REMOVE(ARRAY_AGG(v.id), NULL) AS drivable_vehicle_ids
            FROM "Drivers" d
            LEFT JOIN "DriverVehicles" dv
                ON dv.driver_id = d.id AND dv.enabled = true
            LEFT JOIN "Vehicles" v
                ON v.id = dv.vehicle_id
            WHERE d.enabled = true
            GROUP BY
                d.id
            ORDER BY d.id DESC
        `);

        res.json({
            success: true,
            drivers: result.rows
        });
    } catch (err) {
        console.error('Fetch drivers error:', err);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
