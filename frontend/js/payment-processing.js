const params = new URLSearchParams(window.location.search);

// Ambil booking_id yang kita hantar sendiri
const bookingId = params.get("booking_id");

// Ambil status paid dari Billplz
const paid = params.get("billplz[paid]");

if (!bookingId) {
  window.location.href = "payment-failed.html";
}

// ✅ Jika Billplz sahkan bayaran berjaya
if (paid === "true") {
  window.location.href = `success.html?booking_id=${bookingId}`;
} else {
  // ❌ Jika gagal atau batal
  window.location.href = "payment-failed.html";
}
