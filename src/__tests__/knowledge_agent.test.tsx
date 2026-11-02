import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({
  fetchAutomationContext: vi.fn(),
  fetchAutomationTemplates: vi.fn(),
  addAutomation: vi.fn(),
  updateAutomation: vi.fn(),
  toggleAutomationApi: vi.fn(),
  removeAutomation: vi.fn(),
  fetchAssignment: vi.fn(),
  saveAssignment: vi.fn(),
  getStoredTenantId: vi.fn(() => "t1"),
  fetchKnowledge: vi.fn(),
  addKnowledgeSource: vi.fn(),
  refreshKnowledgeSource: vi.fn(),
  removeKnowledgeSource: vi.fn(),
  saveKnowledgeNotes: vi.fn(),
  draftAgent: vi.fn(),
}));
vi.mock("../services/api", () => api);
import { Automations } from "../components/user/Automations";
import { describeRule } from "../utils/automationText";

const EMPTY = { sources: [], overview: "", products: [], notes: "", writtenByRiwo: false, ready: false };
const READY = {
  sources: [{ id: "s1", url: "https://scriza.example", status: "ready", error: "", pages: 24, autoRefresh: true, lastReadAt: new Date(Date.now() - 3600_000).toISOString(), lastChangedAt: null }],
  overview: "Scriza builds business software and runs digital projects for companies in the UAE and India.",
  products: [{ name: "Scriza CRM", summary: "A sales CRM.", url: "" }, { name: "Scriza ERP", summary: "Inventory.", url: "" }],
  notes: "Demos are free.",
  writtenByRiwo: true,
  ready: true,
};
const wrap = (automations: any[] = []) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Automations automations={automations} teammates={[]} onChanged={vi.fn()} />
    </QueryClientProvider>,
  );
const savedAgent = (over = {}) => ({
  id: "a1", name: "Scriza sales agent", triggerType: "first_message", triggerCondition: "", actionType: "ai_chat", actionSummary: "", isEnabled: false, executionsCount: 0, templateId: null,
  config: { reply: "", useKnowledge: true, knowledge: "", handoff: "Passing you on.", agent: { enabled: true, goal: "Book demos", playbook: "Be brief.", closeWith: "book_demo", pricing: "handoff" }, sales: { enabled: true, questions: [], formal: "Thank you {{first_name}}.", followUpHours: 1, stageName: "Proposal" } },
  ...over,
});

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  api.getStoredTenantId.mockReturnValue("t1");
  api.fetchAutomationContext.mockResolvedValue({ countries: [], homeCodes: [], homeFrom: "", riwo: { available: true, reason: null }, chat: { defaultReplies: 5, maxReplies: 10, sources: [], handoff: "", sales: { maxQuestions: 6, questions: [], formal: "", followUpHours: 2 } } });
  api.fetchAutomationTemplates.mockResolvedValue({ templates: [] });
  api.fetchAssignment.mockResolvedValue({ enabled: false, mode: "round_robin", team: "", sessionNames: [], keepOwner: true, maxOpen: null, useHours: false, timezone: "Asia/Dubai", workDays: [1, 2, 3, 4, 5], workStart: "09:00", workEnd: "18:00", members: [], teams: [], numbers: [] });
  api.fetchKnowledge.mockResolvedValue(EMPTY);
  api.addAutomation.mockResolvedValue({ automation: savedAgent() });
  api.updateAutomation.mockResolvedValue({ automation: savedAgent() });
  api.toggleAutomationApi.mockResolvedValue({});
});
afterEach(cleanup);

