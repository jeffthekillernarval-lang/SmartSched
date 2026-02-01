const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.post('/', async (req, res) => {
    const { dates, timeStart, timeEnd, facilityId } = req.body;

    if (!Array.isArray(dates) || !dates.length || !timeStart || !timeEnd) {
        return res.json({ success: true, equipments: [] });
    }

    try {
        const query = `
            SELECT e.*
            FROM "Equipments" e
            WHERE e.enabled = true
            AND e.id NOT IN (
                SELECT equipment_type_id
                FROM "Equipment"
                WHERE
                    ($1::time < time_end AND $2::time > time_start)
                    AND EXISTS (
                        SELECT 1
                        FROM unnest($3::date[]) d
                        WHERE d = ANY(dates)
                    )
            )
            ORDER BY e.id DESC
        `;

        console.log('AVAILABILITY CHECK (STRICT):', {
            dates,
            timeStart,
            timeEnd
        });

        const { rows } = await pool.query(query, [
            timeStart,
            timeEnd,
            dates
        ]);

        res.json({ success: true, equipments: rows });
    } catch (err) {
        console.error('Available equipment error:', err);
        res.status(500).json({ success: false });
    }
});


module.exports = router;
