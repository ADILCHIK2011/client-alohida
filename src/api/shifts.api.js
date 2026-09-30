import { request } from './http';

export function getCurrentShift() {
  return request('/shifts/current');
}

export function startShift() {
  return request('/shifts/start', { method: 'POST' });
}

export function endShift() {
  return request('/shifts/end', { method: 'POST' });
}
