const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", ""]);
// On any hosted address (app.scriwo.com, a Vercel preview) the app talks to the backend
// through its own address, where Vercel forwards /api and /health. Only a developer machine uses
// localhost. Matching on "vercel.app" alone sent every custom domain to the visitor's own computer.
export const backendBaseFor = (hostname: string, configured?: string) =>
  configured || (LOCAL_HOSTS.has(hostname) ? "http://localhost:8080" : "");
export const socketUrlFor = (
  hostname: string,
  configured: { socket?: string; backend?: string } = {},
) =>
  configured.socket ||
  configured.backend ||
  backendBaseFor(hostname) ||
  "https://srv1628639.hstgr.cloud";
const currentHost = () =>
  typeof window !== "undefined" ? window.location.hostname : "";
export const getBaseBackendUrl = () =>
  backendBaseFor(currentHost(), import.meta.env.VITE_BACKEND_URL);
export const getSocketBackendUrl = () =>
  socketUrlFor(currentHost(), {
    socket: import.meta.env.VITE_SOCKET_URL,
    backend: import.meta.env.VITE_BACKEND_URL,
  });
export const resolveEndpoint = (path: string, base = getBaseBackendUrl()) =>
  `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
export const TOKEN_STORAGE_KEY = "wppflow_auth_token",
  TENANT_STORAGE_KEY = "wppflow_tenant_id";
let accessToken: string | null = null;
let refreshPromise: Promise<any> | null = null;
const getStorage = (): Storage | null => {
  try {
    if (
      typeof window !== "undefined" &&
      window.localStorage &&
      typeof window.localStorage.getItem === "function"
    ) {
      return window.localStorage;
    }
  } catch {}
  return null;
};

export const getStoredToken = () => accessToken;
export function setStoredToken(token: string) {
  accessToken = token;
  getStorage()?.removeItem(TOKEN_STORAGE_KEY);
}
export const getStoredTenantId = () =>
  getStorage()?.getItem(TENANT_STORAGE_KEY) ?? null;
export const setStoredTenantId = (id: string) => {
  getStorage()?.setItem(TENANT_STORAGE_KEY, id);
};
export function clearStoredToken() {
  accessToken = null;
  const storage = getStorage();
  storage?.removeItem(TOKEN_STORAGE_KEY);
  storage?.removeItem(TENANT_STORAGE_KEY);
  storage?.removeItem("wppflow_refresh_token");
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
export const getInviteInfo = (token: string) =>
  apiGet(`/api/auth/invite-info?token=${encodeURIComponent(token)}`);
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
// newNumber: linking a number that is not linked yet. The server then refuses a name that is already in
// use, instead of starting that number from its saved login (which connects without any QR code).
export const startLiveSession = (sessionName: string, newNumber = false) =>
  apiPost("/api/sessions/start", newNumber ? { sessionName, newNumber } : { sessionName });
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
    /** Only this WhatsApp number's chats */
    sessionName?: string;
  } = {},
) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (v !== null && v !== undefined && v !== "") q.set(k, String(v));
  return apiGet(`/api/conversations?${q}`);
}
export const fetchConversationChanges = (since: string) =>
  apiGet(`/api/conversations/changes?since=${encodeURIComponent(since)}`);
export const fetchNotifications = () => apiGet("/api/notifications?limit=30");
export const markNotificationRead = (id: string) =>
  apiPost(`/api/notifications/${encodeURIComponent(id)}/read`, {});
export const markAllNotificationsRead = () =>
  apiPost("/api/notifications/read-all", {});
export const fetchConversation = async (id: string) =>
  (await apiGet(`/api/conversations/${encodeURIComponent(id)}`)).conversation;
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
// Loads one file that was never saved from WhatsApp, then keeps it.
export const fetchMessageMedia = (conversationId: string, messageId: string) =>
  apiPost(
    `/api/conversations/${conversationId}/messages/${messageId}/media`,
    {},
  );
// Loads a small batch of the chat's unsaved files; call again with nextBefore until it is null.
export const fetchPendingMedia = (
  conversationId: string,
  params: { before?: string | null; limit?: number } = {},
) =>
  apiPost(`/api/conversations/${conversationId}/media/fetch-pending`, params);
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
/** A ready-made broadcast. Parts the sender must write are [in square brackets]. */
export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  text: string;
  blanks: string[];
}
/** Who a broadcast to one tag would reach, and who it would leave out */
export interface Audience {
  tag: string;
  total: number;
  willReceive: number;
  /** Nobody has recorded whether they agree to receive broadcasts */
  notAsked: number;
  /** Said STOP, were marked as not wanting messages, or are blocked */
  optedOut: number;
  tags: { tag: string; count: number; willReceive: number }[];
  unsubscribeRule: { exists: boolean; enabled: boolean };
}
export const fetchCampaignTemplates = (): Promise<{
  templates: CampaignTemplate[];
  variables: string[];
}> => apiGet("/api/campaigns/templates");
export const fetchAudience = (tag?: string): Promise<Audience> =>
  apiGet(
    `/api/campaigns/audience${tag && tag !== "All Contacts" ? `?tag=${encodeURIComponent(tag)}` : ""}`,
  );
export const duplicateCampaign = (id: string) =>
  apiPost(`/api/campaigns/${encodeURIComponent(id)}/duplicate`, {});
/** The owner confirms the people in this audience agreed to hear from the business */
export const recordPermission = (
  tag?: string,
): Promise<{ recorded: number; audience: Audience }> =>
  apiPost("/api/contacts/permission", {
    confirm: true,
    ...(tag && tag !== "All Contacts" ? { tag } : {}),
  });
export const startCampaign = (id: string) =>
  apiPost(`/api/campaigns/${id}/start`, {});
export const stopCampaign = (id: string) =>
  apiPost(`/api/campaigns/${id}/stop`, {});
export const fetchAutomations = () => apiGet("/api/automations");
export const addAutomation = (data: any) => apiPost("/api/automations", data);
export const updateAutomation = (id: string, data: any) =>
  apiRequest(`/api/automations/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export type RuleTrigger = "keyword" | "first_message" | "after_hours";
