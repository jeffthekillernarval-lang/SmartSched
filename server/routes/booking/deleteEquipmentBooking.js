const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

/**
 * DELETE /api/booking/:id
 * Deletes an equipment booking by booking ID
 */
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid booking id",
        });
    }

    try {
        const result = await pool.query(
            `DELETE FROM "Equipment"
       WHERE id = $1
       RETURNING *`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        return res.json({
            success: true,
            message: "Equipment booking deleted successfully",
            deleted: result.rows[0],
        });
    } catch (err) {
        console.error("Delete Equipment Booking error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to delete booking",
            error: err.message,
        });
    }
});

module.exports = router;
