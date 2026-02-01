import { apiGet, apiPost } from "../api.js";

const statusBox = document.getElementById("draftStatus");
const saveBtn = document.getElementById("saveDraftBtn");
const nextBtn = document.getElementById("nextBtn");
const validationMsg = document.getElementById("validationMsg");

const titleEl = document.getElementById("title");
const priceEl = document.getElementById("price");
const typeEl = document.getElementById("type");
const descEl = document.getElementById("description");

let currentDraftId = null;
let autoSaveTimer = null;

// --------------------
// BASIC VALIDATION
// --------------------
function isValid() {
  if (!titleEl.value.trim()) {
    validationMsg.innerText = "Title is required";
    return false;
  }
  if (!priceEl.value || Number(priceEl.value) <= 0) {
    validationMsg.innerText = "Valid price is required";
    return false;
  }
  if (!typeEl.value) {
    validationMsg.innerText = "Please select property type";
    return false;
  }
  validationMsg.innerText = "";
  return true;
}

// --------------------
// LOAD OR CREATE DRAFT
// --------------------
async function loadDraft() {
  statusBox.innerText = "Checking existing draft...";

  const res = await apiGet("/api/seller/draft");

  if (!res.ok) {
    statusBox.innerText = "New draft mode";
    return;
  }

  const d = res.draft;
  currentDraftId = d.draftId;

  titleEl.value = d.title || "";
  priceEl.value = d.price || "";
  typeEl.value = d.type || "";
  descEl.value = d.description || "";

  statusBox.innerText =
    "Draft loaded. Last saved: " +
    new Date(d.updatedAt).toLocaleString();

  if (isValid()) nextBtn.disabled = false;
}

// --------------------
// SAVE DRAFT
// --------------------
async function saveDraft(showAlert = true) {
  if (!isValid()) return;

  statusBox.innerText = "Saving draft...";

  const payload = {
    draftId: currentDraftId,
    title: titleEl.value.trim(),
    price: Number(priceEl.value),
    type: typeEl.value,
    description: descEl.value
  };

  const res = await apiPost("/api/seller/draft/save", payload);

  if (!res.ok) {
    statusBox.innerText = "Save failed";
    if (showAlert) alert(res.error || "Draft save failed");
    return;
  }

  currentDraftId = res.draftId;
  statusBox.innerText = "Draft saved at " + new Date().toLocaleString();
  nextBtn.disabled = false;
}

// --------------------
// AUTO SAVE (30 sec)
// --------------------
function startAutoSave() {
  autoSaveTimer = setInterval(() => {
    if (isValid()) saveDraft(false);
  }, 30000);
}

// --------------------
// EVENTS
// --------------------
saveBtn.onclick = () => saveDraft(true);

nextBtn.onclick = async () => {
  await saveDraft(false);
  location.href = "seller-upload.html";
};

// --------------------
loadDraft();
startAutoSave();
