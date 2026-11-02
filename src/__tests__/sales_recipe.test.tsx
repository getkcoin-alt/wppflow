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
}));
vi.mock("../services/api", () => api);
import { Automations } from "../components/user/Automations";
import { describeRule } from "../utils/automationText";
import { handoffLabel } from "../utils/handoff";
import { describeEvent } from "../utils/pipeline";

const QUESTIONS = ["What are you looking for?", "How many do you need, and for which location?", "When do you need it by?", "Do you have a budget range in mind?"];
const FORMAL = "Thank you for your interest, {{first_name}}. Our executive {{executive}} has been assigned to review your requirements and will share the proposal and pricing with you shortly.";
const context = (over: Record<string, unknown> = {}) => ({
  countries: [{ code: "971", name: "United Arab Emirates" }],
  homeCodes: ["971"],
  homeFrom: "",
  riwo: { available: true, reason: null },
  chat: { defaultReplies: 5, maxReplies: 10, sources: [], handoff: "Thanks! I've passed this to our team.", sales: { maxQuestions: 6, questions: QUESTIONS, formal: FORMAL, followUpHours: 2 } },
  ...over,
});
const TEMPLATE = {
  id: "sales-assistant",
  group: "Sales",
  recommended: true,
  name: "Sales assistant: ask the right questions, then hand over to an executive",
  description: "Riwo asks your questions, then hands pricing requests to an executive.",
  rule: { triggerType: "first_message", triggerCondition: "", actionType: "ai_chat", actionSummary: "", config: { reply: "Hi {{first_name}}, welcome!", knowledge: "", handoff: "Thanks!", sales: { enabled: true, questions: ["Which city?", "How many?"], formal: FORMAL, followUpHours: 2, stageName: "" } } },
  needs: ["about"],
};
const ABOUT = "We are a property brokerage in Dubai Marina. We help people buy, rent and sell apartments.";
const onChanged = vi.fn();
const wrap = (automations: any[] = []) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Automations automations={automations} teammates={[]} onChanged={onChanged} />
    </QueryClientProvider>,
  );
const sheet = async () => within(await screen.findByRole("dialog", { name: "Sales assistant" }));
const saved = (over = {}) => ({
  id: "s1",
  name: "Sales assistant",
  triggerType: "first_message",
  triggerCondition: "",
  actionType: "ai_chat",
  actionSummary: "",
  isEnabled: false,
  executionsCount: 0,
  templateId: "sales-assistant",
  config: { reply: "Hello there!", knowledge: ABOUT, handoff: "A person will call.", sourceOptions: [], sales: { enabled: true, questions: ["Which city?", "How many?"], formal: FORMAL, followUpHours: 4, stageName: "Quote" } },
  ...over,
});

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  onChanged.mockReset();
  api.getStoredTenantId.mockReturnValue("t1");
  api.fetchAutomationContext.mockResolvedValue(context());
  api.fetchAutomationTemplates.mockResolvedValue({ templates: [TEMPLATE] });
  api.fetchAssignment.mockResolvedValue({ enabled: false, mode: "round_robin", team: "", sessionNames: [], keepOwner: true, maxOpen: null, useHours: false, timezone: "Asia/Dubai", workDays: [1, 2, 3, 4, 5], workStart: "09:00", workEnd: "18:00", members: [], teams: [], numbers: [] });
  api.addAutomation.mockResolvedValue({ automation: saved() });
  api.updateAutomation.mockResolvedValue({ automation: saved() });
  api.toggleAutomationApi.mockResolvedValue({});
});
afterEach(cleanup);

const open = async () => {
  wrap();
  const card = (await screen.findByRole("region", { name: "Sales assistant" })) as HTMLElement;
  fireEvent.click(within(card).getByRole("button", { name: /Set it up/ }));
  return sheet();
};
const fillAbout = (form: ReturnType<typeof within>) => fireEvent.change(form.getByLabelText("About your business"), { target: { value: ABOUT } });

