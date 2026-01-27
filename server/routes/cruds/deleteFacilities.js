const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM "Facilities"
             WHERE id = $1
             RETURNING id`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Facility not found' });
        }

        res.json({ success: true, message: 'Facility deleted' });
    } catch (err) {
        console.error('Delete facility error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
