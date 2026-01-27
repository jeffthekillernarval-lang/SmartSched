const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.post('/', async (req, res) => {
    const {
        name,
        age,
        gender,
        contactNumber,
        licenseNumber,
        drivableVehicles
    } = req.body;



    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const driverRes = await pool.query(
            `
    INSERT INTO "Drivers"
    (name, age, gender, contact_number, liscence_id_number, enabled)
    VALUES ($1, $2, $3, $4, $5, true)
    RETURNING id
    `,
            [name, age, gender, contactNumber, licenseNumber]
        );

        const driverId = driverRes.rows[0].id;

        if (drivableVehicles?.length) {
            const values = drivableVehicles
                .map((_, i) => `($1, $${i + 2}, true)`)
                .join(',');

            await pool.query(
                `
        INSERT INTO "DriverVehicles"
        (driver_id, vehicle_id, enabled)
        VALUES ${values}
        `,
                [driverId, ...drivableVehicles]
            );
        }


        await client.query('COMMIT');

        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create Driver error:', err);
        res.status(500).json({ success: false });
    } finally {
        client.release();
    }
});

module.exports = router;
