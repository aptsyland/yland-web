import { apiPost } from "../api.js";

const statusBox = document.getElementById("uploadStatus");
const uploadBtn = document.getElementById("uploadBtn");
const submitBtn = document.getElementById("submitBtn");

const photosEl = document.getElementById("photos");
const videoEl = document.getElementById("video");
const docsEl = document.getElementById("docs");

let uploaded = {
  photos: false,
  video: false,
  docs: false
};

// --------------------
// VALIDATIONS
// --------------------
function validateFiles() {
  if (photosEl.files.length > 10) {
    alert("Max 10 photos allowed");
    return false;
  }

  if (videoEl.files[0] && videoEl.files[0].size > 300 * 1024 * 1024) {
    alert("Video too large (max ~5 min)");
    return false;
  }

  if (docsEl.files[0] && docsEl.files[0].size > 10 * 1024 * 1024) {
    alert("PDF max size 10MB");
    return false;
  }

  return true;
}

// --------------------
// UPLOAD HANDLER (TEMP SIMULATION)
// --------------------
async function uploadMedia() {
  if (!validateFiles()) return;

  statusBox.innerText = "Uploading media...";

  // TEMP: backend already has signed URL pipeline
  // For now simulate success

  setTimeout(() => {
    uploaded.photos = photosEl.files.length > 0;
    uploaded.video = !!videoEl.files[0];
    uploaded.docs = !!docsEl.files[0];

    statusBox.innerText = "Media uploaded successfully";
    submitBtn.disabled = false;
  }, 1200);
}

// --------------------
// SUBMIT FOR REVIEW
// --------------------
async function submitDraft() {
  statusBox.innerText = "Submitting for review...";

  const res = await apiPost("/api/seller/draft/submit", {});

  if (!res.ok) {
    alert(res.error || "Submit failed");
    return;
  }

  alert("Draft submitted successfully!");
  location.href = "seller.html";
}

// --------------------
uploadBtn.onclick = uploadMedia;
submitBtn.onclick = submitDraft;
