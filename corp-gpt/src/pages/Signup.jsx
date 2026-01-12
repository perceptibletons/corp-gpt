import React, { useState } from "react";
import axios from "axios";
import "./Signup.css"; // we will write CSS below

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",  
    password: "",
    companyId: "",
    inviteCode: "",
    phone: "",
    role: "employee",
  });

  const [proof, setProof] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setMessage("");
  };

  const handleFileChange = (e) => {
    setProof(e.target.files[0]);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("companyId", form.companyId);
      formData.append("inviteCode", form.inviteCode);
      formData.append("phone", form.phone);
      formData.append("role", form.role);
      if (proof) formData.append("proof", proof);

      const res = await axios.post(
        "http://127.0.0.1:8000/api/auth/signup",
        formData,
        
      );

      setMessage(res.data.message || "Signup successful. Check your email.");
      setForm({
        name: "",
        email: "",
        password: "",
        companyId: "",
        inviteCode: "",
        phone: "",
        role: "employee",
      });
      setProof(null);
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Signup failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-card" onSubmit={handleSubmit}>
        <h2>Create Account</h2>

        <div className="grid">
          <input type="text" name="name" placeholder="Full Name"
            value={form.name} onChange={handleChange} required />

          <input type="email" name="email" placeholder="Email"
            value={form.email} onChange={handleChange} required />

          <input type="password" name="password" placeholder="Password"
            value={form.password} onChange={handleChange} required />

          <select name="role" value={form.role} onChange={handleChange}>
            <option value="employee">Employee</option>
            <option value="intern">Intern</option>
            <option value="manager">Manager</option>
            <option value="hr">HR</option>
          </select>

          <input type="text" name="companyId" placeholder="Company ID"
            value={form.companyId} onChange={handleChange} />

          <input type="text" name="inviteCode" placeholder="Invite Code"
            value={form.inviteCode} onChange={handleChange} />

          <input type="text" name="phone" placeholder="Phone Number"
            value={form.phone} onChange={handleChange} />
        </div>

        <div className="file-upload">
          <label>Upload Proof Document:</label>
          <input type="file" onChange={handleFileChange} />
          {proof && <small>Selected: {proof.name}</small>}
        </div>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}
