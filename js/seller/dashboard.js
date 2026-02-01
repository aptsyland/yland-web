import { apiGet, apiPost } from "../api.js";

async function loadDashboard() {
  const res = await apiGet("/api/seller/listings");

  if (!res.ok) {
    alert("Please login as seller");
    return;
  }

  // stats
  document.getElementById("stat-pending").innerText =
    "Pending: " + res.stats.pending;

  document.getElementById("stat-live").innerText =
    "Live: " + res.stats.live;

  document.getElementById("stat-expired").innerText =
    "Expired: " + res.stats.expired;

  const tbody = document.getElementById("listingRows");
  tbody.innerHTML = "";

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

function renderAction(l) {
  if (l.status === "expired") {
    return `<button onclick="startRenew('${l.listingId}')">RENEW</button>`;
  }

  if (l.status === "pending") {
    return "Waiting for admin";
  }

  if (l.status === "waiting_payment") {
  return `
    <button onclick="payNow('${l.listingId}')">
      Pay ₹${l.payableAmount || ""}
    </button>
  `;
}


  return "-";
}

// ✅ CORRECT RENEW HANDLER
window.startRenew = async function (listingId) {
  const res = await apiPost("/api/seller/startRenew", {
    listingId
  });

  if (!res.ok) {
    alert(res.error || "Renew failed");
    return;
  }

  alert("Renew started. Please complete payment.");
  location.reload();
};

loadDashboard();


// 💰 PAY NOW HANDLER
window.payNow = async function (listingId) {
  const res = await apiPost("/api/payments/createPaymentLink", {
    listingId
  });

  if (!res.ok) {
    alert(res.error || "Payment link failed");
    return;
  }

  // redirect to Razorpay
  window.location.href = res.paymentLink;
};

