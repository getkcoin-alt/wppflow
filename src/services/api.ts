/**
 * WppFlow Cloud Engine Client
 * Connects frontend to the production Cloud backend running Chromium & OmniEngine
 */

export const getBaseBackendUrl = (): string => {
  // If running in browser on Vercel, use same-origin relative proxy (zero CORS, zero DNS delay)
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return '';
  }
  return (import.meta as any).env?.VITE_BACKEND_URL || 'https://wppflow-backend-production.up.railway.app';
};

export const DEFAULT_BACKEND_URL = getBaseBackendUrl();
export const DEFAULT_RAILWAY_BACKEND_URL = DEFAULT_BACKEND_URL;

export function resolveEndpoint(path: string, baseUrl = getBaseBackendUrl()): string {
  if (!baseUrl) return path.startsWith('/') ? path : `/${path}`;
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

export interface BackendHealth {
  status: string;
  engine: string;
  version: string;
  activeSessions: number;
  uptime: number;
  timestamp: string;
  database?: any;
}

export interface LiveSessionInfo {
  sessionKey: string;
  status: string;
  phone: string | null;
  battery: number;
  antiBanHealth: number;
  warmupDay: number;
  hasQr: boolean;
  lastActive: string;
}

export async function checkBackendHealth(baseUrl = getBaseBackendUrl()): Promise<BackendHealth | null> {
  try {
    const res = await fetch(resolveEndpoint('/health', baseUrl), { 
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    try {
      const fallbackUrl = baseUrl === '' 
        ? 'https://wppflow-backend-production.up.railway.app/health' 
        : '/health';
      const fallbackRes = await fetch(fallbackUrl, { method: 'GET' });
      if (fallbackRes.ok) return await fallbackRes.json();
    } catch {}
    return null;
  }
}

export async function startLiveSession(sessionName: string, baseUrl = getBaseBackendUrl()) {
  const token = getStoredToken();
  const res = await fetch(resolveEndpoint('/api/sessions/start', baseUrl), {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ sessionName })
  });
  return await res.json();
}

export async function getLiveSessionQr(sessionName: string, baseUrl = getBaseBackendUrl()) {
  const token = getStoredToken();
  const res = await fetch(resolveEndpoint(`/api/sessions/${sessionName}/qr`, baseUrl), {
    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
  });
  return await res.json();
}

export async function getLiveSessionStatus(sessionName: string, baseUrl = getBaseBackendUrl()) {
  const token = getStoredToken();
  const res = await fetch(resolveEndpoint(`/api/sessions/${sessionName}/status`, baseUrl), {
    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
  });
  return await res.json();
}

export async function closeLiveSession(sessionName: string, baseUrl = getBaseBackendUrl()) {
  try {
    const token = getStoredToken();
    const res = await fetch(resolveEndpoint(`/api/sessions/${sessionName}/close`, baseUrl), {
      method: 'POST',
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    });
    return await res.json();
  } catch (err: any) {
    return { status: 'error', message: err.message };
  }
}

export async function sendLiveMessage(sessionName: string, phone: string, message: string, baseUrl = getBaseBackendUrl()) {
  const res = await fetch(resolveEndpoint(`/api/sessions/${sessionName}/send-message`, baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message })
  });
  return await res.json();
}

export async function getLiveSessions(baseUrl = getBaseBackendUrl()): Promise<LiveSessionInfo[]> {
  try {
    const token = getStoredToken();
    const res = await fetch(resolveEndpoint('/api/sessions', baseUrl), {
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.sessions || [];
  } catch {
    return [];
  }
}

// --- Authentication & User Management ---

export interface AuthResponse {
  status: 'success' | 'error';
  message?: string;
  token?: string;
  user?: any;
}

export const TOKEN_STORAGE_KEY = 'wppflow_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {}
}

export function clearStoredToken() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {}
}

export async function loginUser(email: string, password: string, baseUrl = getBaseBackendUrl()): Promise<AuthResponse> {
  try {
    const res = await fetch(resolveEndpoint('/api/auth/login', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await res.json();
  } catch (err: any) {
    // Fallback to direct backend URL if proxy fails
    try {
      const fallbackRes = await fetch('https://wppflow-backend-production.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await fallbackRes.json();
    } catch {}
    return { status: 'error', message: err.message || 'Network error connecting to auth server' };
  }
}

export async function signupUser(
  name: string, 
  email: string, 
  password: string, 
  companyName?: string, 
  role?: 'admin' | 'user',
  baseUrl = getBaseBackendUrl()
): Promise<AuthResponse> {
  try {
    const res = await fetch(resolveEndpoint('/api/auth/signup', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, companyName, role })
    });
    return await res.json();
  } catch (err: any) {
    try {
      const fallbackRes = await fetch('https://wppflow-backend-production.up.railway.app/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, companyName, role })
      });
      return await fallbackRes.json();
    } catch {}
    return { status: 'error', message: err.message || 'Network error connecting to auth server' };
  }
}

export async function getCurrentUser(token: string, baseUrl = getBaseBackendUrl()): Promise<any | null> {
  try {
    const res = await fetch(resolveEndpoint('/api/auth/me', baseUrl), {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    try {
      const fallbackRes = await fetch('https://wppflow-backend-production.up.railway.app/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return data.user || null;
      }
    } catch {}
    return null;
  }
}

// ─── DATA API ────────────────────────────────────────────────────────────────

function authHeaders(token?: string | null): Record<string, string> {
  const t = token || getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (t) headers['Authorization'] = `Bearer ${t}`;
  return headers;
}

export async function apiGet(path: string) {
  const res = await fetch(resolveEndpoint(path), { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiPost(path: string, body: any) {
  const res = await fetch(resolveEndpoint(path), { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiPatch(path: string, body: any) {
  const res = await fetch(resolveEndpoint(path), { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiDelete(path: string) {
  const res = await fetch(resolveEndpoint(path), { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Contacts
export const fetchContacts = () => apiGet('/api/contacts');
export const addContact = (data: any) => apiPost('/api/contacts', data);
export const removeContact = (id: string) => apiDelete(`/api/contacts/${id}`);

// Chats
export const fetchChats = () => apiGet('/api/chats');
export const addChat = (data: any) => apiPost('/api/chats', data);
export const patchChat = (id: string, data: any) => apiPatch(`/api/chats/${id}`, data);

// Messages
export const fetchMessages = (chatId: string) => apiGet(`/api/chats/${chatId}/messages`);
export const addMessage = (chatId: string, data: any) => apiPost(`/api/chats/${chatId}/messages`, data);

// Campaigns
export const fetchCampaigns = () => apiGet('/api/campaigns');
export const addCampaign = (data: any) => apiPost('/api/campaigns', data);

// Automations
export const fetchAutomations = () => apiGet('/api/automations');
export const addAutomation = (data: any) => apiPost('/api/automations', data);
export const toggleAutomationApi = (id: string) => apiPatch(`/api/automations/${id}/toggle`, {});
export const removeAutomation = (id: string) => apiDelete(`/api/automations/${id}`);

export async function getTenantUsers(token: string, baseUrl = getBaseBackendUrl()): Promise<{ users: any[], database?: any }> {
  try {
    const res = await fetch(resolveEndpoint('/api/auth/users', baseUrl), {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return { users: [] };
    const data = await res.json();
    return { users: data.users || [], database: data.database };
  } catch {
    try {
      const fallbackRes = await fetch('https://wppflow-backend-production.up.railway.app/api/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return { users: data.users || [], database: data.database };
      }
    } catch {}
    return { users: [] };
  }
}

