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

        const errors = [];
        // 🔢 Age validation
        if (!age || isNaN(age) || Number(age) < 18) {
            errors.push("Driver must be at least 18 years old.");
        }

        // 📱 Contact validation (numbers only, 11 digits typical PH format)
        if (!/^\d+$/.test(contactNumber)) {
            errors.push("Contact number must contain numbers only.");
        }

        // Optional: enforce exact length (recommended)
        if (contactNumber.length !== 11) {
            errors.push("Contact number must be exactly 11 digits.");
        }
        // Check license duplicate
        const licenseCheck = await client.query(
            `SELECT id FROM "Drivers" 
         WHERE liscence_id_number = $1 AND enabled = true`,
            [licenseNumber]
        );

        if (licenseCheck.rows.length > 0) {
            errors.push("License ID already exists.");
        }

        // Check name duplicate
        const nameCheck = await client.query(
            `SELECT id FROM "Drivers" 
         WHERE LOWER(name) = LOWER($1) AND enabled = true`,
            [name]
        );

        if (nameCheck.rows.length > 0) {
            errors.push(
                "Driver name already exists. Please add an additional identifier (e.g. Jr., Sr., Middle Initial)."
            );
        }

        // 🚨 STOP HERE if errors exist
        if (errors.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: errors.join("\n")
            });
        }

        // INSERT only runs if NO errors
        const driverRes = await client.query(
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

            await client.query(
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

        console.error(err);

        // 🔥 Catch UNIQUE constraint fallback
        if (err.code === '23505') {
            return res.status(400).json({
                success: false,
                message: "Duplicate value detected (database constraint)."
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create driver."
        });
    } finally {
        client.release();
    }
});

module.exports = router;
