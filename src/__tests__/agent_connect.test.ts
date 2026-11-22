import { describe, it, expect } from "vitest";
import { CLIENTS, KEY_PLACEHOLDER, claudeCodeCommand, claudeDesktopConfig, cursorConfig, curlExample, expiryText, lastUse, limitsText, openApiUrl, secretLink, vscodeConfig, withKey } from "../components/developer/agents/connect";
import { buildInput, draftOf } from "../components/developer/agents/agentInput";
import { agent, agentsOverview, KEY } from "./agentFixtures";

const e = agentsOverview().endpoints;

describe("what is pasted to connect an agent", () => {
  it("Claude Code gets one command with the address and the key", () => {
    expect(claudeCodeCommand(e, KEY)).toBe(`claude mcp add --transport http scriwo https://api.example.test/mcp --header "Authorization: Bearer ${KEY}"`);
  });

  it("Claude Desktop gets valid JSON that starts mcp-remote with the header held in a variable", () => {
    const cfg = JSON.parse(claudeDesktopConfig(e, KEY));
    expect(cfg.mcpServers.scriwo.command).toBe("npx");
    expect(cfg.mcpServers.scriwo.args).toEqual(["-y", "mcp-remote", "https://api.example.test/mcp", "--header", "Authorization:${SCRIWO_AUTH}"]);
    expect(cfg.mcpServers.scriwo.env).toEqual({ SCRIWO_AUTH: `Bearer ${KEY}` });
  });

  it("Cursor and VS Code get valid JSON with the key as a Bearer header", () => {
    expect(JSON.parse(cursorConfig(e, KEY))).toEqual({ mcpServers: { scriwo: { url: "https://api.example.test/mcp", headers: { Authorization: `Bearer ${KEY}` } } } });
    expect(JSON.parse(vscodeConfig(e, KEY))).toEqual({ servers: { scriwo: { type: "http", url: "https://api.example.test/mcp", headers: { Authorization: `Bearer ${KEY}` } } } });
  });

  it("the link puts the key in the address; ChatGPT gets the description cut to what the agent may do; curl calls a tool", () => {
    expect(secretLink(e, KEY)).toBe(`https://api.example.test/mcp/${KEY}`);
    expect(openApiUrl(e, "read")).toBe("https://api.example.test/api/agent/v1/openapi.json?level=read");
    expect(curlExample(e, KEY)).toContain(`curl -s -X POST https://api.example.test/api/agent/v1/tools/get_overview`);
    expect(curlExample(e, KEY)).toContain(`Authorization: Bearer ${KEY}`);
  });

  it("an agent made earlier shows a placeholder, never a key", () => {
    for (const text of [claudeCodeCommand(e, KEY_PLACEHOLDER), claudeDesktopConfig(e, KEY_PLACEHOLDER), cursorConfig(e, KEY_PLACEHOLDER), secretLink(e, KEY_PLACEHOLDER)]) {
      expect(text).toContain(KEY_PLACEHOLDER);
      expect(text).not.toMatch(/scr_ag_[a-f0-9]{40}/);
    }
  });

  it("a prompt gets the key where it has the placeholder, and is left alone without one", () => {
    const prompt = `Authorization: Bearer ${KEY_PLACEHOLDER}\nand again ${KEY_PLACEHOLDER}`;
    expect(withKey(prompt, KEY)).toBe(`Authorization: Bearer ${KEY}\nand again ${KEY}`);
    expect(withKey(prompt, null)).toBe(prompt);
    expect(withKey(prompt, "")).toBe(prompt);
  });

  it("offers the programs people use, in an order that starts with the ones that need least", () => {
    expect(CLIENTS.map((c) => c.label)).toEqual(["Claude Code", "Claude Desktop", "Cursor", "VS Code", "ChatGPT", "Just a link", "Any agent"]);
  });
});

