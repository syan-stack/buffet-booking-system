const bookingId = localStorage.getItem('booking_id');

if (!bookingId) {
  window.location.href = 'payment-failed.html';
}

async function verify() {
  try {
    const res = await fetch(
      `http://localhost:3000/api/payment/verify/${bookingId}`
    );

    const data = await res.json();

    if (data.status === 'PAID') {
      window.location.href = 'success.html';
    } else {
      window.location.href = 'payment-failed.html';
    }

  } catch (err) {
    console.error(err);
    window.location.href = 'payment-failed.html';
  }
}

verify();

