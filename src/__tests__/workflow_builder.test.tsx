import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({
  draftWorkflow: vi.fn(),
  reviseWorkflow: vi.fn(),
  checkWorkflow: vi.fn(),
  fetchWorkflowRecipes: vi.fn(),
  simulateWorkflow: vi.fn(),
  addAutomation: vi.fn(),
  updateAutomation: vi.fn(),
  toggleAutomationApi: vi.fn(),
  fetchAutomationContext: vi.fn(),
}));
vi.mock("../services/api", () => api);
import { WorkflowBuilder } from "../components/user/workflow/WorkflowBuilder";
import type { WorkflowDraft } from "../services/api";

const flow = () => ({
  version: 1 as const,
  start: "n1",
  nodes: {
    n1: { type: "ask" as const, question: "Is this about work, or are you family or a friend?", saveAs: "relation", showOptions: true, options: [{ key: "work", label: "Work", hints: [] }, { key: "personal", label: "Family or friend", hints: [] }], next: { work: "n2", personal: "n3" }, onUnsure: "handoff_unclear" },
    n2: { type: "agent" as const, goal: "Find out what they need and arrange a meeting", playbook: "Professional and brief.", closeWith: "book_demo", pricing: "handoff", maxReplies: 12 },
    n3: { type: "say" as const, text: "Lovely to hear from you! The boss has been told.", next: "end_auto" },
    end_auto: { type: "end" as const },
    handoff_unclear: { type: "handoff" as const, reason: "unclear" },
  },
});
const draft = (over: Partial<WorkflowDraft> = {}): WorkflowDraft => ({
  rule: { name: "Work or family", triggerType: "returning", triggerCondition: "", actionType: "workflow", actionSummary: "", config: { silentDays: 30, includeNew: true, useKnowledge: true, workflow: flow() } },
  when: "Starts when someone writes after 30 quiet days, or for the first time.",
  understood: "Anyone new is asked whether it is about work. Work gets a professional conversation; friends get a warm note.",
  guardrails: ["Never answers groups, or your own numbers", "Stops the moment a teammate replies"],
  outline: [
    { id: "n1", via: "", type: "ask", summary: "Is this about work, or are you family or a friend?", goes: [{ label: "Work", to: "n2" }, { label: "Family or friend", to: "n3" }, { label: "not understood", to: "handoff_unclear" }] },
    { id: "n2", via: "Work", type: "agent", summary: "Find out what they need and arrange a meeting", goes: [] },
    { id: "n3", via: "Family or friend", type: "say", summary: "Lovely to hear from you! The boss has been told.", goes: [{ label: "", to: "end_auto" }] },
    { id: "end_auto", via: "", type: "end", summary: "Finish", goes: [] },
    { id: "handoff_unclear", via: "not understood", type: "handoff", summary: "Send your formal message and hand the chat to a person", goes: [] },
  ],
  warnings: [],
  needs: [],
  source: "ai",
  note: "",
  ...over,
});

const wrap = (ui: React.ReactNode) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);
const open = (props: Partial<React.ComponentProps<typeof WorkflowBuilder>> = {}) => {
  const onSaved = vi.fn();
  const onClose = vi.fn();
  wrap(<WorkflowBuilder open onClose={onClose} onSaved={onSaved} {...props} />);
  return { onSaved, onClose };
};
const describeIt = async (text = "If someone new writes, ask whether it is about work or family and friends.") => {
  fireEvent.change(await screen.findByLabelText("Describe what should happen"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: /Let Riwo build it/ }));
};

