const bookingId = localStorage.getItem('booking_id');

if (!bookingId) {
  window.location.href = 'payment-failed.html';
}

async function loadReceipt() {
  try {
    const res = await fetch(
      `https://buffet-booking-system.onrender.com/api/bookings/${bookingId}`
    );

    if (!res.ok) throw new Error('Failed fetch booking');

    const data = await res.json();

    document.getElementById('custName').textContent =
      data.customer_name || '-';

    document.getElementById('bookingId').textContent =
      data.id || bookingId;

    document.getElementById('bookingDate').textContent =
      new Date(data.booking_date).toLocaleDateString('ms-MY');

    // OPTIONAL: clear selepas papar
    setTimeout(() => {
      localStorage.removeItem('booking_id');
    }, 30000);

  } catch (err) {
    console.error(err);
    window.location.href = 'payment-failed.html';
  }
}

loadReceipt();
