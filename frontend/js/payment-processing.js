const bookingId = localStorage.getItem('booking_id');

if (!bookingId) {
  window.location.href = 'payment-failed.html';
}

async function verify() {
  try {
    const res = await fetch(
      `https://buffet-booking-system.onrender.com`
    );

    const data = await res.json();

    if (data.status === 'PAID') {
      localStorage.removeItem('booking_id'); // cleanup
      window.location.href = 'success.html';
    } else {
      window.location.href = 'payment-failed.html';
    }

  } catch (err) {
    console.error("Verify error:", err);
    window.location.href = 'payment-failed.html';
  }
}

verify();


