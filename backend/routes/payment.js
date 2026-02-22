const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const pool = require('../config/db');

const router = express.Router();
const TRANSACTION_FEE = 1.60;


/**
 * =====================================================
 * CREATE BILLPLZ BILL
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

    // 🚫 Jangan create bill kalau dah PAID
    if (booking.payment_status === 'PAID') {
      return res.status(400).json({ error: 'Booking sudah dibayar' });
    }

    // 🔁 Reuse existing bill
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
    console.error('BILLPLZ ERROR:', err.response?.data || err.message);
    res.status(500).json({ error: 'Gagal cipta bill' });
  }
});


/**
 * =====================================================
 * CALLBACK (SECURE WEBHOOK)
 * =====================================================
 */
router.post('/callback', async (req, res) => {
  try {
    const signature = req.headers['x-signature'];
    const rawBody = JSON.stringify(req.body);

    if (!signature) {
      return res.status(400).send('No signature');
    }

    const expected = crypto
      .createHmac('sha256', process.env.BILLPLZ_X_SIGNATURE_KEY)
      .update(rawBody)
      .digest('hex');

    if (signature !== expected) {
      return res.status(400).send('Invalid signature');
    }

    const { id: bill_id, paid } = req.body;

    if (paid === true) {
      await pool.query(
        `UPDATE bookings
         SET payment_status = 'PAID'
         WHERE bill_id = $1 AND payment_status != 'PAID'`,
        [bill_id]
      );
    }

    res.send('OK');

  } catch (err) {
    console.error('CALLBACK ERROR:', err.message);
    res.send('OK');
  }
});


/**
 * =====================================================
 * RETURN FROM BILLPLZ (SOURCE OF TRUTH)
 * =====================================================
 */
router.get('/return', async (req, res) => {
  try {
    const billId = req.query.billplz?.id;

    if (!billId) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failed.html`);
    }

    const result = await pool.query(
      'SELECT * FROM bookings WHERE bill_id = $1',
      [billId]
    );

    if (result.rows.length === 0) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failed.html`);
    }

    const booking = result.rows[0];

    // 🔥 Verify direct with Billplz
    const billRes = await axios.get(
      `${process.env.BILLPLZ_BASE_URL}/bills/${billId}`,
      {
        auth: {
          username: process.env.BILLPLZ_API_KEY,
          password: ''
        }
      }
    );

    if (billRes.data.paid === true) {

      if (booking.payment_status !== 'PAID') {
        await pool.query(
          `UPDATE bookings SET payment_status = 'PAID' WHERE id = $1`,
          [booking.id]
        );
      }

      return res.redirect(
        `${process.env.FRONTEND_URL}/success.html?booking_id=${booking.id}&date=${booking.booking_date}&name=${encodeURIComponent(booking.customer_name)}`
      );
    }

    return res.redirect(`${process.env.FRONTEND_URL}/payment-failed.html`);

  } catch (err) {
    console.error('RETURN ERROR:', err.message);
    return res.redirect(`${process.env.FRONTEND_URL}/payment-failed.html`);
  }
});


/**
 * =====================================================
 * VERIFY API
 * =====================================================
 */
router.get('/verify/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    const result = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    );

    if (result.rows.length === 0) {
      return res.json({ status: 'FAILED' });
    }

    const booking = result.rows[0];

    if (!booking.bill_id) {
      return res.json({ status: 'FAILED' });
    }

    const billRes = await axios.get(
      `${process.env.BILLPLZ_BASE_URL}/bills/${booking.bill_id}`,
      {
        auth: {
          username: process.env.BILLPLZ_API_KEY,
          password: ''
        }
      }
    );

    if (billRes.data.paid === true) {
      await pool.query(
        `UPDATE bookings SET payment_status = 'PAID' WHERE id = $1`,
        [bookingId]
      );
      return res.json({ status: 'PAID' });
    }

    return res.json({ status: 'FAILED' });

  } catch (err) {
    console.error('VERIFY ERROR:', err.message);
    return res.json({ status: 'FAILED' });
  }
});

module.exports = router;