describe("the knowledge base", () => {
  it("takes a website, and shows it being read", async () => {
    api.addKnowledgeSource.mockResolvedValue({ ...EMPTY, sources: [{ id: "s1", url: "https://scriza.example", status: "reading", error: "", pages: 0, autoRefresh: true, lastReadAt: null, lastChangedAt: null }] });
    wrap();
    const card = within(await screen.findByRole("region", { name: "Knowledge base" }));
    fireEvent.change(card.getByLabelText("Website address"), { target: { value: "scriza.example" } });
    fireEvent.click(card.getByRole("button", { name: /Add website/ }));
    await waitFor(() => expect(api.addKnowledgeSource).toHaveBeenCalledWith("scriza.example"));
    expect(await card.findByText("Riwo is reading this website…")).toBeDefined();
    expect(card.getByText("Reading")).toBeDefined();
    expect(card.getByRole("button", { name: "Refresh https://scriza.example" }).hasAttribute("disabled")).toBe(true);
  });

  it("shows what Riwo learned, offers a refresh that reads again, and can remove a website", async () => {
    api.fetchKnowledge.mockResolvedValue(READY);
    api.refreshKnowledgeSource.mockResolvedValue({ ...READY, sources: [{ ...READY.sources[0], status: "queued" }] });
    api.removeKnowledgeSource.mockResolvedValue(EMPTY);
    wrap();
    const card = within(await screen.findByRole("region", { name: "Knowledge base" }));
    expect(await card.findByText(/24 pages · read /)).toBeDefined();
    expect(card.getByText("Up to date")).toBeDefined();
    expect(card.getByText(/Scriza builds business software/)).toBeDefined();
    expect(within(card.getByRole("list", { name: "Products and services found" })).getAllByRole("listitem").map((l) => l.textContent)).toEqual(["Scriza CRM", "Scriza ERP"]);
    fireEvent.click(card.getByRole("button", { name: "Refresh https://scriza.example" }));
    await waitFor(() => expect(api.refreshKnowledgeSource).toHaveBeenCalledWith("s1"));
    expect(await card.findByText("Riwo is reading this website…")).toBeDefined();
    fireEvent.click(card.getByRole("button", { name: "Remove https://scriza.example" }));
    await waitFor(() => expect(api.removeKnowledgeSource).toHaveBeenCalledWith("s1"));
  });

  it("says plainly when a website could not be read, and saves the owner's notes", async () => {
    api.fetchKnowledge.mockResolvedValue({ ...READY, sources: [{ ...READY.sources[0], status: "failed", error: "We couldn't open that website." }] });
    api.saveKnowledgeNotes.mockResolvedValue({ ...READY, notes: "We never discount." });
    wrap();
    const card = within(await screen.findByRole("region", { name: "Knowledge base" }));
    expect(await card.findByText("We couldn't open that website.")).toBeDefined();
    expect(card.getByText("Couldn't read")).toBeDefined();
    fireEvent.change(card.getByLabelText("Notes for Riwo"), { target: { value: "We never discount." } });
    fireEvent.click(card.getByRole("button", { name: "Save notes" }));
    await waitFor(() => expect(api.saveKnowledgeNotes).toHaveBeenCalledWith("We never discount."));
  });

  it("shows a refusal, such as an address that is not a public website", async () => {
    api.addKnowledgeSource.mockRejectedValue(new Error("That address isn't a public website."));
    wrap();
    const card = within(await screen.findByRole("region", { name: "Knowledge base" }));
    fireEvent.change(card.getByLabelText("Website address"), { target: { value: "http://10.0.0.1" } });
    fireEvent.click(card.getByRole("button", { name: /Add website/ }));
    expect(await card.findByText("That address isn't a public website.")).toBeDefined();
  });
});

