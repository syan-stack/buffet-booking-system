const API_BASE = "https://buffet-booking-system.onrender.com";

// 🔥 AMBIL booking_id DARI URL (BUKAN localStorage)
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

    document.getElementById("name").textContent = data.customer_name;
    document.getElementById("bookingId").textContent = data.id;
    document.getElementById("date").textContent =
      new Date(data.booking_date).toLocaleDateString("ms-MY");

  } catch (err) {
    console.error(err);
    window.location.href = "payment-failed.html";
  }
}

loadReceipt();
