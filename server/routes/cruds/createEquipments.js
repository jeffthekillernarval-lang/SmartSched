const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.post('/', async (req, res) => {
    const { name, control_number, model_id } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO "Equipments"
             (name, control_number, model_id, enabled)
             VALUES ($1, $2, $3, true)
             RETURNING id, name, control_number, model_id`,
            [name, control_number, model_id]
        );

        res.json({
            success: true,
            equipment: result.rows[0],
            message: 'Equipment Created'
        });
    } catch (err) {
        console.error('Create Equipment error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
