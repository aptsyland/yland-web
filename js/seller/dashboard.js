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

function daysBetween(dateStr) {
  if (!dateStr) return null;

  const today = new Date();
  const target = new Date(dateStr);

  const diffMs = target - today;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// --------------------
// ACTION RENDER
// --------------------
function renderAction(l) {
  // 🔹 LIVE LISTING
  if (l.status === "live") {
    const daysLeft = daysBetween(l.expiresAt);

    if (daysLeft !== null) {
      if (daysLeft > 0) {
        return `
          LIVE ✅<br/>
          <small style="color:#d97706">
            ⏰ Expires in ${daysLeft} day${daysLeft > 1 ? "s" : ""}
          </small>
        `;
      }

      // safety fallback
      return "LIVE ✅";
    }

    return "LIVE ✅";
  }

  // 🔹 WAITING PAYMENT
  if (l.status === "waiting_payment") {
    return `
      <button onclick="payNow('${l.listingId}')">
        Pay ₹${l.payableAmount}
      </button><br/>
      <button onclick="openProof('${l.listingId}')">
        Payment Failed?
      </button>
    `;
  }

  // 🔹 EXPIRED (GRACE PERIOD)
  if (l.status === "expired") {
    const daysAfterExpiry = daysBetween(l.deletedAt || l.expiredAt);

    if (daysAfterExpiry !== null && daysAfterExpiry < 0) {
      const graceLeft = Math.abs(daysAfterExpiry);

      if (graceLeft <= 6) {
        return `
          <span style="color:red">Expired</span><br/>
          <small>
            🕒 ${6 - graceLeft} days left to renew
          </small><br/>
          <button onclick="renew('${l.listingId}')">RENEW</button>
        `;
      }
    }

    return `
      <span style="color:red">Expired</span><br/>
      <button onclick="renew('${l.listingId}')">RENEW</button>
    `;
  }

  // 🔹 PENDING
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

  window.location.href = res.paymentLink;
};

// --------------------
// RENEW
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
// PAYMENT PROOF FLOW
// --------------------
let currentListingId = null;

window.openProof = function (listingId) {
  currentListingId = listingId;
  document.getElementById("proofModal").style.display = "block";
};

window.closeProof = function () {
  document.getElementById("proofModal").style.display = "none";
  document.getElementById("proofFile").value = "";
  document.getElementById("proofRef").value = "";
};

// --------------------
// SUBMIT PROOF (FINAL)
// --------------------
window.submitProof = async function () {
  const file = document.getElementById("proofFile").files[0];
  const ref = document.getElementById("proofRef").value.trim();

  if (!file || !ref) {
    alert("Upload proof image and reference required");
    return;
  }

  try {
    // 1️⃣ Get signed URL for proof upload
    const signRes = await apiPost("/api/seller/getUploadUrl", {
      fileName: file.name,
      fileType: file.type,
      mediaType: "payment-proof"
    });

    if (!signRes.ok || !signRes.uploadUrl || !signRes.objectKey) {
      alert("Failed to get upload URL");
      return;
    }

    // 2️⃣ Upload proof image to R2
    await fetch(signRes.uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type
      }
    });

    // 3️⃣ Inform backend with reference + proof key
    const res = await apiPost("/api/seller/uploadPaymentProof", {
      listingId: currentListingId,
      reference: ref,
      proofKey: signRes.objectKey
    });

    if (!res.ok) {
      alert(res.error || "Proof submit failed");
      return;
    }

    alert("Payment proof submitted. Admin will verify.");
    closeProof();
    loadDashboard();

  } catch (e) {
    alert("Proof upload failed");
  }
};

// --------------------
loadDashboard();
