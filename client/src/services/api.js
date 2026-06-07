import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

async function request(path, options = {}) {
  const token = await getAccessToken();
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (API_URL.includes('ngrok-free.app')) headers.set('ngrok-skip-browser-warning', 'true');

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Request failed');
  return payload;
}

export function getDeals(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return request(`/api/deals${query ? `?${query}` : ''}`);
}

export const getDeal = (id) => request(`/api/deals/${id}`);
export const createDeal = (formData) => request('/api/deals', { method: 'POST', body: formData });
export const confirmDeal = (id, confirmationStatus) => request(`/api/deals/${id}/confirm`, { method: 'POST', body: JSON.stringify({ confirmationStatus }) });
export const getAdminMe = () => request('/api/admin/me');
export const getMyProfile = () => request('/api/me/profile');
export const updateMyProfile = (profile) => request('/api/me/profile', { method: 'PUT', body: JSON.stringify(profile) });
export const getMyAlertPreferences = () => request('/api/me/alerts');
export const updateMyAlertPreferences = (preferences) => request('/api/me/alerts', { method: 'PUT', body: JSON.stringify(preferences) });
export const getMySavedDealIds = () => request('/api/me/saved-deals');
export const saveMyDeal = (id) => request(`/api/me/saved-deals/${id}`, { method: 'PUT', body: JSON.stringify({}) });
export const unsaveMyDeal = (id) => request(`/api/me/saved-deals/${id}`, { method: 'DELETE' });
export const getMyHiddenDealIds = () => request('/api/me/hidden-deals');
export const hideMyDeal = (id) => request(`/api/me/hidden-deals/${id}`, { method: 'PUT', body: JSON.stringify({}) });
export const unhideMyDeal = (id) => request(`/api/me/hidden-deals/${id}`, { method: 'DELETE' });
export function getPendingDeals(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return request(`/api/admin/deals/pending${query ? `?${query}` : ''}`);
}
export const updateDealStatus = (id, status) => request(`/api/admin/deals/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const updateAdminDeal = (id, deal) => request(`/api/admin/deals/${id}`, { method: 'PATCH', body: JSON.stringify(deal) });
export const deleteDeal = (id) => request(`/api/admin/deals/${id}`, { method: 'DELETE' });
export const runScanners = () => request('/api/admin/scanners/run', { method: 'POST', body: JSON.stringify({}) });
export const getScannerRuns = () => request('/api/admin/scanners/runs');
export function getRawDealMentions(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return request(`/api/admin/raw-deal-mentions${query ? `?${query}` : ''}`);
}
export const ignoreRawDealMention = (id) => request(`/api/admin/raw-deal-mentions/${id}/ignore`, { method: 'PATCH', body: JSON.stringify({}) });
export const convertRawDealMention = (id, status = 'pending') => request(`/api/admin/raw-deal-mentions/${id}/convert`, { method: 'POST', body: JSON.stringify({ status }) });
export const classifyRawDealMention = (id) => request(`/api/admin/ai/classify/${id}`, { method: 'POST', body: JSON.stringify({}) });
export const classifyNewMentions = (limit = 20) => request('/api/admin/ai/classify-batch', { method: 'POST', body: JSON.stringify({ limit }) });
export const getAiClassificationResults = () => request('/api/admin/ai/classification-results');
