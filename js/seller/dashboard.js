import { apiGet, apiPost } from "../api.js";

// --------------------
// LOAD DASHBOARD
// --------------------
async function loadDashboard() {
  const res = await apiGet("/api/seller/listings");

  if (!res.ok) {
    alert("Seller login required");
    return;
  }

  // STATS
  if (res.stats) {
    document.getElementById("stat-pending").innerText =
      "Pending: " + res.stats.pending;
    document.getElementById("stat-live").innerText =
      "Live: " + res.stats.live;
    document.getElementById("stat-expired").innerText =
      "Expired: " + res.stats.expired;
  }

  const tbody = document.getElementById("listingRows");
  tbody.innerHTML = "";

  if (!res.listings || res.listings.length === 0) {
    tbody.innerHTML =
      "<tr><td colspan='4'>No listings found</td></tr>";
    return;
  }

  for (const l of res.listings) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${l.title || "-"}</td>
      <td>${l.status}</td>
      <td>${l.price || "-"}</td>
      <td>${renderAction(l)}</td>
    `;

    tbody.appendChild(tr);
  }
}

// --------------------
// ACTION RENDER
// --------------------
function renderAction(l) {
  if (l.status === "waiting_payment") {
    return `
      <button onclick="payNow('${l.listingId}')">
        Pay ₹${l.payableAmount}
      </button>
    `;
  }

  if (l.status === "live") {
    return "LIVE ✅";
  }

  if (l.status === "expired") {
    return `
      <button onclick="renew('${l.listingId}')">
        RENEW
      </button>
    `;
  }

  if (l.status === "pending") {
    return "Waiting for admin";
  }

  return "-";
}

// --------------------
// PAY NOW
// --------------------
window.payNow = async function (listingId) {
  const res = await apiPost("/api/payments/createPaymentLink", {
    listingId
  });

  if (!res.ok || !res.paymentLink) {
    alert(res.error || "Payment link failed");
    return;
  }

  // Redirect to Razorpay
  window.location.href = res.paymentLink;
};

// --------------------
// RENEW (AFTER EXPIRY)
// --------------------
window.renew = async function (listingId) {
  const res = await apiPost("/api/seller/startRenew", { listingId });

  if (!res.ok) {
    alert(res.error || "Renew failed");
    return;
  }

  alert("Renew started. Please complete payment.");
  loadDashboard();
};

// --------------------
loadDashboard();
