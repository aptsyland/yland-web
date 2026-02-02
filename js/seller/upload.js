import { apiPost } from "../api.js";

const statusBox = document.getElementById("uploadStatus");
const uploadBtn = document.getElementById("uploadBtn");
const submitBtn = document.getElementById("submitBtn");
const progressBox = document.getElementById("progressBox");
const progressEl = document.getElementById("uploadProgress");

const photosEl = document.getElementById("photos");
const videoEl = document.getElementById("video");
const docsEl = document.getElementById("docs");

// --------------------
// VALIDATIONS
// --------------------
function validate() {
  if (photosEl.files.length > 10) {
    alert("Max 10 photos allowed");
    return false;
  }
  if (docsEl.files[0] && docsEl.files[0].size > 10 * 1024 * 1024) {
    alert("PDF must be <= 10MB");
    return false;
  }
  return true;
}

// --------------------
// UPLOAD SINGLE FILE
// --------------------
async function uploadFile(file, type) {
  // 1) Ask backend for signed URL
  const res = await apiPost("/api/seller/getUploadUrl", {
    fileName: file.name,
    fileType: file.type,
    mediaType: type
  });

  if (!res.ok || !res.uploadUrl) {
    throw new Error("Signed URL failed");
  }

  // 2) Upload directly to R2
  await fetch(res.uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type
    }
  });
}

// --------------------
// MAIN UPLOAD
// --------------------
async function uploadAll() {
  if (!validate()) return;

  statusBox.innerText = "Uploading files...";
  progressBox.style.display = "block";
  progressEl.value = 0;

  let total =
    photosEl.files.length +
    (videoEl.files[0] ? 1 : 0) +
    (docsEl.files[0] ? 1 : 0);

  let done = 0;

  const updateProgress = () => {
    progressEl.value = Math.round((done / total) * 100);
  };

  try {
    for (const f of photosEl.files) {
      await uploadFile(f, "photo");
      done++;
      updateProgress();
    }

    if (videoEl.files[0]) {
      await uploadFile(videoEl.files[0], "video");
      done++;
      updateProgress();
    }

    if (docsEl.files[0]) {
      await uploadFile(docsEl.files[0], "document");
      done++;
      updateProgress();
    }

    statusBox.innerText = "Upload complete";
    submitBtn.disabled = false;
  } catch (e) {
    alert("Upload failed");
    statusBox.innerText = "Upload failed";
  }
}

// --------------------
// SUBMIT FOR REVIEW
// --------------------
async function submitDraft() {
  const res = await apiPost("/api/seller/draft/submit", {});
  if (!res.ok) {
    alert(res.error || "Submit failed");
    return;
  }
  alert("Submitted for admin review");
  location.href = "seller.html";
}

// --------------------
uploadBtn.onclick = uploadAll;
submitBtn.onclick = submitDraft;
