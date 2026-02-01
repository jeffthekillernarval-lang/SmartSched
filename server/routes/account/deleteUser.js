const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM "User"
             WHERE id = $1
             RETURNING id`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User permanently deleted',
            deletedUserId: result.rows[0].id
        });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: err.message
        });
    }
});

module.exports = router;
