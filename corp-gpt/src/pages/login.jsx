import React, { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message);

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("role", data.role); // NEW (backend includes role)

      setMsg("Login successful!");

      // role-based redirect:
      const role = data.role;

      switch (role) {
        case "superadmin":
          window.location.href = "/superadmin/dashboard";
          break;
        case "admin":
          window.location.href = "/admin/dashboard";
          break;
        case "manager":
          window.location.href = "/manager/dashboard";
          break;
        case "hr":
          window.location.href = "/hr/dashboard";
          break;
        case "accountant":
          window.location.href = "/finance/dashboard";
          break;
        case "intern":
          window.location.href = "/intern/dashboard";
          break;
        default:
          window.location.href = "/dashboard";
      }
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 400 }}>
      <h2>Sign in</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Corporate Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="TOTP Code (if enabled)"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Authenticating..." : "Login"}
        </button>
      </form>

      {msg && <p style={{ color: msg.includes("failed") ? "red" : "green" }}>{msg}</p>}
    </div>
  );
}
