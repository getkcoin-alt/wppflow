import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { STAGES, TEAM, lead, settings, task } from "./pipelineFixtures";

const api = vi.hoisted(() => ({
  fetchLead: vi.fn(),
  fetchChatLead: vi.fn(),
  fetchPipelineSettings: vi.fn(),
  moveLead: vi.fn(),
  updateLead: vi.fn(),
  updateLeadTask: vi.fn(),
  addLeadTask: vi.fn(),
  deleteLeadTask: vi.fn(),
  deleteLead: vi.fn(),
  createLead: vi.fn(),
  fetchContacts: vi.fn(),
  aiLeadSuggestion: vi.fn(),
  savePipelineStages: vi.fn(),
  applyPipelinePreset: vi.fn(),
  setPipelineCurrency: vi.fn(),
  setPipelineAutoCreate: vi.fn(),
  getStoredTenantId: () => "t1",
}));
vi.mock("../services/api", () => api);
import { LeadSheet } from "../components/pipeline/LeadSheet";
import { NewLeadSheet } from "../components/pipeline/NewLeadSheet";
import { PipelineSettings } from "../components/pipeline/PipelineSettings";
import { LeadPanel } from "../components/pipeline/LeadPanel";

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrap = (ui: React.ReactElement) => render(<QueryClientProvider client={client()}>{ui}</QueryClientProvider>);
const dialog = (name: string) => within(screen.getByRole("dialog", { name }));
// The lead's sheet is called "Lead" until it has loaded, then by the customer's name.
const leadSheet = async (name = "Aisha Khan") => within(await screen.findByRole("dialog", { name }));
const onClose = vi.fn(),
  onOpenChat = vi.fn(),
  onCreated = vi.fn();

beforeEach(() => {
  for (const fn of Object.values(api)) if (typeof fn === "function" && "mockReset" in fn) (fn as any).mockReset();
  for (const fn of [onClose, onOpenChat, onCreated]) fn.mockReset();
  api.fetchPipelineSettings.mockResolvedValue(settings());
  api.moveLead.mockImplementation(async (id: string, body: any) => ({ lead: lead({ id, stageId: body.stageId }) }));
});
afterEach(cleanup);

