import { io } from 'socket.io-client';

// Same-origin in dev (Vite proxies /socket.io to the server); in production
// this points at the backend's own domain, since it's a separate deployment.
const SOCKET_URL = import.meta.env.VITE_API_URL || undefined;

let socket = null;
let currentToken = null;

export function connectSocket(token) {
  if (socket && currentToken === token) return socket;
  if (socket) socket.disconnect();
  currentToken = token;
  socket = io(SOCKET_URL, { auth: { token } });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
  socket = null;
  currentToken = null;
}
