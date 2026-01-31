const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `
  SELECT
    u.id,
    u.name,
    u.role,
    u.email,

    -- Fallback if affiliation is invalid or missing
    COALESCE(a.meaning, 'CJC') AS affiliation

  FROM "User" u
  LEFT JOIN "Affiliations" a
    ON LOWER(TRIM(a.abbreviation)) = LOWER(TRIM(u.affiliation))
   AND a.enabled = true

  WHERE u.id = $1
    AND u.deleted = false
  `,
            [id]
        );



        if (result.rows.length > 0) {
            res.json({ success: true, user: result.rows[0] });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        console.error('Fetch user details error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user details',
            error: err.message
        });
    }
});

module.exports = router;
