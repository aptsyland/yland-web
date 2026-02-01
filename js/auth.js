// js/auth.js

export function setToken(token) {
  localStorage.setItem("yland_token", token);
}

export function getToken() {
  return localStorage.getItem("yland_token");
}

export function clearToken() {
  localStorage.removeItem("yland_token");
}

export function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: "Bearer " + token } : {})
  };
}
