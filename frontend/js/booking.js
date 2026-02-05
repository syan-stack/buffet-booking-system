const API_BASE = "https://buffet-booking-system.onrender.com";

const adultInput = document.getElementById('adult');
const childInput = document.getElementById('child');
const paxEl = document.getElementById('total_pax');
const amountEl = document.getElementById('total_amount');

function updateSummary() {
  const adult = Number(adultInput.value || 0);
  const child = Number(childInput.value || 0);

  paxEl.textContent = adult + child;
  amountEl.textContent = (adult * 49.9 + child * 39.9).toFixed(2);
}

adultInput.addEventListener('input', updateSummary);
childInput.addEventListener('input', updateSummary);

updateSummary();

document.getElementById('payBtn').addEventListener('click', submitBooking);

async function submitBooking() {
  const payload = {
    customer_name: document.getElementById('customer_name').value,
    phone: document.getElementById('phone').value,
    booking_date: document.getElementById('booking_date').value,
    adult: Number(adultInput.value),
    child: Number(childInput.value),
    email: document.getElementById('email').value
  };

  try {
    const res = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Booking failed');

    const data = await res.json();

    // ✅ INI FIX MUKTAMAD
    localStorage.setItem('booking_id', data.id);

    window.location.href = 'payment.html';

  } catch (err) {
    alert('Gagal buat tempahan');
    console.error(err);
  }
}
