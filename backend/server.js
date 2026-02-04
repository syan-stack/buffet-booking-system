require('dotenv').config();
const express = require('express');
const cors = require('cors');

const bookingRoutes = require('./routes/booking');
const paymentRoutes = require('./routes/payment');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/bookings', bookingRoutes); // 🔥 FIX MUKTAMAD
app.use('/api/payment', paymentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

