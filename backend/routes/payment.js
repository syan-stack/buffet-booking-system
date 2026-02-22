const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const pool = require('../config/db');

const router = express.Router();
const TRANSACTION_FEE = 1.60;

/**
 * =====================================================
 * CREATE BILL
 * =====================================================
 */
router.post('/billplz', async (req, res) => {
  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id diperlukan' });
    }

    const result = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [booking_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking tidak dijumpai' });
    }

    const booking = result.rows[0];

    if (booking.payment_status === 'PAID') {
      return res.status(400).json({ error: 'Booking sudah dibayar' });
    }

    if (booking.bill_id) {
      return res.json({
        payment_url: `https://www.billplz.com/bills/${booking.bill_id}`
      });
    }

    const finalAmount =
      Number(booking.total_amount) + TRANSACTION_FEE;

    const billRes = await axios.post(
      `${process.env.BILLPLZ_BASE_URL}/bills`,
      {
        collection_id: process.env.BILLPLZ_COLLECTION_ID,
        description: `Tempahan Buffet - ${booking.customer_name}`,
        email: booking.email,
        name: booking.customer_name,
        amount: Math.round(finalAmount * 100),
        callback_url: `${process.env.BASE_URL}/api/payment/callback`,
        redirect_url: `${process.env.BASE_URL}/api/payment/return`
      },
      {
        auth: {
          username: process.env.BILLPLZ_API_KEY,
          password: ''
        }
      }
    );

    await pool.query(
      'UPDATE bookings SET bill_id = $1 WHERE id = $2',
      [billRes.data.id, booking_id]
    );

    res.json({ payment_url: billRes.data.url });

  } catch (err) {
    console.error("CREATE BILL ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: 'Gagal cipta bill' });
  }
});


/**
 * =====================================================
 * RETURN (SOURCE OF TRUTH)
 * =====================================================
 */
router.get('/return', async (req, res) => {
  try {
    const billId = req.query['billplz[id]'];

    if (!billId) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failed.html`);
    }

    // Verify directly with Billplz
    const billRes = await axios.get(
      `${process.env.BILLPLZ_BASE_URL}/bills/${billId}`,
      {
        auth: {
          username: process.env.BILLPLZ_API_KEY,
          password: ''
        }
      }
    );

    const isPaid =
      billRes.data.paid === true ||
      billRes.data.paid === "true" ||
      Number(billRes.data.paid_amount) > 0;

    if (!isPaid) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failed.html`);
    }

    const update = await pool.query(
      `UPDATE bookings
       SET payment_status = 'PAID'
       WHERE bill_id = $1
       RETURNING id`,
      [billId]
    );

    if (update.rows.length === 0) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failed.html`);
    }

    const bookingId = update.rows[0].id;

    return res.redirect(
      `${process.env.FRONTEND_URL}/success.html?booking_id=${bookingId}`
    );

  } catch (err) {
    console.error("RETURN ERROR:", err.response?.data || err.message);
    return res.redirect(`${process.env.FRONTEND_URL}/payment-failed.html`);
  }
});


/**
 * =====================================================
 * CALLBACK (OPTIONAL - NOT REQUIRED FOR SUCCESS FLOW)
 * =====================================================
 */
router.post('/callback', async (req, res) => {
  try {
    const { id: bill_id, paid } = req.body;

    if (paid === true || paid === "true") {
      await pool.query(
        `UPDATE bookings
         SET payment_status = 'PAID'
         WHERE bill_id = $1`,
        [bill_id]
      );
    }

    res.send('OK');

  } catch (err) {
    console.error("CALLBACK ERROR:", err.message);
    res.send('OK');
  }
});

module.exports = router;