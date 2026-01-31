const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

/**
 * UPDATE vehicle booking payment
 * PUT /api/edit-payment/:id
 */
router.put('/:id', async (req, res) => {
    const bookingId = Number(req.params.id);
    const { payment } = req.body;

    // 🔒 Basic validation
    if (!Number.isInteger(bookingId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid booking ID',
        });
    }

    if (!Number.isFinite(payment) || payment < 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid payment amount',
        });
    }

    try {
        const result = await pool.query(
            `
      UPDATE "VehicleBookings"
      SET payment = $1
      WHERE id = $2
      RETURNING *
      `,
            [payment, bookingId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        res.json({
            success: true,
            booking: result.rows[0],
        });
    } catch (err) {
        console.error('Edit payment error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update payment',
        });
    }
});

module.exports = router;
