const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.get('/available-equipments', async (req, res) => {
    const { date, timeStart, timeEnd, facilityId } = req.query;

    if (!date || !timeStart || !timeEnd || !facilityId) {
        return res.status(400).json({
            success: false,
            message: 'date, timeStart, timeEnd, and facilityId are required'
        });
    }

    try {
        const query = `
      SELECT e.*
      FROM "Equipments" e
      WHERE e.enabled = true
      AND e.id NOT IN (
        SELECT equipment_type_id
        FROM "Equipment"
        WHERE $1 = ANY(dates)
          AND facility_id = $2
          AND (
            $3::time < time_end
            AND $4::time > time_start
          )
      )
      ORDER BY e.id DESC
    `;

        const { rows } = await pool.query(query, [
            date,
            facilityId,
            timeStart,
            timeEnd
        ]);

        res.json({ success: true, equipments: rows });
    } catch (err) {
        console.error('Available equipment error:', err);
        res.status(500).json({ success: false });
    }
});
module.exports = router;