// server/routes/booking/toggleReservation.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// POST /api/toggle-reservation/:id
router.post('/:id', async (req, res) => {
    const bookingId = req.params.id;
    const { reservation } = req.body; // true or false

    if (typeof reservation !== 'boolean') {
        return res.status(400).json({ success: false, message: 'reservation must be true or false' });
    }

    try {
        const result = await pool.query(
            `UPDATE "Booking" SET reservation = $1 WHERE id = $2 RETURNING *`,
            [reservation, bookingId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({ success: true, booking: result.rows[0], message: 'Reservation updated successfully' });
    } catch (err) {
        console.error('Update reservation error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
