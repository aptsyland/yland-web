import { getToken, authHeaders } from "./auth.js";
import { API_BASE } from "./utils/config.js";

// --------------------
// INIT MAP
// --------------------
const map = L.map("map").setView([16.5, 80.6], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19
}).addTo(map);

// --------------------
// LOAD PINS (GUEST SAFE)
// --------------------
async function loadPins() {
  try {
    const res = await fetch(API_BASE + "/api/map/pins", {
      headers: authHeaders() // token ఉంటే పంపుతుంది, లేకపోతే empty
    });

    const data = await res.json();
    if (!data.ok) return;

    for (const p of data.pins) {
      const marker = L.marker([p.lat, p.lng]).addTo(map);
      marker.on("click", () => onPinClick(p.listingId, p.lat, p.lng));
    }
  } catch (err) {
    console.error("Map pin load failed", err);
  }
}

loadPins();

// --------------------
// PIN CLICK HANDLER
// --------------------
async function onPinClick(listingId, lat, lng) {
  const token = getToken();

  // 🔒 GUEST RULE (FINAL LOCK)
  if (!token) {
    alert("Property details చూడాలంటే login అవ్వాలి");
    location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(
      API_BASE + "/api/map/popup?listingId=" + listingId,
      {
        headers: authHeaders()
      }
    );

    const data = await res.json();

    if (!data.ok) {
      alert("Property load కాలేదు");
      return;
    }

    L.popup()
      .setLatLng([lat, lng])
      .setContent(`
        <b>${data.title}</b><br/>
        Price: ₹${data.price}<br/>
        <small>${data.category}</small>
      `)
      .openOn(map);

  } catch (err) {
    alert("Server error");
    console.error(err);
  }
}
