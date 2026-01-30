const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Use your DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

/**
 * POST /api/create-equipment-booking
 * Body: {
 *   equipments: [{ equipmentId: string, quantity: number }],
 *   departmentId: string,
 *   facilityId: string,
 *   purpose: string,
 *   mode: string,
 *   date: string,
 *   specificDates: array of strings (YYYY-MM-DD),
 *   rangeStart: string (YYYY-MM-DD),
 *   rangeEnd: string (YYYY-MM-DD),
 *   timeStart: string (HH:MM),
 *   timeEnd: string (HH:MM)
 * }
 */
router.post('/', async (req, res) => {
    const {
        equipments,
        departmentId,
        facilityId,
        purpose,
        mode,
        date,
        specificDates,
        rangeStart,
        rangeEnd,
        timeStart,
        timeEnd
    } = req.body;

    // Validate required fields
    const missing = [];

    if (!equipments?.length) missing.push('equipments');
    if (!departmentId) missing.push('departmentId');
    if (!facilityId) missing.push('facilityId');
    if (!purpose) missing.push('purpose');
    if (!timeStart) missing.push('timeStart');
    if (!timeEnd) missing.push('timeEnd');

    if (missing.length) {
        return res.status(400).json({
            success: false,
            message: `Missing required fields: ${missing.join(', ')}`
        });
    }


    // Validate and construct dates array based on mode
    // ✅ Construct dates array (single-date booking)
    if (!date) {
        return res.status(400).json({
            success: false,
            message: 'Missing required field: date'
        });
    }

    const datesArray = [date];


    try {
        // Check conflicts for each equipment and date
        for (const eq of equipments) {
            for (const bookingDate of datesArray) {
                const conflictQuery = `
                    SELECT *
                    FROM "Equipment"
                    WHERE equipment_type_id = $1
                    AND $2 = ANY(dates)
                    AND facility_id = $3
                    AND (
                        ($4::time < time_end AND $5::time > time_start)
                    )
                `;
                const { rows: conflicts } = await pool.query(conflictQuery, [
                    eq.equipmentId,
                    bookingDate,
                    facilityId,
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

        // Insert each equipment booking into the database
        for (const eq of equipments) {
            await pool.query(
                `INSERT INTO "Equipment" (
      equipment_type_id,
      quantity,
      affiliation_id,
      facility_id,
      dates,
      purpose,
      time_start,
      time_end
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    eq.equipmentId,
                    eq.quantity ?? 1,
                    departmentId,
                    facilityId,
                    datesArray,
                    purpose,
                    timeStart,
                    timeEnd
                ]
            );

        }

        res.json({
            success: true,
            message: 'Equipment booking created successfully'
        });
    } catch (err) {
        console.error('Create Equipment Booking error:', err);
        res.status(500).json({ success: false, message: 'Failed to create equipment booking', error: err.message });
    }
});

module.exports = router;
