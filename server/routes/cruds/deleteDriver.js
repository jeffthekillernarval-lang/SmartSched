const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.delete('/:id', async (req, res) => {
    const driverId = req.params.id;

    try {
        await pool.query(
            `UPDATE "Drivers" SET enabled = false WHERE id = $1`,
            [driverId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Delete Driver error:', err);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
