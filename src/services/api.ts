/**
 * WppFlow Cloud Engine Client
 * Connects frontend to the production Railway backend running Chromium & OmniEngine
 */

export const DEFAULT_RAILWAY_BACKEND_URL = 
  (import.meta as any).env?.VITE_BACKEND_URL || 'https://wppflow-backend-production.up.railway.app';

export interface BackendHealth {
  status: string;
  engine: string;
  version: string;
  activeSessions: number;
  uptime: number;
  timestamp: string;
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

export async function checkBackendHealth(baseUrl = DEFAULT_RAILWAY_BACKEND_URL): Promise<BackendHealth | null> {
  try {
    const res = await fetch(`${baseUrl}/health`, { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export async function startLiveSession(sessionName: string, baseUrl = DEFAULT_RAILWAY_BACKEND_URL) {
  const res = await fetch(`${baseUrl}/api/sessions/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionName })
  });
  return await res.json();
}

export async function getLiveSessionQr(sessionName: string, baseUrl = DEFAULT_RAILWAY_BACKEND_URL) {
  const res = await fetch(`${baseUrl}/api/sessions/${sessionName}/qr`);
  return await res.json();
}

export async function getLiveSessionStatus(sessionName: string, baseUrl = DEFAULT_RAILWAY_BACKEND_URL) {
  const res = await fetch(`${baseUrl}/api/sessions/${sessionName}/status`);
  return await res.json();
}

export async function sendLiveMessage(sessionName: string, phone: string, message: string, baseUrl = DEFAULT_RAILWAY_BACKEND_URL) {
  const res = await fetch(`${baseUrl}/api/sessions/${sessionName}/send-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message })
  });
  return await res.json();
}

export async function getLiveSessions(baseUrl = DEFAULT_RAILWAY_BACKEND_URL): Promise<LiveSessionInfo[]> {
  try {
    const res = await fetch(`${baseUrl}/api/sessions`);
    if (!res.ok) return [];
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

export async function loginUser(email: string, password: string, baseUrl = DEFAULT_RAILWAY_BACKEND_URL): Promise<AuthResponse> {
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await res.json();
  } catch (err: any) {
    return { status: 'error', message: err.message || 'Network error connecting to auth server' };
  }
}

export async function signupUser(
  name: string, 
  email: string, 
  password: string, 
  companyName?: string, 
  role?: 'admin' | 'user',
  baseUrl = DEFAULT_RAILWAY_BACKEND_URL
): Promise<AuthResponse> {
  try {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, companyName, role })
    });
    return await res.json();
  } catch (err: any) {
    return { status: 'error', message: err.message || 'Network error connecting to auth server' };
  }
}

export async function getCurrentUser(token: string, baseUrl = DEFAULT_RAILWAY_BACKEND_URL): Promise<any | null> {
  try {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function getTenantUsers(token: string, baseUrl = DEFAULT_RAILWAY_BACKEND_URL): Promise<{ users: any[], database?: any }> {
  try {
    const res = await fetch(`${baseUrl}/api/auth/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return { users: [] };
    const data = await res.json();
    return { users: data.users || [], database: data.database };
  } catch {
    return { users: [] };
  }
}

