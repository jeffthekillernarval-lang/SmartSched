const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, control_number, model_id } = req.body;

    try {
        const result = await pool.query(
            `UPDATE "Equipments"
             SET name = $1,
                 control_number = $2,
                 model_id = $3
             WHERE id = $4
             RETURNING id, name, control_number, model_id`,
            [name, control_number, model_id, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        res.json({
            success: true,
            equipment: result.rows[0],
            message: 'Equipment updated'
        });
    } catch (err) {
        console.error('Update equipment error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
