import { apiGet, apiPost } from "../api.js";

let draftId = null;

async function initDraft() {
  // 1️⃣ Check localStorage
  draftId = localStorage.getItem("draftId");

  // 2️⃣ Create draft if not exists
  if (!draftId) {
    const res = await apiPost("/api/seller/createDraft", {});
    if (!res.ok) {
      alert("Draft create failed");
      return;
    }

    draftId = res.draftId;
    localStorage.setItem("draftId", draftId);
  }

  // 3️⃣ Load draft
  const draftRes = await apiGet(
    "/api/seller/getDraft?draftId=" + draftId
  );

  if (!draftRes.ok) {
    alert("Failed to load draft");
    return;
  }

  document.getElementById("draftStatus").innerText =
    "Draft ID: " + draftId;

  fillForm(draftRes.draft.data || {});
}

function fillForm(data) {
  document.getElementById("title").value = data.title || "";
  document.getElementById("category").value = data.category || "";
  document.getElementById("price").value = data.price || "";
}

// 💾 SAVE DRAFT
document.getElementById("saveBtn").onclick = async () => {
  const payload = {
    title: document.getElementById("title").value,
    category: document.getElementById("category").value,
    price: Number(document.getElementById("price").value) || null
  };

  const res = await apiPost("/api/seller/updateDraft", {
    draftId,
    data: payload
  });

  if (!res.ok) {
    alert(res.error || "Save failed");
    return;
  }

  alert("Draft saved");
};

// ➡️ NEXT STEP
document.getElementById("nextBtn").onclick = () => {
  location.href = "seller-upload.html";
};

// INIT
initDraft();
