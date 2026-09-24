import { request } from './http';

function qs(params) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') s.set(k, v);
  });
  const str = s.toString();
  return str ? `?${str}` : '';
}

export function listProducts(params = {}) {
  return request(`/products${qs(params)}`);
}

export function getProductByBarcode(barcode) {
  return request(`/products/barcode/${barcode}`);
}

export function generateBarcode() {
  return request('/products/generate-barcode');
}

export function createProduct(data) {
  return request('/products', { method: 'POST', body: data });
}

export function updateProduct(id, data) {
  return request(`/products/${id}`, { method: 'PUT', body: data });
}

export function deleteProduct(id) {
  return request(`/products/${id}`, { method: 'DELETE' });
}

export function importProducts(items) {
  return request('/products/import', { method: 'POST', body: { items } });
}
