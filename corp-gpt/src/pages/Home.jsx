import React from 'react';
import Topbar from '../components/Topbar';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';

export default function Home() {
  const { user } = useAuth();
  return (
    <div>
      <Topbar />
      <div className="container">
        <h1 style={{ fontSize: 28, margin: 0 }}>Welcome to CorpGPT</h1>
        <p className="small mt-4">A secure enterprise assistant demo — start by logging in or exploring the app.</p>

        {!user && (
          <div className="mt-4 row">
            <Link to="/login" className="btn primary">Sign in</Link>
            <Link to="/signup" className="btn ghost">Create account</Link>
          </div>
        )}

        {user && (
          <>
            <div className="mt-4 card" style={{ padding: 14 }}>
              <p className="small">Signed in as <strong>{user.name}</strong> — role: {user.role}</p>
            </div>

            <div className="mt-4 grid cols-3">
              <div className="card">
                <h4>Search Documents</h4>
                <p className="small">Search company docs filtered by your role.</p>
                <div className="mt-4">
                  <button className="btn primary">Open</button>
                </div>
              </div>

              <div className="card">
                <h4>Audit</h4>
                <p className="small">(Admin/Manager only)</p>
                <div className="mt-4">
                  <button className="btn ghost">View</button>
                </div>
              </div>

              <div className="card">
                <h4>Admin</h4>
                <p className="small">User & role management</p>
                <div className="mt-4">
                  <button className="btn ghost">Manage</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
