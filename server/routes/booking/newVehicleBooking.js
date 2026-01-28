const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.post('/', async (req, res) => {
    const {
        vehicle_id,
        driver_id,
        requestor,
        department_id,
        dates, // this should now be an array of dates
        purpose,
        destination,
        booker_id = 1,
        deleted = false,
        payment = 0
    } = req.body;

    // required fields
    const requiredFields = ["vehicle_id", "driver_id", "requestor", "department_id", "dates", "purpose", "destination"];
    const missing = requiredFields.filter(f =>
        req.body[f] === undefined || req.body[f] === null ||
        (Array.isArray(req.body[f]) && req.body[f].length === 0) || req.body[f] === ""
    );

    if (missing.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Missing fields",
            missing
        });
    }

    // Ensure dates is an array
    const dateArray = Array.isArray(dates) ? dates : [dates];

    try {
        // 1️⃣ Check driver conflicts for any of the dates
        const conflictCheck = await pool.query(`
            SELECT id, unnest(dates) as date
            FROM "VehicleBooking"
            WHERE driver_id = $1 AND deleted = false
        `, [driver_id]);

        const conflictingDates = conflictCheck.rows
            .map(b => b.date.toISOString().slice(0, 10)) // convert to YYYY-MM-DD
            .filter(d => dateArray.includes(d));

        if (conflictingDates.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Driver is already booked on some dates!",
                conflictDates: conflictingDates
            });
        }

        // 2️⃣ Insert booking (all dates in one row using date[] column)
        const result = await pool.query(`
            INSERT INTO "VehicleBooking"
            (
                vehicle_id,
                driver_id,
                requestor,
                department_id,
                dates,
                purpose,
                destination,
                booker_id,
                deleted,
                payment,
                status
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Pending')
            RETURNING *
        `, [
            Number(vehicle_id),
            Number(driver_id),
            requestor,
            Number(department_id),
            dateArray,   // <-- insert as array
            purpose,
            destination,
            Number(booker_id),
            deleted,
            Number(payment)
        ]);

        res.status(201).json({
            success: true,
            booking: result.rows[0]
        });

    } catch (err) {
        console.error("❌ DB insert error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to create vehicle booking",
            details: err.message
        });
    }
});

module.exports = router;
