const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// GET /api/user-equipments-fetch/:userId
router.get('/user-equipments-fetch/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            `SELECT equipments_id
       FROM "User-Equipment-Pivot"
       WHERE user_id = $1`,
            [String(userId)]
        );

        res.json({
            success: true,
            equipments: result.rows.map(r => r.equipments_id)
        });
    } catch (err) {
        console.error('Fetch user equipments error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch user equipments' });
    }
});

// POST /api/user-equipments
router.post('/user-equipments', async (req, res) => {
    const { user_id, equipments } = req.body;

    if (!user_id || !Array.isArray(equipments)) {
        return res.status(400).json({
            success: false,
            message: 'user_id and equipments[] are required'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(
            `DELETE FROM "User-Equipment-Pivot"
       WHERE user_id = $1`,
            [String(user_id)]
        );

        for (const equipmentId of equipments) {
            await client.query(
                `INSERT INTO "User-Equipment-Pivot"(user_id, equipments_id)
         VALUES ($1, $2)`,
                [String(user_id), String(equipmentId)]
            );
        }

        await client.query('COMMIT');

        res.json({ success: true, message: 'User equipments updated successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Save user equipments error:', err);
        res.status(500).json({ success: false, message: 'Failed to save user equipments', error: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;
