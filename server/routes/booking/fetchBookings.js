router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM "Booking" WHERE deleted = false`);
        const bookings = result.rows.map((booking) => ({
            ...booking,
            schedules: booking.schedules ? JSON.parse(booking.schedules) : [], // Parse schedules JSONB
        }));

        res.json({ success: true, bookings });
    } catch (err) {
        console.error('Fetch bookings error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
