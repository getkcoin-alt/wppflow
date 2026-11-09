import { backendBaseFor } from "../utils/backendBase";
export { backendBaseFor };
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
/** Which ways of signing in the server offers, so only buttons that work are shown. */
export const fetchAuthProviders = (): Promise<{ google: boolean }> => apiGet("/api/auth/providers");
/** Where the "Continue with Google" button goes. The server takes the person to Google and brings them back signed in. */
export const googleSignInUrl = (intent?: { plan?: string; interval?: string; trial?: boolean } | null, vertical?: string | null): string => {
  const q = new URLSearchParams();
  if (intent?.trial) q.set("trial", "growth");
  if (vertical) q.set("vertical", vertical);
  if (intent?.plan) q.set("plan", intent.plan);
  if (intent?.interval) q.set("interval", intent.interval);
  // The sign-in comes back to the address it started on (app. or homes.), where the person's sign-in cookies are. The server only
  // accepts the app's own addresses, so this cannot send anyone elsewhere.
  if (typeof window !== "undefined" && window.location?.origin) q.set("origin", window.location.origin);
  return resolveEndpoint(`/api/auth/google/start${q.toString() ? `?${q}` : ""}`);
};
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
      data: Record<string, any>;
    };
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}
// A file (a calendar entry, a PDF) fetched with the signed-in session, for a link that cannot carry a login on its own.
export async function apiDownload(path: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const tenant = getStoredTenantId();
  if (tenant) headers["X-Tenant-Id"] = tenant;
  const res = await fetch(resolveEndpoint(path), { headers, credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error(`Couldn't download the file (${res.status})`);
  return res.blob();
}
export const apiGet = (path: string) => apiRequest(path);
export const apiPost = (path: string, body: any) =>
  apiRequest(path, { method: "POST", body: JSON.stringify(body) });
export const apiPut = (path: string, body: any) =>
  apiRequest(path, { method: "PUT", body: JSON.stringify(body) });
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
  vertical?: string | null,
  extra?: { trial?: boolean; industry?: string },
) =>
  auth("/api/auth/signup", {
    name,
    email,
    password,
    companyName,
    ...(vertical ? { vertical } : {}),
    ...(extra?.trial ? { trial: "growth" } : {}),
    ...(extra?.industry ? { industry: extra.industry } : {}),
  });
export const getInviteInfo = (token: string) =>
  apiGet(`/api/auth/invite-info?token=${encodeURIComponent(token)}`);
export const acceptInvitation = (token: string, password: string) =>
  apiPost("/api/auth/accept-invite", { token, password });
export const requestPasswordReset = (email: string) =>
  apiPost("/api/auth/forgot-password", { email });
export const getResetInfo = (token: string) =>
  apiGet(`/api/auth/reset-info?token=${encodeURIComponent(token)}`);
export const resetPassword = (token: string, password: string) =>
  apiPost("/api/auth/reset-password", { token, password });
export const verifyEmail = (token: string) => apiPost("/api/auth/verify-email", { token });
export const resendVerification = () => apiPost("/api/auth/resend-verification", {});
export const markGuideSeen = () => apiPost("/api/auth/guide-seen", {});
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
export const getContacts = fetchContacts;
export const addContact = (data: any) => apiPost("/api/contacts", data);

// ── Labels: the company's own coloured tags ──────────────────────────────────────────────────────
export const LABEL_COLORS = ["slate", "red", "orange", "amber", "green", "teal", "blue", "indigo", "purple", "pink"] as const;
export type LabelColor = (typeof LABEL_COLORS)[number];
export interface Label {
  id: string;
  name: string;
  color: LabelColor;
  /** How many contacts have it (the manager shows this) */
  contacts?: number;
}
export const fetchLabels = async (): Promise<Label[]> => (await apiGet("/api/labels")).labels;
export const createLabel = async (name: string, color?: LabelColor): Promise<Label> =>
  (await apiPost("/api/labels", color ? { name, color } : { name })).label;
export const updateLabel = async (id: string, data: { name?: string; color?: LabelColor }): Promise<Label> =>
  (await apiPatch(`/api/labels/${id}`, data)).label;
export const deleteLabel = (id: string) => apiDelete(`/api/labels/${id}`);
export const applyLabels = (data: { contactIds: string[]; add?: string[]; remove?: string[] }) => apiPost("/api/labels/apply", data);

// Before starting a chat with a typed number: is it a full number, and do we know the person already?
export interface NumberLookup {
  valid: boolean;
  message?: string;
  phone?: string;
  display?: string;
  contact?: { id: string; name: string; optIn: boolean; labels: Label[] } | null;
}
export const lookupNumber = (phone: string): Promise<NumberLookup> =>
  apiGet(`/api/contacts/lookup?phone=${encodeURIComponent(phone)}`);
export interface StartedChat {
  conversation: any;
  contactCreated: boolean;
  /** true / false when permission for broadcasts was recorded; null when nobody has asked */
  optedIn: boolean | null;
}
export const startChat = (data: { sessionName: string; phone?: string; name?: string; contactId?: string }): Promise<StartedChat> =>
  apiPost("/api/conversations", data);
export interface CreateGroupPayload {
  title: string;
  participants: string[];
  sessionName?: string;
  channel?: string;
}
export interface CreatedGroupResponse {
  status: "success";
  conversation: any;
  groupId: string;
}
export const createGroup = (data: CreateGroupPayload): Promise<CreatedGroupResponse> =>
  apiPost("/api/conversations/group", data);
export interface InboxSearchHit {
  messageId: string;
  conversationId: string;
  fromMe: boolean;
  timestampEpoch: number;
  /** The words around the match, and where the match sits inside them */
  snippet: { text: string; start: number; length: number };
  chat: { id: string; contactName: string; phone: string; displayPhone?: string; avatar: string; isGroup: boolean; sessionName: string };
}
export interface InboxSearchResult {
  query: string;
  chats: any[];
  messages: InboxSearchHit[];
  /** The message search ran out of time, so the list may be missing older matches */
  partial: boolean;
}
export const searchInbox = (text: string, sessionName = ""): Promise<InboxSearchResult> =>
  apiGet(`/api/conversations/search?q=${encodeURIComponent(text)}${sessionName ? `&sessionName=${encodeURIComponent(sessionName)}` : ""}`);
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
    /** Comma-separated label ids, and whether a chat needs any or all of them */
    labels?: string;
    labelMode?: "any" | "all";
    /** "me", "none" (unassigned) or a teammate's id */
    assigned?: string;
    /** Only chats active in the last N days */
    activeDays?: string | number;
    /** A team (the label a teammate has), "1" for chats nobody has answered, "1" for those past the reply target */
    team?: string;
    awaiting?: string;
    overdue?: string;
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
/** The chat a saved person is already in (the most recent one this user may open), or null when there is none yet. */
export const fetchChatOfContact = async (contactId: string) =>
  (await apiGet(`/api/conversations/of-contact/${encodeURIComponent(contactId)}`)).conversation ?? null;
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
export const deleteConversationMessage = (
  conversationId: string,
  messageId: string,
  forEveryone = false,
) =>
  apiDelete(
    `/api/conversations/${conversationId}/messages/${messageId}?forEveryone=${Boolean(forEveryone)}`,
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
export type RuleTrigger = "keyword" | "first_message" | "after_hours" | "foreign_number" | "returning";
export type RuleAction =
  | "reply_text"
  | "assign_agent"
  | "add_tag"
  | "opt_in"
  | "opt_out"
  | "create_lead"
  | "ai_chat"
  | "workflow";
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
    /** "Other countries": calling codes of the company's own countries, and whether only a first message counts */
    homeCodes?: string[];
    onlyNew?: boolean;
    /** "Let Riwo chat": what Riwo may talk about, what it says when it cannot help, how often, and the answers it recognises */
    knowledge?: string;
    handoff?: string;
    maxReplies?: number;
    sourceOptions?: string[];
    /** The website the "about" text was read from */
    website?: string;
    /** Riwo answers from the company's knowledge base (its websites and notes), as well as any text written in the rule */
    useKnowledge?: boolean;
    /** "Riwo sales agent": a whole conversation toward a goal, in the owner's own words */
    agent?: { enabled: boolean; goal: string; playbook: string; closeWith: AgentClose; pricing: "handoff" | "knowledge" };
    /** "Sales assistant": the questions Riwo asks, the formal message for pricing and proposals, and where the lead goes */
    sales?: { enabled: boolean; questions: string[]; formal?: string; followUpHours?: number; stageName?: string };
    /** "Returning": how many quiet days before someone counts as coming back, and whether a first message counts too */
    silentDays?: number;
    includeNew?: boolean;
    /** A workflow: steps that ask, understand the answer and branch */
    workflow?: Workflow;
    /** Test mode: the rule only runs for these numbers (digits with the country code) */
    pilot?: { enabled: boolean; phones: string[] };
  };
}
export type WorkflowStepType = "say" | "ask" | "collect" | "meeting" | "branch" | "agent" | "label" | "notify" | "assign" | "lead" | "task" | "handoff" | "end";
/** One step of a workflow. Which fields it has depends on its type; the server checks and completes them. */
export interface WorkflowStep {
  type: WorkflowStepType;
  text?: string;
  question?: string;
  options?: { key: string; label: string; hints: string[] }[];
  next?: string | Record<string, string | null> | null;
  goal?: string;
  playbook?: string;
  title?: string;
  add?: string;
  teammate?: string;
  [field: string]: unknown;
}
export interface Workflow {
  version: 1;
  start: string;
  nodes: Record<string, WorkflowStep>;
  quiet?: boolean;
}
export interface WorkflowOutlineItem {
  id: string;
  via: string;
  type: WorkflowStepType;
  summary: string;
  goes: { label: string; to: string }[];
}
export type WorkflowNeed = "knowledge" | "countries" | "hours";
/** A workflow as it is shown for confirmation: the rule to save, when it starts, the safety it carries and the steps */
export interface WorkflowDraft {
  rule: RuleDraft;
  when: string;
  understood: string;
  guardrails: string[];
  outline: WorkflowOutlineItem[];
  warnings: string[];
  needs: WorkflowNeed[];
  source: "ai" | "recipe";
  note: string;
}
export interface WorkflowQuestion {
  question: string;
  choices: string[];
}
export interface WorkflowRecipe {
  id: string;
  title: string;
  summary: string;
}
export type AgentClose = "handoff" | "collect_details" | "book_demo" | "send_link";
export interface KnowledgeSource {
  id: string;
  url: string;
  status: "queued" | "reading" | "ready" | "failed";
  error: string;
  pages: number;
  autoRefresh: boolean;
  lastReadAt: string | null;
  lastChangedAt: string | null;
}
export interface KnowledgeStatus {
  sources: KnowledgeSource[];
  overview: string;
  products: { name: string; summary: string; url: string }[];
  notes: string;
  writtenByRiwo: boolean;
  ready: boolean;
}
/** The company's knowledge base: the websites Riwo reads (with a refresh), and the owner's own notes */
export const fetchKnowledge = (): Promise<KnowledgeStatus> => apiGet("/api/knowledge");
export const addKnowledgeSource = (url: string): Promise<KnowledgeStatus> => apiPost("/api/knowledge/sources", { url });
export const refreshKnowledgeSource = (id: string): Promise<KnowledgeStatus> => apiPost(`/api/knowledge/sources/${encodeURIComponent(id)}/refresh`, {});
export const removeKnowledgeSource = (id: string): Promise<KnowledgeStatus> => apiDelete(`/api/knowledge/sources/${encodeURIComponent(id)}`);
export const saveKnowledgeNotes = (notes: string): Promise<KnowledgeStatus> => apiPut("/api/knowledge/notes", { notes });
/** Describe an automation in your own words: Riwo asks what it needs, or drafts it */
export const draftAgent = (
  instruction: string,
  answers: { question: string; answer: string }[] = [],
): Promise<{ clarify?: string[]; draft?: RuleDraft; understood?: string; needs?: string[]; problem?: string }> => apiPost("/api/automations/draft", { instruction, answers });
/** Describe a workflow in your own words (or pick a ready-made one): Riwo asks what it needs, or drafts it. Nothing is saved. */
export const draftWorkflow = (body: { instruction?: string; answers?: { question: string; answer: string }[]; recipe?: string }): Promise<{ clarify?: WorkflowQuestion[]; draft?: WorkflowDraft | null; message?: string; recipes?: WorkflowRecipe[] }> =>
  apiPost("/api/automations/workflow/draft", body);
