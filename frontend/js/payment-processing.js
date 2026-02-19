const API_BASE = "https://buffet-booking-system.onrender.com";

const bookingId = localStorage.getItem('booking_id');

if (!bookingId) {
  window.location.href = 'payment-failed.html';
}

let attempt = 0;
const MAX_ATTEMPT = 10; // cuba 10 kali (20 saat)

async function verify() {
  try {

    const res = await fetch(
      `${API_BASE}/api/payment/verify/${bookingId}`
    );

    if (!res.ok) throw new Error('Verify failed');

    const data = await res.json();

    // ✅ JIKA PAID → TERUS SUCCESS
    if (data.status === 'PAID') {
      localStorage.removeItem('booking_id');
      window.location.href = 'success.html?booking_id=' + bookingId;
      return;
    }

    // 🔥 JANGAN TERUS ANGGAP FAILED
    // BERI MASA BACKEND UPDATE
    if (attempt < MAX_ATTEMPT) {
      attempt++;
      setTimeout(verify, 2000);
      return;
    }

    // ❌ SELEPAS 20 SAAT BARU FAIL
    window.location.href = 'payment-failed.html';

  } catch (err) {
    console.error(err);

    if (attempt < MAX_ATTEMPT) {
      attempt++;
      setTimeout(verify, 2000);
      return;
    }

    window.location.href = 'payment-failed.html';
  }
}

verify();
