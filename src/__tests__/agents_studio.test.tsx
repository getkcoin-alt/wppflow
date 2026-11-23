import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({
  getAgents: vi.fn(),
  createAgent: vi.fn(),
  updateAgent: vi.fn(),
  revokeAgent: vi.fn(),
  getAgentActivity: vi.fn(),
  getAgentPrompt: vi.fn(),
  testAgent: vi.fn(),
}));
vi.mock("../services/api", async (original) => ({ ...(await original<typeof import("../services/api")>()), ...api }));
import { AgentsStudio } from "../components/developer/agents/AgentsStudio";
import { agent, agentsOverview, event, KEY } from "./agentFixtures";

const studio = (canManage = true) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AgentsStudio canManage={canManage} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  api.getAgentActivity.mockResolvedValue([]);
  api.getAgentPrompt.mockResolvedValue("You are \"Claude helper\".\nAuthorization: Bearer YOUR_AGENT_KEY");
  Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
});
afterEach(() => {
  cleanup();
  for (const f of Object.values(api)) f.mockReset();
});

describe("AI agents: the first visit", () => {
  it("a teammate who is not an owner or administrator is told who sets it up, and nothing is asked of the server", () => {
    studio(false);
    expect(screen.getByText(/AI agents are set up by your company's owner or an administrator/)).toBeDefined();
    expect(api.getAgents).not.toHaveBeenCalled();
  });

  it("explains what it is, how it works in three steps, and what keeps it safe, including where the messages go", async () => {
    api.getAgents.mockResolvedValue(agentsOverview());
    studio();
    expect(await screen.findByRole("heading", { name: "Let an AI agent work your WhatsApp inbox" })).toBeDefined();
    const steps = within(screen.getByRole("list", { name: "How it works" }));
    expect(steps.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      expect.stringContaining("Make an agent"),
      expect.stringContaining("Connect it"),
      expect.stringContaining("Ask it"),
    ]);
    const safe = within(screen.getByRole("list", { name: "What keeps it safe" })).getAllByRole("listitem").map((li) => li.textContent || "");
    expect(safe.some((t) => /key of its own, never your password/.test(t))).toBe(true);
    expect(safe.some((t) => /limits on how many messages/.test(t))).toBe(true);
    expect(safe.some((t) => /"human" brings a person/.test(t))).toBe(true);
    expect(safe.some((t) => /goes to the AI service you connect it to/.test(t))).toBe(true);
    expect(screen.getByRole("button", { name: /Make an agent/ })).toBeDefined();
    expect(screen.queryByText("What the agents did"), "no activity before there is an agent").toBeNull();
  });

  it("a company whose plan has no agents is told why", async () => {
    api.getAgents.mockResolvedValue(agentsOverview({ allowed: false, reason: "AI agent access isn't included in your Growth plan." }));
    studio();
    expect(await screen.findByText("AI agent access isn't included in your Growth plan.")).toBeDefined();
    expect(screen.queryByRole("button", { name: /Make an agent/ })).toBeNull();
  });
});

describe("making an agent", () => {
  const made = agent({ id: "agk_new", name: "Support bot", level: "full", numbers: ["main-line"], lastUsedAt: null, lastClient: null, usage: { sentLastHour: 0, sentLast24h: 0, callsLast24h: 0 } });

  it("what is chosen is what is sent; the key is shown once with its connect lines, and gone when it has been copied", async () => {
    api.getAgents.mockResolvedValueOnce(agentsOverview()).mockResolvedValue(agentsOverview({ agents: [made] }));
    api.createAgent.mockResolvedValue({ ...made, key: KEY });
    studio();
    fireEvent.click(await screen.findByRole("button", { name: /Make an agent/ }));
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "  Support   bot " } });
    fireEvent.click(screen.getByRole("radio", { name: /Full inbox control/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /All of the company's numbers/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /main-line/ }));
    fireEvent.click(screen.getByRole("button", { name: "Make agent" }));

    await waitFor(() => expect(api.createAgent).toHaveBeenCalledTimes(1));
    expect(api.createAgent).toHaveBeenCalledWith({ name: "Support bot", level: "full", numbers: ["main-line"], allowGroups: false, sharePhones: false, disclose: false, allowNewChats: false, newChatsPerHour: 5, newChatsPerDay: 10, perHour: 30, perDay: 200, perChatHour: 6, expiresInDays: 90 });

    // the key, once, and the lines that use it
    expect(await screen.findByText("Copy the key now")).toBeDefined();
    expect(screen.getByLabelText("Agent key").textContent).toBe(KEY);
    expect(screen.getByLabelText("Claude Code command").textContent).toBe(`claude mcp add --transport http scriwo https://api.example.test/mcp --header "Authorization: Bearer ${KEY}"`);
    expect(screen.getByText(/Waiting for its first call/)).toBeDefined();
    expect(screen.queryByText(/The examples show YOUR_AGENT_KEY/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "I have copied it" }));
    expect(screen.queryByText("Copy the key now")).toBeNull();
    expect(screen.queryByLabelText("Agent key")).toBeNull();
    expect(screen.getByLabelText("Claude Code command").textContent).toContain("Bearer YOUR_AGENT_KEY");
    expect(screen.getByLabelText("Claude Code command").textContent).not.toContain(KEY);
    expect(screen.getByText(/The examples show YOUR_AGENT_KEY/)).toBeDefined();
    expect(document.body.textContent).not.toContain(KEY);
  });

  it("starting chats with new numbers is a switch of its own, off at first, with a cap, and the card says when it is on", async () => {
    const made2 = agent({ id: "agk_nn", name: "Outreach bot", allowNewChats: true, limits: { perHour: 30, perDay: 200, perChatHour: 6, newChatsPerHour: 2, newChatsPerDay: 5 } });
    api.getAgents.mockResolvedValueOnce(agentsOverview()).mockResolvedValue(agentsOverview({ agents: [made2] }));
    api.createAgent.mockResolvedValue({ ...made2, key: KEY });
    studio();
    fireEvent.click(await screen.findByRole("button", { name: /Make an agent/ }));
    const box = screen.getByRole("checkbox", { name: /Allow starting chats with new numbers/ }) as HTMLInputElement;
    expect(box.checked).toBe(false);
    expect(screen.getByText(/WhatsApp can restrict a number that messages people who have not written first/)).toBeDefined();
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "Outreach bot" } });
    fireEvent.click(box);
    // the limits are two sets: existing customers, and new numbers
    expect(within(screen.getByRole("group", { name: "Limits for existing customers" })).getByLabelText("Messages an hour")).toBeDefined();
    const newSet = within(screen.getByRole("group", { name: "Limits for new numbers" }));
    expect(newSet.queryByLabelText("Messages an hour")).toBeNull();
    fireEvent.change(newSet.getByLabelText("New chats an hour"), { target: { value: "2" } });
    fireEvent.change(newSet.getByLabelText("New chats in 24 hours"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Make agent" }));
    await waitFor(() => expect(api.createAgent).toHaveBeenCalledTimes(1));
    expect(api.createAgent.mock.calls[0][0]).toMatchObject({ allowNewChats: true, newChatsPerHour: 2, newChatsPerDay: 5 });
    expect(within(await screen.findByRole("listitem", { name: "Agent Outreach bot" })).getByText(/may start chats with new numbers/)).toBeDefined();
    expect(within(screen.getByRole("listitem", { name: "Agent Outreach bot" })).getByText(/new numbers: 2 chats an hour, 5 a day/)).toBeDefined();
  });

  it("a name that is missing or a limit that is out of range is explained, and nothing is sent", async () => {
    api.getAgents.mockResolvedValue(agentsOverview());
    studio();
    fireEvent.click(await screen.findByRole("button", { name: /Make an agent/ }));
    const form = screen.getByRole("form", { name: "New agent" });
    fireEvent.submit(form);
    expect(await screen.findByText(/Give the agent a name/)).toBeDefined();
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "Bot" } });
    fireEvent.change(screen.getByLabelText("Messages an hour"), { target: { value: "0" } });
    fireEvent.submit(form);
    expect(await screen.findByText("Messages an hour must be a whole number from 1 to 1000.")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Messages an hour"), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /All of the company's numbers/ }));
    fireEvent.submit(form);
    expect(await screen.findByText(/Pick at least one number/)).toBeDefined();
    expect(api.createAgent).not.toHaveBeenCalled();
  });

  it("the server's refusal is shown with what to do about it", async () => {
    api.getAgents.mockResolvedValue(agentsOverview());
    api.createAgent.mockRejectedValue(Object.assign(new Error("A company can have up to 10 agents."), { data: { fix: "Revoke one you no longer use, then make the new one." } }));
    studio();
    fireEvent.click(await screen.findByRole("button", { name: /Make an agent/ }));
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "Bot" } });
    fireEvent.click(screen.getByRole("button", { name: "Make agent" }));
    expect(await screen.findByText(/A company can have up to 10 agents\. Revoke one you no longer use/)).toBeDefined();
    expect(screen.queryByText("Copy the key now")).toBeNull();
  });

  it("an owner can make an agent that only reads, and is told it can draft replies", async () => {
    api.getAgents.mockResolvedValue(agentsOverview());
    studio();
    fireEvent.click(await screen.findByRole("button", { name: /Make an agent/ }));
    fireEvent.click(screen.getByRole("radio", { name: /Read only/ }));
    expect(screen.getByText(/can draft replies for you to send yourself/)).toBeDefined();
  });

  it("at the limit of agents the button is off and says why", async () => {
    api.getAgents.mockResolvedValue(agentsOverview({ maxAgents: 2, agents: [agent({ id: "a1" }), agent({ id: "a2", name: "Second" })] }));
    studio();
    const button = await screen.findByRole("button", { name: /Make an agent/ });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/up to 2 agents/)).toBeDefined();
  });
});

