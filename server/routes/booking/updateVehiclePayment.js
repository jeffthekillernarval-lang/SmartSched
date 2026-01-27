// routes/editPayment.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// PUT /api/edit-payment/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { payment } = req.body;

    if (payment === undefined) {
        return res.status(400).json({ success: false, message: 'Payment value is required' });
    }

    try {
        const result = await pool.query(
            `UPDATE "VehicleBooking"
             SET payment = $1
             WHERE id = $2
             RETURNING *`,
            [payment, id]
        );

        if (result.rows.length > 0) {
            res.json({ success: true, message: 'Payment updated successfully', booking: result.rows[0] });
        } else {
            res.status(404).json({ success: false, message: 'Booking not found' });
        }
    } catch (err) {
        console.error('Error updating payment:', err);
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
});

module.exports = router;