describe("a lead's sheet", () => {
  const detail = (over: Record<string, unknown> = {}) => ({
    lead: lead({ title: "2BR Marina", expectedClose: "2026-12-31" }),
    tasks: [task({ title: "Call back" }), task({ id: "t2", title: "Send floor plan", done: true })],
    timeline: [
      { id: 2, actorName: "Sam Agent", type: "stage", detail: { from: "New", to: "Contacted" }, createdAt: new Date(Date.now() - 3600_000).toISOString() },
      { id: 1, actorName: "", type: "created", detail: { source: "automation" }, createdAt: new Date(Date.now() - 86_400_000).toISOString() },
    ],
    ...over,
  });
  const open = (props: Record<string, unknown> = {}) =>
    wrap(<LeadSheet leadId="l1" currency="AED" stages={STAGES} teammates={TEAM} isManager onClose={onClose} onOpenChat={onOpenChat} {...props} />);

  it("shows where the lead is, what it is for, who has it, the follow-ups and the history", async () => {
    api.fetchLead.mockResolvedValue(detail());
    open();
    const d = await leadSheet();
    expect(await d.findByDisplayValue("2BR Marina")).toBeDefined();
    expect(d.getByRole("button", { name: "New" }).getAttribute("aria-pressed")).toBe("true");
    expect((d.getByLabelText("Value") as HTMLInputElement).value).toBe("1400000");
    expect((d.getByLabelText("Expected close") as HTMLInputElement).value).toBe("2026-12-31");
    expect((d.getByLabelText("Owner") as HTMLSelectElement).value).toBe("2");
    expect((d.getByLabelText("Call back is done") as HTMLInputElement).checked).toBe(false);
    expect((d.getByLabelText("Send floor plan is done") as HTMLInputElement).checked).toBe(true);
    expect(d.getByText("Sam Agent moved it from New to Contacted")).toBeDefined();
    expect(d.getByText("Added automatically")).toBeDefined();
  });

  it("saves changes only when something changed", async () => {
    api.fetchLead.mockResolvedValue(detail());
    api.updateLead.mockResolvedValue({ lead: lead() });
    open();
    const d = await leadSheet();
    await d.findByDisplayValue("2BR Marina");
    expect(d.queryByRole("button", { name: "Save changes" })).toBeNull();
    fireEvent.change(d.getByLabelText("Value"), { target: { value: "1500000" } });
    fireEvent.change(d.getByLabelText("Owner"), { target: { value: "1" } });
    fireEvent.click(d.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(api.updateLead).toHaveBeenCalledWith("l1", { title: "2BR Marina", value: 1500000, expectedClose: "2026-12-31", ownerUserId: 1 }));
  });

  it("moves to another step in one tap, and asks why for a lost one", async () => {
    api.fetchLead.mockResolvedValue(detail());
    open();
    const d = await leadSheet();
    await d.findByDisplayValue("2BR Marina");
    fireEvent.click(d.getByRole("button", { name: "Qualified" }));
    await waitFor(() => expect(api.moveLead).toHaveBeenCalledWith("l1", { stageId: "s3" }));
    fireEvent.click(d.getByRole("button", { name: "Lost" }));
    fireEvent.click(await within(await screen.findByRole("dialog", { name: "Why was it lost?" })).findByRole("button", { name: "No reply" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Why was it lost?" })).getByRole("button", { name: "Mark as lost" }));
    await waitFor(() => expect(api.moveLead).toHaveBeenLastCalledWith("l1", { stageId: "s5", lostReason: "No reply" }));
  });

  it("sets a follow-up with a ready time, or at a time of the person's choosing", async () => {
    api.fetchLead.mockResolvedValue(detail());
    api.addLeadTask.mockResolvedValue({ tasks: [] });
    open();
    const d = await leadSheet();
    await d.findByDisplayValue("2BR Marina");
    fireEvent.change(d.getByLabelText("Follow-up"), { target: { value: "Send the quote" } });
    fireEvent.click(d.getByRole("button", { name: "Tomorrow" }));
    await waitFor(() => expect(api.addLeadTask).toHaveBeenCalledWith("l1", { title: "Send the quote", dueAt: expect.any(String) }));
    const tomorrow = new Date(api.addLeadTask.mock.calls[0][1].dueAt);
    expect(tomorrow.getHours()).toBe(9);
    expect(d.getByRole("button", { name: "Add" }).hasAttribute("disabled")).toBe(true);
    fireEvent.change(d.getByLabelText("Pick a time"), { target: { value: "2030-01-02T10:30" } });
    fireEvent.click(d.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(api.addLeadTask).toHaveBeenCalledTimes(2));
    expect(new Date(api.addLeadTask.mock.calls[1][1].dueAt).getTime()).toBe(new Date("2030-01-02T10:30").getTime());
  });

  it("ticks off and removes a follow-up", async () => {
    api.fetchLead.mockResolvedValue(detail());
    api.updateLeadTask.mockResolvedValue({ task: task() });
    api.deleteLeadTask.mockResolvedValue({});
    open();
    const d = await leadSheet();
    fireEvent.click(await d.findByLabelText("Call back is done"));
    await waitFor(() => expect(api.updateLeadTask).toHaveBeenCalledWith("t1", { done: true }));
    fireEvent.click(d.getByRole("button", { name: "Delete Call back" }));
    await waitFor(() => expect(api.deleteLeadTask).toHaveBeenCalledWith("t1"));
  });

  it("opens the chat", async () => {
    api.fetchLead.mockResolvedValue(detail());
    open();
    fireEvent.click((await leadSheet()).getByRole("button", { name: "Open chat" }));
    expect(onOpenChat).toHaveBeenCalledWith("chat-1");
  });

  it("lets only managers delete, after asking twice", async () => {
    api.fetchLead.mockResolvedValue(detail());
    api.deleteLead.mockResolvedValue({});
    open({ isManager: false });
    await (await leadSheet()).findByDisplayValue("2BR Marina");
    expect(screen.queryByRole("button", { name: "Delete this lead" })).toBeNull();
    cleanup();
    open();
    const d = await leadSheet();
    fireEvent.click(await d.findByRole("button", { name: "Delete this lead" }));
    expect(api.deleteLead).not.toHaveBeenCalled();
    fireEvent.click(d.getByRole("button", { name: "Keep" }));
    fireEvent.click(d.getByRole("button", { name: "Delete this lead" }));
    fireEvent.click(d.getByRole("button", { name: "Yes, delete" }));
    await waitFor(() => expect(api.deleteLead).toHaveBeenCalledWith("l1"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows why a change failed", async () => {
    api.fetchLead.mockResolvedValue(detail());
    api.updateLead.mockRejectedValue(new Error("Enter a value between 0 and 9,999,999,999"));
    open();
    const d = await leadSheet();
    await d.findByDisplayValue("2BR Marina");
    fireEvent.change(d.getByLabelText("Value"), { target: { value: "5" } });
    fireEvent.click(d.getByRole("button", { name: "Save changes" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Enter a value between");
  });

  it("says how a lost lead was lost, and what a won one was worth", async () => {
    api.fetchLead.mockResolvedValue(detail({ lead: lead({ stageId: "s5", status: "lost", lostReason: "Chose a competitor" }) }));
    open();
    expect(await (await leadSheet()).findByText("Lost: Chose a competitor")).toBeDefined();
    cleanup();
    api.fetchLead.mockResolvedValue(detail({ lead: lead({ stageId: "s4", status: "won", value: 90000 }) }));
    open();
    expect(await (await leadSheet()).findByText("Won AED 90,000")).toBeDefined();
  });
});

describe("adding a lead", () => {
  const from = { conversationId: "chat-9", name: "Priya Nair" };
  const sheet = (props: Record<string, unknown> = {}) =>
    wrap(<NewLeadSheet open from={from} stages={STAGES} teammates={TEAM} aiAvailable onClose={onClose} onCreated={onCreated} {...props} />);

  it("adds the customer of the open chat, and sets a reminder with it", async () => {
    api.createLead.mockResolvedValue({ lead: lead({ id: "new" }), existing: false });
    api.addLeadTask.mockResolvedValue({ tasks: [] });
    sheet();
    const d = dialog("Add to pipeline");
    expect(d.getByText("Priya Nair")).toBeDefined();
    fireEvent.change(d.getByLabelText("What is it for?"), { target: { value: "Annual checkup" } });
    fireEvent.change(d.getByLabelText("Value"), { target: { value: "450" } });
    fireEvent.change(d.getByLabelText("Remind me"), { target: { value: "3" } });
    fireEvent.change(d.getByLabelText("Reminder"), { target: { value: "Call to book" } });
    fireEvent.click(d.getByRole("button", { name: "Add lead" }));
    await waitFor(() => expect(api.createLead).toHaveBeenCalledWith({ conversationId: "chat-9", title: "Annual checkup", value: 450 }));
    await waitFor(() => expect(api.addLeadTask).toHaveBeenCalledWith("new", { title: "Call to book", dueAt: expect.any(String) }));
    const due = new Date(api.addLeadTask.mock.calls[0][1].dueAt);
    expect(due.getHours()).toBe(9);
    expect(Math.round((due.getTime() - Date.now()) / 86_400_000)).toBe(3);
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ id: "new" }), false));
  });

  it("lets Riwo suggest the details, which stay editable and are never saved by themselves", async () => {
    api.aiLeadSuggestion.mockResolvedValue({ title: "2 bedroom in Marina", value: 1400000, nextStep: "Confirm the viewing time", followUpDays: 2 });
    sheet();
    const d = dialog("Add to pipeline");
    fireEvent.click(d.getByRole("button", { name: "Suggest with Riwo" }));
    await waitFor(() => expect((d.getByLabelText("What is it for?") as HTMLInputElement).value).toBe("2 bedroom in Marina"));
    expect((d.getByLabelText("Value") as HTMLInputElement).value).toBe("1400000");
    expect((d.getByLabelText("Remind me") as HTMLSelectElement).value).toBe("2");
    expect((d.getByLabelText("Reminder") as HTMLInputElement).value).toBe("Confirm the viewing time");
    expect(d.getByText(/Riwo's suggestion\. Check it/)).toBeDefined();
    expect(api.aiLeadSuggestion).toHaveBeenCalledWith("chat-9");
    expect(api.createLead).not.toHaveBeenCalled();
  });

  it("doesn't offer Riwo when it isn't available, and says when it couldn't help", async () => {
    sheet({ aiAvailable: false });
    expect(screen.queryByRole("button", { name: "Suggest with Riwo" })).toBeNull();
    cleanup();
    api.aiLeadSuggestion.mockRejectedValue(new Error("There isn't enough in this chat to suggest anything yet."));
    sheet();
    fireEvent.click(dialog("Add to pipeline").getByRole("button", { name: "Suggest with Riwo" }));
    expect((await screen.findByRole("alert")).textContent).toContain("There isn't enough in this chat");
  });

  it("finds a contact by name or number, then adds them", async () => {
    api.fetchContacts.mockResolvedValue({ contacts: [{ id: "c7", name: "Chitra Rao", phone: "971500000007" }] });
    api.createLead.mockResolvedValue({ lead: lead({ id: "n2", contactName: "Chitra Rao" }), existing: false });
    sheet({ from: undefined });
    const d = dialog("Add to pipeline");
    expect(d.queryByRole("button", { name: "Suggest with Riwo" })).toBeNull();
    fireEvent.change(d.getByLabelText("Find a contact"), { target: { value: "chi" } });
    fireEvent.click(await d.findByRole("button", { name: /Chitra Rao/ }));
    fireEvent.change(d.getByLabelText("Owner"), { target: { value: "1" } });
    fireEvent.click(d.getByRole("button", { name: "Add lead" }));
    await waitFor(() => expect(api.createLead).toHaveBeenCalledWith({ contactId: "c7", title: undefined, value: 0, ownerUserId: 1 }));
    expect(api.fetchContacts).toHaveBeenCalledWith({ search: "chi" });
  });

  it("can't add until someone is chosen, and starts from a contact when it is given one", async () => {
    sheet({ from: undefined });
    const d = dialog("Add to pipeline");
    expect(d.getByRole("button", { name: "Add lead" }).hasAttribute("disabled")).toBe(true);
    cleanup();
    sheet({ from: undefined, contact: { id: "c7", name: "Chitra Rao", phone: "971500000007" } });
    expect(dialog("Add to pipeline").getAllByText("Chitra Rao").length).toBeGreaterThan(0);
    expect(dialog("Add to pipeline").getByRole("button", { name: "Add lead" }).hasAttribute("disabled")).toBe(false);
  });

  it("tells the person when the customer already had an open lead", async () => {
    api.createLead.mockResolvedValue({ lead: lead(), existing: true });
    sheet();
    fireEvent.click(dialog("Add to pipeline").getByRole("button", { name: "Add lead" }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(expect.anything(), true));
    expect(api.addLeadTask).not.toHaveBeenCalled();
  });

  it("only offers open steps to start in, and shows why it failed", async () => {
    api.createLead.mockRejectedValue(new Error("A group chat can't be a lead"));
    sheet();
    const d = dialog("Add to pipeline");
    const step = d.getByLabelText("Step") as HTMLSelectElement;
    expect(Array.from(step.options).map((o) => o.textContent)).toEqual(["New", "Contacted", "Qualified"]);
    fireEvent.click(d.getByRole("button", { name: "Add lead" }));
    expect((await screen.findByRole("alert")).textContent).toContain("group chat can't be a lead");
  });
});

describe("pipeline settings", () => {
  const open = (s = settings()) => wrap(<PipelineSettings open settings={s} onClose={onClose} />);

  it("applies a template, saying that no lead moves", async () => {
    api.applyPipelinePreset.mockResolvedValue(settings());
    open();
    fireEvent.click(dialog("Pipeline settings").getByRole("button", { name: "Real estate" }));
    await waitFor(() => expect(api.applyPipelinePreset).toHaveBeenCalledWith("real_estate"));
    expect(await dialog("Pipeline settings").findByText(/No lead moved/)).toBeDefined();
  });

  it("renames, reorders, adds and removes steps, then saves them together", async () => {
    api.savePipelineStages.mockResolvedValue(settings());
    open();
    const d = dialog("Pipeline settings");
    expect(d.queryByRole("button", { name: "Save steps" })).toBeNull();
    fireEvent.change(d.getByLabelText("Step 1"), { target: { value: "Fresh" } });
    fireEvent.click(d.getByRole("button", { name: "Move Qualified up" }));
    fireEvent.click(d.getByRole("button", { name: "Add a step" }));
    fireEvent.change(d.getByLabelText("Step 4"), { target: { value: "Site visit" } });
    fireEvent.change(d.getByLabelText("Won step"), { target: { value: "Closed" } });
    fireEvent.click(d.getByRole("button", { name: "Save steps" }));
    await waitFor(() =>
      expect(api.savePipelineStages).toHaveBeenCalledWith({
        open: [{ id: "s1", name: "Fresh" }, { id: "s3", name: "Qualified" }, { id: "s2", name: "Contacted" }, { name: "Site visit" }],
        wonName: "Closed",
        lostName: "Lost",
      }),
    );
  });

  it("won't remove a step that still has leads, and says why", () => {
    open();
    const d = dialog("Pipeline settings");
    const remove = d.getByRole("button", { name: "Remove New" });
    expect(remove.hasAttribute("disabled")).toBe(true);
    expect(remove.getAttribute("title")).toBe("1 lead is here. Move them first.");
    expect(d.getByRole("button", { name: "Remove Qualified" }).hasAttribute("disabled")).toBe(false);
  });

  it("shows what the server refused", async () => {
    api.savePipelineStages.mockRejectedValue(new Error("Move the leads out of “New” before removing it"));
    open();
    const d = dialog("Pipeline settings");
    fireEvent.change(d.getByLabelText("Step 1"), { target: { value: "x" } });
    fireEvent.click(d.getByRole("button", { name: "Save steps" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Move the leads out of");
  });

  it("changes the currency and switches automatic leads on and off", async () => {
    api.setPipelineCurrency.mockResolvedValue(settings({ currency: "INR" }));
    api.setPipelineAutoCreate.mockResolvedValue(settings());
    open();
    const d = dialog("Pipeline settings");
    fireEvent.change(d.getByLabelText("Currency"), { target: { value: "INR" } });
    await waitFor(() => expect(api.setPipelineCurrency).toHaveBeenCalledWith("INR"));
    const toggle = d.getByRole("switch", { name: "Add every new customer as a lead" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(toggle);
    await waitFor(() => expect(api.setPipelineAutoCreate).toHaveBeenCalledWith(true));
    expect(await d.findByText("New customers will be added as leads.")).toBeDefined();
  });
});

describe("the bar in a chat", () => {
  const bar = () =>
    wrap(<LeadPanel conversationId="chat-1" contactName="Aisha Khan" teammates={TEAM} aiAvailable isManager onOpenChat={onOpenChat} />);

  it("shows where this customer is, what it is worth, who has it and what is next", async () => {
    api.fetchChatLead.mockResolvedValue({ lead: lead({ nextTask: { id: "t", title: "Call back", dueAt: new Date(Date.now() + 86_400_000).toISOString() } }) });
    bar();
    const region = within(await screen.findByLabelText("Sales pipeline"));
    expect((region.getByLabelText("Pipeline step") as HTMLSelectElement).value).toBe("s1");
    expect(region.getByText("AED 1,400,000")).toBeDefined();
    expect(region.getByText("Sam Agent")).toBeDefined();
    expect(region.getByTitle(/Call back · Tomorrow/)).toBeDefined();
  });

  it("moves the customer on from the chat", async () => {
    api.fetchChatLead.mockResolvedValue({ lead: lead() });
    bar();
    fireEvent.change(await screen.findByLabelText("Pipeline step"), { target: { value: "s2" } });
    await waitFor(() => expect(api.moveLead).toHaveBeenCalledWith("l1", { stageId: "s2" }));
  });

  it("offers to add a customer who isn't in the pipeline, from the chat", async () => {
    api.fetchChatLead.mockResolvedValue({ lead: null });
    api.createLead.mockResolvedValue({ lead: lead(), existing: false });
    bar();
    fireEvent.click(await screen.findByRole("button", { name: "Add to pipeline" }));
    const d = dialog("Add to pipeline");
    expect(d.getByText("Aisha Khan")).toBeDefined();
    fireEvent.click(d.getByRole("button", { name: "Add lead" }));
    await waitFor(() => expect(api.createLead).toHaveBeenCalledWith(expect.objectContaining({ conversationId: "chat-1" })));
  });

  it("opens the lead's details", async () => {
    api.fetchChatLead.mockResolvedValue({ lead: lead() });
    api.fetchLead.mockResolvedValue({ lead: lead(), tasks: [], timeline: [] });
    bar();
    fireEvent.click(await screen.findByRole("button", { name: "Details" }));
    expect(await screen.findByRole("dialog", { name: "Aisha Khan" })).toBeDefined();
  });

  it("stays out of the way when it can't tell", async () => {
    api.fetchChatLead.mockRejectedValue(new Error("nope"));
    bar();
    await waitFor(() => expect(api.fetchChatLead).toHaveBeenCalled());
    expect(screen.queryByLabelText("Sales pipeline")).toBeNull();
  });
});
