const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.put('/:bookingId', async (req, res) => {
    const { bookingId } = req.params;

    const {
        equipments,
        departmentId,
        facilityId,
        purpose,
        date,
        timeStart,
        timeEnd
    } = req.body;

    // ================== VALIDATION ==================
    const missing = [];
    if (!equipments?.length) missing.push('equipments');
    if (!departmentId) missing.push('departmentId');
    if (!facilityId) missing.push('facilityId');
    if (!purpose) missing.push('purpose');
    if (!date) missing.push('date');
    if (!timeStart) missing.push('timeStart');
    if (!timeEnd) missing.push('timeEnd');

    if (missing.length) {
        return res.status(400).json({
            success: false,
            message: `Missing required fields: ${missing.join(', ')}`
        });
    }

    const datesArray = [date];

    try {
        // ================== CONFLICT CHECK ==================
        for (const eq of equipments) {
            for (const bookingDate of datesArray) {
                const conflictQuery = `
          SELECT *
          FROM "Equipment"
          WHERE equipment_type_id = $1
            AND $2 = ANY(dates)
            AND facility_id = $3
            AND id != $4
            AND (
              $5::time < time_end
              AND $6::time > time_start
            )
        `;

                const { rows: conflicts } = await pool.query(conflictQuery, [
                    eq.equipmentId,
                    bookingDate,
                    facilityId,
                    bookingId,        // 👈 EXCLUDE CURRENT BOOKING
                    timeStart,
                    timeEnd
                ]);

                if (conflicts.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Conflict: Equipment ID ${eq.equipmentId} is already booked on ${bookingDate} from ${conflicts[0].time_start} to ${conflicts[0].time_end}`
                    });
                }
            }
        }

        // ================== UPDATE ==================
        // (Equipment booking = 1 row = 1 equipment)
        const eq = equipments[0];

        const result = await pool.query(
            `UPDATE "Equipment"
       SET equipment_type_id = $1,
           quantity = $2,
           affiliation_id = $3,
           facility_id = $4,
           dates = $5,
           purpose = $6,
           time_start = $7,
           time_end = $8
       WHERE id = $9
       RETURNING *`,
            [
                eq.equipmentId,
                eq.quantity ?? 1,
                departmentId,
                facilityId,
                datesArray,
                purpose,
                timeStart,
                timeEnd,
                bookingId
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment booking not found'
            });
        }

        res.json({
            success: true,
            booking: result.rows[0]
        });

    } catch (err) {
        console.error('Update Equipment Booking error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update equipment booking',
            error: err.message
        });
    }
});

module.exports = router;
