// js/utils/config.js

export const API_BASE = "https://api.yland.in";
// later replace with https://api.yland.in

export const ROUTES = {
  sellerDashboard: "/api/seller/listings",
  createDraft: "/api/seller/createDraft",
  getDraft: "/api/seller/getDraft",
  updateDraft: "/api/seller/updateDraft",
  submitDraft: "/api/seller/submitDraft",

  listTempPhotos: "/api/media/listTempPhotos",
  listTempVideos: "/api/media/listTempVideos",
  listTempDocs: "/api/media/listTempDocuments",

  uploadPhoto: "/api/media/getPhotoUploadUrl",
  uploadVideo: "/api/media/getVideoUploadUrl",
  uploadDoc: "/api/media/getDocUploadUrl",

  startRenew: "/api/seller/startRenew"
};
