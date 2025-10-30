import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/Authcontext.jsx';

export default function Topbar() {
  const { user, logout } = useAuth();
  return (
    <header className="topbar">
      <div className="brand">
        <div className="logo"><Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>CorpGPT</Link></div>
        <div className="tag">Secure RAG Assistant</div>
      </div>

      <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {!user && (
          <>
            <Link to="/login" className="btn link">Login</Link>
            <Link to="/signup" className="btn ghost">Sign up</Link>
          </>
        )}
        {user && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="small">{user.name}</div>
            <button className="btn link" onClick={logout}>Sign out</button>
          </div>
        )}
      </nav>
    </header>
  );
}
