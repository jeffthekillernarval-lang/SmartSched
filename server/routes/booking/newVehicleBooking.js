const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.post('/', async (req, res) => {
    const {
        vehicle_id,
        requestor,
        department_id,
        date,
        purpose,
        booker_id = 1,
        deleted = false,
        payment = 0,  // Default to 0 if not provided,
        status
    } = req.body;

    const requiredFields = [
        "vehicle_id",
        "requestor",
        "department_id",
        "date",
        "purpose"
    ];

    const missing = requiredFields.filter(f => !req.body[f]);
    if (missing.length > 0) {
        return res.status(400).json({ error: "Missing fields", missing });
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO "VehicleBooking"
            (vehicle_id, requestor, department_id, date, purpose, booker_id, deleted, payment, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
            RETURNING * 
            `,
            [
                vehicle_id,
                requestor,
                department_id,
                date,
                purpose,
                booker_id,
                deleted,
                payment // Insert the payment value (defaults to 0 if not provided)
            ]
        );

        res.status(201).json({
            success: true,
            booking: result.rows[0]
        });

    } catch (err) {
        console.error("❌ DB insert error:", err);
        res.status(500).json({ error: "Failed to create vehicle booking", details: err.message });
    }
});

module.exports = router;
