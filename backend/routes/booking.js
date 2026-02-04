const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.post('/', async (req, res) => {
  try {
    const { booking_date, adult, child, email, customer_name, phone } = req.body;

    if (!booking_date || !customer_name || !phone) {
      return res.status(400).json({ error: 'Maklumat tidak lengkap' });
    }

    const total_pax = adult + child;
    const total_amount = adult * 49.9 + child * 39.9;

    const result = await pool.query(
      `INSERT INTO bookings
      (booking_date, adult, child, total_pax, total_amount, email, customer_name, phone)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [booking_date, adult, child, total_pax, total_amount, email, customer_name, phone]
    );

    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Booking failed' });
  }
});

router.get('/:id', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM bookings WHERE id = $1',
    [req.params.id]
  );
  res.json(result.rows[0]);
});

module.exports = router;




