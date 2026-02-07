const API_BASE = "https://buffet-booking-system.onrender.com";

// 🔥 AMBIL booking_id DARI URL
const params = new URLSearchParams(window.location.search);
const bookingId = params.get("booking_id");

if (!bookingId) {
  window.location.href = "payment-failed.html";
}

async function loadReceipt() {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/${bookingId}`);

    if (!res.ok) throw new Error("Booking not found");

    const data = await res.json();

    // ✅ ISI MAKLUMAT
    document.getElementById("receipt-name").textContent =
      data.customer_name;

    document.getElementById("receipt-id").textContent =
      data.id;

    document.getElementById("receipt-date").textContent =
      data.booking_date.split("T")[0];

    document.getElementById("receipt-status").textContent =
      data.payment_status;

  } catch (err) {
    console.error(err);
    window.location.href = "payment-failed.html";
  }
}

loadReceipt();
