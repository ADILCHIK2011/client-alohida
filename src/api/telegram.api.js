import { request } from './http';

export function getTelegramStatus() {
  return request('/telegram/status');
}

export function disconnectTelegram() {
  return request('/telegram/disconnect', { method: 'POST' });
}
