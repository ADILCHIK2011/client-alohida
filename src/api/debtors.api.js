import { request } from './http';

export function listDebtors(q) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return request(`/debtors${qs}`);
}

export function createDebtor(data) {
  return request('/debtors', { method: 'POST', body: data });
}

export function updateDebtor(id, data) {
  return request(`/debtors/${id}`, { method: 'PUT', body: data });
}

export function getDebtor(id) {
  return request(`/debtors/${id}`);
}

export function recordPayment(id, data) {
  return request(`/debtors/${id}/payments`, { method: 'POST', body: data });
}
