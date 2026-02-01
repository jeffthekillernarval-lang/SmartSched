const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

/**
 * UPDATE facility booking payment
 * PUT /api/edit-facility-payment/:id
 */
router.put('/:id', async (req, res) => {
    const bookingId = Number(req.params.id);
    const { booking_fee } = req.body;

    // 🔒 Validation
    if (!Number.isInteger(bookingId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid booking ID',
        });
    }

    if (!Number.isFinite(booking_fee) || booking_fee < 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid payment amount',
        });
    }

    try {
        const result = await pool.query(
            `
            UPDATE "Booking"
            SET booking_fee = $1
            WHERE id = $2
            RETURNING *
            `,
            [booking_fee, bookingId]
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
        console.error('Edit facility payment error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update payment',
        });
    }
});

module.exports = router;
