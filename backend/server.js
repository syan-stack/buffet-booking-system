require('dotenv').config();

const express = require('express');
const cors = require('cors');

const bookingRoutes = require('./routes/booking');
const paymentRoutes = require('./routes/payment');

const app = express();

/**
 * ==============================
 * IMPORTANT: BODY PARSERS
 * ==============================
 */

// CORS
app.use(cors());

// WAJIB UNTUK JSON
app.use(express.json());

// WAJIB UNTUK BILLPLZ CALLBACK
app.use(express.urlencoded({ extended: true }));

/**
 * ==============================
 * ROUTES
 * ==============================
 */

app.use('/api/bookings', bookingRoutes);
app.use('/api/payment', paymentRoutes);

/**
 * ==============================
 * HEALTH CHECK
 * ==============================
 */

app.get('/', (req, res) => {
  res.send('API running 🚀');
});

/**
 * ==============================
 * START SERVER
 * ==============================
 */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});