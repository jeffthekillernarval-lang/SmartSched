const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// PUT /api/vehicle/delete/:id
router.put('/:id', async (req, res) => {
    const bookingId = Number(req.params.id);

    if (!bookingId || Number.isNaN(bookingId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid vehicle booking ID',
        });
    }

    try {
        const result = await pool.query(
            `UPDATE "VehicleBooking"
             SET deleted = true
             WHERE id = $1`,
            [bookingId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle booking not found',
            });
        }

        res.json({
            success: true,
            message: 'Vehicle booking deleted (soft) successfully',
        });
    } catch (err) {
        console.error('Delete vehicle booking error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


module.exports = router;
