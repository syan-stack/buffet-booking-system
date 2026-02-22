const API_BASE = "https://buffet-booking-system.onrender.com";
const TRANSACTION_FEE = 1.60;

const bookingId = localStorage.getItem('booking_id');

if (!bookingId) {
  alert('Booking tidak dijumpai. Sila buat tempahan semula.');
  window.location.href = 'booking.html';
  throw new Error("Booking ID missing");
}

const payBtn = document.getElementById('payBtn');

async function loadBooking() {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/${bookingId}`);

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Gagal ambil data booking");
      return;
    }

    const buffetAmount = Number(data.total_amount);
    const finalAmount = buffetAmount + TRANSACTION_FEE;

    document.getElementById('name').textContent = data.customer_name;
    document.getElementById('phone').textContent = data.phone;
    document.getElementById('date').textContent =
      data.booking_date.split('T')[0];
    document.getElementById('pax').textContent = data.total_pax;
    document.getElementById('fee').textContent =
      TRANSACTION_FEE.toFixed(2);
    document.getElementById('amount').textContent =
      finalAmount.toFixed(2);

  } catch (err) {
    console.error(err);
    alert('Server tidak dapat dihubungi.');
  }
}

loadBooking();

payBtn.addEventListener('click', async () => {
  payBtn.disabled = true;
  payBtn.textContent = 'Menghubungkan ke Billplz...';

  try {
    const res = await fetch(`${API_BASE}/api/payment/billplz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Gagal cipta bil");
      payBtn.disabled = false;
      payBtn.textContent = 'SAHKAN BAYARAN';
      return;
    }

    window.location.href = data.payment_url;

  } catch (err) {
    console.error(err);
    alert('Gagal sambung ke sistem bayaran.');
    payBtn.disabled = false;
    payBtn.textContent = 'SAHKAN BAYARAN';
  }
});