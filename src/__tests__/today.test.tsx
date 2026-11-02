import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { dayLine, endOfToday, greetingFor } from "../components/home/greeting";

const api = vi.hoisted(() => ({
  fetchHome: vi.fn(),
  aiSuggestReply: vi.fn(),
  updateLeadTask: vi.fn(),
  fetchAutopilot: vi.fn(),
  setAutopilotRule: vi.fn(),
  undoAutopilot: vi.fn(),
  apiGet: vi.fn(),
  getStoredTenantId: () => "t1",
}));
vi.mock("../services/api", async (original) => ({ ...(await original<typeof import("../services/api")>()), ...api }));
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
import { Today, type TodayProps } from "../components/home/Today";

const none = { waiting: 0, overdue: 0, tasksDue: 0, tasksOverdue: 0, numbersNeedingCare: 0, askedForPerson: 0 };
const chat = (over = {}) => ({ kind: "chat", id: "chat:c1", conversationId: "c1", title: "Asha Rao", avatar: "", preview: "Is the villa still available?", waitingSeconds: 5400, overdue: true, unread: 1, assignedTo: "", isMine: false, ...over });
const home = (over = {}) => ({ firstName: "Olivia", counts: none, replyTargetMinutes: 30, needsYou: [], more: 0, setup: null, ...over });

let props: TodayProps;
let qc: QueryClient;
const show = (data: object, extra: Partial<TodayProps> = {}) => {
  api.fetchHome.mockResolvedValue(data);
  props = {
    workspaceName: "Bloom Florist",
    ai: { available: true, locked: false },
    hasNumber: true,
    onOpenChat: vi.fn(),
    onSend: vi.fn().mockResolvedValue(undefined),
    onSearch: vi.fn(),
    onOpenInbox: vi.fn(),
    onOpenNumbers: vi.fn(),
    onConnectNumber: vi.fn(),
    onSetupStep: vi.fn(),
    ...extra,
  };
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <Today {...props} />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  for (const f of Object.values(api)) if (typeof f === "function" && "mockReset" in f) (f as any).mockReset();
  api.fetchAutopilot.mockResolvedValue({ available: true, reason: null, canEdit: false, rules: [], sentToday: 0, dailyCap: 50, log: [] });
  api.apiGet.mockResolvedValue({ summary: { conversations: 12, contacts: 30, sessions: 1, pending: 0, sent: 10, delivered: 8, read: 5 } });
});
afterEach(cleanup);

describe("the words on Today", () => {
  it("greets by the hour, and says the state of the day in one calm sentence", () => {
    expect(greetingFor(new Date(2026, 0, 1, 8))).toBe("Good morning");
    expect(greetingFor(new Date(2026, 0, 1, 14))).toBe("Good afternoon");
    expect(greetingFor(new Date(2026, 0, 1, 20))).toBe("Good evening");
    expect(greetingFor(new Date(2026, 0, 1, 2))).toBe("Working late");
    expect(dayLine(none, 30)).toBe("You're all caught up. Nothing is waiting for you.");
    expect(dayLine({ waiting: 3, overdue: 1, tasksDue: 2, tasksOverdue: 1, numbersNeedingCare: 0 }, 30)).toBe("3 customers are waiting for a reply, 1 past your 30-minute target. 2 follow-ups are due today, 1 late.");
    expect(dayLine({ ...none, waiting: 1 }, 15)).toBe("1 customer is waiting for a reply.");
  });
  it("ends 'today' at the person's own midnight", () => {
    const end = new Date(endOfToday(new Date(2026, 5, 10, 9, 30)));
    expect([end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes()]).toEqual([2026, 5, 10, 23, 59]);
  });
});

