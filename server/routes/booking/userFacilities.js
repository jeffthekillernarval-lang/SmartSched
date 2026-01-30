const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.post('/', async (req, res) => {
    const { user_id, facilities } = req.body;
    // facilities = array of facility ids

    if (!user_id || !Array.isArray(facilities)) {
        return res.status(400).json({
            success: false,
            message: 'user_id and facilities[] are required'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // remove old facilities of user
        await client.query(
            `DELETE FROM "User-Facility-Pivot"
       WHERE user_id = $1`,
            [user_id]
        );

        // insert new facilities
        for (const facilityId of facilities) {
            await client.query(
                `INSERT INTO "User-Facility-Pivot"(user_id, facilities_id)
         VALUES ($1, $2)`,
                [user_id, String(facilityId)]
            );
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'User facilities updated successfully'
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Save user facilities error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to save user facilities',
            error: err.message
        });
    } finally {
        client.release();
    }
});

module.exports = router;