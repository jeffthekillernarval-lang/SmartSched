const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// GET /api/download-reports
router.get('/', async (req, res) => {
    console.log('DOWNLOAD REPORTS HIT');
    try {
        // VENUE BOOKINGS
        const venueResult = await pool.query(`
            SELECT
                id,
                event_name,
                event_facility,
                event_date,
                starting_time,
                ending_time,
                requested_by,
                organization,
                contact,
                status,
                creator_id
            FROM "Booking"
            ORDER BY event_date DESC
        `);

        // VEHICLE BOOKINGS
        const vehicleResult = await pool.query(`
            SELECT
                id,
                "vehicle_Type",
                requestor,
                department,
                date,
                purpose,
                booker_id,
                deleted
            FROM "VehicleBooking"
            ORDER BY date DESC
        `);

        let csv = '';

        /* =======================
           VENUE BOOKINGS SECTION
        ======================== */
        csv += 'VENUE BOOKINGS\n';
        csv += 'ID,Event Name,Facility,Event Date,Start Time,End Time,Requested By,Organization,Contact,Status,Creator ID\n';

        venueResult.rows.forEach(b => {
            csv += `${b.id},"${b.event_name}","${b.event_facility}",${b.event_date},${b.starting_time},${b.ending_time},"${b.requested_by}","${b.organization}",${b.contact},${b.status},${b.creator_id}\n`;
        });

        csv += '\n\n';

        /* =======================
           VEHICLE BOOKINGS SECTION
        ======================== */
        csv += 'VEHICLE BOOKINGS\n';
        csv += 'ID,Vehicle Type,Requestor,Department,Date,Purpose,Booker ID,Deleted\n';

        vehicleResult.rows.forEach(v => {
            csv += `${v.id},"${v.vehicle_Type}","${v.requestor}","${v.department}",${v.date},"${v.purpose}",${v.booker_id},${v.deleted}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="bookings_report.csv"'
        );

        res.send(csv);

    } catch (err) {
        console.error('Download reports error:', err);
        res.status(500).json({ success: false, message: 'Failed to download reports' });
    }
});

module.exports = router;
