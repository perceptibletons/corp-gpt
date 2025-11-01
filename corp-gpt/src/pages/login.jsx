// src/pages/Login.jsx
import React, { useState } from 'react';
import Topbar from '../components/Topbar';

/**
 * Secure Login page for CorpGPT
 *
 * Flows implemented:
 *  - POST /api/auth/login { email, password, remember, captchaToken }
 *    -> responses:
 *       * 200 OK { ok: true }               => login success (server sets HttpOnly cookie / session)
 *       * 200 OK { ok: false, mfa_required: true, sessionId, methods: ['totp','webauthn'] } => show MFA step
 *       * 202 { status: 'pending', message } => account pending (email verification / admin approval)
 *       * 401/400 { ok: false, message }    => error
 *
 *  - POST /api/auth/mfa/verify { sessionId, method: 'totp'|'webauthn', code } => verifies MFA and finalizes login
 *
 *  - GET /auth/sso/start  => start SSO (redirect to IdP)
 *
 * Important backend requirements (non-negotiable):
 *  - Server should set authentication cookie as HttpOnly, Secure, SameSite=Strict (or use short-lived access+refresh tokens).
 *  - Rate-limit failed login attempts + log attempts in audit logs.
 *  - Return minimal error info (avoid leaking which part failed).
 *  - Support WebAuthn and TOTP for MFA; require MFA for privileged roles.
 */

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaSessionId, setMfaSessionId] = useState(null);
  const [mfaMethods, setMfaMethods] = useState([]); // e.g. ['totp','webauthn']
  const [selectedMfaMethod, setSelectedMfaMethod] = useState('totp');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  // Simple email validator
  function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  // Placeholder - integrate reCAPTCHA/hCaptcha here
  async function getCaptchaToken() {
    // e.g., return await grecaptcha.execute('SITE_KEY', {action: 'login'});
    return null;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email.trim())) return setError('Enter a valid corporate email.');
    if (!password) return setError('Enter your password.');

    setLoading(true);
    try {
      const captchaToken = await getCaptchaToken();

      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include', // expect server to set secure HttpOnly cookie/session
        headers: {
          // If your server uses a CSRF token in a header, include it here.
          // 'X-CSRF-Token': window.__CSRF_TOKEN__ || '',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          remember: !!remember,
          captchaToken,
        }),
      });

      const data = await resp.json();

      if (resp.status === 200 && data?.ok) {
        // Login successful. Server should have set an HttpOnly cookie or returned tokens.
        // Redirect to dashboard.
        window.location.href = '/dashboard';
        return;
      }

      // Handle pending / verification states
      if (resp.status === 202 || data?.status === 'pending') {
        setError(data?.message || 'Account pending approval or email verification.');
        setLoading(false);
        return;
      }

      // Handle MFA required
      if (data?.mfa_required) {
        setMfaRequired(true);
        setMfaSessionId(data.sessionId);
        setMfaMethods(Array.isArray(data.methods) ? data.methods : ['totp']);
        setSelectedMfaMethod(Array.isArray(data.methods) && data.methods.includes('webauthn') ? 'webauthn' : 'totp');
        setLoading(false);
        return;
      }

      // Generic error
      setError(data?.message || 'Login failed. Check credentials.');
    } catch (err) {
      console.error(err);
      setError('Network error. Try again later.');
    } finally {
      setLoading(false);
    }
  }

  // TOTP / MFA verification
  async function handleMfaVerify(e) {
    e.preventDefault();
    setError(null);

    if (!mfaSessionId) {
      setError('MFA session not found. Please retry login.');
      return;
    }

    setMfaLoading(true);
    try {
      if (selectedMfaMethod === 'webauthn' && window.PublicKeyCredential) {
        // WebAuthn flow:
        // 1) Request server for challenge/options: GET /api/auth/webauthn/options?sessionId=...
        // 2) Call navigator.credentials.get({ publicKey: options })
        // 3) POST result to /api/auth/webauthn/verify
        const optResp = await fetch(`/api/auth/webauthn/options?sessionId=${encodeURIComponent(mfaSessionId)}`, {
          method: 'GET',
          credentials: 'include',
        });
        const options = await optResp.json();
        if (!optResp.ok) {
          setError(options.message || 'WebAuthn not available for this account.');
          setMfaLoading(false);
          return;
        }

        // Convert base64url -> ArrayBuffer helper
        const b64ToBuf = (b64u) => {
          const pad = '='.repeat((4 - (b64u.length % 4)) % 4);
          const b64 = (b64u + pad).replace(/-/g, '+').replace(/_/g, '/');
          const str = atob(b64);
          const buf = new ArrayBuffer(str.length);
          const view = new Uint8Array(buf);
          for (let i = 0; i < str.length; i++) view[i] = str.charCodeAt(i);
          return buf;
        };

        // Convert server options to proper binary formats
        const publicKey = { ...options };
        if (publicKey.challenge) publicKey.challenge = b64ToBuf(publicKey.challenge);
        if (publicKey.allowCredentials) {
          publicKey.allowCredentials = publicKey.allowCredentials.map((c) => ({
            ...c,
            id: b64ToBuf(c.id),
          }));
        }

        const cred = await navigator.credentials.get({ publicKey });
        // Prepare attestation response to send to server
        const authData = {
          id: cred.id,
          type: cred.type,
          rawId: btoa(String.fromCharCode(...new Uint8Array(cred.rawId))),
          response: {
            authenticatorData: btoa(String.fromCharCode(...new Uint8Array(cred.response.authenticatorData))),
            clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(cred.response.clientDataJSON))),
            signature: btoa(String.fromCharCode(...new Uint8Array(cred.response.signature))),
            userHandle: cred.response.userHandle ? btoa(String.fromCharCode(...new Uint8Array(cred.response.userHandle))) : null,
          },
        };

        const verifyResp = await fetch('/api/auth/webauthn/verify', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: mfaSessionId, credential: authData }),
        });
        const verifyData = await verifyResp.json();
        if (verifyResp.ok && verifyData?.ok) {
          window.location.href = '/dashboard';
          return;
        } else {
          setError(verifyData?.message || 'WebAuthn verification failed.');
          setMfaLoading(false);
          return;
        }
      } else {
        // TOTP flow
        if (!mfaCode || mfaCode.trim().length < 3) {
          setError('Enter the code from your authenticator app.');
          setMfaLoading(false);
          return;
        }

        const resp = await fetch('/api/auth/mfa/verify', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: mfaSessionId, method: 'totp', code: mfaCode.trim() }),
        });
        const data = await resp.json();
        if (resp.ok && data?.ok) {
          window.location.href = '/dashboard';
          return;
        } else {
          setError(data?.message || 'Invalid MFA code.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('MFA verification failed due to network or browser error.');
    } finally {
      setMfaLoading(false);
    }
  }

  return (
    <div>
      <Topbar />
      <div className="container" style={{ maxWidth: 560 }}>
        <h2 style={{ margin: 0 }}>Sign in</h2>
        <p style={{ color: '#555' }}>Use your corporate credentials to sign in. SSO is preferred for enterprise users.</p>

        {!mfaRequired ? (
          <form onSubmit={handleLogin} className="form mt-4" aria-label="login form">
            <div className="field">
              <label>Corporate email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
              </label>

              <a href="/forgot-password" className="link small">Forgot password?</a>
            </div>

            {/* CAPTCHA placeholder */}
            <div style={{ marginTop: 10 }}>
              <small className="muted">This form is protected from bots. (Integrate reCAPTCHA/hCaptcha in production.)</small>
            </div>

            {error && <div style={{ color: 'var(--danger)', marginTop: 12 }}>{error}</div>}

            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn success" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <div className="right small">
                <a href="/signup" className="link">Create account</a>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 8 }}>Or sign in with SSO:</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a className="btn outline" href="/auth/sso/start?provider=okta">Sign in with SSO</a>
                <a className="btn outline" href="/auth/sso/start?provider=google">Sign in with Google Workspace</a>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleMfaVerify} className="form mt-4" aria-label="mfa form">
            <div style={{ marginBottom: 8 }}>
              <strong>MFA required</strong>
              <div style={{ color: '#666' }}>Complete multi-factor authentication to finish signing in.</div>
            </div>

            <div className="field">
              <label>Method</label>
              <select className="select" value={selectedMfaMethod} onChange={(e) => setSelectedMfaMethod(e.target.value)}>
                {mfaMethods.includes('totp') && <option value="totp">Authenticator app (TOTP)</option>}
                {mfaMethods.includes('webauthn') && <option value="webauthn">Passkey / Security Key (WebAuthn)</option>}
              </select>
            </div>

            {selectedMfaMethod === 'totp' && (
              <div className="field">
                <label>Authenticator code</label>
                <input
                  className="input"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="123456"
                  autoComplete="one-time-code"
                />
              </div>
            )}

            {selectedMfaMethod === 'webauthn' && (
              <div style={{ marginBottom: 10 }}>
                <small className="muted">When you press Continue, your browser will ask to use a passkey or security key.</small>
              </div>
            )}

            {error && <div style={{ color: 'var(--danger)', marginTop: 8 }}>{error}</div>}

            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn success" type="submit" disabled={mfaLoading}>
                {mfaLoading ? 'Verifying...' : 'Continue'}
              </button>

              <button
                className="btn"
                type="button"
                onClick={() => {
                  // Cancel MFA and return to initial login form
                  setMfaRequired(false);
                  setMfaSessionId(null);
                  setMfaMethods([]);
                  setMfaCode('');
                }}
                style={{ marginLeft: 8 }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
