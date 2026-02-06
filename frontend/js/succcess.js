const API_BASE = "https://buffet-booking-system.onrender.com";

const bookingId = localStorage.getItem("booking_id");

if (!bookingId) {
  alert("Maklumat tempahan tidak dijumpai.");
  window.location.href = "index.html";
}

document.getElementById("bookingId").textContent = bookingId;

fetch(`${API_BASE}/api/bookings/${bookingId}`)
  .then(res => res.json())
  .then(data => {
    document.getElementById("custName").textContent = data.customer_name;
    document.getElementById("bookingDate").textContent =
      new Date(data.booking_date).toLocaleDateString("ms-MY");

    // OPTIONAL: buang booking_id lepas berjaya
    localStorage.removeItem("booking_id");
  })
  .catch(() => {
    alert("Gagal papar maklumat tempahan.");
  });
