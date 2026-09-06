/**
 * WppFlow Cloud Engine Client
 * Connects frontend to the production Railway backend running Chromium & OmniEngine
 */
export const getBaseBackendUrl = () => {
    // If running in browser on Vercel, use same-origin relative proxy (zero CORS, zero DNS delay)
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
        return '';
    }
    return import.meta.env?.VITE_BACKEND_URL || 'https://wppflow-backend-production.up.railway.app';
};
export const DEFAULT_RAILWAY_BACKEND_URL = getBaseBackendUrl();
export function resolveEndpoint(path, baseUrl = getBaseBackendUrl()) {
    if (!baseUrl)
        return path.startsWith('/') ? path : `/${path}`;
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
}
export async function checkBackendHealth(baseUrl = getBaseBackendUrl()) {
    try {
        const res = await fetch(resolveEndpoint('/health', baseUrl), {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        return await res.json();
    }
    catch (error) {
        // If relative proxy failed or direct failed, attempt cross-fallback
        try {
            const fallbackUrl = baseUrl === ''
                ? 'https://wppflow-backend-production.up.railway.app/health'
                : '/health';
            const fallbackRes = await fetch(fallbackUrl, { method: 'GET' });
            if (fallbackRes.ok)
                return await fallbackRes.json();
        }
        catch { }
        return null;
    }
}
export async function startLiveSession(sessionName, baseUrl = getBaseBackendUrl()) {
    const res = await fetch(resolveEndpoint('/api/sessions/start', baseUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName })
    });
    return await res.json();
}
export async function getLiveSessionQr(sessionName, baseUrl = getBaseBackendUrl()) {
    const res = await fetch(resolveEndpoint(`/api/sessions/${sessionName}/qr`, baseUrl));
    return await res.json();
}
export async function getLiveSessionStatus(sessionName, baseUrl = getBaseBackendUrl()) {
    const res = await fetch(resolveEndpoint(`/api/sessions/${sessionName}/status`, baseUrl));
    return await res.json();
}
export async function sendLiveMessage(sessionName, phone, message, baseUrl = getBaseBackendUrl()) {
    const res = await fetch(resolveEndpoint(`/api/sessions/${sessionName}/send-message`, baseUrl), {
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
export async function loginUser(email, password, baseUrl = getBaseBackendUrl()) {
    try {
        const res = await fetch(resolveEndpoint('/api/auth/login', baseUrl), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return await res.json();
    }
    catch (err) {
        // Fallback to direct Railway URL if proxy fails
        try {
            const fallbackRes = await fetch('https://wppflow-backend-production.up.railway.app/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            return await fallbackRes.json();
        }
        catch { }
        return { status: 'error', message: err.message || 'Network error connecting to auth server' };
    }
}
export async function signupUser(name, email, password, companyName, role, baseUrl = getBaseBackendUrl()) {
    try {
        const res = await fetch(resolveEndpoint('/api/auth/signup', baseUrl), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, companyName, role })
        });
        return await res.json();
    }
    catch (err) {
        try {
            const fallbackRes = await fetch('https://wppflow-backend-production.up.railway.app/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, companyName, role })
            });
            return await fallbackRes.json();
        }
        catch { }
        return { status: 'error', message: err.message || 'Network error connecting to auth server' };
    }
}
export async function getCurrentUser(token, baseUrl = getBaseBackendUrl()) {
    try {
        const res = await fetch(resolveEndpoint('/api/auth/me', baseUrl), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok)
            return null;
        const data = await res.json();
        return data.user || null;
    }
    catch {
        try {
            const fallbackRes = await fetch('https://wppflow-backend-production.up.railway.app/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (fallbackRes.ok) {
                const data = await fallbackRes.json();
                return data.user || null;
            }
        }
        catch { }
        return null;
    }
}
export async function getTenantUsers(token, baseUrl = getBaseBackendUrl()) {
    try {
        const res = await fetch(resolveEndpoint('/api/auth/users', baseUrl), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok)
            return { users: [] };
        const data = await res.json();
        return { users: data.users || [], database: data.database };
    }
    catch {
        try {
            const fallbackRes = await fetch('https://wppflow-backend-production.up.railway.app/api/auth/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (fallbackRes.ok) {
                const data = await fallbackRes.json();
                return { users: data.users || [], database: data.database };
            }
        }
        catch { }
        return { users: [] };
    }
}
