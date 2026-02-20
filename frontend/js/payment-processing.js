const API_BASE = "https://buffet-booking-system.onrender.com";

const params = new URLSearchParams(window.location.search);
const bookingId = params.get("booking_id");

if (!bookingId) {
  window.location.href = "payment-failed.html";
}

let attempt = 0;
const MAX_ATTEMPT = 10; // tunggu maksimum 20 saat

async function verifyPayment() {
  try {

    const res = await fetch(`${API_BASE}/api/payment/verify/${bookingId}`);
    const data = await res.json();

    // ✅ Jika PAID → terus success
    if (data.status === "PAID") {
      window.location.href = `success.html?booking_id=${bookingId}`;
      return;
    }

    // 🔥 Jika masih PENDING → tunggu lagi
    if (data.status === "PENDING" && attempt < MAX_ATTEMPT) {
      attempt++;
      setTimeout(verifyPayment, 2000);
      return;
    }

    // ❌ Jika betul-betul gagal
    window.location.href = "payment-failed.html";

  } catch (err) {
    console.error(err);

    if (attempt < MAX_ATTEMPT) {
      attempt++;
      setTimeout(verifyPayment, 2000);
      return;
    }

    window.location.href = "payment-failed.html";
  }
}

verifyPayment();
