const express = require('express');
const router = express.Router();
const pool = require('../config/db');

const PRICE_ADULT = 49.9;
const PRICE_CHILD = 39.9;
const MAX_PAX_PER_DAY = 180;

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

    // ✅ Validate date format
    const parsedDate = new Date(booking_date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        error: 'Format tarikh tidak sah'
      });
    }

    // 🚫 BLOCK BOOKING HARI INI
    const today = new Date();
    today.setHours(0,0,0,0);

    const selectedDate = new Date(booking_date);
    selectedDate.setHours(0,0,0,0);

    if (selectedDate.getTime() === today.getTime()) {
      return res.status(400).json({
        error: "Tempahan untuk hari ini telah ditutup."
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

    /**
     * 🔥 CHECK LIMIT 200 PAX (PAID ONLY)
     */
    const existing = await pool.query(
      `SELECT COALESCE(SUM(total_pax),0) AS total
       FROM bookings
       WHERE booking_date = $1
       AND payment_status = 'PAID'`,
      [booking_date]
    );

    const currentPaidPax = Number(existing.rows[0].total);
    const remainingPax = MAX_PAX_PER_DAY - currentPaidPax;

    if (remainingPax <= 0) {
      return res.status(400).json({
        error: 'Tarikh ini telah penuh (180 pax).'
      });
    }

    if (total_pax > remainingPax) {
      return res.status(400).json({
        error: `Baki pax tinggal ${remainingPax} sahaja untuk tarikh ini.`
      });
    }

    const total_amount =
      (adultNum * PRICE_ADULT) +
      (childNum * PRICE_CHILD);

    // ✅ INSERT PENDING
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

/**
 * =====================================================
 * GET AVAILABLE PAX BY DATE
 * =====================================================
 */
router.get('/availability/:date', async (req, res) => {
  try {
    const { date } = req.params;

    const MAX_PAX_PER_DAY = 180;

    const result = await pool.query(
      `SELECT COALESCE(SUM(total_pax),0) AS total
       FROM bookings
       WHERE booking_date = $1
       AND payment_status = 'PAID'`,
      [date]
    );

    const used = Number(result.rows[0].total);
    const remaining = MAX_PAX_PER_DAY - used;

    return res.json({
      date,
      used,
      remaining: remaining < 0 ? 0 : remaining
    });

  } catch (err) {
    console.error('AVAILABILITY ERROR:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;