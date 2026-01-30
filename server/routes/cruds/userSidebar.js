const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

/**
 * POST /api/user-sidebar
 * Body:
 * {
 *   user_id: string,
 *   items: string[]   // sidebar keys
 * }
 */
router.post('/', async (req, res) => {
    const { user_id, items } = req.body;

    if (!user_id || !Array.isArray(items)) {
        return res.status(400).json({
            success: false,
            message: 'user_id and items[] are required'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Remove old sidebar permissions
        await client.query(
            `DELETE FROM "User-Sidebar-Pivot"
             WHERE user_id = $1`,
            [user_id]
        );

        // Insert new sidebar permissions
        for (const key of items) {
            await client.query(
                `INSERT INTO "User-Sidebar-Pivot" (
                    user_id,
                    sidebar_key,
                    enabled
                ) VALUES ($1, $2, true)`,
                [user_id, key]
            );
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Sidebar permissions updated',
            items
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update sidebar permissions error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update sidebar permissions'
        });
    } finally {
        client.release();
    }
});

module.exports = router;
