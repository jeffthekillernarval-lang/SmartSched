const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.post('/', async (req, res) => {
    console.log('REQ BODY:', req.body);

    const { booking_id, equipment } = req.body;

    // Validate booking_id
    if (!booking_id) {
        return res.status(400).json({ success: false, error: 'booking_id is required' });
    }

    // Validate equipment array
    if (!Array.isArray(equipment) || equipment.length === 0) {
        return res.status(400).json({ success: false, error: 'equipment must be a non-empty array' });
    }

    const client = await pool.connect();

    try {
        // Check if booking exists
        const bookingCheck = await client.query(
            `SELECT id FROM "Booking" WHERE id = $1`,
            [booking_id]
        );

        if (bookingCheck.rowCount === 0) {
            return res.status(400).json({ success: false, error: 'Invalid booking_id' });
        }

        await client.query('BEGIN');

        // Insert each equipment item
        for (const eq of equipment) {
            // Convert quantity to integer
            const quantity = parseInt(eq.quantity, 10);

            if (!eq.type || isNaN(quantity) || quantity < 1) {
                throw new Error(`Invalid equipment entry: ${JSON.stringify(eq)}`);
            }

            await client.query(
                `INSERT INTO "Equipment" (type, quantity, booking_id)
         VALUES ($1, $2, $3)`,
                [eq.type, quantity, booking_id]
            );
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `${equipment.length} equipment item(s) added to booking ${booking_id}`,
            booking_id
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('CREATE EQUIPMENT ERROR:', err);
        res.status(500).json({ success: false, error: err.message || 'Failed to create equipment' });
    } finally {
        client.release();
    }
});

module.exports = router;
