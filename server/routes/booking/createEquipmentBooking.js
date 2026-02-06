const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

/**
 * POST /api/create-equipment-booking
 *
 * Supports:
 * - Frontend (equipmentId already provided)
 * - Chatbot (equipment_name resolved to ID)
 */
router.post("/", async (req, res) => {
    const {
        equipments,
        departmentId,
        facilityId,
        purpose,
        timeStart,
        timeEnd,
        dates
    } = req.body;

    /* ===============================
       VALIDATION (frontend-safe)
    =============================== */
    const missing = [];

    if (!Array.isArray(equipments) || !equipments.length) missing.push("equipments");
    if (!departmentId) missing.push("departmentId");
    if (!facilityId) missing.push("facilityId");
    if (!purpose) missing.push("purpose");
    if (!timeStart) missing.push("timeStart");
    if (!timeEnd) missing.push("timeEnd");
    if (!Array.isArray(dates) || !dates.length) missing.push("dates");

    if (missing.length) {
        return res.status(400).json({
            success: false,
            message: `Missing required fields: ${missing.join(", ")}`
        });
    }

    try {
        /* ==========================================
           EQUIPMENT NAME → ID (CHATBOT FALLBACK)
        ========================================== */
        for (const eq of equipments) {
            if (!eq.equipmentId && eq.equipment_name) {
                const result = await pool.query(
                    `
                    SELECT id
                    FROM "Equipments"
                    WHERE enabled = true
                      AND LOWER(name) = LOWER($1)
                    LIMIT 1
                    `,
                    [eq.equipment_name]
                );

                if (result.rowCount === 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Equipment "${eq.equipment_name}" not found`
                    });
                }

                eq.equipmentId = result.rows[0].id;
            }

            if (!eq.equipmentId) {
                return res.status(400).json({
                    success: false,
                    message: "Equipment ID is missing"
                });
            }
        }

        /* ===============================
           CONFLICT CHECK
        =============================== */
        for (const eq of equipments) {
            for (const bookingDate of dates) {
                const conflictQuery = `
                    SELECT 1
                    FROM "Equipment"
                    WHERE equipment_type_id = $1
                      AND facility_id = $2
                      AND $3 = ANY(dates)
                      AND (
                        ($4::time < time_end AND $5::time > time_start)
                      )
                    LIMIT 1
                `;

                const { rowCount } = await pool.query(conflictQuery, [
                    eq.equipmentId,
                    facilityId,
                    bookingDate,
                    timeStart,
                    timeEnd
                ]);

                if (rowCount > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Conflict: Equipment ID ${eq.equipmentId} is already booked on ${bookingDate}`
                    });
                }
            }
        }

        /* ===============================
           INSERT BOOKINGS
        =============================== */
        for (const eq of equipments) {
            await pool.query(
                `
                INSERT INTO "Equipment" (
                    equipment_type_id,
                    quantity,
                    affiliation_id,
                    facility_id,
                    dates,
                    purpose,
                    time_start,
                    time_end
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                `,
                [
                    eq.equipmentId,
                    eq.quantity ?? 1,
                    departmentId,
                    facilityId,
                    dates,
                    purpose,
                    timeStart,
                    timeEnd
                ]
            );
        }

        return res.json({
            success: true,
            message: "Equipment booking created successfully"
        });
    } catch (err) {
        console.error("Create Equipment Booking error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to create equipment booking",
            error: err.message
        });
    }
});

module.exports = router;
