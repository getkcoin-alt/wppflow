export const getBaseBackendUrl = () =>
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== "undefined" &&
  window.location.hostname.endsWith("vercel.app")
    ? ""
    : "http://localhost:8080");
export const getSocketBackendUrl = () =>
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  getBaseBackendUrl() ||
  "https://srv1628639.hstgr.cloud";
export const resolveEndpoint = (path: string, base = getBaseBackendUrl()) =>
  `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
export const TOKEN_STORAGE_KEY = "wppflow_auth_token",
  TENANT_STORAGE_KEY = "wppflow_tenant_id";
let accessToken: string | null = null;
let refreshPromise: Promise<any> | null = null;
export const getStoredToken = () => accessToken;
export function setStoredToken(token: string) {
  accessToken = token;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}
export const getStoredTenantId = () => localStorage.getItem(TENANT_STORAGE_KEY);
export const setStoredTenantId = (id: string) =>
  localStorage.setItem(TENANT_STORAGE_KEY, id);
export function clearStoredToken() {
  accessToken = null;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TENANT_STORAGE_KEY);
  localStorage.removeItem("wppflow_refresh_token");
}
export async function refreshSession() {
  if (!refreshPromise)
    refreshPromise = (async () => {
      const res = await fetch(resolveEndpoint("/api/auth/refresh"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) {
        clearStoredToken();
        return null;
      }
      const data = await res.json();
      setStoredToken(data.token);
      if (data.tenant?.id) setStoredTenantId(data.tenant.id);
      return data;
    })().finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}
export async function apiRequest(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) || {}),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const tenant = getStoredTenantId();
  if (tenant) headers["X-Tenant-Id"] = tenant;
  const res = await fetch(resolveEndpoint(path), {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  if (res.status === 401 && retry && !path.startsWith("/api/auth/")) {
    const refreshed = await refreshSession();
    if (refreshed) return apiRequest(path, init, false);
  }
  const data = await res
    .json()
    .catch(() => ({ message: "The server returned an invalid response" }));
  if (!res.ok) {
    const error = new Error(data.message || `HTTP ${res.status}`) as Error & {
      status: number;
    };
    error.status = res.status;
    throw error;
  }
  return data;
}
export const apiGet = (path: string) => apiRequest(path);
export const apiPost = (path: string, body: any) =>
  apiRequest(path, { method: "POST", body: JSON.stringify(body) });
export const apiPatch = (path: string, body: any) =>
  apiRequest(path, { method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = (path: string) =>
  apiRequest(path, { method: "DELETE" });
export interface AuthResponse {
  status: "success" | "error";
  message?: string;
  token?: string;
  user?: any;
  tenant?: any;
}
async function auth(path: string, body: any): Promise<AuthResponse> {
  try {
    const data = await apiPost(path, body);
    if (data.token) setStoredToken(data.token);
    if (data.tenant?.id) setStoredTenantId(data.tenant.id);
    return data;
  } catch (e: any) {
    return { status: "error", message: e.message };
  }
}
export const loginUser = (email: string, password: string) =>
  auth("/api/auth/login", { email, password });
export const signupUser = (
  name: string,
  email: string,
  password: string,
  companyName?: string,
  _role?: string,
) => auth("/api/auth/signup", { name, email, password, companyName });
export const acceptInvitation = (token: string, password: string) =>
  apiPost("/api/auth/accept-invite", { token, password });
export const switchWorkspace = (tenantId: string) =>
  auth("/api/auth/switch-tenant", { tenantId });
export async function getCurrentUser(_token?: string) {
  try {
    if (!accessToken) {
      const session = await refreshSession();
      if (!session) return null;
    }
    return (await apiGet("/api/auth/me")).user;
  } catch {
    return null;
  }
}
export async function logoutUser() {
  try {
    await apiPost("/api/auth/logout", {});
  } finally {
    clearStoredToken();
  }
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
export async function checkBackendHealth(): Promise<BackendHealth | null> {
  try {
    const res = await fetch(resolveEndpoint("/health"));
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
export const getLiveSessions = async () =>
  (await apiGet("/api/sessions")).sessions;
export const startLiveSession = (sessionName: string) =>
  apiPost("/api/sessions/start", { sessionName });
export const getLiveSessionQr = (name: string) =>
  apiGet(`/api/sessions/${encodeURIComponent(name)}/qr`);
export const getLiveSessionStatus = (name: string) =>
  apiGet(`/api/sessions/${encodeURIComponent(name)}/status`);
export const closeLiveSession = (name: string) =>
  apiPost(`/api/sessions/${encodeURIComponent(name)}/close`, {});
export const deleteSession = (name: string) =>
  apiDelete(`/api/sessions/${encodeURIComponent(name)}`);
export const syncInboxForSession = (name: string) =>
  apiPost(`/api/sessions/${encodeURIComponent(name)}/sync-inbox`, {});
export const fetchContacts = (params: Record<string, string> = {}) =>
  apiGet(`/api/contacts?${new URLSearchParams(params)}`);
export const addContact = (data: any) => apiPost("/api/contacts", data);
export const patchContact = (id: string, data: any) =>
  apiPatch(`/api/contacts/${id}`, data);
export const removeContact = (id: string) => apiDelete(`/api/contacts/${id}`);
export function fetchConversations(
  params: {
    limit?: number;
    cursor?: string | null;
    filter?: string;
    search?: string;
  } = {},
) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (v !== null && v !== undefined) q.set(k, String(v));
  return apiGet(`/api/conversations?${q}`);
}
export const fetchChats = () => fetchConversations();
export const addChat = (data: any) => apiPost("/api/conversations", data);
export const patchChat = (id: string, data: any) =>
  apiPatch(`/api/conversations/${id}`, data);
export function fetchConversationMessages(
  id: string,
  params: { limit?: number; cursor?: string | null; sync?: boolean } = {},
) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (v !== undefined && v !== null) q.set(k, String(v));
  return apiGet(`/api/conversations/${id}/messages?${q}`);
}
export const fetchMessages = (id: string, sync = false) =>
  fetchConversationMessages(id, { sync });
export const sendMessageToConversation = (
  id: string,
  payload: { text: string; idempotencyKey?: string },
) => apiPost(`/api/conversations/${id}/messages`, payload);
export const addMessage = (id: string, data: any) =>
  apiPost(
    `/api/conversations/${id}/${data.isNote || data.type === "internal_note" ? "notes" : "messages"}`,
    { ...data, idempotencyKey: data.idempotencyKey || crypto.randomUUID() },
  );
export const markConversationRead = (id: string) =>
  apiPost(`/api/conversations/${id}/read`, {});
export const fetchCampaigns = () => apiGet("/api/campaigns");
export const addCampaign = (data: any) => apiPost("/api/campaigns", data);
export const startCampaign = (id: string) =>
  apiPost(`/api/campaigns/${id}/start`, {});
export const stopCampaign = (id: string) =>
  apiPost(`/api/campaigns/${id}/stop`, {});
export const fetchAutomations = () => apiGet("/api/automations");
export const addAutomation = (data: any) => apiPost("/api/automations", data);
export const toggleAutomationApi = (id: string) =>
  apiPatch(`/api/automations/${id}/toggle`, {});
export const removeAutomation = (id: string) =>
  apiDelete(`/api/automations/${id}`);
export const getTenantUsers = (_token?: string) => apiGet("/api/auth/users");
export const createTenantUser = (data: any) => apiPost("/api/auth/users", data);
export const updateTenantUser = (id: string, data: any) =>
  apiPatch(`/api/auth/users/${id}`, data);
export const deleteTenantUser = (id: string) =>
  apiDelete(`/api/auth/users/${id}`);
export async function uploadAttachment(
  conversationId: string,
  file: Blob,
  filename: string,
  mimeType: string,
) {
  const prepared = await apiPost("/api/attachments/prepare", {
    conversationId,
    filename,
    mimeType,
    byteSize: file.size,
  });
  const uploaded = await fetch(prepared.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: file,
  });
  if (!uploaded.ok) throw new Error("File upload failed");
  return apiPost(`/api/attachments/${prepared.attachmentId}/send`, {
    idempotencyKey: crypto.randomUUID(),
  });
}
export const changePassword = async (
  currentPassword: string,
  newPassword: string,
) => {
  const data = await apiPost("/api/auth/change-password", {
    currentPassword,
    newPassword,
  });
  if (data.token) setStoredToken(data.token);
  return data;
};
export const listCompanies = async () =>
  (await apiGet("/api/admin/companies")).companies;
export const createCompany = (data: {
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  sessionsLimit: number;
}) => apiPost("/api/admin/companies", data);
export const updateCompany = (id: string, data: Record<string, unknown>) =>
  apiPatch(`/api/admin/companies/${encodeURIComponent(id)}`, data);
export const resendOwnerCredentials = (id: string) =>
  apiPost(
    `/api/admin/companies/${encodeURIComponent(id)}/resend-credentials`,
    {},
  );
export const assignSessionOwner = (name: string, userId: number) =>
  apiPatch(`/api/sessions/${encodeURIComponent(name)}/owner`, { userId });
