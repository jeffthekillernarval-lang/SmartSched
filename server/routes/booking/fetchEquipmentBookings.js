const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Fetch all equipment bookings
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                *
            FROM "Equipment"
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            bookings: result.rows
        });
    } catch (err) {
        console.error('Fetch Equipment Bookings Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch bookings', error: err.message });
    }
});

module.exports = router;
