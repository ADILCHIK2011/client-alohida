const TOKEN_KEY = 'dokon_token';

// In dev, Vite's proxy forwards a relative /api path to the server — no env
// var needed. In production the client and server are separate deployments
// (different origins), so VITE_API_URL must point at the backend's base URL
// (baked in at build time, since Vite only exposes import.meta.env at build).
const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    setToken(null);
    if (onUnauthorized) onUnauthorized();
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data && data.message ? data.message : `Xatolik yuz berdi (${res.status})`;
    throw new Error(message);
  }

  return data;
}
