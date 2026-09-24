import { request } from './http';

function qs(params) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') s.set(k, v);
  });
  const str = s.toString();
  return str ? `?${str}` : '';
}

export function listMySales() {
  return request('/sales/mine');
}

export function getSalesHistory(params = {}) {
  return request(`/sales/history${qs(params)}`);
}

export function createSale() {
  return request('/sales', { method: 'POST' });
}

export function getSale(id) {
  return request(`/sales/${id}`);
}

export function updateSaleItems(id, items) {
  return request(`/sales/${id}/items`, { method: 'PUT', body: { items } });
}

export function completeSale(id, paymentMethod) {
  return request(`/sales/${id}/complete`, { method: 'POST', body: { paymentMethod } });
}

export function cancelSale(id) {
  return request(`/sales/${id}`, { method: 'DELETE' });
}
