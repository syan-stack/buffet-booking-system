const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * CREATE BOOKING
 */
router.post('/', async (req, res) => {
  try {
    const { booking_date, adult, child, email, customer_name, phone } = req.body;

    if (!booking_date || !customer_name || !phone) {
      return res.status(400).json({ error: 'Maklumat tidak lengkap' });
    }

    const total_pax = Number(adult) + Number(child);
    const total_amount = adult * 45.0 + child * 39.9;

    const result = await pool.query(
      `INSERT INTO bookings
      (booking_date, adult, child, total_pax, total_amount, email, customer_name, phone, payment_status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'PAID')
      RETURNING *`,
      [booking_date, adult, child, total_pax, total_amount, email, customer_name, phone]
    );

    // 👉 PENTING: hantar id secara konsisten
    res.json({
      booking_id: result.rows[0].id,
      ...result.rows[0]
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Booking failed' });
  }
});

/**
 * GET BOOKING BY ID (UNTUK SUCCESS PAGE)
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;



