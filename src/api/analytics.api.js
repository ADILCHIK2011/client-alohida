import { request } from './http';

function qs(params) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') s.set(k, v);
  });
  const str = s.toString();
  return str ? `?${str}` : '';
}

export function getSummary(params) {
  return request(`/analytics/summary${qs(params)}`);
}

export function getTopProducts(params) {
  return request(`/analytics/top-products${qs(params)}`);
}

export function getDaily(params) {
  return request(`/analytics/daily${qs(params)}`);
}

export function getDeadStock(params) {
  return request(`/analytics/dead-stock${qs(params)}`);
}
