// ===============================
// SUCCESS PAGE – FINAL & SELAMAT
// ===============================

const API_BASE = "https://buffet-booking-system.onrender.com";
const bookingId = localStorage.getItem("booking_id");

// Jika tiada booking_id → bukan flow sah
if (!bookingId) {
  window.location.href = "payment-failed.html";
}

async function loadReceipt() {
  try {
    const res = await fetch(`${API_BASE}/api/booking/${bookingId}`);

    if (!res.ok) throw new Error("Booking not found");

    const data = await res.json();

    // Papar maklumat sebenar
    document.getElementById("r-name").textContent =
      data.customer_name || "-";

    document.getElementById("r-id").textContent =
      data.id || bookingId;

    document.getElementById("r-date").textContent =
      new Date(data.booking_date).toLocaleDateString("ms-MY");

    // Optional: clear selepas 30 saat (elak refresh ulang)
    setTimeout(() => {
      localStorage.removeItem("booking_id");
    }, 30000);

  } catch (err) {
    console.error(err);
    window.location.href = "payment-failed.html";
  }
}

loadReceipt();

