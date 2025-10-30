import React, { useState } from 'react';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/Authcontext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (!res.ok) setError(res.message || 'Login failed');
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Topbar />
      <div className="container">
        <h2 style={{ margin: 0 }}>Sign in</h2>
        <form onSubmit={handleSubmit} className="form mt-4" aria-label="login form">
          <div className="field">
            <label>Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="field">
            <label>Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <div style={{ color: 'var(--danger)', marginBottom: 8 }}>{error}</div>}

          <div className="row">
            <button type="submit" className="btn primary" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
            <div className="right small">Don't have an account? <a href="/signup" className="link">Create one</a></div>
          </div>
        </form>
      </div>
    </div>
  );
}
