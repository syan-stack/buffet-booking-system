const params = new URLSearchParams(window.location.search);
const bookingId = params.get("booking_id");

if (!bookingId) {
  document.body.innerHTML = "<h2>Booking ID tidak dijumpai</h2>";
  throw new Error("No booking id");
}

async function loadBooking() {
  try {
    const res = await fetch(
      `https://buffet-booking-system.onrender.com/api/bookings/${bookingId}`
    );

    const booking = await res.json();

    document.getElementById("receipt-id").textContent = booking.id;
    document.getElementById("receipt-name").textContent = booking.customer_name;
    document.getElementById("receipt-date").textContent =
      booking.booking_date.split("T")[0];
    document.getElementById("receipt-pax").textContent =
      booking.total_pax;
    document.getElementById("receipt-amount").textContent =
      booking.total_amount;

  } catch (err) {
    console.error("SUCCESS PAGE ERROR:", err);
    document.body.innerHTML = "<h2>Tempahan berjaya tetapi gagal papar maklumat.</h2>";
  }
}

loadBooking();