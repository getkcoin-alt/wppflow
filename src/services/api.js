/**
 * WppFlow Cloud Engine Client
 * Connects frontend to the production Railway backend running Chromium & OmniEngine
 */
export const DEFAULT_RAILWAY_BACKEND_URL = import.meta.env?.VITE_BACKEND_URL || 'https://wppflow-backend-production.up.railway.app';
export async function checkBackendHealth(baseUrl = DEFAULT_RAILWAY_BACKEND_URL) {
    try {
        const res = await fetch(`${baseUrl}/health`, { method: 'GET' });
        if (!res.ok)
            return null;
        return await res.json();
    }
    catch (error) {
        return null;
    }
}
export async function startLiveSession(sessionName, baseUrl = DEFAULT_RAILWAY_BACKEND_URL) {
    const res = await fetch(`${baseUrl}/api/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName })
    });
    return await res.json();
}
export async function getLiveSessionQr(sessionName, baseUrl = DEFAULT_RAILWAY_BACKEND_URL) {
    const res = await fetch(`${baseUrl}/api/sessions/${sessionName}/qr`);
    return await res.json();
}
export async function getLiveSessionStatus(sessionName, baseUrl = DEFAULT_RAILWAY_BACKEND_URL) {
    const res = await fetch(`${baseUrl}/api/sessions/${sessionName}/status`);
    return await res.json();
}
export async function sendLiveMessage(sessionName, phone, message, baseUrl = DEFAULT_RAILWAY_BACKEND_URL) {
    const res = await fetch(`${baseUrl}/api/sessions/${sessionName}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
    });
    return await res.json();
}
export async function getLiveSessions(baseUrl = DEFAULT_RAILWAY_BACKEND_URL) {
    try {
        const res = await fetch(`${baseUrl}/api/sessions`);
        if (!res.ok)
            return [];
        const data = await res.json();
        return data.sessions || [];
    }
    catch {
        return [];
    }
}
export const TOKEN_STORAGE_KEY = 'wppflow_auth_token';
export function getStoredToken() {
    try {
        return localStorage.getItem(TOKEN_STORAGE_KEY);
    }
    catch {
        return null;
    }
}
export function setStoredToken(token) {
    try {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    catch { }
}
export function clearStoredToken() {
    try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    catch { }
}
export async function loginUser(email, password, baseUrl = DEFAULT_RAILWAY_BACKEND_URL) {
    try {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return await res.json();
    }
    catch (err) {
        return { status: 'error', message: err.message || 'Network error connecting to auth server' };
    }
}
export async function signupUser(name, email, password, companyName, role, baseUrl = DEFAULT_RAILWAY_BACKEND_URL) {
    try {
        const res = await fetch(`${baseUrl}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, companyName, role })
        });
        return await res.json();
    }
    catch (err) {
        return { status: 'error', message: err.message || 'Network error connecting to auth server' };
    }
}
export async function getCurrentUser(token, baseUrl = DEFAULT_RAILWAY_BACKEND_URL) {
    try {
        const res = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok)
            return null;
        const data = await res.json();
        return data.user || null;
    }
    catch {
        return null;
    }
}
export async function getTenantUsers(token, baseUrl = DEFAULT_RAILWAY_BACKEND_URL) {
    try {
        const res = await fetch(`${baseUrl}/api/auth/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok)
            return { users: [] };
        const data = await res.json();
        return { users: data.users || [], database: data.database };
    }
    catch {
        return { users: [] };
    }
}
