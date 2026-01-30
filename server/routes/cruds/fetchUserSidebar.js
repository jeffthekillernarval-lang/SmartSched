const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

/**
 * GET /api/user-sidebar-fetch/:userId
 */
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            `SELECT sidebar_key
             FROM "User-Sidebar-Pivot"
             WHERE user_id = $1
               AND enabled = true`,
            [userId]
        );

        res.json({
            success: true,
            items: result.rows.map(r => r.sidebar_key)
        });

    } catch (err) {
        console.error('Fetch sidebar permissions error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sidebar permissions'
        });
    }
});

module.exports = router;
