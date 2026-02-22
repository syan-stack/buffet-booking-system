const express = require('express');
const router = express.Router();
const pool = require('../config/db');

const PRICE_ADULT = 49.9;
const PRICE_CHILD = 39.9;

/**
 * =====================================================
 * CREATE BOOKING (STATUS = PENDING)
 * =====================================================
 */
router.post('/', async (req, res) => {
  try {
    const {
      booking_date,
      adult,
      child,
      email,
      customer_name,
      phone
    } = req.body;

    // Basic validation
    if (!booking_date || !customer_name || !phone) {
      return res.status(400).json({
        error: 'Maklumat tidak lengkap'
      });
    }

    // Validate date format
    const parsedDate = new Date(booking_date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        error: 'Format tarikh tidak sah'
      });
    }

    const adultNum = Number(adult) || 0;
    const childNum = Number(child) || 0;
    const total_pax = adultNum + childNum;

    if (total_pax <= 0) {
      return res.status(400).json({
        error: 'Sila pilih sekurang-kurangnya 1 pax'
      });
    }

    const total_amount =
      (adultNum * PRICE_ADULT) +
      (childNum * PRICE_CHILD);

    const result = await pool.query(
      `INSERT INTO bookings
       (booking_date, adult, child, total_pax, total_amount, email, customer_name, phone, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'PENDING')
       RETURNING id`,
      [
        booking_date,
        adultNum,
        childNum,
        total_pax,
        total_amount,
        email,
        customer_name,
        phone
      ]
    );

    return res.json({
      booking_id: result.rows[0].id
    });

  } catch (err) {
    console.error('CREATE BOOKING ERROR:', err);
    return res.status(500).json({
      error: 'Booking failed'
    });
  }
});


/**
 * =====================================================
 * GET BOOKING BY ID
 * (ALLOW BOTH PENDING & PAID)
 * =====================================================
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          id,
          booking_date,
          customer_name,
          phone,
          email,
          total_amount,
          total_pax,
          payment_status,
          bill_id
       FROM bookings
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Booking tidak dijumpai'
      });
    }

    return res.json(result.rows[0]);

  } catch (err) {
    console.error('GET BOOKING ERROR:', err);
    return res.status(500).json({
      error: 'Server error'
    });
  }
});


module.exports = router;