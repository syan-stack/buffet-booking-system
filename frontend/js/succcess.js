const bookingId = localStorage.getItem('booking_id');

if (!bookingId) {
  window.location.href = 'payment-failed.html';
}

async function verifyPayment() {
  const res = await fetch(`http://localhost:3000/api/booking/${bookingId}`);
  const data = await res.json();

  // ❌ JIKA BUKAN PAID
  if (data.payment_status !== 'PAID') {
    window.location.href = 'payment-failed.html';
  }
}

verifyPayment();
