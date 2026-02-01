import { setToken } from "./auth.js";
import { API_BASE } from "./utils/config.js";

document.getElementById("loginBtn").onclick = async () => {
  const phone = document.getElementById("phone").value.trim();
  const otp = document.getElementById("otp").value.trim();
  const msg = document.getElementById("msg");

  if (!phone || !otp) {
    msg.innerText = "Enter phone & OTP";
    return;
  }

  msg.innerText = "Logging in...";

  const res = await fetch(API_BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp })
  });

  const data = await res.json();

  if (!data.ok) {
    msg.innerText = data.error || "Login failed";
    return;
  }

  // ✅ SAVE TOKEN
  setToken(data.token);

  // ✅ REDIRECT BASED ON ROLE
  if (data.role === "seller") {
    location.href = "seller.html";
  } else {
    location.href = "index.html";
  }
};
