const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.post('/', async (req, res) => {
    const { name, capacity, location } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO "Facilities" (name, capacity, location, enabled) VALUES ($1, $2, $3, true) RETURNING *`,
            [name, capacity, location]
        );
        res.json({ success: true, facility: result.rows[0] });
    } catch (err) {
        console.error('Create Facilities error:', err);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