export const reviseWorkflow = (rule: RuleDraft, instruction: string): Promise<{ clarify?: WorkflowQuestion[]; draft?: WorkflowDraft; diff?: string[] }> => apiPost("/api/automations/workflow/revise", { rule, instruction });
/** "Add a question" without Riwo: the question, the step it goes in front of (or after the last question), and whether the answer goes into the note to the owners */
export const addWorkflowQuestion = (rule: RuleDraft, addQuestion: { question: string; before?: string; tell?: boolean }): Promise<{ draft: WorkflowDraft; diff: string[] }> => apiPost("/api/automations/workflow/revise", { rule, addQuestion });
/** The workflow as the screen has it, checked and completed by the server: the same view as a draft */
export const checkWorkflow = (rule: RuleDraft): Promise<{ draft: WorkflowDraft }> => apiPost("/api/automations/workflow/check", { rule });
export const fetchWorkflowRecipes = (): Promise<{ recipes: WorkflowRecipe[] }> => apiGet("/api/automations/workflow/recipes");
export interface SimulatedEvent {
  kind: "say" | "label" | "notify" | "assign" | "lead" | "task" | "handoff" | "end" | "note";
  text: string;
  node?: string;
}
export interface SimulatedState {
  node: string | null;
  vars: Record<string, unknown>;
  attempts: number;
}
export interface SimulatedTurn {
  events: SimulatedEvent[];
  state: SimulatedState;
  pause: "ask" | "collect" | "meeting" | "agent" | null;
  done: boolean;
  outcome: string | null;
  /** how Riwo understood the customer's answer to a question */
  read: { choice: string; label: string | null; via: string } | null;
  node: string | null;
}
/** One turn of "try it": nothing is sent to WhatsApp or saved */
export const simulateWorkflow = (body: { rule: RuleDraft; state: SimulatedState | null; text: string; labels?: string[]; transcript?: { from: "customer" | "riwo"; text: string }[]; name?: string }): Promise<SimulatedTurn> =>
  apiPost("/api/automations/workflow/simulate", body);
