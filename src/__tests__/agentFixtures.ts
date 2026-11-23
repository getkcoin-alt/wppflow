import type { Agent, AgentEvent, AgentsOverview } from "../services/api";

/** What GET /api/agents answers for a Business company with two numbers and no agents yet. */
export const agentsOverview = (over: Partial<AgentsOverview> = {}): AgentsOverview => ({
  allowed: true,
  reason: null,
  agents: [],
  numbers: [
    { name: "main-line", phone: "971500000001", connected: true },
    { name: "second-line", phone: "971500000002", connected: false },
  ],
  levels: [
    { key: "read", label: "Read only", blurb: "Looks at chats, searches, reads the company's knowledge. Cannot send or change anything.", tools: ["get_overview", "list_conversations"] },
    { key: "reply", label: "Read and reply", blurb: "Also answers customers on WhatsApp, leaves team notes and marks chats read.", tools: ["get_overview", "list_conversations", "send_message"] },
    { key: "full", label: "Full inbox control", blurb: "Also assigns chats, closes and reopens them, labels them, and makes follow-ups.", tools: ["get_overview", "list_conversations", "send_message", "assign_conversation"] },
  ],
  tools: [],
  defaults: { perHour: 30, perDay: 200, perChatHour: 6, expiresInDays: 90, newChatsPerHour: 5, newChatsPerDay: 10 },
  bounds: { perHour: [1, 1000], perDay: [1, 10000], perChatHour: [1, 100], expiresInDays: [1, 730], newChatsPerHour: [1, 100], newChatsPerDay: [1, 200] },
  maxAgents: 10,
  endpoints: { mcp: "https://api.example.test/mcp", rest: "https://api.example.test/api/agent/v1", openapi: "https://api.example.test/api/agent/v1/openapi.json" },
  ...over,
});

export const agent = (over: Partial<Agent> = {}): Agent => ({
  id: "agk_111111111111111111",
  name: "Claude helper",
  level: "reply",
  prefix: "scr_ag_a1b2c3d",
  state: "active",
  numbers: [],
  allowGroups: false,
  sharePhones: false,
  disclose: false,
  allowNewChats: false,
  limits: { perHour: 30, perDay: 200, perChatHour: 6, newChatsPerHour: 5, newChatsPerDay: 10 },
  expiresAt: new Date(Date.now() + 40 * 86_400_000).toISOString(),
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
  lastUsedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  lastClient: "claude-code/2.0 (cli)",
  revokedAt: null,
  usage: { sentLastHour: 2, sentLast24h: 9, callsLast24h: 31 },
  ...over,
});

export const event = (over: Partial<AgentEvent> = {}): AgentEvent => ({
  id: 10,
  at: new Date(Date.now() - 3 * 60_000).toISOString(),
  agentId: "agk_111111111111111111",
  agent: "Claude helper",
  tool: "send_message",
  ok: true,
  chatId: "conv_1",
  chat: "Maria Lopez",
  summary: "Sent a message (143 characters)",
  errorCode: null,
  ms: 120,
  via: "mcp",
  ...over,
});

export const KEY = `scr_ag_${"ab12cd34ef".repeat(4)}`;
