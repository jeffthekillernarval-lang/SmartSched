const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// GET /api/user-vehicles-fetch/:userId
router.get('/user-vehicles-fetch/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            `SELECT vehicles_id
       FROM "User-Vehicle-Pivot"
       WHERE user_id = $1`,
            [String(userId)]
        );

        res.json({
            success: true,
            vehicles: result.rows.map(r => r.vehicles_id)
        });
    } catch (err) {
        console.error('Fetch user vehicles error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch user vehicles' });
    }
});

// POST /api/user-vehicles
router.post('/user-vehicles', async (req, res) => {
    const { user_id, vehicles } = req.body;

    if (!user_id || !Array.isArray(vehicles)) {
        return res.status(400).json({
            success: false,
            message: 'user_id and vehicles[] are required'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(
            `DELETE FROM "User-Vehicle-Pivot"
       WHERE user_id = $1`,
            [String(user_id)]
        );

        for (const vehicleId of vehicles) {
            await client.query(
                `INSERT INTO "User-Vehicle-Pivot"(user_id, vehicles_id)
         VALUES ($1, $2)`,
                [String(user_id), String(vehicleId)]
            );
        }

        await client.query('COMMIT');

        res.json({ success: true, message: 'User vehicles updated successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Save user vehicles error:', err);
        res.status(500).json({ success: false, message: 'Failed to save user vehicles', error: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;
