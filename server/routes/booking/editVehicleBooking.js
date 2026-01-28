const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// PUT /api/edit-vehicle-booking/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;

    const {
        vehicle_id,
        requestor,
        department_id,
        date,
        purpose,
        booker_id,
        driver_id = null,
        destination = null,
        payment = 0,
        status = 'pending'
    } = req.body;

    const requiredFields = ["vehicle_id", "requestor", "department_id", "date", "purpose", "booker_id"];
    const missing = requiredFields.filter(f => !req.body[f]);

    if (missing.length > 0) {
        return res.status(400).json({ success: false, message: "Missing fields", missing });
    }

    try {
        const result = await pool.query(
            `
      UPDATE "VehicleBooking"
      SET
        vehicle_id = $1,
        requestor = $2,
        department_id = $3,
        date = $4,
        purpose = $5,
        booker_id = $6,
        driver_id = $7,
        destination = $8,
        payment = $9,
        status = $10
      WHERE id = $11
      RETURNING *
      `,
            [
                vehicle_id,
                requestor,
                department_id,
                date,
                purpose,
                booker_id,
                driver_id,
                destination,
                payment,
                status,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        res.json({
            success: true,
            message: "Vehicle booking updated successfully",
            booking: result.rows[0]
        });

    } catch (err) {
        console.error("Error updating vehicle booking:", err);
        res.status(500).json({ success: false, message: err.message || "Server error" });
    }
});

module.exports = router;
