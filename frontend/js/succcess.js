const params = new URLSearchParams(window.location.search);
const bookingId = params.get('booking_id');

if (!bookingId) {
  window.location.href = 'payment-failed.html';
}

async function loadBooking() {
  const res = await fetch(
    `https://buffet-booking-system.onrender.com/api/bookings/${bookingId}`
  );
  const data = await res.json();

  document.getElementById('name').textContent = data.customer_name;
  document.getElementById('bookingId').textContent = data.id;
  document.getElementById('date').textContent =
    new Date(data.booking_date).toLocaleDateString('ms-MY');
}

loadBooking();