export interface WorkflowInsights {
  started: number;
  active: number;
  finished: number;
  handedOver: number;
  unclear: number;
  meetings: number;
  last7Days: number;
  questions: { question: string; options: { key: string; label: string; count: number }[] }[];
  suggestion: string;
}
/** How a workflow is doing: how many chats it began, which way answers went, and what to improve */
export const fetchWorkflowInsights = (id: string): Promise<{ insights: WorkflowInsights }> => apiGet(`/api/automations/${encodeURIComponent(id)}/insights`);
export interface AutomationVersion {
  version: number;
  name: string;
  note: string;
  createdAt: string;
}
/** The saved versions of a rule (what it was before each change), newest first, and putting one back */
export const fetchAutomationVersions = (id: string): Promise<{ versions: AutomationVersion[] }> => apiGet(`/api/automations/${encodeURIComponent(id)}/versions`);
export const restoreAutomationVersion = (id: string, version: number) => apiPost(`/api/automations/${encodeURIComponent(id)}/versions/${version}/restore`, {});
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
  needs: ("reply" | "teammate" | "hours" | "country" | "about")[];
}
/** What the "other countries" recipe needs to be easy to fill in */
export interface AutomationContext {
  countries: { code: string; name: string }[];
  /** A guess at the company's own country, from the WhatsApp number it linked */
  homeCodes: string[];
  homeFrom: string;
  riwo: { available: boolean; reason: "not_configured" | "plan" | "disabled" | null };
  chat: {
    defaultReplies: number;
    maxReplies: number;
    sources: string[];
    handoff: string;
    sales: { maxQuestions: number; questions: string[]; formal: string; followUpHours: number };
  };
}
/** Riwo reads the company's own website and drafts the "about" text and questions; nothing is saved */
export const aboutFromWebsite = (url: string): Promise<{ url: string; pages: number; about: string; questions: string[]; usedAi: boolean }> =>
  apiPost("/api/automations/about-from-website", { url });
export const fetchAutomationContext = (): Promise<AutomationContext> =>
  apiGet("/api/automations/context");
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
  let uploaded: Response;
  try {
    uploaded = await fetch(prepared.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": mimeType },
      body: file,
    });
  } catch {
    // When the file storage will not take an upload from this address (its CORS rules), a browser says no more than "Failed to fetch".
    throw new Error(
      typeof navigator !== "undefined" && navigator.onLine === false
        ? "You seem to be offline. Check the connection and send the file again."
        : "The file could not be uploaded: the browser was not allowed to reach the file storage from this address. This is a setting on Scriwo's side, not a problem with your file. Please tell Scriwo support.",
    );
  }
  if (!uploaded.ok)
    throw new Error(`The file could not be uploaded (the storage answered ${uploaded.status}). Try again, and tell Scriwo support if it keeps happening.`);
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
  maxBroadcasts: number | null;
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
    maxBroadcasts: number | null;
    trialDays: number;
    isActive: boolean;
    taxMode: "exclusive" | "inclusive";
    features: string[];
    prices: PlanPrice[];
  }>,
): Promise<{ plan: PlanChoice; notified?: PlanNotified }> =>
  apiRequest(`/api/admin/plans/${encodeURIComponent(code)}`, { method: "PUT", body: JSON.stringify(data) });
/** Who was told when modules were switched on or off for a plan: the companies paying for it, the people told, and what changed */
export interface PlanNotified {
  companies: number;
  told: number;
  added: string[];
  removed: string[];
}
export const listPlans = async (): Promise<PlanChoice[]> =>
  (await apiGet("/api/admin/plans")).plans;