export type RuleAction =
  | "reply_text"
  | "assign_agent"
  | "add_tag"
  | "opt_in"
  | "opt_out"
  | "create_lead";
export interface OpeningHours {
  timezone: string;
  /** 1 is Monday, 7 is Sunday */
  days: number[];
  start: string;
  end: string;
}
/** What a rule is made of, as it is sent to and from the server */
export interface RuleDraft {
  name: string;
  triggerType: RuleTrigger;
  triggerCondition: string;
  actionType: RuleAction;
  actionSummary: string;
  templateId?: string | null;
  config: {
    match?: "contains" | "word" | "exact";
    hours?: OpeningHours;
    reply?: string;
    cooldownHours?: number;
  };
}
export interface AutomationTemplate {
  id: string;
  group: string;
  name: string;
  description: string;
  /** Shown when the person has to write the answer themselves */
  hint?: string;
  recommended?: boolean;
  rule: Omit<RuleDraft, "name">;
  /** What must be filled in before it can be saved */
  needs: ("reply" | "teammate" | "hours")[];
}
export const fetchAutomationTemplates = (): Promise<{
  templates: AutomationTemplate[];
}> => apiGet("/api/automations/templates");
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
export const resendInvitation = (id: string) =>
  apiPost(`/api/auth/users/invitations/${id}/resend`, {});
export const cancelInvitation = (id: string) =>
  apiDelete(`/api/auth/users/invitations/${id}`);
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
/** A plan the platform admin can give a company, as the server defines it (the same five as the pricing page). */
export interface PlanChoice {
  id: "free" | "starter" | "growth" | "business" | "enterprise";
  name: string;
  /** WhatsApp numbers included; null when agreed per company */
  numbers: number | null;
  /** People it is for; null when there is no limit */
  seats: number | null;
  features: { key: string; label: string; included: boolean }[];
  /** Riwo requests a day a company on this plan may make unless another number is agreed; null: not in the plan */
  aiDaily: number | null;
  /** Whether the plan is for sale; plans off sale stay on the companies that have them */
  isActive: boolean;
  trialDays: number;
  maxContacts: number | null;
  taxMode: "exclusive" | "inclusive";
  /** Price per billing interval and currency, in paise or fils */
  prices: PlanPrice[];
}
export interface PlanPrice {
  interval: "monthly" | "annual";
  currency: "INR" | "AED";
  amountMinor: number;
}
/** The plans for sale, as anyone may read them */
export interface PublicPlan {
  id: PlanChoice["id"];
  name: string;
  numbers: number | null;
  seats: number | null;
  taxMode: "exclusive" | "inclusive";
  prices: PlanPrice[];
  features: { key: string; label: string; included: boolean }[];
}
export const fetchPublicPlans = async (): Promise<PublicPlan[]> => (await apiGet("/api/public/plans")).plans;
export const updatePlan = (
  code: string,
  data: Partial<{
    name: string;
    numbers: number | null;
    seats: number | null;
    maxContacts: number | null;
    trialDays: number;
    isActive: boolean;
    features: string[];
    prices: PlanPrice[];
  }>,
) => apiRequest(`/api/admin/plans/${encodeURIComponent(code)}`, { method: "PUT", body: JSON.stringify(data) });
export const listPlans = async (): Promise<PlanChoice[]> =>
  (await apiGet("/api/admin/plans")).plans;
