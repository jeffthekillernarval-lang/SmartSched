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
        // 1️⃣ Get all enabled equipments
        const equipmentsRes = await pool.query(`
            SELECT *
            FROM "Equipments"
            WHERE enabled = true
            ORDER BY id DESC
        `);

        const equipments = equipmentsRes.rows;

        // 2️⃣ Get all conflicting bookings
        const bookingsRes = await pool.query(`
            SELECT *
            FROM "Equipment"
            WHERE
                ($1::time < time_end AND $2::time > time_start)
                AND EXISTS (
                    SELECT 1
                    FROM unnest($3::date[]) d
                    WHERE d = ANY(dates)
                )
        `, [timeStart, timeEnd, dates]);

        const bookings = bookingsRes.rows;

        // 3️⃣ Attach availability metadata
        const enriched = equipments.map(eq => {

            const conflicts = bookings.filter(
                b => b.equipment_type_id === eq.id
            );

            if (!conflicts.length) {
                return {
                    ...eq,
                    availability: "available",
                    overlaps: []
                };
            }

            return {
                ...eq,
                availability: "conflict",
                overlaps: conflicts.map(c => ({
                    date: c.dates,
                    timeStart: c.time_start,
                    timeEnd: c.time_end,
                    purpose: c.purpose
                }))
            };
        });

        res.json({
            success: true,
            equipments: enriched
        });

    } catch (err) {
        console.error('Available equipment error:', err);
        res.status(500).json({ success: false });
    }
});


module.exports = router;
