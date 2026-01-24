const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM "Facilities" ORDER BY id DESC`);
        res.json({ success: true, facilities: result.rows });
    } catch (err) {
        console.error('Fetch Facilities error:', err);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
