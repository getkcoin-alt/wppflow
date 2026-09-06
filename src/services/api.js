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