/** One thing that changed, in words: what it was and what it is now */
export interface ChangeLine {
  field: string;
  from: string;
  to: string;
}
export interface PlanChange {
  id: number;
  plan: string;
  name: string;
  actor: string | null;
  at: string;
  changes: ChangeLine[];
}
/** Who changed which plan and when, newest first */
export const fetchPlanChanges = async (): Promise<PlanChange[]> => (await apiGet("/api/admin/plans/changes")).changes;
/** Who sells, and how tax is worked out on an invoice. Invoices already issued keep what they were issued with. */
export interface BillingSettings {
  seller: {
    legalName: string;
    tradeName: string;
    gstin: string;
    state: string;
    stateCode: string;
    addressLines: string[];
    city: string;
    postalCode: string;
    email: string;
  };
  sacCode: string;
  gstRate: number;
  invoicePrefix: string;
  prorateUpgrades: boolean;
  /** What the next invoice number would look like, and the longest one the law allows */
  nextInvoiceExample: string;
  invoiceNumberLimit: number;
}
export interface BillingSettingsChange {
  id: number;
  actor: string | null;
  at: string;
  changes: ChangeLine[];
}
export interface BillingSettingsReply {
  settings: BillingSettings;
  history: BillingSettingsChange[];
}
export const fetchBillingSettings = async (): Promise<BillingSettingsReply> => {
  const r = await apiGet("/api/admin/billing/settings");
  return { settings: r.settings, history: r.history };
};
export type BillingSettingsPatch = Partial<Pick<BillingSettings, "sacCode" | "gstRate" | "invoicePrefix" | "prorateUpgrades">> & {
  seller?: Partial<Pick<BillingSettings["seller"], "legalName" | "tradeName" | "gstin" | "addressLines" | "city" | "postalCode" | "email">>;
};
export const saveBillingSettings = async (patch: BillingSettingsPatch): Promise<BillingSettingsReply> => {
  const r = await apiRequest("/api/admin/billing/settings", { method: "PUT", body: JSON.stringify(patch) });
  return { settings: r.settings, history: r.history };
};
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
  /** "manual" when the Scriwo team recorded it; "razorpay" or "autopay" when the company paid online */
  source?: "manual" | "razorpay" | "autopay";
  invoice?: { id: string; number: string } | null;
}
export interface AdminPaymentOrder {
  id: string;
  /** The company's name, or the name the buyer gave on the website when no company exists yet */
  company: string;
  /** null for a purchase from the website whose payment has not made a company yet */
  companyId: string | null;
  plan: string;
  interval: "monthly" | "annual";
  status: "created" | "attempted" | "paid" | "failed" | "expired" | "mismatch";
  source: "checkout" | "autopay" | "website";
  totalMinor: number;
  failureReason: string | null;
  paymentId: string | null;
  createdAt: string;
}
export interface AdminPayments {
  payments: { configured: boolean; mode: "test" | "live" | null };
  counts: Record<string, number>;
  orders: AdminPaymentOrder[];
  refunds: { id: string; company: string | null; paymentId: string | null; amountMinor: number; currency: string; status: string; at: string }[];
}
export const fetchAdminPayments = (status = ""): Promise<AdminPayments> => apiGet(`/api/admin/billing/payments${status ? `?status=${encodeURIComponent(status)}` : ""}`);
export const issueCompanyInvoice = (companyId: string, paymentId: string) =>
  apiPost(`/api/admin/companies/${encodeURIComponent(companyId)}/payments/${encodeURIComponent(paymentId)}/invoice`, {});
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
  /** Null for a follow-up made from a chat that has no lead */
  leadId: string | null;
  chatId?: string | null;
  /** The owner and administrators were told it is overdue */
  escalated?: boolean;
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
export const updateLeadTask = (id: string, data: { done?: boolean; title?: string; dueAt?: string; assignedUserId?: number }): Promise<{ task: LeadTask }> =>
  apiRequest(`/api/leads/tasks/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) });
/** Follow-ups on one chat: its own, and those of the lead of the person it is with. */
export const fetchChatTasks = async (conversationId: string): Promise<LeadTask[]> => (await apiGet(`/api/leads/chat/${encodeURIComponent(conversationId)}/tasks`)).tasks ?? [];
export const addChatTask = async (conversationId: string, data: { title: string; dueAt: string; assignedUserId?: number }): Promise<LeadTask[]> =>
  (await apiPost(`/api/leads/chat/${encodeURIComponent(conversationId)}/tasks`, data)).tasks;
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

// ── Today: what needs this person now ────────────────────────────────────────────────────────────
/** What Riwo prepared for a waiting chat, while nobody was looking */
export interface HomePrep {
  summary: string;
  mood: "positive" | "neutral" | "frustrated" | "urgent" | null;
  moodNote: string;
  nextStep: string;
  /** A reply to read, change and send */
  draft: string;
}
export type HomeItem =
  | { kind: "chat"; id: string; conversationId: string; title: string; avatar: string; preview: string; waitingSeconds: number; overdue: boolean; unread: number; assignedTo: string; isMine: boolean; askedForPerson: boolean; askedReason?: "person" | "pricing" | "qualified" | null; prep: HomePrep | null }
  | { kind: "task"; id: string; taskId: string; conversationId: string | null; title: string; who: string; dueAt: string; overdue: boolean; escalated: boolean }
  | { kind: "number"; id: string; sessionName: string; title: string; level: "down" | "warn" | "unpaired"; problem: string };
export interface HomeData {
  /** Derived from saved delivery receipts; available to managers only. */
  activation?: { hasDeliveredReply: boolean; firstReplyAt: string | null; setup?: HomeData["setup"] } | null;
  firstName: string;
  counts: { waiting: number; overdue: number; tasksDue: number; tasksOverdue: number; numbersNeedingCare: number; askedForPerson?: number };
  replyTargetMinutes: number;
  needsYou: HomeItem[];
  more: number;
  /** Owners and administrators of a workspace that is not set up yet */
  /** The morning brief, for owners and administrators */
  brief?: { day: string; text: string; source: "ai" | "rules" } | null;
  setup: { steps: { key: "connect" | "reply" | "replies" | "automation" | "team"; label: string; done: boolean }[]; done: number; total: number } | null;
}
// ── Autopilot: what Riwo may do by itself ─────────────────────────────────────────────────────────
export interface AutopilotEntry {
  id: string;
  rule: string;
  outcome: "sent" | "cleared" | "undone";
  what: string;
  text: string;
  conversationId: string;
  title: string;
  at: string;
  canUndo: boolean;
}
export interface AutopilotState {
  /** Riwo can act right now; otherwise `reason` says why not (the plan has no Riwo, it is switched off, nothing private is connected) */
  available: boolean;
  reason: null | "not_configured" | "plan" | "disabled" | "no_private_provider";
  canEdit: boolean;
  rules: { key: string; label: string; description: string; enabled: boolean }[];
  sentToday: number;
  dailyCap: number;
  log: AutopilotEntry[];
}
export const fetchAutopilot = (): Promise<AutopilotState> => apiGet("/api/home/autopilot");
export const setAutopilotRule = (key: string, enabled: boolean) => apiRequest(`/api/home/autopilot/rules/${encodeURIComponent(key)}`, { method: "PUT", body: JSON.stringify({ enabled }) });
export const undoAutopilot = (id: string) => apiPost(`/api/home/autopilot/${encodeURIComponent(id)}/undo`, {});

/** `until` is the end of the person's own day, which only their browser knows. */
export const fetchHome = async (until: string): Promise<HomeData> => apiGet(`/api/home?until=${encodeURIComponent(until)}`);

// ── AI assistant (Riwo) ──────────────────────────────────────────────────────────────────────────
export type AiTone = "friendly" | "professional" | "brief";
export type AiStyle = "polish" | "shorter" | "friendlier" | "formal";
export interface AiStatus {
  available: boolean;
  /** Why it can't be used: no key on the server, the plan doesn't include it, or an admin switched it off */
  reason: null | "not_configured" | "plan" | "disabled" | "no_private_provider";
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
  provider?: string | null;
  /** Running on free models, whose providers may keep what they receive */
  free?: boolean;
  /** Some connected AI service may keep what it receives, and this company has not limited Riwo to those that do not */
  mayKeepMessages?: boolean;
  /** This company limits Riwo to AI services that say they do not keep or train on messages */
  privateOnly?: boolean;
}
export interface AiSummary {
  text: string;
  sections: { label: string; text: string }[];
  /** How the customer sounds in this chat, when Riwo said so */
  mood?: { label: "positive" | "neutral" | "frustrated" | "urgent"; note: string } | null;
}
/** What the connection test found: the AI account, the models available and every attempt. */
export interface AiTestResult {
  provider: string | null;
  /** Every connected AI service, in the order they are tried */
  providers?: { id: string; ok: boolean; policy: "no-training" | "may-train" | "unknown"; free: boolean; model?: string; error?: string }[];
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
/** "Ask Riwo" in the search bar: which of the given commands a few typed words ask for, or null. */
export const aiRouteCommand = async (text: string, commands: { id: string; label: string; hint?: string }[]): Promise<string | null> =>
  (await apiPost("/api/ai/command", { text, commands })).commandId ?? null;
export const setAiPrivateOnly = (privateOnly: boolean): Promise<AiStatus> =>
  apiRequest("/api/ai/settings", {
    method: "PUT",
    body: JSON.stringify({ privateOnly }),
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


// ── Plans & Billing: paying online, billing details, invoices, autopay ──────────────────────────────
export interface BillingProfile {
  legalName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateCode: string;
  state?: string;
  postalCode: string;
  gstin: string | null;
  billingEmail: string;
}
export interface BillingQuote {
  plan: { id: string; name: string };
  interval: "monthly" | "annual";
  kind: "new" | "renewal" | "change";
  baseMinor: number;
  creditMinor: number;
  taxableMinor: number;
  taxMinor: number;
  cgstMinor: number;
  sgstMinor: number;
  igstMinor: number;
  totalMinor: number;
  gstRate: number;
  intraState: boolean;
  periodStart: string;
  periodEnd: string;
  requiresConfirm: boolean;
  paidUntil: string | null;
  previousPlan: string | null;
}
export interface BillingOrder {
  id: string;
  plan: string;
  planId: string;
  interval: "monthly" | "annual";
  status: "created" | "attempted" | "paid" | "failed" | "expired" | "mismatch";
  source: "checkout" | "autopay" | "website";
  totalMinor: number;
  periodStart: string | null;
  periodEnd: string | null;
  failureReason: string | null;
  invoiceId: string | null;
  createdAt: string;
  paidAt: string | null;
}
export interface BillingInvoice {
  id: string;
  number: string;
  issueDate: string;
  plan: string;
  interval: "monthly" | "annual";
  periodStart: string;
  periodEnd: string;
  totalMinor: number;
}
export interface BillingAutopay {
  id: string;
  plan: string;
  planId: string;
  interval: "monthly";
  amountMinor: number;
  status: "created" | "authenticated" | "active" | "pending" | "halted" | "cancelled" | "completed";
  needsAttention: boolean;
}
export interface BillingOverview {
  payments: { configured: boolean; mode: "test" | "live" | null };
  gstRate: number;
  prorateUpgrades: boolean;
  subscription: any;
  profile: BillingProfile | null;
  states: { code: string; name: string }[];
  orders: BillingOrder[];
  invoices: BillingInvoice[];
  history: { id: number; type: string; plan: string | null; details: Record<string, any>; at: string }[];
  autopay: BillingAutopay | null;
}
export interface CheckoutOptions {
  key: string;
  orderId?: string;
  subscriptionId?: string;
  amount?: number;
  currency?: string;
  name: string;
  description: string;
  prefill: { name: string; email: string };
}
export const fetchBilling = (): Promise<BillingOverview> => apiGet("/api/billing");
export const saveBillingProfile = async (data: Partial<BillingProfile>): Promise<BillingProfile> => (await apiPut("/api/billing/profile", data)).profile;
export const fetchBillingQuote = (plan: string, interval: string): Promise<{ quote: BillingQuote; profileMissing: boolean; autopayActive: boolean }> =>
  apiGet(`/api/billing/quote?plan=${encodeURIComponent(plan)}&interval=${encodeURIComponent(interval)}`);
export const startCheckout = (data: { plan: string; interval: string; confirm?: boolean }): Promise<{ order: BillingOrder; quote: BillingQuote; checkout: CheckoutOptions }> =>
  apiPost("/api/billing/checkout", data);
export const verifyCheckoutPayment = (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }): Promise<{ status: "paid" | "processing" | "pending" | "failed" | "mismatch"; order: BillingOrder }> =>
  apiPost("/api/billing/verify", data);
export const startAutopaySetup = (plan: string): Promise<{ autopay: BillingAutopay; checkout: CheckoutOptions }> => apiPost("/api/billing/autopay", { plan });
export const verifyAutopaySetup = (data: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }): Promise<{ autopay: BillingAutopay }> =>
  apiPost("/api/billing/autopay/verify", data);
export const stopAutopay = () => apiDelete("/api/billing/autopay");
export const scheduleBillingChange = (plan: string) => apiPost("/api/billing/downgrade", { plan });
export const keepBillingPlan = () => apiDelete("/api/billing/downgrade");
// Files behind the login (an invoice, a spreadsheet) are fetched with the token and saved from memory.
export async function downloadFile(path: string, filename: string, failure = "The file could not be downloaded. Please try again.") {
  const headers: Record<string, string> = {};
  const token = getStoredToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const tenant = getStoredTenantId();
  if (tenant) headers["X-Tenant-Id"] = tenant;
  const res = await fetch(resolveEndpoint(path), { headers, credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error(failure);
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
/** Take the company's data away, and check the record of what the machine said (owners and administrators) */
export const downloadCompanyData = () => downloadFile("/api/export", `scriwo-export-${new Date().toISOString().slice(0, 10)}.json`, "The export could not be downloaded. Please try again in a while.");
export const downloadAllMessages = () => downloadFile("/api/export/messages.csv", `scriwo-messages-${new Date().toISOString().slice(0, 10)}.csv`, "The messages could not be downloaded. Please try again in a while.");
export const verifyAutomatedRecord = (): Promise<{ ok: boolean; checked: number; brokenAtId: number | null }> => apiGet("/api/automated-messages/verify");
export const downloadInvoice = (id: string, number: string) =>
  downloadFile(`/api/billing/invoices/${encodeURIComponent(id)}/pdf`, `Scriwo-invoice-${number.replace(/[^A-Za-z0-9]+/g, "-")}.pdf`, "The invoice could not be downloaded. Please try again.");


// ── Reports: how fast the team answers ────────────────────────────────────────────────────────────
export interface ReplyStats {
  answered: number;
  /** false when too few chats were answered for a median to mean anything */
  enoughData: boolean;
  medianSeconds: number | null;
  p90Seconds: number | null;
  meanSeconds: number | null;
}
export interface AgentReport extends ReplyStats {
  rank: number | null;
  userId: number | null;
  name: string;
  team: string;
  withinSlaPercent: number | null;
  chatsHandled: number;
  repliesSent: number;
  slaMinutes: number;
}
export interface WaitingChat {
  conversationId: string;
  contact: string;
  session: string;
  assignedTo: string;
  since: string;
  waitingSeconds: number;
}
export interface ReportSettings {
  slaMinutes: number;
  /** Hours a follow-up may stay overdue before the owner and administrators are told; 0 switches it off */
  taskEscalationHours: number;
  dailyInApp: boolean;
  dailyEmail: boolean;
  teams: Record<string, number>;
}
export interface TeamResponseReport {
  range: { from: string; to: string };
  timeNote: string;
  minSample: number;
  settings: ReportSettings;
  teams: string[];
  totals: ReplyStats & { withinSlaPercent: number | null; waiting: number };
  agents: AgentReport[];
  waiting: WaitingChat[];
  daily: ({ date: string } & ReplyStats)[];
}
export interface ReportFilters {
  from: string;
  to: string;
  team?: string;
  sessionName?: string;
}
const reportQuery = (f: object) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(f) as [string, string | number | undefined][]) if (v !== undefined && v !== "") q.set(k, String(v));
  return q.toString();
};
export const fetchTeamResponse = (f: ReportFilters): Promise<TeamResponseReport> => apiGet(`/api/reports/team-response?${reportQuery(f)}`);
export const fetchAgentEpisodes = async (f: ReportFilters & { userId: number }): Promise<{ conversationId: string; contact: string; session: string; asked: string; replied: string; seconds: number }[]> =>
  (await apiGet(`/api/reports/team-response/episodes?${reportQuery(f)}`)).episodes;
export const exportTeamResponse = (f: ReportFilters) => downloadFile(`/api/reports/team-response?${reportQuery({ ...f, format: "csv" })}`, `reply-times-${f.from}-to-${f.to}.csv`);
export const exportAgentEpisodes = (f: ReportFilters & { userId: number }) => downloadFile(`/api/reports/team-response/episodes?${reportQuery({ ...f, format: "csv" })}`, `reply-times-detail.csv`);
export interface DailyReport {
  date: string;
  newChats: number;
  received: number;
  replied: number;
  answered: number;
  medianSeconds: number | null;
  withinSlaPercent: number | null;
  waitingNow: number;
  topAgent: { name: string; answered: number } | null;
  numbers: { session: string; label: string; team: string; newChats: number; chatsActive: number; received: number; replied: number }[];
  teams: { team: string; answered: number; repliesSent: number; people: number }[];
  agents: AgentReport[];
}
export const fetchDailyReport = (date: string): Promise<DailyReport> => apiGet(`/api/reports/daily?date=${encodeURIComponent(date)}`);
export const fetchDailyChats = async (f: { date: string; sessionName?: string; team?: string; userId?: number }): Promise<{ id: string; contact: string; session: string; assignedTo: string; received: number; replied: number; repliedBy: string | null; lastAt: string }[]> =>
  (await apiGet(`/api/reports/daily/chats?${reportQuery(f)}`)).chats;
export const fetchReportSettings = async (): Promise<ReportSettings> => (await apiGet("/api/reports/settings")).settings;
export const saveReportSettings = async (data: Partial<ReportSettings>): Promise<ReportSettings> => (await apiPut("/api/reports/settings", data)).settings;

// ── How each WhatsApp number is doing ────────────────────────────────────────────────────────────────────
export interface NumberHealthRow {
  sessionName: string;
  label: string;
  phone: string | null;
  status: string;
  ownerUserId: number | null;
  ownerName: string | null;
  lastError: string | null;
  lastHeartbeatAt: string | null;
  lastHeartbeatOkAt: string | null;
  heartbeatFailures: number;
  heartbeatError: string | null;
  connectedSince: string | null;
  downSince: string | null;
  reconnectAttempts: number;
  lastReconnectAt: string | null;
  sends: { sentLast24h: number; failedLast24h: number; failedLastHour: number; totalLastHour: number };
  queued: { count: number; oldestSeconds: number | null };
  level: "ok" | "warn" | "down" | "unpaired";
  problems: { code: "down" | "unresponsive" | "failing" | "stuck"; text: string }[];
}
export const fetchNumberHealth = (): Promise<{ scope: "workspace" | "own"; checkedEverySeconds: number; numbers: NumberHealthRow[] }> => apiGet("/api/sessions/health");

// ── Automatic assignment of new chats ───────────────────────────────────────────────────────────────────
export interface AssignmentSettings {
  enabled: boolean;
  mode: "round_robin" | "least_busy";
  team: string;
  sessionNames: string[];
  keepOwner: boolean;
  maxOpen: number | null;
  useHours: boolean;
  timezone: string;
  /** 0 is Sunday */
  workDays: number[];
  workStart: string;
  workEnd: string;
  members: { id: number; name: string; role: string; team: string; inRotation: boolean; available: boolean; openChats: number }[];
  teams: string[];
  numbers: { sessionName: string; phone: string | null; ownerName: string | null }[];
}
export type AssignmentChange = Partial<Omit<AssignmentSettings, "members" | "teams" | "numbers" | "team"> & { team: string; rotation: number[] }>;
export const fetchAssignment = async (): Promise<AssignmentSettings> => (await apiGet("/api/assignment")).settings;
export const saveAssignment = async (data: AssignmentChange): Promise<AssignmentSettings> => (await apiPut("/api/assignment", data)).settings;
export const fetchMyAvailability = (): Promise<{ available: boolean; inRotation: boolean }> => apiGet("/api/assignment/me");
export const setMyAvailability = (available: boolean): Promise<{ available: boolean }> => apiPut("/api/assignment/me", { available });

// ── The platform console ────────────────────────────────────────────────────────────────────────────────
export interface PlatformOverview {
  generatedAt: string;
  companies: { total: number; active: number; suspended: number; newLast30Days: number; byPlan: Record<string, number>; bySubscription: Record<string, number> };
  people: { active: number };
  numbers: { linked: number; connected: number; notConnected: number };
  messages: { sentLast24h: number; sentLast7Days: number; sentLast30Days: number; receivedLast7Days: number; failedLast7Days: number; activeCompaniesLast7Days: number };
  ai: { requestsThisMonth: number; tokensThisMonth: number; companiesUsing: number };
  payments: { last30Days: { currency: string; payments: number; amount: number }[] };
}
export const fetchPlatformOverview = async (fresh = false): Promise<PlatformOverview> => (await apiGet(`/api/admin/overview${fresh ? "?fresh=1" : ""}`)).overview;
export interface PlatformNumberHealth {
  generatedAt: string;
  totals: { down: number; warn: number; ok: number; unpaired: number };
  companies: { id: string; name: string; status: string; counts: { down: number; warn: number; ok: number; unpaired: number }; numbers: NumberHealthRow[] }[];
}
export const fetchPlatformNumberHealth = (problemsOnly = false): Promise<PlatformNumberHealth> => apiGet(`/api/admin/number-health${problemsOnly ? "?problems=1" : ""}`);
export interface BillingAudit {
  range: { days: number; since: string };
  payments: { configured: { configured: boolean; mode: string | null }; takings: { currency: string; amount: number; source: string; payments: number }[] };
  invoices: { currency: string; invoices: number; taxableMinor: number; taxMinor: number; totalMinor: number }[];
  orders: Record<string, number>;
  refunds: { currency: string; refunds: number; amountMinor: number }[];
  exceptions: {
    amountMismatch: { orderId: string; company: string; companyId: string; totalMinor: number; currency: string; paymentId: string | null; reason: string | null; at: string }[];
    notSettled: { orderId: string; company: string; companyId: string; totalMinor: number; currency: string; paymentId: string | null; status: string; at: string }[];
    paidButNoSubscriptionRecord: { orderId: string; company: string; companyId: string; totalMinor: number; currency: string; paymentId: string | null; at: string }[];
    paymentWithoutInvoice: { paymentId: string; company: string; companyId: string; plan: string; amount: number; currency: string; source: string; at: string }[];
    webhooksNotProcessed: { eventId: string; event: string; receivedAt: string; attempts: number; result: string | null }[];
    invoiceNumberGaps: { series: string; missing: number }[];
    invalidSignatures: { company: string; companyId: string; details: Record<string, unknown>; at: string }[];
  };
  exceptionCount: number;
  events: { id: number; type: string; company: string; actor: string | null; at: string; details: Record<string, unknown> }[];
}
export const fetchBillingAudit = async (days = 30): Promise<BillingAudit> => (await apiGet(`/api/admin/billing/audit?days=${days}`)).audit;

export interface SupportSession {
  id: string;
  adminName: string;
  reason: string;
  startedAt: string;
  expiresAt: string;
  endedAt: string | null;
  active: boolean;
  actions: { action: string; at: string; detail: Record<string, unknown> }[];
}
export const fetchSupportSessions = async (companyId: string): Promise<SupportSession[]> => (await apiGet(`/api/admin/companies/${encodeURIComponent(companyId)}/support`)).sessions;
export const startSupportSession = async (companyId: string, reason: string, minutes = 60): Promise<SupportSession> =>
  (await apiPost(`/api/admin/companies/${encodeURIComponent(companyId)}/support`, { reason, minutes })).session;
export const endSupportSession = (companyId: string): Promise<{ ended: boolean }> => apiDelete(`/api/admin/companies/${encodeURIComponent(companyId)}/support`);
export type SupportSection = "team" | "numbers" | "activity";
export interface SupportTeamMember { id: number; name: string; email: string; role: string; team: string; status: string; joinedAt: string }
export interface SupportActivity { id: number; type: string; actor: string | null; at: string; details: Record<string, unknown> }
export const fetchSupportSection = async <T,>(companyId: string, section: SupportSection): Promise<T[]> =>
  (await apiGet(`/api/admin/companies/${encodeURIComponent(companyId)}/support/${section}`)).data;
/** What the company itself can read: every time Scriwo support looked at its account. */
export const fetchSupportAccess = async (): Promise<SupportSession[]> => (await apiGet("/api/workspace/support-access")).sessions;

/** What the plan allows in contacts and broadcasts, and how much is used: "near" from 80%, "full" at the limit. */
export interface UsageRow {
  used: number;
  limit: number | null;
  state: "unlimited" | "ok" | "near" | "full";
}
export interface PlanUsage {
  plan: string;
  contacts: UsageRow;
  broadcasts: UsageRow & { resets: string };
}

/** Industry solutions the platform admin can give a company, and what one company has */
export interface SolutionChoice {
  key: string;
  name: string;
  version: number;
  summary: string;
  requires: string[];
  enabled: boolean;
}
export const listCompanySolutions = async (companyId: string): Promise<SolutionChoice[]> =>
  (await apiGet(`/api/admin/companies/${encodeURIComponent(companyId)}/solutions`)).solutions;
export const setCompanySolution = async (companyId: string, key: string, enabled: boolean): Promise<{ changed: boolean; solutions: SolutionChoice[] }> =>
  apiPut(`/api/admin/companies/${encodeURIComponent(companyId)}/solutions/${encodeURIComponent(key)}`, { enabled });

// ── Free OTP (Developers): one-time codes on WhatsApp from the company's own number ─────────────────────────────────────────────
export interface OtpTemplate {
  key: string;
  title: string;
  blurb: string;
  defaults: { codeLength: number; ttlSeconds: number; maxAttempts: number; resendSeconds: number };
}
export interface OtpSettings {
  enabled: boolean;
  template: string;
  /** what was typed; empty means "use the company's name" */
  brand: string;
  brandResolved: string;
  locale: string;
  codeLength: number;
  ttlSeconds: number;
  maxAttempts: number;
  resendSeconds: number;
  sessionName: string | null;
  suspended: boolean;
}
export interface OtpKey {
  id: string;
  name: string;
  kind: "secret" | "public";
  mode: "live" | "test";
  prefix: string;
  allowedOrigins: string[];
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}
export interface OtpRequest {
  id: string;
  status: string;
  mode: "live" | "test";
  source: "api" | "widget" | "dashboard";
  /** the number, masked */
  to: string;
  template: string;
  locale: string;
  reference: string | null;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  verifiedAt: string | null;
  expiresAt: string;
  error: string | null;
  secondsToVerify: number | null;
}
export interface OtpOverview {
  available: boolean;
  settings: OtpSettings;
  templates: OtpTemplate[];
  locales: { key: string; name: string }[];
  numbers: { sessionName: string; phone: string | null; connected: boolean }[];
  keys: OtpKey[];
  usage: { today: { used: number; limit: number; resets: string }; month: { used: number; limit: number; resets: string } };
  stats: { days: number; sent: number; delivered: number; verified: number; failed: number; verifiedRate: number | null; medianSecondsToVerify: number | null };
  webhook: { id: string; url: string; createdAt: string } | null;
  limits: { perPhoneWindow: number; perPhoneWindowMinutes: number; perPhoneDay: number };
  ready: { number: boolean; tested: boolean; key: boolean };
}
export type OtpSettingsPatch = Partial<Pick<OtpSettings, "enabled" | "template" | "brand" | "locale" | "codeLength" | "ttlSeconds" | "maxAttempts" | "resendSeconds" | "sessionName">>;
export interface OtpSent {
  id: string;
  state: string;
  channel: string;
  to: string;
  expiresIn: number;
  resendAfter?: number;
  note?: string;
}
export interface OtpChecked {
  valid: boolean;
  id: string;
  reason?: string;
  attemptsLeft?: number;
  secondsToVerify?: number | null;
}
export const getOtp = (): Promise<OtpOverview> => apiGet("/api/otp-setup");
export const saveOtpSettings = async (patch: OtpSettingsPatch): Promise<OtpSettings> => (await apiPut("/api/otp-setup/settings", patch)).settings;
export const getOtpPreview = async (p: { template?: string; locale?: string; brand?: string; codeLength?: number; ttlSeconds?: number }): Promise<string> => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== "") q.set(k, String(v));
  return (await apiGet(`/api/otp-setup/preview?${q}`)).text;
};
export const createOtpKey = async (body: { name: string; kind: "secret" | "public"; mode: "live" | "test"; origins?: string[] }): Promise<OtpKey & { key: string }> => (await apiPost("/api/otp-setup/keys", body)).key;
export const revokeOtpKey = (id: string) => apiDelete(`/api/otp-setup/keys/${encodeURIComponent(id)}`);
export const otpTestSend = (phone: string): Promise<OtpSent> => apiPost("/api/otp-setup/test/send", { phone });
export const otpTestCheck = (id: string, code: string): Promise<OtpChecked> => apiPost("/api/otp-setup/test/verify", { id, code });
export const otpTestStatus = async (id: string): Promise<OtpRequest> => (await apiGet(`/api/otp-setup/test/${encodeURIComponent(id)}`)).request;
export const getOtpLog = async (): Promise<OtpRequest[]> => (await apiGet("/api/otp-setup/log")).requests;
export const setOtpWebhook = (url: string): Promise<{ webhook: { id: string; url: string }; secret: string }> => apiPut("/api/otp-setup/webhook", { url });
export const removeOtpWebhook = () => apiDelete("/api/otp-setup/webhook");
export const testOtpWebhook = () => apiPost("/api/otp-setup/webhook/test", {});
export const getOtpWebhookDeliveries = async (): Promise<{ id: string; event: string; status: string; attempts: number; response_status: number | null; error: string | null; created_at: string }[]> => (await apiGet("/api/otp-setup/webhook/deliveries")).deliveries;
