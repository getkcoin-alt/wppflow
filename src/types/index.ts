export type UserRole =
  | "superadmin"
  | "tenant_admin"
  | "agent"
  | "sales"
  | "support";
export type PlanTier = "starter" | "growth" | "enterprise";
export type AccountStatus = "active" | "blocked" | "suspended" | "pending";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  company: string;
  plan: PlanTier;
  status: AccountStatus;
  whatsappSessionsQuota: number;
  activeSessionsCount: number;
  monthlyBroadcastLimit: number;
  broadcastsUsed: number;
  teamSeats: number;
  apiCallsThisMonth: number;
  createdAt: string;
  lastLogin: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  company_name: string;
  role: "superadmin" | "admin" | "sales" | "support" | "user";
  plan: string;
  sessions_limit: number;
  status?: AccountStatus;
  membershipRole?: string;
  mustChangePassword?: boolean;
  isSuperAdmin?: boolean;
  is_superadmin?: boolean;
  created_at: string;
}

export type SessionState =
  | "CONNECTED"
  | "STARTING"
  | "QRCODE"
  | "DISCONNECTED"
  | "AUTHENTICATING"
  | "FAILED"
  | "EXPIRED";

export interface WhatsAppSession {
  id: string;
  sessionKey: string;
  displayName: string;
  phone: string;
  status: SessionState;
  battery: number;
  isCharging: boolean;
  antiBanHealth: number; // 0 - 100
  warmupDay: number; // 1 - 14
  proxyIp: string;
  messagesSentToday: number;
  messagesLimitToday: number;
  lastActive: string;
  wppVersion: string;
  channel: "sales" | "support" | "vip" | "general";
  ownerUserId?: number | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  currency: string;
  status: "Delivered" | "In Transit" | "Processing" | "Abandoned Cart";
  itemsSummary: string;
}

export interface InternalNote {
  id: string;
  author: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  tags: string[];
  customTraits: Record<string, string>;
  lifetimeValue: number;
  orders: CustomerOrder[];
  notes: InternalNote[];
  assignedAgent?: string;
  channel: string;
  lastSeen: string;
}

export type MessageStatus =
  | "sending"
  | "dispatching"
  | "uncertain"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export interface ChatMessage {
  id: string;
  chatId: string;
  sender: "customer" | "agent" | "bot";
  agentName?: string;
  text: string;
  type:
    | "text"
    | "image"
    | "gif"
    | "video"
    | "audio"
    | "document"
    | "sticker"
    | "location"
    | "contact"
    | "buttons"
    | "list"
    | "internal_note"
    | "call_log"
    | "e2e_notification";
  mediaUrl?: string;
  /** Opens in the browser (PDF, photo, video, audio) instead of downloading */
  openUrl?: string;
  /** Small version of a photo, shown in the chat while the full file stays for the viewer */
  thumbUrl?: string;
  /** The photo's own size, so the chat can reserve its space before it loads */
  width?: number;
  height?: number;
  mimeType?: string;
  /** ready: saved. not_saved: can be loaded from WhatsApp. storage_off / unavailable: cannot. */
  mediaState?: "ready" | "not_saved" | "storage_off" | "unavailable";
  fileName?: string;
  fileSize?: string;
  audioDuration?: string;
  buttons?: { id: string; label: string }[];
  listItems?: { title: string; description: string }[];
  timestamp: string;
  status: MessageStatus;
  isNote?: boolean;
  ack?: number;
  idempotencyKey?: string;
  providerMessageId?: string;
  timestampEpoch?: number;
}

export interface ChatThread {
  id: string;
  contactId: string;
  contactName: string;
  phone: string;
  avatar: string;
  unreadCount: number;
  isGroup: boolean;
  groupMembersCount?: number;
  channel: string;
  assignedTo: string;
  assignedAvatar?: string;
  isSnoozed?: boolean;
  isClosed?: boolean;
  isPinned?: boolean;
  /** Epoch seconds of the customer's first message nobody on the team has answered yet */
  awaitingSince?: number | null;
  tags: string[];
  /** The labels on the person this chat is with. Updates pushed over the socket leave this out. */
  labels?: { id: string; name: string; color: string }[];
  lastMessage: {
    text: string;
    timestamp: string;
    status: MessageStatus;
    fromMe: boolean;
    isNote?: boolean;
  };
}

export interface BroadcastCampaign {
  id: string;
  name: string;
  targetSegment: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  repliedCount: number;
  failedCount: number;
  costSavedMeta: number; // e.g. $64.80 saved compared to Meta official API fees
  status:
    | "completed"
    | "running"
    | "scheduled"
    | "draft"
    | "paused"
    | "stopped";
  templateText: string;
  antiBanDelaySeconds: number; // 3 - 10s humanized jitter
  createdAt: string;
  scheduledFor?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  triggerType:
    | "keyword"
    | "new_lead"
    | "interactive_button"
    | "order_abandoned";
  triggerCondition: string;
  actionType: "reply_text" | "reply_buttons" | "assign_agent" | "fire_webhook";
  actionSummary: string;
  isEnabled: boolean;
  executionsCount: number;
}

export interface ApiEndpoint {
  id: string;
  method: "GET" | "POST" | "DELETE" | "PUT";
  path: string;
  category:
    | "Sessions"
    | "Messages"
    | "Groups"
    | "Contacts & Chats"
    | "Webhooks";
  title: string;
  description: string;
  headers: Record<string, string>;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  sampleBody?: Record<string, any>;
  sampleResponse: Record<string, any>;
  curlSnippet: string;
  nodeSnippet: string;
  pythonSnippet: string;
  phpSnippet: string;
  goSnippet: string;
}

export interface WebhookLog {
  id: string;
  event: "onmessage" | "onack" | "onstatechange" | "onbattery" | "pollresponse";
  session: string;
  timestamp: string;
  status: "delivered" | "processing" | "failed";
  payload: Record<string, any>;
}

export interface ClusterMetrics {
  activeContainers: number;
  totalSessions: number;
  cpuUsagePercent: number;
  ramUsagePercent: number;
  ramUsageGb: number;
  totalRamGb: number;
  queueDepth: number;
  avgResponseMs: number;
  uptimeHours: number;
  systemStatus: "healthy" | "degraded" | "maintenance";
}

export type NotificationType = "note" | "mention" | "assignment" | "session" | "lead" | "lead_task" | "subscription" | "report" | "support";
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  conversationId: string | null;
  actorName: string;
  createdAt: string;
  read: boolean;
}
