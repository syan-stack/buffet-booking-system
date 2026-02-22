const params = new URLSearchParams(window.location.search);
const bookingId = params.get("booking_id");

if (!bookingId) {
  window.location.href = "payment-failed.html";
} else {
  localStorage.setItem("booking_id", bookingId);
  window.location.href = "success.html";
}