describe("describing a workflow in your own words", () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset());
    api.fetchWorkflowRecipes.mockResolvedValue({ recipes: [{ id: "triage", title: "Work or family and friends", summary: "Asks whether it is about work." }, { id: "after_hours", title: "After-hours enquiries", summary: "Tells people you are closed." }] });
    api.fetchAutomationContext.mockResolvedValue({ countries: [], homeCodes: [] });
    api.checkWorkflow.mockImplementation(async (rule) => ({ draft: draft({ rule }) }));
  });

  it("asks for a sentence or two, then shows what Riwo understood, the steps, the safety and when it starts", async () => {
    api.draftWorkflow.mockResolvedValue({ draft: draft() });
    open();
    fireEvent.change(await screen.findByLabelText("Describe what should happen"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: /Let Riwo build it/ }));
    expect(await screen.findByText("Describe in a sentence or two what should happen.")).toBeTruthy();
    expect(api.draftWorkflow).not.toHaveBeenCalled();
    await describeIt();
    await waitFor(() => expect(api.draftWorkflow).toHaveBeenCalledWith({ instruction: "If someone new writes, ask whether it is about work or family and friends.", answers: [] }));
    expect(await screen.findByText(/Here is what I understood\./)).toBeTruthy();
    expect(screen.getByText(/Anyone new is asked whether it is about work/)).toBeTruthy();
    expect(screen.getByText("Starts when someone writes after 30 quiet days, or for the first time.")).toBeTruthy();
    const steps = within(screen.getByRole("list", { name: "Steps of the workflow" }));
    expect(steps.getAllByRole("listitem").length).toBeGreaterThanOrEqual(5);
    expect(steps.getByText("Find out what they need and arrange a meeting")).toBeTruthy();
    expect(screen.getByText("Safety Riwo added")).toBeTruthy();
    expect(screen.getByText("Stops the moment a teammate replies")).toBeTruthy();
    expect(screen.getByLabelText("Workflow name")).toHaveProperty("value", "Work or family");
  });

  it("asks only what it cannot decide, with answers to tap, and sends them back", async () => {
    api.draftWorkflow.mockResolvedValueOnce({ clarify: [{ question: "Should friends be asked again every month?", choices: ["Only once", "Every time"] }] }).mockResolvedValueOnce({ draft: draft() });
    open();
    await describeIt();
    expect(await screen.findByText("Should friends be asked again every month?")).toBeTruthy();
    const build = screen.getByRole("button", { name: "Build it" }) as HTMLButtonElement;
    expect(build.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Only once" }));
    fireEvent.click(build);
    await waitFor(() => expect(api.draftWorkflow).toHaveBeenLastCalledWith({ instruction: expect.any(String), answers: [{ question: "Should friends be asked again every month?", answer: "Only once" }] }));
    expect(await screen.findByText(/Here is what I understood\./)).toBeTruthy();
  });

  it("starts from a ready-made workflow, and offers them when Riwo could not build one", async () => {
    api.draftWorkflow.mockResolvedValueOnce({ draft: null, message: "Riwo isn't available right now. You can start from one of these and change it.", recipes: [{ id: "after_hours", title: "After-hours enquiries", summary: "Tells people you are closed." }] }).mockResolvedValueOnce({ draft: draft({ source: "recipe", note: "Starts from a ready-made workflow." }) });
    open();
    await describeIt();
    expect(await screen.findByText(/start from one of these/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Use this" }));
    await waitFor(() => expect(api.draftWorkflow).toHaveBeenLastCalledWith({ recipe: "after_hours" }));
    expect(await screen.findByText("Starts from a ready-made workflow.")).toBeTruthy();
  });

  it("changes the words of a step in place, and the server checks it again", async () => {
    api.draftWorkflow.mockResolvedValue({ draft: draft() });
    open();
    await describeIt();
    await screen.findByText(/Here is what I understood\./);
    fireEvent.click(screen.getByRole("button", { name: "Edit step 3" }));
    fireEvent.change(screen.getByLabelText("What Riwo says"), { target: { value: "So good to hear from you!" } });
    await waitFor(() => expect(api.checkWorkflow).toHaveBeenCalled(), { timeout: 2000 });
    const sent = api.checkWorkflow.mock.calls.at(-1)![0];
    expect(sent.config.workflow.nodes.n3.text).toBe("So good to hear from you!");
  });

  it("says what is wrong with an edit, and does not let it be saved", async () => {
    api.draftWorkflow.mockResolvedValue({ draft: draft() });
    open();
    await describeIt();
    await screen.findByText(/Here is what I understood\./);
    api.checkWorkflow.mockRejectedValueOnce(new Error('Step "n3": The message is required'));
    fireEvent.click(screen.getByRole("button", { name: "Edit step 3" }));
    fireEvent.change(screen.getByLabelText("What Riwo says"), { target: { value: "" } });
    expect(await screen.findByText('Step "n3": The message is required', {}, { timeout: 2000 })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Save paused" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("asks for what is still needed, and holds saving until it is given", async () => {
    api.draftWorkflow.mockResolvedValue({ draft: draft({ needs: ["knowledge"], rule: { ...draft().rule, config: { ...draft().rule.config, useKnowledge: false, knowledge: "" } } }) });
    open();
    await describeIt();
    expect(await screen.findByText("Riwo needs something to talk from")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Save paused" }) as HTMLButtonElement).disabled).toBe(true);
    api.checkWorkflow.mockImplementationOnce(async (rule) => ({ draft: draft({ rule, needs: [] }) }));
    fireEvent.change(screen.getByLabelText("What Riwo may talk about"), { target: { value: "We build websites and business software for companies in India and the UAE." } });
    await waitFor(() => expect((screen.getByRole("button", { name: "Save paused" }) as HTMLButtonElement).disabled).toBe(false), { timeout: 3000 });
  });
});

describe("trying it and saving it", () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset());
    api.fetchWorkflowRecipes.mockResolvedValue({ recipes: [] });
    api.fetchAutomationContext.mockResolvedValue({ countries: [], homeCodes: [] });
    api.checkWorkflow.mockImplementation(async (rule) => ({ draft: draft({ rule }) }));
    api.draftWorkflow.mockResolvedValue({ draft: draft() });
  });
  const built = async () => {
    const view = open();
    await describeIt();
    await screen.findByText(/Here is what I understood\./);
    return view;
  };

  it("plays the customer: shows what Riwo said, what it understood, and what would happen", async () => {
    api.simulateWorkflow
      .mockResolvedValueOnce({ events: [{ kind: "say", text: "Is this about work, or are you family or a friend?\n\n1. Work\n2. Family or friend", node: "n1" }], state: { node: "n1", vars: {}, attempts: 0 }, pause: "ask", done: false, outcome: null, read: null, node: "n1" })
      .mockResolvedValueOnce({ events: [{ kind: "say", text: "Lovely to hear from you! The boss has been told." }, { kind: "label", text: "The label “Family & friends” is put on the contact" }, { kind: "end", text: "The flow finishes" }], state: { node: null, vars: {}, attempts: 0 }, pause: null, done: true, outcome: "completed", read: { choice: "personal", label: "Family or friend", via: "number" }, node: null });
    await built();
    fireEvent.change(screen.getByLabelText("Type as the customer"), { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Send as the customer" }));
    expect(await screen.findByText(/1\. Work/)).toBeTruthy();
    expect(api.simulateWorkflow.mock.calls[0][0]).toMatchObject({ state: null, text: "Hello", labels: [] });
    fireEvent.click(screen.getByRole("button", { name: "Answers 2" }));
    expect(await screen.findByText("Riwo understood: Family or friend (by the number)")).toBeTruthy();
    expect(screen.getByText("The label “Family & friends” is put on the contact")).toBeTruthy();
    expect(screen.getByText("The workflow finished.")).toBeTruthy();
    expect(api.simulateWorkflow.mock.calls[1][0].state).toEqual({ node: "n1", vars: {}, attempts: 0 });
    expect(api.simulateWorkflow.mock.calls[1][0].transcript[0]).toEqual({ from: "customer", text: "Hello" });
    // the step that ran is lit in the list, and starting over clears the conversation
    fireEvent.click(screen.getByRole("button", { name: /Start over/ }));
    expect(screen.queryByText(/1\. Work/)).toBeNull();
    expect(screen.getByText(/Say something as the customer/)).toBeTruthy();
  });

  it("says plainly when trying it fails", async () => {
    api.simulateWorkflow.mockRejectedValue(new Error("You've tried the workflow a lot just now. Please try again in a while."));
    await built();
    fireEvent.click(screen.getByRole("button", { name: "A new customer" }));
    expect(await screen.findByText(/You've tried the workflow a lot just now/)).toBeTruthy();
  });

  it("can be saved paused, with the owner's own name, and no test numbers", async () => {
    api.addAutomation.mockResolvedValue({ automation: { id: "a1" } });
    const { onSaved } = await built();
    fireEvent.change(screen.getByLabelText("Workflow name"), { target: { value: "Work or family (mine)" } });
    fireEvent.click(screen.getByRole("button", { name: "Save paused" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith("Saved “Work or family (mine)” paused. Turn it on when you are ready."));
    const body = api.addAutomation.mock.calls[0][0];
    expect(body.name).toBe("Work or family (mine)");
    expect(body.config.pilot).toBeUndefined();
    expect(body.config.workflow.start).toBe("n1");
    expect(api.toggleAutomationApi).not.toHaveBeenCalled();
    expect((screen.queryByRole("button", { name: /Turn on in test mode/ }) as HTMLButtonElement | null)?.disabled ?? true).toBe(true);
  });

  it("turns on in test mode for the numbers listed, and only with real numbers", async () => {
    api.addAutomation.mockResolvedValue({ automation: { id: "a1" } });
    api.toggleAutomationApi.mockResolvedValue({});
    const { onSaved } = await built();
    const live = screen.getByRole("button", { name: /Turn on in test mode/ }) as HTMLButtonElement;
    expect(live.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Numbers to test with"), { target: { value: "12345" } });
    expect(live.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Numbers to test with"), { target: { value: "+91 98000 00010, +971 50 123 4567" } });
    expect(live.disabled).toBe(false);
    fireEvent.click(live);
    await waitFor(() => expect(api.toggleAutomationApi).toHaveBeenCalledWith("a1"));
    expect(api.addAutomation.mock.calls[0][0].config.pilot).toEqual({ enabled: true, phones: ["919800000010", "971501234567"] });
    expect(onSaved).toHaveBeenCalledWith("“Work or family” is on, in test mode: it only runs for the numbers you listed.");
  });

  it("says so when it was saved but could not be turned on", async () => {
    api.addAutomation.mockResolvedValue({ automation: { id: "a1" } });
    api.toggleAutomationApi.mockRejectedValue(new Error("Your plan does not include automations"));
    const { onSaved } = await built();
    fireEvent.change(screen.getByLabelText("Numbers to test with"), { target: { value: "+91 98000 00010" } });
    fireEvent.click(screen.getByRole("button", { name: /Turn on in test mode/ }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith("Saved “Work or family”, but it is still paused: Your plan does not include automations"));
  });

  it("changes the workflow in words, shows what would change, and only then uses it", async () => {
    const changed = draft({ rule: { ...draft().rule, config: { ...draft().rule.config, workflow: { ...flow(), nodes: { ...flow().nodes, n3: { type: "say", text: "Welcome!", next: "end_auto" } } } } } });
    api.reviseWorkflow.mockResolvedValue({ draft: changed, diff: ["Changed: Welcome!"] });
    await built();
    fireEvent.change(screen.getByLabelText("What to change"), { target: { value: "make the friend note shorter" } });
    fireEvent.click(screen.getByRole("button", { name: "Change it" }));
    expect(await screen.findByText("Changed: Welcome!")).toBeTruthy();
    expect(api.reviseWorkflow.mock.calls[0][1]).toBe("make the friend note shorter");
    fireEvent.click(screen.getByRole("button", { name: /Use this/ }));
    await waitFor(() => expect(screen.queryByText("Here is what would change:")).toBeNull());
  });

  it("opens a saved workflow already built, and saves changes to it", async () => {
    api.updateAutomation.mockResolvedValue({});
    const { onSaved } = open({ initial: { id: "a9", rule: draft().rule } });
    await screen.findByText(/Here is what I understood\./);
    expect(api.checkWorkflow).toHaveBeenCalledWith(draft().rule);
    expect(screen.queryByRole("button", { name: /Turn on in test mode/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(api.updateAutomation).toHaveBeenCalledWith("a9", expect.objectContaining({ name: "Work or family" })));
    expect(onSaved).toHaveBeenCalledWith("Saved “Work or family”.");
  });
});
