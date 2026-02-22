const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const crypto = require('crypto');

const PRICE_ADULT = 49.9;
const PRICE_CHILD = 39.9;

/**
 * =====================================================
 * STEP 1: CREATE PAYMENT (NO DB INSERT HERE)
 * =====================================================
 */
router.post('/create', async (req, res) => {
  try {
    const { booking_date, adult, child, email, customer_name, phone } = req.body;

    if (!booking_date || !customer_name || !phone) {
      return res.status(400).json({ error: 'Maklumat tidak lengkap' });
    }

    // 🚫 BLOCK BOOKING HARI INI
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(booking_date);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate.getTime() === today.getTime()) {
      return res.status(400).json({
        error: "Tempahan untuk hari ini telah ditutup."
      });
    }

    const adultNum = Number(adult) || 0;
    const childNum = Number(child) || 0;

    const total_pax = adultNum + childNum;
    const total_amount = (adultNum * PRICE_ADULT) + (childNum * PRICE_CHILD);

    if (total_pax <= 0) {
      return res.status(400).json({ error: 'Jumlah pax tidak sah' });
    }

    // Generate bill_id
    const bill_id = 'BILL_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

    // Temporary memory storage (⚠ not for real production cluster)
    global.tempBookings = global.tempBookings || {};

    global.tempBookings[bill_id] = {
      booking_date,
      adult: adultNum,
      child: childNum,
      total_pax,
      total_amount,
      email,
      customer_name,
      phone
    };

    return res.json({
      bill_id,
      total_amount,
      payment_url: `https://payment-gateway.com/pay/${bill_id}`
    });

  } catch (err) {
    console.error('CREATE ERROR:', err.message);
    return res.status(500).json({ error: 'Create payment failed' });
  }
});


/**
 * =====================================================
 * STEP 2: PAYMENT WEBHOOK (ONLY HERE INSERT TO DB)
 * =====================================================
 */
router.post('/webhook', async (req, res) => {
  try {
    const { bill_id, status, signature } = req.body;

    if (!bill_id || !status || !signature) {
      return res.status(400).send('Invalid payload');
    }

    // 🔐 VERIFY SIGNATURE
    const secret = process.env.PAYMENT_SECRET;

    const hash = crypto
      .createHmac('sha256', secret)
      .update(bill_id + status)
      .digest('hex');

    if (hash !== signature) {
      return res.status(400).send('Invalid signature');
    }

    // Jika bukan SUCCESS → cleanup sahaja
    if (status !== 'SUCCESS') {
      if (global.tempBookings?.[bill_id]) {
        delete global.tempBookings[bill_id];
      }
      return res.status(200).send('Payment failed');
    }

    // Pastikan belum pernah insert (idempotent safety)
    const existing = await pool.query(
      'SELECT id FROM bookings WHERE bill_id = $1',
      [bill_id]
    );

    if (existing.rows.length > 0) {
      return res.status(200).json({
        message: 'Already processed',
        booking_id: existing.rows[0].id
      });
    }

    const booking = global.tempBookings?.[bill_id];

    if (!booking) {
      return res.status(400).send('Booking data not found');
    }

    const result = await pool.query(
      `INSERT INTO bookings
      (booking_date, adult, child, total_pax, total_amount, email, customer_name, phone, bill_id, payment_status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'PAID')
      RETURNING id, booking_date, customer_name`,
      [
        booking.booking_date,
        booking.adult,
        booking.child,
        booking.total_pax,
        booking.total_amount,
        booking.email,
        booking.customer_name,
        booking.phone,
        bill_id
      ]
    );

    // cleanup memory
    delete global.tempBookings[bill_id];

    return res.status(200).json({
      message: 'Payment confirmed',
      booking_id: result.rows[0].id,
      booking_date: result.rows[0].booking_date,
      customer_name: result.rows[0].customer_name
    });

  } catch (err) {
    console.error('WEBHOOK ERROR:', err.message);
    return res.status(500).send('Webhook error');
  }
});


module.exports = router;