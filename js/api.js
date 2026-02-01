import { API_BASE } from "./utils/config.js";
import { authHeaders, clearToken } from "./auth.js";

async function handleResponse(res) {
  if (res.status === 401) {
    clearToken();
    alert("Session expired. Please login again.");
    location.href = "login.html";
    throw new Error("Unauthorized");
  }

  const data = await res.json();

  if (!data.ok) {
    throw new Error(data.error || "API Error");
  }

  return data;
}

export async function apiGet(path) {
  const res = await fetch(API_BASE + path, {
    headers: authHeaders()
  });
  return handleResponse(res);
}

export async function apiPost(path, body = {}) {
  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body)
  });
  return handleResponse(res);
}
