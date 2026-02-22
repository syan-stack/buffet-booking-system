const params = new URLSearchParams(window.location.search);
const bookingId = params.get("booking_id");

if (!bookingId) {
  window.location.href = "payment-failed.html";
}

async function loadBooking() {
  try {
    const res = await fetch(
      `https://buffet-booking-system.onrender.com/api/bookings/${bookingId}`
    );

    if (!res.ok) throw new Error();

    const booking = await res.json();

    document.getElementById("receipt-id").textContent = booking.id;
    document.getElementById("receipt-name").textContent = booking.customer_name;
    document.getElementById("receipt-date").textContent =
      booking.booking_date.split("T")[0];
    document.getElementById("receipt-pax").textContent =
      booking.total_pax;
    document.getElementById("receipt-amount").textContent =
      booking.total_amount;

  } catch {
    window.location.href = "payment-failed.html";
  }
}

loadBooking();