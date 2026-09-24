import { createContext, useContext, useEffect, useState } from 'react';
import { login as loginApi, adminLogin as adminLoginApi, fetchMe } from '../api/auth.api';
import { getToken, setToken, setUnauthorizedHandler } from '../api/http';
import { connectSocket, disconnectSocket } from '../socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      disconnectSocket();
      setUser(null);
    });

    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    fetchMe()
      .then((data) => {
        setUser(data.user);
        connectSocket(token);
      })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  // Plan/subscription changes are made by the superadmin, not this session,
  // so nothing in this tab would otherwise trigger a re-fetch. Poll lightly
  // and also refresh whenever the tab regains focus, so an upgrade/downgrade
  // (or an expired subscription) reflects without the owner having to
  // manually reload.
  useEffect(() => {
    if (!user) return;

    function refresh() {
      if (!getToken()) return;
      fetchMe()
        .then((data) => setUser(data.user))
        .catch(() => {});
    }

    const interval = setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [user?.id]);

  async function login(marketSlug, username, password) {
    const data = await loginApi(marketSlug, username, password);
    setToken(data.token);
    setUser(data.user);
    connectSocket(data.token);
    return data.user;
  }

  async function adminLogin(username, password) {
    const data = await adminLoginApi(username, password);
    setToken(data.token);
    setUser(data.user);
    connectSocket(data.token);
    return data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
    disconnectSocket();
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, adminLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
