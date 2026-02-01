const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// DELETE /api/delete-booking/:id
router.delete('/:id', async (req, res) => {
    const bookingId = Number(req.params.id);

    if (!Number.isInteger(bookingId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid booking ID',
        });
    }

    try {
        const result = await pool.query(
            `DELETE FROM "Booking"
             WHERE id = $1`,
            [bookingId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        res.json({
            success: true,
            message: 'Booking permanently deleted',
        });
    } catch (err) {
        console.error('Delete booking error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
});

module.exports = router;
