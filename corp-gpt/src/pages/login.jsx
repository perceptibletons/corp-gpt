import React, { useState } from "react";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Safe JSON parser (prevents crash)
  async function safeJson(res) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  // STEP 1 — /login/start
  async function handleLoginStart(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");

    try {
      const res = await fetch("/api/auth/login/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data.detail || data.message || "Invalid credentials");
      }

      setMsg("OTP sent to your email!");
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // STEP 2 — /login/verify
  async function handleVerifyOTP(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");

    try {
      const res = await fetch("/api/auth/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data.detail || data.message || "Invalid OTP");
      }

      // Save tokens
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("role", data.role);

      setMsg("Login successful!");

      // Redirect based on role
      if (data.role === "admin" || data.role === "superadmin") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Welcome Back</h2>

        {/* STEP 1 — PASSWORD LOGIN */}
        {step === 1 && (
          <form onSubmit={handleLoginStart}>
            <input
              className="login-input"
              type="email"
              placeholder="Corporate Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              className="login-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Login"}
            </button>
          </form>
        )}

        {/* STEP 2 — OTP LOGIN */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <p className="otp-info">
              Enter the OTP sent to <strong>{email}</strong>
            </p>

            <input
              className="login-input"
              type="text"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {msg && <p className="login-msg">{msg}</p>}
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}