export const createCompany = (data: {
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  plan: string;
  /** Leave out to give the company what the plan includes */
  sessionsLimit?: number;
  /** Riwo requests a day agreed with the company; leave out for the default */
  aiDailyLimit?: number;
}) => apiPost("/api/admin/companies", data);
/** A payment the platform admin recorded for a company */
export interface SubscriptionPayment {
  id: string;
  plan: string;
  cycle: "monthly" | "annual";
  periodStart: string;
  periodEnd: string;
  amount: number | null;
  currency: "AED" | "INR" | null;
  reference: string;
  recordedBy: string | null;
  recordedAt: string;
}
const subscriptionUrl = (id: string, rest: string) => `/api/admin/companies/${encodeURIComponent(id)}${rest}`;
export const listPayments = async (id: string): Promise<SubscriptionPayment[]> =>
  (await apiGet(subscriptionUrl(id, "/payments"))).payments;
export const recordPayment = (
  id: string,
  data: {
    plan?: string;
    cycle: "monthly" | "annual";
    periodStart?: string;
    periodEnd?: string;
    amount?: number;
    currency?: "AED" | "INR";
    reference?: string;
    sessionsLimit?: number;
  },
) => apiPost(subscriptionUrl(id, "/subscription/payment"), data);
export const scheduleSubscriptionChange = (id: string, plan: string) =>
  apiPost(subscriptionUrl(id, "/subscription/schedule"), { plan });
export const clearSubscriptionChange = (id: string) =>
  apiDelete(subscriptionUrl(id, "/subscription/schedule"));
export const updateCompany = (id: string, data: Record<string, unknown>) =>
  apiPatch(`/api/admin/companies/${encodeURIComponent(id)}`, data);
export const resendOwnerCredentials = (id: string) =>
  apiPost(
    `/api/admin/companies/${encodeURIComponent(id)}/resend-credentials`,
    {},
  );
export const assignSessionOwner = (name: string, userId: number) =>
  apiPatch(`/api/sessions/${encodeURIComponent(name)}/owner`, { userId });

