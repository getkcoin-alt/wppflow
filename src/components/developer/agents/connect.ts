import type { AgentLevel, AgentsOverview } from "../../../services/api";

// What a person pastes to connect an AI agent to Scriwo: one block per kind of agent, with the agent's key in it. Pure text, so that it
// can be tested. The key is shown once, when the agent is made; for an agent made earlier the examples carry a placeholder instead.
export const KEY_PLACEHOLDER = "YOUR_AGENT_KEY";
export type Endpoints = AgentsOverview["endpoints"];
export type ClientKey = "claude-code" | "claude-desktop" | "cursor" | "vscode" | "chatgpt" | "link" | "prompt";

export const CLIENTS: { key: ClientKey; label: string }[] = [
  { key: "claude-code", label: "Claude Code" },
  { key: "claude-desktop", label: "Claude Desktop" },
  { key: "cursor", label: "Cursor" },
  { key: "vscode", label: "VS Code" },
  { key: "chatgpt", label: "ChatGPT" },
  { key: "link", label: "Just a link" },
  { key: "prompt", label: "Any agent" },
];

/** Claude Code: one command in a terminal */
export const claudeCodeCommand = (e: Endpoints, key: string) => `claude mcp add --transport http scriwo ${e.mcp} --header "Authorization: Bearer ${key}"`;

/** Claude Desktop's claude_desktop_config.json. The desktop app starts remote servers through mcp-remote; the header is given by a variable so that the space in "Bearer ..." survives on every system. */
export const claudeDesktopConfig = (e: Endpoints, key: string) =>
  JSON.stringify({ mcpServers: { scriwo: { command: "npx", args: ["-y", "mcp-remote", e.mcp, "--header", "Authorization:${SCRIWO_AUTH}"], env: { SCRIWO_AUTH: `Bearer ${key}` } } } }, null, 2);

/** Cursor: ~/.cursor/mcp.json (all projects) or .cursor/mcp.json (one project) */
export const cursorConfig = (e: Endpoints, key: string) => JSON.stringify({ mcpServers: { scriwo: { url: e.mcp, headers: { Authorization: `Bearer ${key}` } } } }, null, 2);

/** VS Code (GitHub Copilot agent mode): .vscode/mcp.json */
export const vscodeConfig = (e: Endpoints, key: string) => JSON.stringify({ servers: { scriwo: { type: "http", url: e.mcp, headers: { Authorization: `Bearer ${key}` } } } }, null, 2);

/** For a place that can only be given an address (some chat apps' "connectors"). The key is part of the address, so the address is a password. */
export const secretLink = (e: Endpoints, key: string) => `${e.mcp}/${key}`;

/** The description ChatGPT's Actions import; the level leaves out the tools this agent may not use */
export const openApiUrl = (e: Endpoints, level: AgentLevel) => `${e.openapi}?level=${level}`;

export const curlExample = (e: Endpoints, key: string) => `curl -s -X POST ${e.rest}/tools/get_overview \\\n  -H "Authorization: Bearer ${key}" \\\n  -H "Content-Type: application/json" -d '{}'`;

/** Puts the key where a prompt or an example has the placeholder (no key, no change) */
export const withKey = (text: string, key?: string | null) => (key ? text.split(KEY_PLACEHOLDER).join(key) : text);

/** The last use of an agent in words: what the owner wants to know is whether it is connected */
export function lastUse(lastUsedAt: string | null, client: string | null, ago: (iso: string) => string): string {
  if (!lastUsedAt) return "Not connected yet";
  const who = client ? ` · ${client.replace(/\s*\(.*?\)\s*/g, " ").trim().slice(0, 40)}` : "";
  return `Last used ${ago(lastUsedAt)}${who}`;
}

/** "30 an hour, 200 a day, 6 per chat" */
export const limitsText = (l: { perHour: number; perDay: number; perChatHour: number }) => `${l.perHour} messages an hour, ${l.perDay} a day, ${l.perChatHour} to one chat an hour`;

/** "Never expires", "Expires in 12 days", "Expired" */
export function expiryText(expiresAt: string | null, now = Date.now()): string {
  if (!expiresAt) return "Never expires";
  const days = Math.ceil((new Date(expiresAt).getTime() - now) / 86_400_000);
  if (days <= 0) return "Expired";
  return days === 1 ? "Expires tomorrow" : `Expires in ${days} days`;
}
