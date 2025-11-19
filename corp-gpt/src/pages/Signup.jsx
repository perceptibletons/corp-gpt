import React, { useState, useRef } from "react";
import Topbar from "../components/Topbar";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyId: "",
    inviteCode: "",
    phone: "",
    role: "employee"   // NEW
  });

  const [proof, setProof] = useState(null);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setError("");

    const fd = new FormData();
    Object.entries(form).forEach(([key, val]) => fd.append(key, val));
    if (proof) fd.append("proof", proof);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || "Signup failed");

      setMsg(data.message);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setError("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message);

      setMsg("Email verified successfully!");
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Topbar />
      <div className="container" style={{ maxWidth: 600, marginTop: "2rem" }}>
        <h2>Signup for CorpGPT</h2>

        {step === 1 && (
          <form onSubmit={handleSignup}>
            <input name="name" placeholder="Full Name" onChange={handleChange} required />
            <input name="email" type="email" placeholder="Corporate Email" onChange={handleChange} required />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
            <input name="companyId" placeholder="Company ID" onChange={handleChange} />
            <input name="inviteCode" placeholder="Invite Code" onChange={handleChange} />
            <input name="phone" placeholder="Phone" onChange={handleChange} />

            {/* ROLE DROPDOWN */}
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="employee">Employee</option>
              <option value="intern">Intern</option>
            </select>

            {/* PROOF UPLOAD */}
            <input type="file" accept=".pdf,image/*" ref={fileRef} onChange={(e) => setProof(e.target.files[0])} />

            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Signup"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerify}>
            <p>Enter the OTP sent to <strong>{form.email}</strong></p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {step === 3 && (
          <div>
            <p style={{ color: "green" }}>Your email is verified!</p>
            <p>Now wait for admin approval before logging in.</p>
            <p>You can now <a href="/login">go to login</a>.</p>
          </div>
        )}

        {msg && <p style={{ color: "green" }}>{msg}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}
