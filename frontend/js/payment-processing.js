const bookingId = localStorage.getItem('booking_id');

if (!bookingId) {
  window.location.href = 'payment-failed.html';
}

async function verify() {
  try {
    const res = await fetch(
      `https://buffet-booking-system.onrender.com/api/payment/verify/${bookingId}`
    );

    // ✅ FIX 1: check response
    if (!res.ok) {
      throw new Error('Verify API failed');
    }

    const data = await res.json();

    // ✅ FIX 2: tolerate status PENDING seketika
    if (data.status === 'PAID') {
      localStorage.removeItem('booking_id'); // cleanup
      window.location.href = 'success.html';
      return;
    }

    if (data.status === 'PENDING') {
      // retry sekali sahaja lepas 2 saat
      setTimeout(verify, 2000);
      return;
    }

    // FAILED atau status lain
    window.location.href = 'payment-failed.html';

  } catch (err) {
    console.error("Verify error:", err);
    window.location.href = 'payment-failed.html';
  }
}

verify();
