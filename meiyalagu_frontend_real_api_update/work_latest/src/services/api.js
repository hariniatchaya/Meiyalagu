const configuredBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const API_BASE = configuredBase.replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, code = 'API_ERROR', status = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export function authHeaders() {
  const token = ['access_token', 'accessToken', 'auth_token', 'token']
    .map(key => localStorage.getItem(key))
    .find(Boolean);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      ...options,
      headers: { ...authHeaders(), ...(options.headers || {}) }
    });
  } catch {
    throw new ApiError('Backend is unavailable. Check that the backend server is running on http://localhost:8000.', 'NETWORK');
  }
  if (response.status === 401 || response.status === 403) {
    // If auth failed, clear bad token
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    throw new ApiError('Your session has expired. Please sign in again.', 'AUTH_EXPIRED', response.status);
  }
  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body.detail || body.message || '';
      if (Array.isArray(detail)) {
        detail = detail.map(d => d.msg || JSON.stringify(d)).join(', ');
      }
    } catch {}
    throw new ApiError(detail || `Backend request failed (${response.status}).`, 'HTTP_ERROR', response.status);
  }
  if (response.status === 204) return null;
  try {
    return await response.json();
  } catch {
    throw new ApiError('Backend returned an unreadable response.', 'INVALID_JSON', response.status);
  }
}

// User Authentication
export async function loginUser(email, password) {
  const result = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (result?.access_token) {
    localStorage.setItem('access_token', result.access_token);
    if (result.user) {
      localStorage.setItem('meiyalagu_user', JSON.stringify(result.user));
    }
  }
  return result;
}

export async function registerUser(name, email, password) {
  const result = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  if (result?.access_token) {
    localStorage.setItem('access_token', result.access_token);
    if (result.user) {
      localStorage.setItem('meiyalagu_user', JSON.stringify(result.user));
    }
  }
  return result;
}

export async function getCurrentUser() {
  const user = await request('/api/auth/me', { method: 'GET' });
  if (user) {
    localStorage.setItem('meiyalagu_user', JSON.stringify(user));
  }
  return user;
}

export async function updateCurrentUser(data) {
  const user = await request('/api/auth/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (user) {
    localStorage.setItem('meiyalagu_user', JSON.stringify(user));
  }
  return user;
}

// Skin Analysis
export async function uploadAnalysisImage(file) {
  if (!(file instanceof File)) {
    throw new ApiError('Choose an image file before starting analysis.', 'INVALID_FILE');
  }
  const form = new FormData();
  form.append('file', file);
  form.append('image', file);
  return request('/api/analysis/upload', { method: 'POST', body: form });
}

export async function predictAnalysis(analysisId) {
  if (analysisId == null || analysisId === '') {
    throw new ApiError('Upload response did not include analysis_id.', 'INVALID_RESPONSE');
  }
  return request(`/api/analysis/predict/${encodeURIComponent(String(analysisId))}`, { method: 'POST' });
}

export async function getSavedAnalysis(analysisId) {
  if (analysisId == null || analysisId === '') {
    throw new ApiError('Missing analysis ID.', 'INVALID_RESPONSE');
  }
  return request(`/api/analysis/${encodeURIComponent(String(analysisId))}`, { method: 'GET' });
}

// Risk Screening Assessment
export async function submitRiskAssessment(data) {
  return request('/api/risk/assess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

// Dashboard & History
export async function getDashboardData() {
  return request('/api/dashboard', { method: 'GET' });
}

export async function getHistoryData() {
  return request('/api/history', { method: 'GET' });
}

export async function getDiseasesLibrary() {
  return request('/api/diseases', { method: 'GET' });
}