// ── Sales pipeline ───────────────────────────────────────────────────────────────────────────────
export type StageKind = "open" | "won" | "lost";
export interface PipelineStage {
  id: string;
  name: string;
  kind: StageKind;
  position: number;
}
export interface Lead {
  id: string;
  title: string;
  contactId: string | null;
  contactName: string;
  phone: string;
  email: string;
  tags: string[];
  sessionName: string | null;
  conversationId: string | null;
  stageId: string;
  stageName: string;
  stageKind: StageKind;
  status: StageKind;
  value: number;
  source: string;
  ownerUserId: number | null;
  ownerName: string;
  lostReason: string;
  expectedClose: string | null;
  stageChangedAt: string;
  closedAt: string | null;
  createdAt: string;
  lastMessage: { text: string; fromMe: boolean; at: number | null } | null;
  unread: number;
  openTasks: number;
  nextTask: { id: string; title: string; dueAt: string } | null;
}
export interface BoardColumn extends PipelineStage {
  count: number;
  value: number;
  leads: Lead[];
}
export interface Board {
  pipeline: { id: string; name: string; preset: string };
  currency: "AED" | "INR";
  stages: BoardColumn[];
  totals: { open: number; openValue: number; won: number };
  perColumn: number;
}
export interface LeadTask {
  id: string;
  leadId: string;
  title: string;
  dueAt: string;
  assignedUserId: number | null;
  assignedName: string;
  done: boolean;
  doneAt: string | null;
  leadTitle?: string;
  contactName?: string;
  stageName?: string;
  conversationId?: string | null;
}
export interface LeadEvent {
  id: number;
  actorName: string;
  type: "created" | "stage" | "won" | "lost" | "reopened" | "owner" | "value";
  detail: Record<string, any>;
  createdAt: string;
}
export interface PipelineSettings {
  pipeline: { id: string; name: string; preset: string };
  currency: "AED" | "INR";
  stages: (PipelineStage & { leads: number })[];
  presets: { id: string; name: string; stages: string[] }[];
  autoCreate: { exists: boolean; enabled: boolean };
}
export interface LeadFilters {
  mine?: boolean;
  owner?: string;
  number?: string;
  q?: string;
  overdue?: boolean;
  source?: string;
  stage?: string;
  status?: string;
  limit?: number;
  offset?: number;
}
const leadQuery = (f: LeadFilters = {}) => {
  const p = new URLSearchParams();
  if (f.mine) p.set("mine", "1");
  if (f.owner) p.set("owner", f.owner);
  if (f.number) p.set("number", f.number);
  if (f.q) p.set("q", f.q);
  if (f.overdue) p.set("overdue", "1");
  if (f.source) p.set("source", f.source);
  if (f.stage) p.set("stage", f.stage);
  if (f.status) p.set("status", f.status);
  if (f.limit) p.set("limit", String(f.limit));
  if (f.offset) p.set("offset", String(f.offset));
  const text = p.toString();
  return text ? `?${text}` : "";
};
export const fetchLeadBoard = (f?: LeadFilters): Promise<Board> => apiGet(`/api/leads/board${leadQuery(f)}`);
export const fetchLeads = (f?: LeadFilters): Promise<{ leads: Lead[]; total: number; limit: number; offset: number }> =>
  apiGet(`/api/leads${leadQuery(f)}`);
export const fetchLead = (id: string): Promise<{ lead: Lead; tasks: LeadTask[]; timeline: LeadEvent[] }> =>
  apiGet(`/api/leads/${encodeURIComponent(id)}`);
export const createLead = (data: {
  conversationId?: string;
  contactId?: string;
  title?: string;
  value?: number;
  stageId?: string;
  ownerUserId?: number | null;
  expectedClose?: string;
}): Promise<{ lead: Lead; existing: boolean }> => apiPost("/api/leads", data);
export const bulkCreateLeads = (contactIds: string[]): Promise<{ created: number; skipped: number }> =>
  apiPost("/api/leads/bulk", { contactIds });
