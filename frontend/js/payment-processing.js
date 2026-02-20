const params = new URLSearchParams(window.location.search);

const bookingId = params.get("booking_id");
const paid = params.get("billplz[paid]");

if (!bookingId) {
  window.location.href = "payment-failed.html";
}

// ✅ BILLPLZ SUDAH SAHKAN BAYARAN
if (paid === "true") {

  // Simpan booking_id untuk success page
  localStorage.setItem("booking_id", bookingId);

  window.location.href = "success.html";
} 
// ❌ GAGAL ATAU CANCEL
else {
  window.location.href = "payment-failed.html";
}
