import { apiGet, apiPost } from "../api.js";

const draftId = localStorage.getItem("draftId");

if (!draftId) {
  alert("Draft not found. Please create draft first.");
  location.href = "seller-draft.html";
}

// --------------------
// HELPERS
// --------------------
async function uploadFile(uploadUrl, file) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }
}

function showInfo(msg) {
  document.getElementById("info").innerText = msg;
}

// --------------------
// LIST EXISTING FILES
// --------------------
async function loadLists() {
  const photos = await apiGet(
    "/api/media/listTempPhotos?draftId=" + draftId
  );
  const videos = await apiGet(
    "/api/media/listTempVideos?draftId=" + draftId
  );
  const docs = await apiGet(
    "/api/media/listTempDocuments?draftId=" + draftId
  );

  renderList("photoList", photos.files || []);
  renderList("videoList", videos.files || []);
  renderList("docList", docs.files || []);
}

function renderList(id, files) {
  const ul = document.getElementById(id);
  ul.innerHTML = "";

  for (const f of files) {
    const li = document.createElement("li");
    li.innerText = f.key.split("/").pop();
    ul.appendChild(li);
  }
}

// --------------------
// PHOTO UPLOAD
// --------------------
document.getElementById("uploadPhotoBtn").onclick = async () => {
  const file = document.getElementById("photoInput").files[0];
  if (!file) return alert("Select a photo");

  showInfo("Uploading photo...");

  const res = await apiPost("/api/media/getPhotoUploadUrl", {
    draftId,
    filename: file.name
  });

  if (!res.ok) return alert(res.error);

  await uploadFile(res.uploadUrl, file);
  showInfo("Photo uploaded");
  loadLists();
};

// --------------------
// VIDEO UPLOAD
// --------------------
document.getElementById("uploadVideoBtn").onclick = async () => {
  const file = document.getElementById("videoInput").files[0];
  if (!file) return alert("Select a video");

  showInfo("Uploading video...");

  const res = await apiPost("/api/media/getVideoUploadUrl", {
    draftId,
    filename: file.name
  });

  if (!res.ok) return alert(res.error);

  await uploadFile(res.uploadUrl, file);
  showInfo("Video uploaded");
  loadLists();
};

// --------------------
// DOC UPLOAD
// --------------------
document.getElementById("uploadDocBtn").onclick = async () => {
  const file = document.getElementById("docInput").files[0];
  if (!file) return alert("Select a document");

  showInfo("Uploading document...");

  const res = await apiPost("/api/media/getDocUploadUrl", {
    draftId,
    filename: file.name
  });

  if (!res.ok) return alert(res.error);

  await uploadFile(res.uploadUrl, file);
  showInfo("Document uploaded");
  loadLists();
};

// --------------------
// SUBMIT LISTING
// --------------------
document.getElementById("submitBtn").onclick = async () => {
  if (!confirm("Submit listing for admin approval?")) return;

  const res = await apiPost("/api/seller/submitDraft", {
    draftId
  });

  if (!res.ok) {
    alert(res.error || "Submit failed");
    return;
  }

  // cleanup local draft
  localStorage.removeItem("draftId");

  alert("Listing submitted successfully");
  location.href = "seller.html";
};

// INIT
loadLists();
