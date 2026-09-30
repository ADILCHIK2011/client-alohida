import { request } from './http';

function qs(params) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') s.set(k, v);
  });
  const str = s.toString();
  return str ? `?${str}` : '';
}

export function getCurrentShift() {
  return request('/shifts/current');
}

export function startShift() {
  return request('/shifts/start', { method: 'POST' });
}

export function endShift() {
  return request('/shifts/end', { method: 'POST' });
}

export function getShiftHistory(params = {}) {
  return request(`/shifts/history${qs(params)}`);
}
