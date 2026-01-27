const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { abbr, meaning, moderator } = req.body;

    try {
        const result = await pool.query(
            `UPDATE "Affiliations"
             SET abbreviation = $1,
                 meaning = $2,
                 moderator = $3
             WHERE id = $4
             RETURNING id, abbreviation, meaning, moderator`,
            [abbr, meaning, moderator, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Affiliation not found'
            });
        }

        res.json({
            success: true,
            affiliation: result.rows[0],
            message: 'Affiliation Updated'
        });
    } catch (err) {
        console.error('Update Affiliation error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
