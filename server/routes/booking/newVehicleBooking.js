const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.post('/', async (req, res) => {
    const {
        vehicle_id,
        driver_id,
        requestor,
        department_id,
        date,
        purpose,
        destination,
        booker_id = 1,
        deleted = false,
        payment = 0
    } = req.body;

    // required fields
    const requiredFields = [
        "vehicle_id",
        "driver_id",
        "requestor",
        "department_id",
        "date",
        "purpose",
        "destination"
    ];

    const missing = requiredFields.filter(f =>
        req.body[f] === undefined || req.body[f] === null || req.body[f] === ""
    );

    if (missing.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Missing fields",
            missing
        });
    }

    try {
        // 1️⃣ Check for driver conflict
        const conflictCheck = await pool.query(
            `
            SELECT id
            FROM "VehicleBooking"
            WHERE driver_id = $1
              AND date = $2
              AND deleted = false
            LIMIT 1
            `,
            [driver_id, date]
        );

        if (conflictCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Driver is already booked on this date!"
            });
        }

        // 2️⃣ Insert booking
        const result = await pool.query(
            `
            INSERT INTO "VehicleBooking"
            (
                vehicle_id,
                driver_id,
                requestor,
                department_id,
                date,
                purpose,
                destination,
                booker_id,
                deleted,
                payment,
                status
            )
            VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending')
            RETURNING *
            `,
            [
                Number(vehicle_id),
                Number(driver_id),
                requestor,
                Number(department_id),
                date,
                purpose,
                destination,
                Number(booker_id),
                deleted,
                Number(payment)
            ]
        );

        res.status(201).json({
            success: true,
            booking: result.rows[0]
        });

    } catch (err) {
        console.error("❌ DB insert error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to create vehicle booking",
            details: err.message
        });
    }
});

module.exports = router;