describe("Today", () => {
  it("shows the person's name, the day, and who is waiting", async () => {
    show(home({ counts: { ...none, waiting: 1, overdue: 1 }, needsYou: [chat()] }));
    expect(await screen.findByRole("heading", { level: 1, name: /Olivia/ })).toBeDefined();
    expect(screen.getByText(/1 customer is waiting for a reply, 1 past your 30-minute target/)).toBeDefined();
    const card = screen.getByTestId("need-chat:c1");
    expect(within(card).getByText("Asha Rao")).toBeDefined();
    expect(within(card).getByText(/Is the villa still available/)).toBeDefined();
    expect(within(card).getByTitle("Past your reply target").textContent).toMatch(/Waiting 1\.5 h/);
    expect(document.body.textContent).not.toContain("@lid");
  });

  it("an owner is shown the morning brief, and others are not", async () => {
    show(home({ brief: { day: "2026-06-10", text: "Yesterday was busy. Today: reply to the customers still waiting.", source: "ai" } }));
    const brief = await screen.findByRole("region", { name: "Morning brief" });
    expect(brief.textContent).toContain("Today: reply to the customers still waiting.");
    cleanup();
    show(home());
    await screen.findByText("All clear");
    expect(screen.queryByRole("region", { name: "Morning brief" })).toBeNull();
  });

  it("a customer who asked for a person is marked, and the day says so first", async () => {
    show(home({ counts: { ...none, waiting: 2, askedForPerson: 1 }, needsYou: [chat({ askedForPerson: true })] }));
    const card = await screen.findByTestId("need-chat:c1");
    expect(within(card).getByText("Asked for a person")).toBeDefined();
    expect(screen.getByText(/^1 customer has asked for a person\. 2 customers are waiting for a reply\./)).toBeDefined();
    expect(dayLine({ ...none, waiting: 3, askedForPerson: 2 }, 30)).toMatch(/^2 customers have asked for a person\./);
  });

  it("says plainly when everything is answered", async () => {
    show(home());
    expect(await screen.findByText("All clear")).toBeDefined();
    expect(screen.getByText(/You're all caught up/)).toBeDefined();
  });

  it("a workspace with no connected number is shown how to start", async () => {
    show(home(), { hasNumber: false });
    fireEvent.click(await screen.findByRole("button", { name: /Connect a number/ }));
    expect(props.onConnectNumber).toHaveBeenCalled();
    expect(screen.queryByText("All clear")).toBeNull();
  });

  it("Riwo drafts a reply, the person edits it, and one tap sends it", async () => {
    api.aiSuggestReply.mockResolvedValue({ text: "Hi Asha! Yes, it is still available. Shall I book a viewing?", tone: "friendly" });
    show(home({ counts: { ...none, waiting: 1 }, needsYou: [chat()] }));
    fireEvent.click(await screen.findByRole("button", { name: "Draft a reply with Riwo" }));
    expect(api.aiSuggestReply).toHaveBeenCalledWith("c1", "friendly");
    const box = (await screen.findByRole("textbox", { name: "Reply" })) as HTMLTextAreaElement;
    expect(box.value).toContain("still available");
    fireEvent.change(box, { target: { value: "  Hi Asha, yes it is. When would you like to see it?  " } });
    fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
    await waitFor(() => expect(props.onSend).toHaveBeenCalledWith("c1", "Hi Asha, yes it is. When would you like to see it?"));
    await waitFor(() => expect(api.fetchHome).toHaveBeenCalledTimes(2)); // the list is asked again: the customer has an answer
  });

  it("a reply Riwo prepared earlier is already there: with what the customer wants, how they sound, and the next step", async () => {
    const prep = { summary: "Wants to view the villa on Friday.", mood: "urgent", moodNote: "needs it this week", nextStep: "Offer 5pm", draft: "Hi Asha! Friday at 5pm works. Shall I book it?" };
    show(home({ needsYou: [chat({ prep })] }));
    const box = (await screen.findByRole("textbox", { name: "Reply" })) as HTMLTextAreaElement;
    expect(box.value).toBe(prep.draft);
    expect(screen.getByText("Riwo prepared this reply. Read it, change it, then send.")).toBeDefined();
    expect(screen.getByText("Wants to view the villa on Friday.")).toBeDefined();
    expect(screen.getByText("Urgent")).toBeDefined();
    expect(screen.getByText("Next: Offer 5pm")).toBeDefined();
    expect(api.aiSuggestReply).not.toHaveBeenCalled(); // nothing to wait for: it was done while nobody looked
    fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
    await waitFor(() => expect(props.onSend).toHaveBeenCalledWith("c1", prep.draft));
  });

  it("a prepared reply with a [bracketed] part cannot be sent until it is filled in", async () => {
    show(home({ needsYou: [chat({ prep: { summary: "Asks the price.", mood: "neutral", moodNote: "", nextStep: "", draft: "Hi Ben, our plans start at [price]." } })] }));
    const send = (await screen.findByRole("button", { name: /^Send$/ })) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    expect(send.title).toBe("Fill in the [bracketed] part first");
    expect(screen.getByText(/Riwo left a \[bracketed\] part/)).toBeDefined();
    fireEvent.change(screen.getByRole("textbox", { name: "Reply" }), { target: { value: "Hi Ben, our plans start at INR 999." } });
    expect((screen.getByRole("button", { name: /^Send$/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("when Riwo finishes after the card was shown it appears, unless the person already threw one away", async () => {
    const prep = { summary: "Asks the price.", mood: "neutral", moodNote: "", nextStep: "", draft: "Hi! Plans start at INR 999." };
    show(home({ needsYou: [chat()] }));
    await screen.findByRole("button", { name: "Draft a reply with Riwo" });
    api.fetchHome.mockResolvedValue(home({ needsYou: [chat({ prep })] }));
    await qc.invalidateQueries({ queryKey: ["home", "t1"] });
    expect(((await screen.findByRole("textbox", { name: "Reply" })) as HTMLTextAreaElement).value).toBe(prep.draft);
    fireEvent.click(screen.getByRole("button", { name: /Discard/ }));
    await qc.invalidateQueries({ queryKey: ["home", "t1"] });
    await waitFor(() => expect(api.fetchHome.mock.calls.length).toBeGreaterThanOrEqual(3));
    expect(screen.queryByRole("textbox", { name: "Reply" }), "a discarded draft does not come back").toBeNull();
  });

  it("another tone writes a new draft, and a draft can be thrown away without sending anything", async () => {
    api.aiSuggestReply.mockResolvedValueOnce({ text: "Hello!", tone: "friendly" }).mockResolvedValueOnce({ text: "Yes.", tone: "brief" });
    show(home({ needsYou: [chat()] }));
    fireEvent.click(await screen.findByRole("button", { name: "Draft a reply with Riwo" }));
    await screen.findByRole("textbox", { name: "Reply" });
    fireEvent.click(screen.getByRole("button", { name: "Brief" }));
    await waitFor(() => expect((screen.getByRole("textbox", { name: "Reply" }) as HTMLTextAreaElement).value).toBe("Yes."));
    expect(api.aiSuggestReply).toHaveBeenLastCalledWith("c1", "brief");
    fireEvent.click(screen.getByRole("button", { name: /Discard/ }));
    expect(screen.queryByRole("textbox", { name: "Reply" })).toBeNull();
    expect(props.onSend).not.toHaveBeenCalled();
  });

  it("says why a draft or a send did not work, and keeps the words", async () => {
    api.aiSuggestReply.mockRejectedValueOnce(new Error("Riwo is busy right now. Please try again in a moment.")).mockResolvedValue({ text: "Hello", tone: "friendly" });
    show(home({ needsYou: [chat()] }), { onSend: vi.fn().mockRejectedValue(new Error("That number is not connected.")) });
    fireEvent.click(await screen.findByRole("button", { name: "Draft a reply with Riwo" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/busy right now/);
    fireEvent.click(screen.getByRole("button", { name: "Draft a reply with Riwo" }));
    await screen.findByRole("textbox", { name: "Reply" });
    fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/not connected/);
    expect((screen.getByRole("textbox", { name: "Reply" }) as HTMLTextAreaElement).value).toBe("Hello");
  });

  it("without Riwo the card still opens the chat, and on a plan without it says so", async () => {
    show(home({ needsYou: [chat()] }), { ai: { available: false, locked: true } });
    expect(await screen.findByText(/Riwo drafts replies on Growth/)).toBeDefined();
    expect(screen.queryByRole("button", { name: "Draft a reply with Riwo" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Open chat/ }));
    expect(props.onOpenChat).toHaveBeenCalledWith("c1");
  });

  it("a follow-up can be done, moved to tomorrow, or opened in its chat", async () => {
    api.updateLeadTask.mockResolvedValue({});
    const task = { kind: "task", id: "task:t9", taskId: "t9", conversationId: "c1", title: "Call back about the deposit", who: "Asha Rao", dueAt: new Date(Date.now() - 3600_000).toISOString(), overdue: true, escalated: true };
    show(home({ counts: { ...none, tasksDue: 1, tasksOverdue: 1 }, needsYou: [task] }));
    const card = await screen.findByTestId("need-task:t9");
    expect(within(card).getByText(/Late, was due/)).toBeDefined();
    expect(within(card).getByText(/Your manager has been told/)).toBeDefined();
    fireEvent.click(within(card).getByRole("button", { name: /Done/ }));
    await waitFor(() => expect(api.updateLeadTask).toHaveBeenCalledWith("t9", { done: true }));
    fireEvent.click(within(card).getByRole("button", { name: "Tomorrow" }));
    await waitFor(() => expect(api.updateLeadTask).toHaveBeenLastCalledWith("t9", { dueAt: expect.stringMatching(/T/) }));
    const due = new Date(api.updateLeadTask.mock.calls[1][1].dueAt);
    expect(due.getTime()).toBeGreaterThan(Date.now());
    fireEvent.click(within(card).getByRole("button", { name: /Open chat/ }));
    expect(props.onOpenChat).toHaveBeenCalledWith("c1");
  });

  it("a number that is down says what is wrong and takes the person to fix it", async () => {
    show(home({ counts: { ...none, numbersNeedingCare: 1 }, needsYou: [{ kind: "number", id: "number:shop", sessionName: "shop", title: "Sam's number", level: "down", problem: "Not connected for 20 minutes." }] }));
    const card = await screen.findByTestId("need-number:shop");
    expect(within(card).getByText("Not connected for 20 minutes.")).toBeDefined();
    fireEvent.click(within(card).getByRole("button", { name: "Fix it" }));
    expect(props.onOpenNumbers).toHaveBeenCalled();
  });

  it("owners of a new workspace get a short list of steps, each a tap away", async () => {
    show(home({ setup: { done: 1, total: 4, steps: [{ key: "connect", label: "Connect your WhatsApp number", done: true }, { key: "replies", label: "Save a few quick replies", done: false }, { key: "automation", label: "Turn on a welcome message", done: false }, { key: "team", label: "Invite a teammate", done: false }] } }));
    const bar = await screen.findByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("1");
    expect((screen.getByRole("button", { name: /Connect your WhatsApp number/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Turn on a welcome message/ }));
    expect(props.onSetupStep).toHaveBeenCalledWith("automation");
  });

  it("counts what does not fit, and the rest of the old Overview is below", async () => {
    show(home({ needsYou: [chat()], more: 4 }));
    fireEvent.click(await screen.findByRole("button", { name: /And 4 more/ }));
    expect(props.onOpenInbox).toHaveBeenCalled();
    expect(await screen.findByText("Performance")).toBeDefined();
    expect(await screen.findByText("Conversations")).toBeDefined();
  });

  it("says why it could not load, and tries again", async () => {
    api.fetchHome.mockRejectedValueOnce(new Error("Could not reach the server.")).mockResolvedValue(home());
    show(home());
    api.fetchHome.mockReset();
    api.fetchHome.mockRejectedValueOnce(new Error("Could not reach the server.")).mockResolvedValue(home());
    cleanup();
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <Today {...(props as TodayProps)} />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Could not reach the server.")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("All clear")).toBeDefined();
  });
});

describe("Autopilot on Today", () => {
  const state = (over = {}) => ({
    available: true, reason: null, canEdit: true, sentToday: 3, dailyCap: 50,
    rules: [
      { key: "saved_replies", label: "Answer questions with my saved replies", description: "Riwo sends the saved reply, word for word.", enabled: false },
      { key: "thanks_done", label: "Clear thank-yous", description: "Takes thank-yous off your list.", enabled: true },
    ],
    log: [{ id: "l1", rule: "saved_replies", outcome: "sent", what: "Sent “Opening hours”", text: "We open at 9.", conversationId: "c7", title: "Chitra Das", at: new Date().toISOString(), canUndo: true }],
    ...over,
  });

  it("an owner sees the rules in plain words, switches one on, and sees what Autopilot did", async () => {
    api.fetchAutopilot.mockResolvedValue(state());
    api.setAutopilotRule.mockResolvedValue({});
    show(home());
    const toggle = await screen.findByRole("switch", { name: "Answer questions with my saved replies" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(screen.getByRole("switch", { name: "Clear thank-yous" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText(/3 sent today, up to 50 a day/)).toBeDefined();
    expect(screen.getByText(/never answers a group/)).toBeDefined();
    const list = screen.getByRole("list", { name: "Autopilot did this" });
    expect(within(list).getByText("Chitra Das")).toBeDefined();
    expect(within(list).getByText("Sent “Opening hours”")).toBeDefined();
    fireEvent.click(toggle);
    await waitFor(() => expect(api.setAutopilotRule).toHaveBeenCalledWith("saved_replies", true));
    await waitFor(() => expect(api.fetchAutopilot.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it("an action can be taken back with one tap, and the waiting list is asked again", async () => {
    api.fetchAutopilot.mockResolvedValue(state());
    api.undoAutopilot.mockResolvedValue({});
    show(home());
    fireEvent.click(await screen.findByRole("button", { name: /Take back: Sent “Opening hours” for Chitra Das/ }));
    await waitFor(() => expect(api.undoAutopilot).toHaveBeenCalledWith("l1"));
    await waitFor(() => expect(api.fetchHome.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it("says why it could not do it, and a click on a name opens that chat", async () => {
    api.fetchAutopilot.mockResolvedValue(state());
    api.undoAutopilot.mockRejectedValue(new Error("That reply is still being sent. Try again in a moment."));
    show(home());
    fireEvent.click(await screen.findByRole("button", { name: /Take back/ }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/still being sent/);
    fireEvent.click(screen.getByRole("button", { name: "Chitra Das" }));
    expect(props.onOpenChat).toHaveBeenCalledWith("c7");
  });

  it("a teammate can read what it did but not change the rules, and sees nothing when there is nothing", async () => {
    api.fetchAutopilot.mockResolvedValue(state({ canEdit: false }));
    show(home());
    await screen.findByRole("list", { name: "Autopilot did this" });
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.getByText("On")).toBeDefined();
    cleanup();
    api.fetchAutopilot.mockResolvedValue(state({ canEdit: false, log: [] }));
    show(home());
    await screen.findByText("All clear");
    expect(screen.queryByText("Autopilot")).toBeNull();
  });

  it("on a plan without Riwo it says so instead of offering switches, and says why when Riwo is off", async () => {
    api.fetchAutopilot.mockResolvedValue(state({ available: false, reason: "plan", log: [] }));
    show(home());
    expect(await screen.findByText(/Autopilot is part of the Growth plan/)).toBeDefined();
    expect(screen.queryByRole("switch")).toBeNull();
    cleanup();
    api.fetchAutopilot.mockResolvedValue(state({ available: false, reason: "disabled", log: [] }));
    show(home());
    expect(await screen.findByText("Riwo is switched off for your company.")).toBeDefined();
  });
});
