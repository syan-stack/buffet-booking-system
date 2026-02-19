const API_BASE = "https://buffet-booking-system.onrender.com";

// Ambil booking_id dari URL
const params = new URLSearchParams(window.location.search);
const bookingId = params.get("booking_id");

if (!bookingId) {
  window.location.href = "payment-failed.html";
}

async function loadSuccess() {
  try {
    // 🔥 VERIFY DENGAN BACKEND
    const verifyRes = await fetch(
      `${API_BASE}/api/payment/verify/${bookingId}`
    );

    if (!verifyRes.ok) {
      throw new Error("Verify failed");
    }

    const verifyData = await verifyRes.json();

    // ❌ JIKA BUKAN PAID → TERUS FAILED
    if (verifyData.status !== "PAID") {
      window.location.href = "payment-failed.html";
      return;
    }

    // ✅ JIKA PAID → BARU LOAD BOOKING DATA
    const bookingRes = await fetch(
      `${API_BASE}/api/bookings/${bookingId}`
    );

    if (!bookingRes.ok) {
      throw new Error("Booking not found");
    }

    const booking = await bookingRes.json();

    document.getElementById("receipt-id").textContent = booking.id;
    document.getElementById("receipt-name").textContent = booking.customer_name;
    document.getElementById("receipt-date").textContent =
      booking.booking_date.split("T")[0];
    document.getElementById("receipt-pax").textContent = booking.total_pax;
    document.getElementById("receipt-amount").textContent =
      booking.total_amount;

  } catch (err) {
    console.error(err);
    window.location.href = "payment-failed.html";
  }
}

loadSuccess();
