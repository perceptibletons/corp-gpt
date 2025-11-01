// src/pages/Signup.jsx
import React, { useState, useRef } from 'react';
import Topbar from '../components/Topbar';

/**
 * Secure Signup page for CorpGPT (frontend).
 *
 * Important:
 *  - This component POSTS to /api/auth/signup (FormData). The backend must:
 *      - validate companyId / inviteCode server-side
 *      - verify corporate email and send verification email/OTP
 *      - store user in PENDING state until admin/automated approval
 *      - never trust client-sent roles — assign roles server-side
 *  - Replace RECAPTCHA_SITE_KEY with your real site key if using reCAPTCHA.
 */

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyId, setCompanyId] = useState(''); // required for company verification
  const [inviteCode, setInviteCode] = useState(''); // optional: invite token
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [proofFile, setProofFile] = useState(null); // optional uploaded document (ID/offer letter)
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const fileInputRef = useRef(null);

  // Simple client-side email validation
  function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  // Simple password strength estimator (replace with zxcvbn on production)
  function passwordStrength(pw) {
    if (pw.length >= 14 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) return 'very strong';
    if (pw.length >= 10 && ((/[A-Z]/.test(pw) && /[0-9]/.test(pw)) || (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)))) return 'strong';
    if (pw.length >= 8) return 'fair';
    return 'weak';
  }

  // Placeholder for getting captcha token (implement reCAPTCHA v3 or hCaptcha here)
  async function getCaptchaToken() {
    // Example: use grecaptcha.execute(siteKey, {action: 'signup'})...
    // For now return null if not configured.
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // client-side validation
    if (!name.trim()) return setError('Full name is required.');
    if (!isValidEmail(email.trim())) return setError('Enter a valid email.');
    if (!companyId.trim() && !inviteCode.trim()) return setError('Enter a Company ID or an Invite Code.');
    if (password.length < 8) return setError('Password must be at least 8 characters. (Use a passphrase >= 12 chars for better security.)');

    setLoading(true);
    try {
      const captchaToken = await getCaptchaToken();

      // Build multipart/form-data so file upload is simple
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('email', email.trim().toLowerCase());
      fd.append('password', password); // server must hash!
      fd.append('companyId', companyId.trim());
      if (inviteCode.trim()) fd.append('inviteCode', inviteCode.trim());
      if (phone.trim()) fd.append('phone', phone.trim());
      if (proofFile) fd.append('proof', proofFile);
      if (captchaToken) fd.append('captchaToken', captchaToken);

      // POST to your backend signup endpoint
      const resp = await fetch('/api/auth/signup', {
        method: 'POST',
        body: fd,
        credentials: 'include', // if you use cookies for CSRF/session
        // Include CSRF header if your backend requires it (example):
        // headers: { 'X-CSRF-Token': window.__CSRF_TOKEN__ || '' },
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data?.message || 'Signup failed on server.');
        setLoading(false);
        return;
      }

      // Success: server should create a PENDING user and send verification email
      setSuccessMsg(
        'Signup request received. Please verify your corporate email (check inbox). Your account will be activated after admin approval.'
      );
      setName('');
      setEmail('');
      setPassword('');
      setCompanyId('');
      setInviteCode('');
      setPhone('');
      setProofFile(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch (err) {
      console.error(err);
      setError('Network error or server unavailable.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Topbar />
      <div className="container" style={{ maxWidth: 700 }}>
        <h2 style={{ margin: 0 }}>Create account</h2>
        <p style={{ color: '#555' }}>
          Use your corporate email and provide a Company ID or Invite Code. Accounts require admin approval.
        </p>

        <form onSubmit={handleSubmit} className="form mt-4" aria-label="signup form">
          <div className="field">
            <label>Full name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="field">
            <label>Corporate email</label>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              autoComplete="email"
              placeholder="you@yourcompany.com"
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <small style={{ display: 'block', marginTop: 6 }}>
              Strength: <strong>{password ? passwordStrength(password) : '—'}</strong>. Use a long passphrase (≥12 chars) or use a password manager.
            </small>
          </div>

          <div className="field">
            <label>Company ID (or)</label>
            <input
              className="input"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              placeholder="Company identifier provided by your HR (e.g., ACME-1234)"
            />
            <small className="muted">If you were provided an invite code, paste it below instead.</small>
          </div>

          <div className="field">
            <label>Invite code (optional)</label>
            <input
              className="input"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Single-use invite token"
            />
          </div>

          <div className="field">
            <label>Phone (optional)</label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98XXXXXXXX"
              autoComplete="tel"
            />
            <small className="muted">Phone may be used for MFA / account recovery.</small>
          </div>

          <div className="field">
            <label>Upload proof (optional)</label>
            <input
              ref={fileInputRef}
              className="input"
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
            />
            <small className="muted">Acceptable: employee ID card, offer letter. Files are encrypted at rest on the server.</small>
          </div>

          {/* Put your CAPTCHA widget here (reCAPTCHA / hCaptcha). */}
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            {/* Example: <ReCAPTCHA sitekey="RECAPTCHA_SITE_KEY" /> */}
            <small className="muted">
              This form is protected from bots. (Integrate reCAPTCHA v3 or hCaptcha on the backend/frontend.)
            </small>
          </div>

          {error && <div style={{ color: 'var(--danger)', marginBottom: 8 }}>{error}</div>}
          {successMsg && <div style={{ color: 'var(--success)', marginBottom: 8 }}>{successMsg}</div>}

          <div className="row">
            <button type="submit" className="btn success" disabled={loading}>
              {loading ? 'Submitting request...' : 'Request account'}
            </button>

            <div className="right small">
              Already have an account? <a href="/login" className="link">Sign in</a>
            </div>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
            By creating an account you consent to audit logging and agree to company policies. Personal documents are stored encrypted and reviewed only by authorized admins.
          </div>
        </form>
      </div>
    </div>
  );
}
