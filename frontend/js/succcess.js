const API_BASE = "https://api.kopitenggeklarkin.com"; // guna domain primary Render kau

const params = new URLSearchParams(window.location.search);
const bookingId = params.get("booking_id");

if (!bookingId) {
  document.body.innerHTML =
    "<h2>Booking ID tidak dijumpai dalam URL.</h2>";
  throw new Error("Missing booking_id");
}

async function loadBooking() {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/${bookingId}`);

    if (!res.ok) {
      throw new Error("API response not OK");
    }

    const booking = await res.json();

    console.log("BOOKING DATA:", booking);

    document.getElementById("name").textContent =
      booking.customer_name || "-";

    document.getElementById("bookingId").textContent =
      booking.id || "-";

    document.getElementById("date").textContent =
      booking.booking_date
        ? booking.booking_date.split("T")[0]
        : "-";

  } catch (err) {
    console.error("FETCH ERROR:", err);
    document.body.innerHTML =
      "<h2>Tempahan berjaya tetapi gagal papar maklumat.</h2>";
  }
}

loadBooking();