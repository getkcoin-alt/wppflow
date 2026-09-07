export type UserRole = 'superadmin' | 'tenant_admin' | 'agent' | 'sales' | 'support';
export type PlanTier = 'starter' | 'growth' | 'enterprise';
export type AccountStatus = 'active' | 'suspended' | 'pending';

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
  role: 'superadmin' | 'admin' | 'sales' | 'support' | 'user';
  plan: string;
  sessions_limit: number;
  created_at: string;
}

export type SessionState = 'CONNECTED' | 'STARTING' | 'QRCODE' | 'DISCONNECTED';

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
  channel: 'sales' | 'support' | 'vip' | 'general';
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  currency: string;
  status: 'Delivered' | 'In Transit' | 'Processing' | 'Abandoned Cart';
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

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  id: string;
  chatId: string;
  sender: 'customer' | 'agent' | 'bot';
  agentName?: string;
  text: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact' | 'buttons' | 'list' | 'internal_note';
  mediaUrl?: string;
  fileName?: string;
  fileSize?: string;
  audioDuration?: string;
  buttons?: { id: string; label: string }[];
  listItems?: { title: string; description: string }[];
  timestamp: string;
  status: MessageStatus;
  isNote?: boolean;
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
  tags: string[];
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
  status: 'completed' | 'running' | 'scheduled' | 'draft';
  templateText: string;
  antiBanDelaySeconds: number; // 3 - 10s humanized jitter
  createdAt: string;
  scheduledFor?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  triggerType: 'keyword' | 'new_lead' | 'interactive_button' | 'order_abandoned';
  triggerCondition: string;
  actionType: 'reply_text' | 'reply_buttons' | 'assign_agent' | 'fire_webhook';
  actionSummary: string;
  isEnabled: boolean;
  executionsCount: number;
}

export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'DELETE' | 'PUT';
  path: string;
  category: 'Sessions' | 'Messages' | 'Groups' | 'Contacts & Chats' | 'Webhooks';
  title: string;
  description: string;
  headers: Record<string, string>;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
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
  event: 'onmessage' | 'onack' | 'onstatechange' | 'onbattery' | 'pollresponse';
  session: string;
  timestamp: string;
  status: 'delivered' | 'processing' | 'failed';
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
  systemStatus: 'healthy' | 'degraded' | 'maintenance';
}
