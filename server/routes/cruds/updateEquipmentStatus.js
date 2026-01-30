const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.put('/:bookingId', async (req, res) => {
    const { bookingId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Pending', 'Approved', 'Rejected', 'Returned'];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status value'
        });
    }

    try {
        const result = await pool.query(
            `UPDATE "Equipment"
       SET status = $1
       WHERE id = $2
       RETURNING *`,
            [status, bookingId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment booking not found'
            });
        }

        res.json({
            success: true,
            booking: result.rows[0]
        });
    } catch (err) {
        console.error('Update Equipment Status error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update status'
        });
    }
});

module.exports = router;
