import React, { useState } from 'react';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/Authcontext';

export default function Signup() {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signup(name.trim(), email.trim(), password, role);
      if (!res.ok) setError(res.message || 'Signup failed');
    } catch (err) {
      setError('Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Topbar />
      <div className="container">
        <h2 style={{ margin: 0 }}>Create account</h2>
        <form onSubmit={handleSubmit} className="form mt-4" aria-label="signup form">
          <div className="field">
            <label>Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="field">
            <label>Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="field">
            <label>Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="field">
            <label>Role (demo)</label>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="employee">Employee</option>
              <option value="hr">HR</option>
              <option value="finance">Finance</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && <div style={{ color: 'var(--danger)', marginBottom: 8 }}>{error}</div>}

          <div className="row">
            <button type="submit" className="btn success" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
            <div className="right small">Already have an account? <a href="/login" className="link">Sign in</a></div>
          </div>
        </form>
      </div>
    </div>
  );
}
