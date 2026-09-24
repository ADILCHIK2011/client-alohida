import { request } from './http';

export function sendAiMessage(messages) {
  return request('/ai/chat', { method: 'POST', body: { messages } });
}

export function getDailyBriefing() {
  return request('/ai/briefing');
}
