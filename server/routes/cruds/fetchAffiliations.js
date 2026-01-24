const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, abbreviation, meaning, moderator
             FROM "Affiliations"
             WHERE enabled = true
             ORDER BY id DESC`
        );

        res.json({
            success: true,
            affiliations: result.rows
        });
    } catch (err) {
        console.error('Fetch Affiliations error:', err);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
