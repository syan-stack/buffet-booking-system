const API_BASE = "https://buffet-booking-system.onrender.com";

const bookingId = localStorage.getItem('booking_id');

if (!bookingId) {
  window.location.href = 'payment-failed.html';
}

async function verify() {
  try {
    const res = await fetch(
      `${API_BASE}/api/payment/verify/${bookingId}`
    );

    if (!res.ok) throw new Error('Verify failed');

    const data = await res.json();

    if (data.status === 'PAID') {
      localStorage.removeItem('booking_id');
      window.location.href = 'success.html';
      return;
    }

    if (data.status === 'PENDING') {
      setTimeout(verify, 2000);
      return;
    }

    window.location.href = 'payment-failed.html';

  } catch (err) {
    console.error(err);
    window.location.href = 'payment-failed.html';
  }
}

verify();