describe("the sales assistant", () => {
  it("is one clear card, and opens a form already filled in with usual questions and the formal message", async () => {
    const form = await open();
    expect((form.getAllByRole("listitem", { name: "" }).length || 0) >= 0).toBe(true);
    const questions = within(form.getByRole("list", { name: "Questions" })).getAllByRole("textbox") as HTMLInputElement[];
    expect(questions.map((q) => q.value)).toEqual(QUESTIONS);
    expect((form.getByLabelText("Message for pricing and proposals") as HTMLTextAreaElement).value).toMatch(/Our executive \{\{executive\}\} has been assigned to review your requirements/);
    expect((form.getByLabelText("Remind your team after") as HTMLInputElement).value).toBe("2");
    expect(form.getByText(/Riwo never writes it/)).toBeDefined();
    // it starts paused unless asked
    expect(form.getByRole("button", { name: "Save paused" })).toBeDefined();
  });

  it("needs what Riwo may say, a question and the formal message before it can be saved", async () => {
    const form = await open();
    fireEvent.click(form.getByRole("button", { name: "Save paused" }));
    expect(await form.findByText(/Write a few sentences about your business/)).toBeDefined();
    fillAbout(form);
    for (let i = 4; i >= 1; i--) fireEvent.click(form.getByRole("button", { name: `Remove question ${i}` }));
    fireEvent.click(form.getByRole("button", { name: "Save paused" }));
    expect(await form.findByText(/Add at least one question/)).toBeDefined();
    fireEvent.change(form.getByLabelText("Add a question"), { target: { value: "Which city?" } });
    fireEvent.click(form.getByRole("button", { name: /Add/ }));
    fireEvent.change(form.getByLabelText("Message for pricing and proposals"), { target: { value: " " } });
    fireEvent.click(form.getByRole("button", { name: "Save paused" }));
    expect(await form.findByText(/Write the message that is sent when someone asks for pricing/)).toBeDefined();
    expect(api.addAutomation).not.toHaveBeenCalled();
  });

  it("questions can be added, moved and removed, up to the limit, and are saved in that order", async () => {
    const form = await open();
    fillAbout(form);
    fireEvent.click(form.getByRole("button", { name: "Move question 2 up" }));
    fireEvent.click(form.getByRole("button", { name: "Remove question 4" }));
    fireEvent.change(form.getByLabelText("Add a question"), { target: { value: "Which city?" } });
    fireEvent.click(form.getByRole("button", { name: /Add/ }));
    // adding the same question again changes nothing
    fireEvent.change(form.getByLabelText("Add a question"), { target: { value: "which city?" } });
    fireEvent.click(form.getByRole("button", { name: /Add/ }));
    expect(form.getByRole("button", { name: "Move question 1 up" }).hasAttribute("disabled")).toBe(true);
    fireEvent.change(form.getByLabelText("Pipeline step"), { target: { value: "Quote" } });
    fireEvent.click(form.getByRole("button", { name: "Save paused" }));
    await waitFor(() => expect(api.addAutomation).toHaveBeenCalledTimes(1));
    const rule = api.addAutomation.mock.calls[0][0];
    expect(rule).toMatchObject({ triggerType: "first_message", actionType: "ai_chat", templateId: "sales-assistant" });
    expect(rule.config.sales).toEqual({
      enabled: true,
      questions: [QUESTIONS[1], QUESTIONS[0], QUESTIONS[2], "Which city?"],
      formal: FORMAL,
      followUpHours: 2,
      stageName: "Quote",
    });
    expect(rule.config.knowledge).toBe(ABOUT);
    expect(api.toggleAutomationApi).not.toHaveBeenCalled();
    expect(onChanged).toHaveBeenCalled();
  });

  it("can be saved and turned on in one go, and says so when the switch fails", async () => {
    let form = await open();
    fillAbout(form);
    fireEvent.click(form.getByRole("button", { name: "Save and turn on" }));
    await waitFor(() => expect(api.toggleAutomationApi).toHaveBeenCalledWith("s1"));
    cleanup();
    api.toggleAutomationApi.mockRejectedValueOnce(new Error("Plan doesn't include automations"));
    form = await open();
    fillAbout(form);
    fireEvent.click(form.getByRole("button", { name: "Save and turn on" }));
    expect(await screen.findByText(/Saved, but it is still paused: Plan doesn't include automations/)).toBeDefined();
  });

  it("a saved sales rule opens this form, not the general editor, and keeps its own words", async () => {
    wrap([saved()]);
    expect(screen.queryByRole("region", { name: "Sales assistant" })).toBeNull();
    fireEvent.click(await screen.findByRole("button", { name: /Edit/ }));
    const form = await sheet();
    expect((within(form.getByRole("list", { name: "Questions" })).getAllByRole("textbox") as HTMLInputElement[]).map((q) => q.value)).toEqual(["Which city?", "How many?"]);
    expect((form.getByLabelText("Pipeline step") as HTMLInputElement).value).toBe("Quote");
    expect((form.getByLabelText("Remind your team after") as HTMLInputElement).value).toBe("4");
    expect(form.queryByRole("button", { name: "Save and turn on" })).toBeNull();
    fireEvent.change(form.getByLabelText("Remind your team after"), { target: { value: "0" } });
    fireEvent.click(form.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(api.updateAutomation).toHaveBeenCalledWith("s1", expect.objectContaining({ config: expect.objectContaining({ sales: expect.objectContaining({ followUpHours: 0 }) }) })));
  });

  it("the ready-made rule opens the same form", async () => {
    wrap();
    const article = (await screen.findByRole("heading", { name: /Sales assistant: ask the right questions/ })).closest("article") as HTMLElement;
    fireEvent.click(within(article).getByRole("button", { name: /Use this rule/ }));
    const form = await sheet();
    expect((within(form.getByRole("list", { name: "Questions" })).getAllByRole("textbox") as HTMLInputElement[]).map((q) => q.value)).toEqual(["Which city?", "How many?"]);
  });

  it("says plainly when Riwo cannot read messages, because the questions and the hand-off still work", async () => {
    api.fetchAutomationContext.mockResolvedValue(context({ riwo: { available: false, reason: "plan" } }));
    const form = await open();
    expect(form.getByRole("status").textContent).toMatch(/each reply is taken as the answer to the question just asked/);
  });
});

describe("words for the team", () => {
  it("describes the rule, why a chat is waiting for a person, and what the pipeline history says", () => {
    expect(describeRule({ ...saved(), triggerType: "first_message" } as any).then).toMatch(/asks the rest one at a time, and when they ask for pricing or a proposal sends your formal message/);
    expect(handoffLabel("pricing").label).toBe("Wants pricing");
    expect(handoffLabel("qualified").label).toBe("Ready for an executive");
    expect(handoffLabel("person").label).toBe("Asked for a person");
    expect(handoffLabel(null).label).toBe("Asked for a person");
    expect(describeEvent({ type: "requirements", actorName: "Riwo", detail: { items: [{ question: "q", answer: "2 villas" }, { question: "q", answer: "Marina" }] } })).toBe("Riwo noted what they need: 2 villas, Marina");
  });
});
