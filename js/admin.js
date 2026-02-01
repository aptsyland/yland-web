import { apiGet, apiPost } from "./api.js";

async function loadAdmin() {
  const res = await apiGet("/api/admin/listings");

  if (!res.ok) {
    alert("Admin login required");
    return;
  }

  const tbody = document.getElementById("adminRows");
  tbody.innerHTML = "";

  for (const l of res.listings) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${l.listingId}</td>
      <td>${l.title || "-"}</td>
      <td>${l.status}</td>
      <td>${renderAction(l)}</td>
    `;

    tbody.appendChild(tr);
  }
}

function renderAction(l) {
  if (l.status === "pending") {
    return `
      <input type="number" id="amt-${l.listingId}" placeholder="Amount ₹" />
      <button onclick="approve('${l.listingId}')">Approve</button>
      <button onclick="reject('${l.listingId}')">Reject</button>
    `;
  }

  if (l.status === "live") {
    return `<button onclick="pause('${l.listingId}')">Pause</button>`;
  }

  if (l.status === "paused") {
    return `<button onclick="resume('${l.listingId}')">Resume</button>`;
  }

  return "-";
}

// ✅ ADMIN ACTIONS
window.approve = async function (listingId) {
  const amt = document.getElementById("amt-" + listingId).value;

  if (!amt) {
    alert("Enter amount");
    return;
  }

  const res = await apiPost("/api/admin/approveListing", {
    listingId,
    amount: Number(amt)
  });

  if (!res.ok) {
    alert(res.error || "Approve failed");
    return;
  }

  alert("Approved & waiting payment");
  loadAdmin();
};

window.reject = async function (listingId) {
  if (!confirm("Reject listing?")) return;

  const res = await apiPost("/api/admin/rejectListing", {
    listingId
  });

  if (!res.ok) {
    alert(res.error || "Reject failed");
    return;
  }

  loadAdmin();
};

window.pause = async function (listingId) {
  const res = await apiPost("/api/admin/pauseListing", { listingId });
  if (res.ok) loadAdmin();
};

window.resume = async function (listingId) {
  const res = await apiPost("/api/admin/resumeListing", { listingId });
  if (res.ok) loadAdmin();
};

// INIT
loadAdmin();