export const updateLead = (id: string, data: { title?: string; value?: number; expectedClose?: string | null; ownerUserId?: number | null }): Promise<{ lead: Lead }> =>
  apiRequest(`/api/leads/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) });
export const moveLead = (id: string, data: { stageId: string; beforeLeadId?: string; lostReason?: string }): Promise<{ lead: Lead }> =>
  apiPost(`/api/leads/${encodeURIComponent(id)}/move`, data);
export const deleteLead = (id: string) => apiDelete(`/api/leads/${encodeURIComponent(id)}`);
export const addLeadTask = (id: string, data: { title: string; dueAt: string; assignedUserId?: number }): Promise<{ tasks: LeadTask[] }> =>
  apiPost(`/api/leads/${encodeURIComponent(id)}/tasks`, data);
export const updateLeadTask = (id: string, data: { done?: boolean; title?: string; dueAt?: string }): Promise<{ task: LeadTask }> =>
  apiRequest(`/api/leads/tasks/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteLeadTask = (id: string) => apiDelete(`/api/leads/tasks/${encodeURIComponent(id)}`);
/** The open lead for whoever a chat is with, if there is one. */
export const fetchChatLead = (conversationId: string): Promise<{ lead: Lead | null }> =>
  apiGet(`/api/leads/chat/${encodeURIComponent(conversationId)}`);
export const fetchLeadTasks = (opts: { when?: "today" | "overdue" | "all"; everyone?: boolean; until?: string } = {}): Promise<{ tasks: LeadTask[] }> => {
  const p = new URLSearchParams({ when: opts.when || "today" });
  if (opts.everyone) p.set("everyone", "1");
  if (opts.until) p.set("until", opts.until);
  return apiGet(`/api/leads/tasks?${p}`);
};
export const fetchPipelineSettings = (): Promise<PipelineSettings> => apiGet("/api/leads/settings");
export const savePipelineStages = (data: {
  open: { id?: string; name: string }[];
  wonName: string;
  lostName: string;
}): Promise<PipelineSettings> => apiRequest("/api/leads/settings/stages", { method: "PUT", body: JSON.stringify(data) });
export const applyPipelinePreset = (preset: string): Promise<PipelineSettings> => apiPost("/api/leads/settings/preset", { preset });
export const setPipelineCurrency = (currency: "AED" | "INR"): Promise<PipelineSettings> =>
  apiRequest("/api/leads/settings/currency", { method: "PUT", body: JSON.stringify({ currency }) });
export const setPipelineAutoCreate = (enabled: boolean): Promise<PipelineSettings> =>
  apiRequest("/api/leads/settings/auto-create", { method: "PUT", body: JSON.stringify({ enabled }) });

// ── AI assistant (Riwo) ──────────────────────────────────────────────────────────────────────────
export type AiTone = "friendly" | "professional" | "brief";
export type AiStyle = "polish" | "shorter" | "friendlier" | "formal";
export interface AiStatus {
  available: boolean;
  /** Why it can't be used: no key on the server, the plan doesn't include it, or an admin switched it off */
  reason: null | "not_configured" | "plan" | "disabled";
  enabled: boolean;
  used: number;
  limit: number;
  remaining: number;
  /** The allowance was agreed for this company, rather than being the server's default */
  custom?: boolean;
  /** When today's allowance starts again (midnight UTC) */
  resetsAt?: string;
  /** What the company has asked of Riwo so far this month */
  month?: { requests: number; inputTokens: number; outputTokens: number };
  /** Which AI service writes the answers */
  provider?: "openrouter" | "anthropic" | null;
  /** Running on free models, whose providers may keep what they receive */
  free?: boolean;
}
export interface AiSummary {
  text: string;
  sections: { label: string; text: string }[];
}
/** What the connection test found: the AI account, the models available and every attempt. */
export interface AiTestResult {
  provider: "openrouter" | "anthropic" | null;
  ok: boolean;
  /** The sentence to show when it isn't working */
  error?: string;
  /** Free models only: what OpenRouter says about the key */
  account?: { freeTier: boolean | null; used: number | null; limit: number | null } | { error: string } | null;
  freeModels?: number;
  topModels?: string[];
  attempts?: { model: string; ok?: boolean; status?: number; message?: string; ms?: number; skipped?: string }[];
  model?: string;
  sample?: string;
}
export const getAiStatus = (): Promise<AiStatus> => apiGet("/api/ai/status");
export const testAi = (): Promise<AiTestResult> => apiPost("/api/ai/test", {});
export const setAiEnabled = (enabled: boolean): Promise<AiStatus> =>
  apiRequest("/api/ai/settings", {
    method: "PUT",
    body: JSON.stringify({ enabled }),
  });
export const aiSuggestReply = (
  conversationId: string,
  tone: AiTone,
): Promise<{ text: string; tone: AiTone }> =>
  apiPost(
    `/api/ai/conversations/${encodeURIComponent(conversationId)}/suggest-reply`,
    { tone },
  );
export const aiLeadSuggestion = (
  conversationId: string,
): Promise<{ title: string; value: number; nextStep: string; followUpDays: number }> =>
  apiPost(`/api/ai/conversations/${encodeURIComponent(conversationId)}/lead-suggestion`, {});
export const aiSummary = (conversationId: string): Promise<AiSummary> =>
  apiPost(
    `/api/ai/conversations/${encodeURIComponent(conversationId)}/summary`,
    {},
  );
export const aiImprove = (
  text: string,
  style: AiStyle,
): Promise<{ text: string }> => apiPost("/api/ai/improve", { text, style });
export const aiTranslate = (
  text: string,
  target: string,
): Promise<{ text: string; target: string }> =>
  apiPost("/api/ai/translate", { text, target });
