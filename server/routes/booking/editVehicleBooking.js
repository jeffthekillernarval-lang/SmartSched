const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// PUT /edit-vehicle-booking/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { vehicle_id, requestor, department_id, date, purpose, booker_id } = req.body;

    if (!vehicle_id || !requestor || !department_id || !date || !purpose || !booker_id) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        // Update the vehicle booking with the new data
        const result = await pool.query(
            `UPDATE "VehicleBooking"
             SET vehicle_id = $1, requestor = $2, department_id = $3, date = $4, purpose = $5, booker_id = $6
             WHERE id = $7 RETURNING *`,
            [vehicle_id, requestor, department_id, date, purpose, booker_id, id]
        );

        if (result.rows.length > 0) {
            res.json({ success: true, message: 'Vehicle booking updated successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Booking not found' });
        }
    } catch (err) {
        console.error('Error updating vehicle booking:', err);
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
});

module.exports = router;
