const bookingId = localStorage.getItem('booking_id');

if (!bookingId) {
  window.location.href = 'payment-failed.html';
}

async function verifyPayment() {
  const res = await fetch(`https://buffet-booking-system.onrender.com`);
  const data = await res.json();

  // ❌ JIKA BUKAN PAID
  if (data.payment_status !== 'PAID') {
    window.location.href = 'payment-failed.html';
  }
}

verifyPayment();
