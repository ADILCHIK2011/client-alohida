import { request } from './http';

export function listWorkers() {
  return request('/workers');
}

export function createWorker(data) {
  return request('/workers', { method: 'POST', body: data });
}

export function updateWorker(id, data) {
  return request(`/workers/${id}`, { method: 'PUT', body: data });
}

export function resetWorkerPassword(id, password) {
  return request(`/workers/${id}/password`, { method: 'PUT', body: { password } });
}
