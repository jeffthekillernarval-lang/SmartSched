const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.post('/', async (req, res) => {
    const {
        vehicle_Type,
        requestor,
        department,
        date,
        purpose,
        booker_id = 1,
        deleted = false
    } = req.body;

    const requiredFields = [
        "vehicle_Type",
        "requestor",
        "department",
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
      ("vehicle_Type", requestor, department, date, purpose, booker_id, deleted)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
            [
                vehicle_Type,
                requestor,
                department,
                date,
                purpose,
                booker_id,
                deleted
            ]
        );

        res.status(201).json({
            success: true,
            booking: result.rows[0]
        });

    } catch (err) {
        console.error("❌ DB insert error:", err);
        res.status(500).json({ error: "Failed to create vehicle booking" });
    }
});

module.exports = router;
