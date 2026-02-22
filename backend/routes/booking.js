const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const crypto = require('crypto');

const PRICE_ADULT = 49.9;
const PRICE_CHILD = 39.9;

/**
 * =====================================================
 * STEP 1: CREATE PAYMENT (NO DATE BLOCK, NO DB INSERT)
 * =====================================================
 */
router.post('/create', async (req, res) => {
  try {
    const { booking_date, adult, child, email, customer_name, phone } = req.body;

    // Basic validation
    if (!booking_date || !customer_name || !phone) {
      return res.status(400).json({ error: 'Maklumat tidak lengkap' });
    }

    // Validate date
    const parsedDate = new Date(booking_date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Format tarikh tidak sah' });
    }

    const adultNum = Number(adult) || 0;
    const childNum = Number(child) || 0;

    const total_pax = adultNum + childNum;

    if (total_pax <= 0) {
      return res.status(400).json({ error: 'Sila pilih sekurang-kurangnya 1 pax' });
    }

    const total_amount =
      (adultNum * PRICE_ADULT) +
      (childNum * PRICE_CHILD);

    // Generate unique bill_id
    const bill_id =
      'BILL_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

    // Ensure memory storage exists
    if (!global.tempBookings) {
      global.tempBookings = {};
    }

    // Store temporary booking
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
      success: true,
      bill_id,
      total_amount,
      payment_url: `https://payment-gateway.com/pay/${bill_id}`
    });

  } catch (err) {
    console.error('CREATE ERROR:', err);
    return res.status(500).json({ error: 'Create payment failed' });
  }
});


/**
 * =====================================================
 * STEP 2: PAYMENT WEBHOOK (INSERT ONLY WHEN SUCCESS)
 * =====================================================
 */
router.post('/webhook', async (req, res) => {
  try {
    const { bill_id, status, signature } = req.body;

    if (!bill_id || !status || !signature) {
      return res.status(400).send('Invalid payload');
    }

    if (!process.env.PAYMENT_SECRET) {
      console.error('PAYMENT_SECRET not set');
      return res.status(500).send('Server config error');
    }

    // Verify signature
    const expectedHash = crypto
      .createHmac('sha256', process.env.PAYMENT_SECRET)
      .update(bill_id + status)
      .digest('hex');

    if (expectedHash !== signature) {
      return res.status(400).send('Invalid signature');
    }

    // If payment failed → cleanup
    if (status !== 'SUCCESS') {
      if (global.tempBookings && global.tempBookings[bill_id]) {
        delete global.tempBookings[bill_id];
      }
      return res.status(200).send('Payment failed');
    }

    // Check if already inserted (avoid duplicate)
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

    if (!global.tempBookings || !global.tempBookings[bill_id]) {
      return res.status(400).send('Booking data not found');
    }

    const booking = global.tempBookings[bill_id];

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

    // Cleanup memory
    delete global.tempBookings[bill_id];

    return res.status(200).json({
      message: 'Payment confirmed',
      booking_id: result.rows[0].id,
      booking_date: result.rows[0].booking_date,
      customer_name: result.rows[0].customer_name
    });

  } catch (err) {
    console.error('WEBHOOK ERROR:', err);
    return res.status(500).send('Webhook error');
  }
});


module.exports = router;