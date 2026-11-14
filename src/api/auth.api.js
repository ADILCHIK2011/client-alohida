import { request } from './http';

export function login(password) {
  return request('/auth/alohida-login', { method: 'POST', body: { password } });
}

export function adminLogin(username, password) {
  return request('/auth/admin-login', { method: 'POST', body: { username, password } });
}

export function fetchMe() {
  return request('/auth/me');
}

export function changePassword(currentPassword, newPassword) {
  return request('/auth/me/password', { method: 'PUT', body: { currentPassword, newPassword } });
}
