// ===============================
// PAYMENT PAGE SCRIPT (FINAL)
// ===============================

// ⭐ TAMBAHAN: Caj transaksi Billplz
const TRANSACTION_FEE = 1.60;

// Ambil booking_id
const bookingId = localStorage.getItem('booking_id');

if (!bookingId) {
  alert('Booking tidak dijumpai. Sila buat tempahan semula.');
  window.location.href = 'booking.html';
}

// Element button
const payBtn = document.getElementById('payBtn');

// ===============================
// LOAD MAKLUMAT BOOKING
// ===============================
async function loadBooking() {
  try {
    const res = await fetch(`http://localhost:3000/api/booking/${bookingId}`);

    if (!res.ok) {
      throw new Error('Gagal ambil data booking');
    }

    const data = await res.json();

    const buffetAmount = Number(data.total_amount);
    const finalAmount = buffetAmount + TRANSACTION_FEE;

    document.getElementById('name').textContent = data.customer_name;
    document.getElementById('phone').textContent = data.phone;
    document.getElementById('date').textContent =
      data.booking_date.split('T')[0];
    document.getElementById('pax').textContent = data.total_pax;

    // ⭐ TAMBAHAN: Papar yuran & jumlah sebenar
    document.getElementById('fee').textContent =
      TRANSACTION_FEE.toFixed(2);

    document.getElementById('amount').textContent =
      finalAmount.toFixed(2);

  } catch (err) {
    console.error('LOAD BOOKING ERROR:', err);
    alert('Gagal papar maklumat tempahan.');
  }
}

loadBooking();

// ===============================
// BUTTON SAHKAN BAYARAN (KEKAL)
// ===============================
payBtn.addEventListener('click', async () => {
  payBtn.disabled = true;
  payBtn.textContent = 'Menghubungkan ke Billplz...';

  try {
    const res = await fetch('http://localhost:3000/api/payment/billplz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        booking_id: bookingId
      })
    });

    if (!res.ok) {
      throw new Error('Backend gagal cipta bill');
    }

    const data = await res.json();

    if (!data.payment_url) {
      throw new Error('Payment URL tidak diterima');
    }

    // 🔥 REDIRECT KE BILLPLZ
    window.location.href = data.payment_url;

  } catch (err) {
    console.error('PAYMENT ERROR:', err);
    alert('Gagal sambung ke sistem bayaran. Sila cuba semula.');

    payBtn.disabled = false;
    payBtn.textContent = 'SAHKAN BAYARAN';
  }
});

