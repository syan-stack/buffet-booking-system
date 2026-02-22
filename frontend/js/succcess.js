const API_BASE = "https://api.kopitenggeklarkin.com";

const params = new URLSearchParams(window.location.search);
const bookingId = params.get("booking_id");

if (!bookingId) {
  document.body.innerHTML =
    "<h2>Booking ID tidak dijumpai.</h2>";
  throw new Error("Missing booking_id");
}

async function loadBooking() {
  try {
    const response = await fetch(
      `${API_BASE}/api/bookings/${bookingId}`
    );

    if (!response.ok) {
      throw new Error("API Error");
    }

    const data = await response.json();

    // 🔥 PASTIKAN ID MATCH DENGAN HTML
    document.getElementById("name").textContent =
      data.customer_name;

    document.getElementById("bookingId").textContent =
      data.id;

    document.getElementById("date").textContent =
      data.booking_date.split("T")[0];

  } catch (err) {
    console.error("SUCCESS PAGE ERROR:", err);
    document.body.innerHTML =
      "<h2>Tempahan berjaya tetapi gagal papar maklumat.</h2>";
  }
}

loadBooking();