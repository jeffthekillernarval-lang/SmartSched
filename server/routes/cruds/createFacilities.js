const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.post('/', async (req, res) => {
    const { name, capacity, location } = req.body;

    try {

        // 🔎 Check case-insensitive duplicate
        const existing = await pool.query(
            `SELECT id FROM "Facilities"
             WHERE LOWER(name) = LOWER($1)`,
            [name]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Facility name already exists (case-insensitive)."
            });
        }

        const result = await pool.query(
            `INSERT INTO "Facilities"
             (name, capacity, location, enabled)
             VALUES ($1, $2, $3, true)
             RETURNING *`,
            [name, capacity, location]
        );

        res.json({ success: true, facility: result.rows[0] });

    } catch (err) {

        // 🔥 Catch DB unique violation fallback
        if (err.code === '23505') {
            return res.status(400).json({
                success: false,
                message: "Facility name already exists."
            });
        }

        console.error('Create Facilities error:', err);
        res.status(500).json({ success: false });
    }
});
module.exports = router;