describe("the Riwo sales agent", () => {
  const open = async () => {
    wrap();
    const section = (await screen.findByRole("region", { name: "Riwo sales agent" })) as HTMLElement;
    fireEvent.click(within(section).getByRole("button", { name: /Set it up/ }));
    return within(await screen.findByRole("dialog", { name: "Riwo sales agent" }));
  };

  it("asks questions about a vague request, then fills the settings from the answers", async () => {
    api.fetchKnowledge.mockResolvedValue(READY);
    api.draftAgent.mockResolvedValueOnce({ clarify: ["Which products should it talk about?", "Should it quote prices?"] });
    const form = await open();
    fireEvent.change(form.getByLabelText("Describe what Riwo should do"), { target: { value: "Reply to people and sell our software" } });
    fireEvent.click(form.getByRole("button", { name: "Let Riwo set it up" }));
    expect(await form.findByLabelText("Which products should it talk about?")).toBeDefined();
    fireEvent.change(form.getByLabelText("Which products should it talk about?"), { target: { value: "The CRM" } });
    fireEvent.change(form.getByLabelText("Should it quote prices?"), { target: { value: "No, pass to the team" } });
    api.draftAgent.mockResolvedValueOnce({ draft: savedAgent(), understood: "You want Riwo to book demos and leave prices to your team." });
    fireEvent.click(form.getByRole("button", { name: "Send my answers" }));
    expect(await form.findByText(/You want Riwo to book demos and leave prices to your team\./)).toBeDefined();
    expect(api.draftAgent).toHaveBeenLastCalledWith("Reply to people and sell our software", [{ question: "Which products should it talk about?", answer: "The CRM" }, { question: "Should it quote prices?", answer: "No, pass to the team" }]);
    expect((form.getByLabelText("The goal") as HTMLInputElement).value).toBe("Book demos");
    expect((form.getByLabelText("How Riwo should talk") as HTMLTextAreaElement).value).toBe("Be brief.");
    expect((form.getByLabelText("How it ends") as HTMLSelectElement).value).toBe("book_demo");
    expect((form.getByLabelText("Prices") as HTMLSelectElement).value).toBe("handoff");
    expect((form.getByLabelText("Remind your team after") as HTMLInputElement).value).toBe("1");
    expect(form.getByText(/Riwo uses your knowledge base: 1 website and your notes/)).toBeDefined();
  });

  it("saves a rule that uses the knowledge base, paused by default", async () => {
    api.fetchKnowledge.mockResolvedValue(READY);
    const form = await open();
    fireEvent.change(form.getByLabelText("The goal"), { target: { value: "Find out what they need and book a demo" } });
    fireEvent.click(form.getByRole("button", { name: "Save paused" }));
    await waitFor(() => expect(api.addAutomation).toHaveBeenCalledTimes(1));
    const rule = api.addAutomation.mock.calls[0][0];
    expect(rule).toMatchObject({ triggerType: "first_message", actionType: "ai_chat" });
    expect(rule.config.useKnowledge).toBe(true);
    expect(rule.config.agent).toEqual({ enabled: true, goal: "Find out what they need and book a demo", playbook: "", closeWith: "handoff", pricing: "handoff" });
    expect(rule.config.sales).toMatchObject({ enabled: true, questions: [] });
    expect(api.toggleAutomationApi).not.toHaveBeenCalled();
  });

  it("without a knowledge base it asks for one, or for facts, before it can be saved", async () => {
    const form = await open();
    expect(form.getByText(/Your knowledge base is empty/)).toBeDefined();
    fireEvent.change(form.getByLabelText("The goal"), { target: { value: "Book demos" } });
    fireEvent.click(form.getByRole("button", { name: "Save paused" }));
    expect(await form.findByText(/add your website to the knowledge base, or write a few facts/)).toBeDefined();
    fireEvent.change(form.getByLabelText("Facts about your business"), { target: { value: "Scriza builds business software in Dubai and Udaipur." } });
    fireEvent.click(form.getByRole("button", { name: "Save paused" }));
    await waitFor(() => expect(api.addAutomation).toHaveBeenCalled());
    expect(api.addAutomation.mock.calls[0][0].config).toMatchObject({ useKnowledge: false, knowledge: "Scriza builds business software in Dubai and Udaipur." });
  });

  it("needs a goal, says what went wrong when Riwo cannot draft, and a saved agent opens in this form", async () => {
    api.fetchKnowledge.mockResolvedValue(READY);
    const form = await open();
    fireEvent.click(form.getByRole("button", { name: "Save paused" }));
    expect(await form.findByText(/Tell Riwo what it should achieve/)).toBeDefined();
    fireEvent.click(form.getByRole("button", { name: "Let Riwo set it up" }));
    expect(await form.findByText(/Describe in a sentence or two/)).toBeDefined();
    fireEvent.change(form.getByLabelText("Describe what Riwo should do"), { target: { value: "Sell things to people who write" } });
    api.draftAgent.mockRejectedValueOnce(new Error("Riwo couldn't turn that into an automation. Try saying it a little differently."));
    fireEvent.click(form.getByRole("button", { name: "Let Riwo set it up" }));
    expect(await form.findByText(/couldn't turn that into an automation/)).toBeDefined();
    cleanup();
    wrap([savedAgent()]);
    fireEvent.click(await screen.findByRole("button", { name: /Edit/ }));
    const editor = within(await screen.findByRole("dialog", { name: "Riwo sales agent" }));
    expect((editor.getByLabelText("The goal") as HTMLInputElement).value).toBe("Book demos");
    expect(editor.queryByRole("button", { name: "Save and turn on" })).toBeNull();
    expect(describeRule(savedAgent() as any).then).toMatch(/talk to them from your knowledge base like a salesperson/);
  });
});