describe("the agents of a company", () => {
  const list = [
    agent({ id: "a1", name: "Claude helper", numbers: ["main-line"], allowGroups: true }),
    agent({ id: "a2", name: "Waiting bot", lastUsedAt: null, lastClient: null, usage: { sentLastHour: 0, sentLast24h: 0, callsLast24h: 0 } }),
    agent({ id: "a3", name: "Old bot", state: "expired", expiresAt: "2026-10-01T00:00:00.000Z" }),
    agent({ id: "a4", name: "Gone bot", state: "revoked", revokedAt: new Date(Date.now() - 3600_000).toISOString() }),
  ];

  it("each one says what it may do, whether it is connected, what it has sent and its limits", async () => {
    api.getAgents.mockResolvedValue(agentsOverview({ agents: list }));
    studio();
    const first = within(await screen.findByRole("listitem", { name: "Agent Claude helper" }));
    expect(first.getByText("Active")).toBeDefined();
    expect(first.getByText("Read and reply")).toBeDefined();
    expect(first.getByText(/Numbers: main-line · groups allowed/)).toBeDefined();
    expect(first.getByText(/Last used 5m ago · claude-code\/2\.0/)).toBeDefined();
    expect(first.getByText(/Expires in 40 days|Expires in 41 days/)).toBeDefined();
    expect(first.getByText(/Sent 2 in the last hour, 9 in 24 hours\. Limits: 30 messages an hour, 200 a day, 6 to one chat an hour\./)).toBeDefined();
    expect(first.getByText("scr_ag_a1b2c3d…")).toBeDefined();
    expect(within(screen.getByRole("listitem", { name: "Agent Waiting bot" })).getByText(/Not connected yet/)).toBeDefined();
    const old = within(screen.getByRole("listitem", { name: "Agent Old bot" }));
    expect(old.getByText("Expired")).toBeDefined();
    const gone = within(screen.getByRole("listitem", { name: "Agent Gone bot" }));
    expect(gone.getByText("Revoked")).toBeDefined();
    expect(gone.getByText(/Revoked 1h ago/)).toBeDefined();
    expect(gone.queryByRole("button", { name: /Connect/ }), "a revoked agent has nothing to do").toBeNull();
    expect(gone.queryByRole("button", { name: /Revoke/ })).toBeNull();
  });

  it("settings open with what is set, and a change is sent without touching the expiry", async () => {
    api.getAgents.mockResolvedValue(agentsOverview({ agents: [list[0]] }));
    api.updateAgent.mockResolvedValue(list[0]);
    studio();
    fireEvent.click(await screen.findByRole("button", { name: "Settings for Claude helper" }));
    expect((screen.getByLabelText(/^Name/) as HTMLInputElement).value).toBe("Claude helper");
    expect((screen.getByRole("radio", { name: /Read and reply/ }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("checkbox", { name: /All of the company's numbers/ }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole("checkbox", { name: /main-line/ }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText("Messages an hour") as HTMLInputElement).value).toBe("30");
    fireEvent.change(screen.getByLabelText("Messages an hour"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("radio", { name: /Full inbox control/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(api.updateAgent).toHaveBeenCalledTimes(1));
    const [id, body] = api.updateAgent.mock.calls[0];
    expect(id).toBe("a1");
    expect(body).toMatchObject({ name: "Claude helper", level: "full", numbers: ["main-line"], allowGroups: true, perHour: 12, perDay: 200, perChatHour: 6 });
    expect("expiresInDays" in body, "the key keeps the expiry it has").toBe(false);
  });

  it("a key can be given a new expiry from the settings", async () => {
    api.getAgents.mockResolvedValue(agentsOverview({ agents: [list[2]] }));
    api.updateAgent.mockResolvedValue(list[2]);
    studio();
    fireEvent.click(await screen.findByRole("button", { name: "Settings for Old bot" }));
    fireEvent.change(screen.getByLabelText("The key stops working"), { target: { value: "365" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(api.updateAgent).toHaveBeenCalled());
    expect(api.updateAgent.mock.calls[0][1].expiresInDays).toBe(365);
  });

  it("revoking asks first; keeping it changes nothing; confirming revokes it", async () => {
    api.getAgents.mockResolvedValue(agentsOverview({ agents: [list[0]] }));
    api.revokeAgent.mockResolvedValue({});
    studio();
    fireEvent.click(await screen.findByRole("button", { name: "Revoke Claude helper" }));
    expect(screen.getByRole("alertdialog", { name: "Revoke Claude helper?" })).toBeDefined();
    expect(screen.getByText(/stops working at once and cannot be switched back on/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Keep it" }));
    expect(api.revokeAgent).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Revoke Claude helper" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, revoke it" }));
    await waitFor(() => expect(api.revokeAgent).toHaveBeenCalledWith("a1"));
  });
});

describe("connecting an agent", () => {
  const open = async (over = {}) => {
    api.getAgents.mockResolvedValue(agentsOverview({ agents: [agent({ id: "a1", ...over })] }));
    studio();
    fireEvent.click(await screen.findByRole("button", { name: "Connect" }));
    return await screen.findByRole("heading", { name: "Connect Claude helper" });
  };
  const tab = (name: string) => fireEvent.click(screen.getByRole("tab", { name }));

  it("an agent that has already been used is shown as connected, an old one with a placeholder instead of a key", async () => {
    await open();
    expect(screen.getByText(/Connected · used 5m ago/)).toBeDefined();
    expect(screen.getByText(/The examples show YOUR_AGENT_KEY/)).toBeDefined();
  });

  it("each program has its own lines", async () => {
    await open({ lastUsedAt: null });
    expect(screen.getByText(/Waiting for its first call/)).toBeDefined();
    tab("Claude Desktop");
    expect(JSON.parse(screen.getByLabelText("Claude Desktop configuration").textContent!).mcpServers.scriwo.args[2]).toBe("https://api.example.test/mcp");
    tab("Cursor");
    expect(JSON.parse(screen.getByLabelText("Cursor configuration").textContent!).mcpServers.scriwo.url).toBe("https://api.example.test/mcp");
    tab("VS Code");
    expect(JSON.parse(screen.getByLabelText("VS Code configuration").textContent!).servers.scriwo.type).toBe("http");
    tab("ChatGPT");
    expect(screen.getByText("https://api.example.test/api/agent/v1/openapi.json?level=reply"), "the description is cut to what this agent may do").toBeDefined();
    expect(screen.getByText(/ChatGPT asks you to confirm each action that sends or changes something/)).toBeDefined();
    tab("Just a link");
    expect(screen.getByLabelText("Connector address").textContent).toBe("https://api.example.test/mcp/YOUR_AGENT_KEY");
    expect(screen.getByText(/treat the address like a password/)).toBeDefined();
  });

  it("'any agent' gives a prompt from the server, with the placeholder, and a curl line", async () => {
    await open();
    tab("Any agent");
    expect(await screen.findByLabelText("Prompt for any agent")).toBeDefined();
    expect(screen.getByLabelText("Prompt for any agent").textContent).toContain("Authorization: Bearer YOUR_AGENT_KEY");
    expect(api.getAgentPrompt).toHaveBeenCalledWith("a1", "rest");
    expect(screen.getByLabelText("curl example").textContent).toContain("/api/agent/v1/tools/get_overview");
    fireEvent.click(screen.getByRole("button", { name: "Copy the prompt" }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining("You are \"Claude helper\".")));
    expect(await screen.findByRole("button", { name: "Copied" })).toBeDefined();
  });

  it("the prompt carries the key right after the agent was made", async () => {
    const made = agent({ id: "a9", name: "Claude helper", lastUsedAt: null });
    api.getAgents.mockResolvedValue(agentsOverview({ agents: [] }));
    api.createAgent.mockResolvedValue({ ...made, key: KEY });
    studio();
    fireEvent.click(await screen.findByRole("button", { name: /Make an agent/ }));
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "Claude helper" } });
    api.getAgents.mockResolvedValue(agentsOverview({ agents: [made] }));
    fireEvent.click(screen.getByRole("button", { name: "Make agent" }));
    await screen.findByText("Copy the key now");
    tab("Any agent");
    expect((await screen.findByLabelText("Prompt for any agent")).textContent).toContain(`Authorization: Bearer ${KEY}`);
    tab("Just a link");
    expect(screen.getByLabelText("Connector address").textContent).toBe(`https://api.example.test/mcp/${KEY}`);
  });

  it("a new agent's key is never shown in the panel of another agent", async () => {
    const older = agent({ id: "a1", name: "Older agent" });
    const made = agent({ id: "a9", name: "Brand new", lastUsedAt: null });
    api.getAgents.mockResolvedValue(agentsOverview({ agents: [older] }));
    api.createAgent.mockResolvedValue({ ...made, key: KEY });
    studio();
    fireEvent.click(await screen.findByRole("button", { name: /Make an agent/ }));
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "Brand new" } });
    api.getAgents.mockResolvedValue(agentsOverview({ agents: [made, older] }));
    fireEvent.click(screen.getByRole("button", { name: "Make agent" }));
    await screen.findByText("Copy the key now");
    // one panel is open at a time: open the older agent's, while the new key is still on the page
    expect(within(screen.getByRole("listitem", { name: "Agent Brand new" })).getByLabelText("Claude Code command").textContent).toContain(KEY);
    fireEvent.click(within(screen.getByRole("listitem", { name: "Agent Older agent" })).getByRole("button", { name: "Connect" }));
    const olderLine = within(screen.getByRole("listitem", { name: "Agent Older agent" })).getByLabelText("Claude Code command");
    expect(olderLine.textContent).toContain("YOUR_AGENT_KEY");
    expect(olderLine.textContent).not.toContain(KEY);
    expect(screen.getAllByLabelText("Claude Code command")).toHaveLength(1);
    // and the new agent's panel still has its own key when it is opened again
    fireEvent.click(within(screen.getByRole("listitem", { name: "Agent Brand new" })).getByRole("button", { name: "Connect" }));
    expect(within(screen.getByRole("listitem", { name: "Agent Brand new" })).getByLabelText("Claude Code command").textContent).toContain(KEY);
  });

  it("'see what this agent will see' shows the overview and says nothing was sent", async () => {
    await open();
    api.testAgent.mockResolvedValue({
      company: "Acme Stores",
      you: { name: "Claude helper", level: "reply", numbers: "all", groupChats: false, customerPhoneNumbers: "hidden" },
      numbers: [{ name: "main-line", connected: true, phone: "+971500000001" }],
      inbox: { openChats: 12, unreadChats: 4, waitingForReply: 3, waitingLongerThanTarget: 1, askedForAPerson: 1, replyTargetMinutes: 30 },
    });
    fireEvent.click(screen.getByRole("button", { name: "See what this agent will see" }));
    const box = within(await screen.findByLabelText("What this agent sees"));
    expect(box.getByText(/12 open chats, 4 unread, 3 waiting for a reply, 1 asked for a person/)).toBeDefined();
    expect(box.getByText(/main-line \(connected\)/)).toBeDefined();
    expect(box.getByText(/Phone numbers: hidden\. Groups: not available\. Nothing was sent or changed\./)).toBeDefined();
    expect(api.testAgent).toHaveBeenCalledWith("a1");
  });

  it("a failing test says why", async () => {
    await open();
    api.testAgent.mockRejectedValue(new Error("This agent was revoked."));
    fireEvent.click(screen.getByRole("button", { name: "See what this agent will see" }));
    expect(await screen.findByText("This agent was revoked.")).toBeDefined();
  });
});

describe("what the agents did", () => {
  const page1 = Array.from({ length: 30 }, (_, i) => event({ id: 100 - i, summary: i === 0 ? "Sent a message (143 characters)" : `Read a chat ${i}`, tool: i === 0 ? "send_message" : "get_conversation" }));

  it("lists what happened, newest first, with the result of each and no message text", async () => {
    api.getAgents.mockResolvedValue(agentsOverview({ agents: [agent()] }));
    api.getAgentActivity.mockResolvedValue([
      event({ id: 3, ok: null, summary: "Sending a message" }),
      event({ id: 2, ok: false, errorCode: "limit_reached", summary: "This agent has reached its limit of 30 messages an hour." }),
      event({ id: 1, ok: true, errorCode: "duplicate", summary: "The same message again: nothing was sent twice" }),
      event({ id: 0, ok: true, via: "test", chat: null, tool: "get_overview", summary: "Looked at the overview" }),
    ]);
    studio();
    const rows = within(await screen.findByRole("list", { name: "Agent activity" })).getAllByRole("listitem");
    expect(rows).toHaveLength(4);
    expect(rows[0].textContent).toContain("Sending…");
    expect(rows[1].textContent).toContain("Refused");
    expect(rows[1].textContent).toContain("limit of 30 messages an hour");
    expect(rows[2].textContent).toContain("Repeat");
    expect(rows[3].textContent).toContain("Done");
    expect(rows[3].textContent).toContain("test");
    expect(rows[0].textContent).toContain("Claude helper");
    expect(rows[0].textContent).toContain("Maria Lopez");
    expect(api.getAgentActivity).toHaveBeenCalledWith({ changes: false, agentId: undefined, limit: 30 });
  });

  it("can be narrowed to what changed something, and to one agent, and can go further back", async () => {
    api.getAgents.mockResolvedValue(agentsOverview({ agents: [agent(), agent({ id: "a2", name: "Second" })] }));
    api.getAgentActivity.mockImplementation(async (p: any) => (p.beforeId ? [event({ id: 5, summary: "An older thing" })] : page1));
    studio();
    await screen.findByRole("list", { name: "Agent activity" });
    fireEvent.click(screen.getByRole("button", { name: "Show older" }));
    await waitFor(() => expect(api.getAgentActivity).toHaveBeenCalledWith({ changes: false, agentId: undefined, limit: 30, beforeId: 71 }));
    expect(await screen.findByText(/An older thing/)).toBeDefined();
    expect(screen.queryByRole("button", { name: "Show older" }), "a short page is the end").toBeNull();

    fireEvent.click(screen.getByRole("switch", { name: "Only what changed something" }));
    await waitFor(() => expect(api.getAgentActivity).toHaveBeenCalledWith({ changes: true, agentId: undefined, limit: 30 }));
    fireEvent.change(screen.getByLabelText("Show one agent"), { target: { value: "a2" } });
    await waitFor(() => expect(api.getAgentActivity).toHaveBeenCalledWith({ changes: true, agentId: "a2", limit: 30 }));
  });

  it("says plainly when nothing has happened yet", async () => {
    api.getAgents.mockResolvedValue(agentsOverview({ agents: [agent()] }));
    api.getAgentActivity.mockResolvedValue([]);
    studio();
    expect(await screen.findByText(/Nothing yet\. When an agent looks at a chat or answers a customer/)).toBeDefined();
  });
});
