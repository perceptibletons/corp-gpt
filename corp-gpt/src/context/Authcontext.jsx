import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../api/auth';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = sessionStorage.getItem('corp_user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        sessionStorage.removeItem('corp_user');
      }
    }
  }, []);

  async function login(email, password) {
    const res = await authApi.login(email, password);
    if (res.ok) {
      setUser(res.user);
      sessionStorage.setItem('corp_user', JSON.stringify(res.user));
      navigate('/');
      return { ok: true };
    }
    return { ok: false, message: res.message };
  }

  async function signup(name, email, password, role = 'employee') {
    const res = await authApi.signup({ name, email, password, role });
    if (res.ok) {
      setUser(res.user);
      sessionStorage.setItem('corp_user', JSON.stringify(res.user));
      navigate('/');
      return { ok: true };
    }
    return { ok: false, message: res.message };
  }

  function logout() {
    sessionStorage.removeItem('corp_user');
    setUser(null);
    navigate('/login');
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
