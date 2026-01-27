const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, capacity, location } = req.body;

    try {
        const result = await pool.query(
            `UPDATE "Facilities"
             SET name = $1,
                 capacity = $2,
                 location = $3
             WHERE id = $4
             RETURNING id, name, capacity, location`,
            [name, capacity, location, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Facility not found' });
        }

        res.json({
            success: true,
            facility: result.rows[0],
            message: 'Facility updated'
        });
    } catch (err) {
        console.error('Update facility error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
