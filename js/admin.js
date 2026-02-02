import { apiGet, apiPost } from "./api.js";

const tbody = document.getElementById("pendingRows");

// --------------------
// LOAD PENDING LISTINGS
// --------------------
async function loadPending() {
  const res = await apiGet("/api/admin/pendingListings");

  if (!res.ok) {
    alert("Admin login required");
    return;
  }

  tbody.innerHTML = "";

  if (!res.listings || res.listings.length === 0) {
    tbody.innerHTML =
      "<tr><td colspan='4'>No pending listings</td></tr>";
    return;
  }

  for (const l of res.listings) {
    const tr = document.createElement("tr");

    let actionHtml = "-";

    // 🔹 PENDING → approve / reject
    if (l.status === "pending") {
      actionHtml = `
        <input
          type="number"
          id="amt-${l.listingId}"
          placeholder="Amount ₹"
          style="width:90px"
        />
        <button onclick="approve('${l.listingId}')">Approve</button>
        <button onclick="reject('${l.listingId}')">Reject</button>
      `;
    }

    // 🔹 PAYMENT PROOF SUBMITTED → manual confirm
    else if (l.status === "waiting_payment" && l.paymentProof) {
      actionHtml = `
        <button onclick="confirmPaid('${l.listingId}')">
          Mark as PAID
        </button>
      `;
    }

    tr.innerHTML = `
      <td>${l.title || "-"}</td>
      <td>${l.sellerName || "-"}</td>
      <td>${l.status}</td>
      <td>${actionHtml}</td>
    `;

    tbody.appendChild(tr);
  }
}

// --------------------
// MANUAL PAID CONFIRM
// --------------------
window.confirmPaid = async function (listingId) {
  if (!confirm("Confirm payment received?")) return;

  const res = await apiPost("/api/admin/markPaidManual", { listingId });

  if (!res.ok) {
    alert(res.error || "Manual confirm failed");
    return;
  }

  alert("Marked as PAID. Listing is LIVE.");
  loadPending();
};

// --------------------
// APPROVE LISTING
// --------------------
window.approve = async function (listingId) {
  const amtEl = document.getElementById("amt-" + listingId);
  const amount = Number(amtEl.value);

  if (!amount || amount <= 0) {
    alert("Please enter valid amount");
    return;
  }

  const res = await apiPost("/api/admin/approveListing", {
    listingId,
    amount
  });

  if (!res.ok) {
    alert(res.error || "Approve failed");
    return;
  }

  alert("Approved. Seller waiting for payment.");
  loadPending();
};

// --------------------
// REJECT LISTING
// --------------------
window.reject = async function (listingId) {
  const reason = prompt("Enter reject reason");

  if (!reason || !reason.trim()) {
    alert("Reject reason required");
    return;
  }

  const res = await apiPost("/api/admin/rejectListing", {
    listingId,
    reason
  });

  if (!res.ok) {
    alert(res.error || "Reject failed");
    return;
  }

  alert("Listing rejected");
  loadPending();
};

// --------------------
loadPending();