describe("how an agent is described", () => {
  const ago = (iso: string) => `${iso.slice(11, 16)} ago`;
  it("says whether it is connected, and with what", () => {
    expect(lastUse(null, null, ago)).toBe("Not connected yet");
    expect(lastUse("2026-11-16T10:30:00Z", "claude-code/2.0 (cli)", ago)).toBe("Last used 10:30 ago · claude-code/2.0");
    expect(lastUse("2026-11-16T10:30:00Z", null, ago)).toBe("Last used 10:30 ago");
  });
  it("puts the limits and the expiry in words", () => {
    expect(limitsText({ perHour: 30, perDay: 200, perChatHour: 6 })).toBe("30 messages an hour, 200 a day, 6 to one chat an hour");
    const now = Date.parse("2026-11-16T00:00:00Z");
    expect(expiryText(null, now)).toBe("Never expires");
    expect(expiryText("2026-11-27T00:00:00Z", now)).toBe("Expires in 11 days");
    expect(expiryText("2026-11-17T00:00:00Z", now)).toBe("Expires tomorrow");
    expect(expiryText("2026-11-15T00:00:00Z", now)).toBe("Expired");
  });
});

describe("what the form sends", () => {
  const o = agentsOverview();
  const fill = (over = {}) => ({ ...draftOf(o), name: "  Claude   helper ", ...over });

  it("a new agent starts as read and reply, on every number, with the AI line on and the usual limits and 90 days", () => {
    expect(draftOf(o)).toMatchObject({ level: "reply", allNumbers: true, allowGroups: false, sharePhones: false, disclose: true, perHour: "30", perDay: "200", perChatHour: "6", expiry: "90", allowNewChats: false, newChatsPerDay: "10" });
    expect(buildInput(o, fill(), false).value).toEqual({ name: "Claude helper", level: "reply", numbers: [], allowGroups: false, sharePhones: false, disclose: true, allowNewChats: false, newChatsPerDay: 10, perHour: 30, perDay: 200, perChatHour: 6, expiresInDays: 90 });
  });

  it("picked numbers are sent, 'never' becomes null, and the numbers on the screen are numbers", () => {
    const v = buildInput(o, fill({ allNumbers: false, picked: ["second-line"], expiry: "never", perHour: "5", level: "full" }), false).value!;
    expect(v).toMatchObject({ numbers: ["second-line"], expiresInDays: null, perHour: 5, level: "full" });
  });

  it("a name is needed and kept short; limits must be whole numbers within the server's bounds; some number must be picked", () => {
    expect(buildInput(o, fill({ name: "   " }), false).problem).toMatch(/Give the agent a name/);
    expect(buildInput(o, fill({ name: "x".repeat(81) }), false).problem).toMatch(/up to 80/);
    expect(buildInput(o, fill({ perHour: "0" }), false).problem).toBe("Messages an hour must be a whole number from 1 to 1000.");
    expect(buildInput(o, fill({ perDay: "1.5" }), false).problem).toMatch(/Messages a day must be a whole number from 1 to 10000/);
    expect(buildInput(o, fill({ perChatHour: "abc" }), false).problem).toMatch(/Messages to one chat an hour/);
    expect(buildInput(o, fill({ allNumbers: false, picked: [] }), false).problem).toMatch(/Pick at least one number/);
    expect(buildInput(o, fill({ newChatsPerDay: "0" }), false).problem).toBe("New chats a day must be a whole number from 1 to 200.");
    expect(buildInput(o, fill({ newChatsPerDay: "201" }), false).problem).toMatch(/from 1 to 200/);
  });

  it("starting chats with new numbers is off unless chosen, with its own cap", () => {
    expect(buildInput(o, fill({ allowNewChats: true, newChatsPerDay: "25" }), false).value).toMatchObject({ allowNewChats: true, newChatsPerDay: 25 });
  });

  it("editing keeps the key's expiry unless a new one is chosen", () => {
    const a = agent({ numbers: ["main-line"], allowGroups: true, limits: { perHour: 12, perDay: 90, perChatHour: 3, newChatsPerDay: 10 } });
    const d = draftOf(o, a);
    expect(d).toMatchObject({ name: "Claude helper", allNumbers: false, picked: ["main-line"], allowGroups: true, perHour: "12", expiry: "keep" });
    const kept = buildInput(o, d, true).value!;
    expect("expiresInDays" in kept).toBe(false);
    expect(buildInput(o, { ...d, expiry: "365" }, true).value!.expiresInDays).toBe(365);
    expect(buildInput(o, { ...d, expiry: "never" }, true).value!.expiresInDays).toBeNull();
  });
});
