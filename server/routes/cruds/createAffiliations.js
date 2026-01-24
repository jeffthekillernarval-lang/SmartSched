const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.post('/', async (req, res) => {
    const { abbr, meaning, moderator } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO "Affiliations"
             (abbreviation, meaning, moderator, enabled)
             VALUES ($1, $2, $3, true)
             RETURNING id, abbreviation, meaning, moderator`,
            [abbr, meaning, moderator]
        );

        res.json({
            success: true,
            affiliation: result.rows[0],
            message: 'Affiliation Created'
        });
    } catch (err) {
        console.error('Create Affiliation error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
