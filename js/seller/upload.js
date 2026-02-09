import { apiPost } from "../api.js";

const statusBox = document.getElementById("uploadStatus");
const uploadBtn = document.getElementById("uploadBtn");
const submitBtn = document.getElementById("submitBtn");
const progressBox = document.getElementById("progressBox");
const progressEl = document.getElementById("uploadProgress");

const photosEl = document.getElementById("photos");
const videoEl = document.getElementById("video");
const docsEl = document.getElementById("docs");
const uploadedList = document.getElementById("uploadedList");

// 🔒 Track uploaded files
const uploaded = {
  photo: [],
  video: [],
  document: []
};

// 🆕 prevent double upload click
let isUploading = false;

// ===============================
// 🆕 STEP–1 : IMAGE PROCESS STATE
// ===============================
const processedPhotos = new Map(); // key: original file name → value: webp Blob

// --------------------
// VALIDATION
// --------------------
function validateBeforeUpload() {
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
// SIGNED UPLOAD
// --------------------
async function uploadFile(file, type) {
  const res = await apiPost("/api/seller/getUploadUrl", {
    fileName: file.name,
    fileType: file.type,
    mediaType: type
  });

  if (!res.ok || !res.uploadUrl || !res.objectKey) {
    throw new Error("Signed URL failed");
  }

  await fetch(res.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type }
  });

  uploaded[type].push({
    name: file.name,
    key: res.objectKey
  });

  renderUploadedList();
}

// --------------------
// PHOTO PREVIEW (EXISTING)
// --------------------
function renderPhotoPreview(files) {
  const previewBox =
    document.getElementById("photoPreview") ||
    (() => {
      const div = document.createElement("div");
      div.id = "photoPreview";
      div.style.display = "flex";
      div.style.gap = "8px";
      div.style.flexWrap = "wrap";
      photosEl.parentNode.appendChild(div);
      return div;
    })();

  previewBox.innerHTML = "";

  Array.from(files).forEach(file => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.style.width = "80px";
    img.style.height = "60px";
    img.style.objectFit = "cover";
    previewBox.appendChild(img);
  });
}

// ===============================
// 🆕 STEP–1.1 : SQUARE + WEBP LOGIC
// ===============================
function squareCanvas(img) {
  const size = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - size) / 2;
  const sy = (img.naturalHeight - size) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);

  return canvas;
}

function convertToWebP(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = squareCanvas(img);
      canvas.toBlob(
        blob => {
          if (!blob) return reject();
          resolve(blob);
        },
        "image/webp",
        0.9
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ===============================
// 🆕 PHOTO CHANGE HANDLER (PREVIEW + PROCESS)
// ===============================
photosEl.addEventListener("change", async e => {
  renderPhotoPreview(e.target.files);

  processedPhotos.clear();

  for (const file of e.target.files) {
    try {
      const webpBlob = await convertToWebP(file);
      processedPhotos.set(file.name, webpBlob);
    } catch (e) {
      alert("Image processing failed");
    }
  }
});

// --------------------
// UPLOAD ALL
// --------------------
async function uploadAll() {
  if (isUploading) return;
  if (!validateBeforeUpload()) return;

  isUploading = true;

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
    // 🆕 upload processed photos if available
    if (processedPhotos.size > 0) {
      for (const [name, blob] of processedPhotos.entries()) {
        const file = new File([blob], name.replace(/\.\w+$/, ".webp"), {
          type: "image/webp"
        });
        await uploadFile(file, "photo");
        done++; updateProgress();
      }
    } else {
      for (const f of photosEl.files) {
        await uploadFile(f, "photo");
        done++; updateProgress();
      }
    }

    if (videoEl.files[0]) {
      await uploadFile(videoEl.files[0], "video");
      done++; updateProgress();
    }

    if (docsEl.files[0]) {
      await uploadFile(docsEl.files[0], "document");
      done++; updateProgress();
    }

    statusBox.innerText = "Upload complete";

    if (uploaded.photo.length > 0 || uploaded.video.length > 0) {
      submitBtn.disabled = false;
    }

  } catch (e) {
    alert("Upload failed");
    statusBox.innerText = "Upload failed";
  } finally {
    isUploading = false;
    progressBox.style.display = "none";
  }
}

// --------------------
// RENDER UPLOADED FILES
// --------------------
function renderUploadedList() {
  uploadedList.innerHTML = "";

  Object.keys(uploaded).forEach(type => {
    uploaded[type].forEach((f, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${type.toUpperCase()}: ${f.name}
        <button onclick="removeFile('${type}', ${index})">❌</button>
      `;
      uploadedList.appendChild(li);
    });
  });
}

// --------------------
// REMOVE FILE (UI ONLY)
// --------------------
window.removeFile = function (type, index) {
  uploaded[type].splice(index, 1);
  renderUploadedList();

  if (uploaded.photo.length === 0 && uploaded.video.length === 0) {
    submitBtn.disabled = true;
  }
};

// --------------------
// SUBMIT FOR REVIEW
// --------------------
async function submitDraft() {
  if (uploaded.photo.length === 0 && uploaded.video.length === 0) {
    alert("At least 1 photo or video required");
    return;
  }

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
