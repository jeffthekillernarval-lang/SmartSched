const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

router.post("/", async (req, res) => {
    let {
        vehicle_id,
        vehicle_name,
        driver_id,
        requestor,
        department_id,
        start_datetime,
        end_datetime,
        purpose,
        destination,
        booker_id = 1,
        deleted = false,
        payment = 0,
    } = req.body;

    try {
        /* --------------------------------------------------
           1️⃣ Resolve vehicle_id from vehicle_name (CHATBOT)
        -------------------------------------------------- */
        if (!vehicle_id && vehicle_name) {
            const vehicleResult = await pool.query(
                `
        SELECT id
        FROM "Vehicles"
        WHERE LOWER(vehicle_name) = LOWER($1)
        AND enabled = true
        LIMIT 1
        `,
                [vehicle_name.trim()]
            );

            if (vehicleResult.rowCount === 0) {
                return res.status(400).json({
                    success: false,
                    message: `Vehicle "${vehicle_name}" not found`,
                });
            }

            vehicle_id = vehicleResult.rows[0].id;
        }

        /* --------------------------------------------------
           2️⃣ Required fields (driver_id NOT required)
        -------------------------------------------------- */
        const requiredFields = [
            "vehicle_id",
            "requestor",
            "department_id",
            "start_datetime",
            "end_datetime",
            "purpose",
            "destination",
        ];


        const missing = requiredFields.filter(
            (f) =>
                req.body[f] === undefined ||
                req.body[f] === null ||
                (Array.isArray(req.body[f]) && req.body[f].length === 0) ||
                req.body[f] === ""
        );

        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Missing fields",
                missing,
            });
        }

        /* --------------------------------------------------
           3️⃣ Normalize dates (array always)
        -------------------------------------------------- */
        // const dateArray = Array.isArray(dates) ? dates : [dates];

        /* --------------------------------------------------
           4️⃣ Vehicle conflict check (DATE ARRAY SAFE)
        -------------------------------------------------- */
        //     const conflictCheck = await pool.query(
        //         `
        //   SELECT id, unnest(dates) AS date
        //   FROM "VehicleBooking"
        //   WHERE vehicle_id = $1
        //   AND deleted = false
        //   `,
        //         [Number(vehicle_id)]
        //     );

        //     const conflictingDates = conflictCheck.rows
        //         .map((r) => r.date.toISOString().slice(0, 10))
        //         .filter((d) => dateArray.includes(d));

        //     if (conflictingDates.length > 0) {
        //         return res.status(400).json({
        //             success: false,
        //             message: "Vehicle already booked on selected dates",
        //             conflictDates: conflictingDates,
        //         });
        //     }
        const conflictCheck = await pool.query(
            `
    SELECT id
    FROM "VehicleBooking"
    WHERE vehicle_id = $1
    AND deleted = false
    AND NOT (
        end_datetime <= $2
        OR start_datetime >= $3
    )
    `,
            [
                Number(vehicle_id),
                start_datetime,
                end_datetime
            ]
        );

        if (conflictCheck.rowCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Vehicle already booked during this time range"
            });
        }

        /* --------------------------------------------------
           5️⃣ Insert booking
        -------------------------------------------------- */
        const insertResult = await pool.query(
            `
    INSERT INTO "VehicleBooking"
    (
        vehicle_id,
        driver_id,
        requestor,
        department_id,
        start_datetime,
        end_datetime,
        purpose,
        destination,
        booker_id,
        deleted,
        payment,
        status
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Pending')
    RETURNING *
    `,
            [
                Number(vehicle_id),
                driver_id ? Number(driver_id) : null,
                requestor,
                Number(department_id),
                start_datetime,
                end_datetime,
                purpose,
                destination,
                Number(booker_id),
                deleted,
                Number(payment),
            ]
        );


        res.status(201).json({
            success: true,
            booking: insertResult.rows[0],
        });
    } catch (err) {
        console.error("❌ Vehicle booking error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to create vehicle booking",
            details: err.message,
        });
    }
});

module.exports = router;
