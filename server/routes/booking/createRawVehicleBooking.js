const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

/**
 * POST /api/vehicle/create-raw
 * Direct vehicle booking creation (NO AI)
 */
router.post('/', async (req, res) => {
    const {
        vehicle_id,
        requestor,
        department_id,
        date,
        purpose,
        booker_id = 1,
        deleted = false,
        payment = 0
    } = req.body;

    // ✅ Validate required fields
    const requiredFields = {
        vehicle_id,
        requestor,
        department_id,
        date,
        purpose,
    };

    const missing = Object.entries(requiredFields)
        .filter(([_, v]) => v === undefined || v === null || v === '')
        .map(([k]) => k);

    if (missing.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Missing required fields: ${missing.join(', ')}`,
        });
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO "VehicleBooking"
            (
                vehicle_id,
                requestor,
                department_id,
                date,
                purpose,
                booker_id,
                deleted,
                payment,
                status
            )
            VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
            RETURNING *
            `,
            [
                vehicle_id,
                requestor,
                department_id,
                date,
                purpose,
                Number(booker_id),
                deleted,
                payment
            ]
        );

        return res.status(201).json({
            success: true,
            booking: result.rows[0],
        });

    } catch (err) {
        console.error('❌ Create raw vehicle booking error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error creating vehicle booking',
            details: err.message
        });
    }
});

module.exports = router;
