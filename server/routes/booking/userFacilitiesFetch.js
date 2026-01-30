const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            `SELECT facilities_id
       FROM "User-Facility-Pivot"
       WHERE user_id = $1`,
            [userId]
        );

        res.json({
            success: true,
            facilities: result.rows.map(r => r.facilities_id) // array of strings
        });
    } catch (err) {
        console.error('Fetch user facilities error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user facilities',
            error: err.message
        });
    }
});

module.exports = router;