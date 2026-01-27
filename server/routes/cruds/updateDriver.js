const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.put('/:id', async (req, res) => {
    const driverId = req.params.id;
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

        await pool.query(
            `
    UPDATE "Drivers"
    SET
        name = $1,
        age = $2,
        gender = $3,
        contact_number = $4,
        liscence_id_number = $5
    WHERE id = $6
    `,
            [name, age, gender, contactNumber, licenseNumber, req.params.id]
        );


        await pool.query(
            `DELETE FROM "DriverVehicles" WHERE driver_id = $1`,
            [req.params.id]
        );

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
                [req.params.id, ...drivableVehicles]
            );
        }


        await client.query('COMMIT');

        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update Driver error:', err);
        res.status(500).json({ success: false });
    } finally {
        client.release();
    }
});

module.exports = router;
