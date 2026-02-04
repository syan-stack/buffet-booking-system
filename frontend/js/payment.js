const API_BASE = "https://buffet-booking-system.onrender.com";

// ⭐ TAMBAHAN: Caj transaksi Billplz
const TRANSACTION_FEE = 1.60;

const bookingId = localStorage.getItem('booking_id');

if (!bookingId) {
  alert('Booking tidak dijumpai. Sila buat tempahan semula.');
  window.location.href = 'booking.html';
}

const payBtn = document.getElementById('payBtn');

async function loadBooking() {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/${bookingId}`);

    if (!res.ok) throw new Error('Gagal ambil data booking');

    const data = await res.json();

    const buffetAmount = Number(data.total_amount);
    const finalAmount = buffetAmount + TRANSACTION_FEE;

    document.getElementById('name').textContent = data.customer_name;
    document.getElementById('phone').textContent = data.phone;
    document.getElementById('date').textContent = data.booking_date.split('T')[0];
    document.getElementById('pax').textContent = data.total_pax;
    document.getElementById('fee').textContent = TRANSACTION_FEE.toFixed(2);
    document.getElementById('amount').textContent = finalAmount.toFixed(2);

  } catch (err) {
    console.error(err);
    alert('Gagal papar maklumat tempahan.');
  }
}

loadBooking();

payBtn.addEventListener('click', async () => {
  payBtn.disabled = true;
  payBtn.textContent = 'Menghubungkan ke Billplz...';

  try {
    // 🔥 FIX UTAMA: ENDPOINT CREATE PAYMENT BETUL
    const res = await fetch(
      `${API_BASE}/api/payment/create/${bookingId}`,
      { method: 'POST' }
    );

    if (!res.ok) throw new Error('Gagal cipta bil');

    const data = await res.json();

    window.location.href = data.payment_url;

  } catch (err) {
    console.error(err);
    alert('Gagal sambung ke sistem bayaran.');
    payBtn.disabled = false;
    payBtn.textContent = 'SAHKAN BAYARAN';
  }
});
