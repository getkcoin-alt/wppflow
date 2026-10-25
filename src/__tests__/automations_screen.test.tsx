import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({
  fetchAutomationTemplates: vi.fn(),
  addAutomation: vi.fn(),
  updateAutomation: vi.fn(),
  toggleAutomationApi: vi.fn(),
  removeAutomation: vi.fn(),
}));
vi.mock("../services/api", () => api);
import { Automations } from "../components/user/Automations";

const hours = { timezone: "Asia/Dubai", days: [1, 2, 3, 4, 5, 6], start: "09:00", end: "18:00" };
const TEMPLATES = [
  { id: "welcome", group: "Start here", recommended: true, name: "Welcome new customers", description: "Greets someone the first time they message you.", rule: { triggerType: "first_message", triggerCondition: "", actionType: "reply_text", actionSummary: "Hi {{first_name}}, thanks for contacting {{company}}!", config: {} }, needs: [] },
  { id: "after-hours", group: "Start here", recommended: true, name: "Away message after hours", description: "Tells customers you are closed.", rule: { triggerType: "after_hours", triggerCondition: "", actionType: "reply_text", actionSummary: "We're closed right now.", config: { hours, cooldownHours: 12 } }, needs: ["hours"] },
  { id: "price", group: "Answer common questions", name: "Answer price questions", description: "Replies when someone asks what things cost.", hint: "Write your prices, or a link to your price list.", rule: { triggerType: "keyword", triggerCondition: "price, cost, how much", actionType: "reply_text", actionSummary: "", config: { match: "contains" } }, needs: ["reply"] },
  { id: "complaint", group: "Send to your team", name: "Send complaints to a manager", description: "Assigns the chat to a manager.", rule: { triggerType: "keyword", triggerCondition: "complaint, refund", actionType: "assign_agent", actionSummary: "", config: { match: "contains", reply: "We're sorry about that." } }, needs: ["teammate"] },
];
const TEAM = [
  { id: 1, name: "Olivia Owner" },
  { id: 2, name: "Sam Agent" },
];
const saved = (over = {}) => ({
  id: "r1",
  name: "Welcome new customers",
  triggerType: "first_message",
  triggerCondition: "",
  actionType: "reply_text",
  actionSummary: "Hi {{first_name}}!",
  isEnabled: false,
  executionsCount: 3,
  templateId: "welcome",
  config: {},
  ...over,
});
const onChanged = vi.fn();

const wrap = (automations: any[] = []) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Automations automations={automations} teammates={TEAM} onChanged={onChanged} />
    </QueryClientProvider>,
  );
const editor = async (name: string) => within(await screen.findByRole("dialog", { name }));
const useRule = async (name: string) => {
  const card = (await screen.findByRole("heading", { name })).closest("article")!;
  fireEvent.click(within(card).getByRole("button", { name: /Use this rule|Add another/ }));
  return editor("New rule");
};

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  onChanged.mockReset();
  api.fetchAutomationTemplates.mockResolvedValue({ templates: TEMPLATES });
  api.addAutomation.mockResolvedValue({ automation: saved() });
  api.updateAutomation.mockResolvedValue({ automation: saved() });
  api.toggleAutomationApi.mockResolvedValue({});
  api.removeAutomation.mockResolvedValue({});
});
afterEach(cleanup);

describe("ready-made rules", () => {
  it("are offered in groups, with the recommended ones marked", async () => {
    wrap();
    expect(await screen.findByRole("heading", { name: "Welcome new customers" })).toBeDefined();
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Start here", "Answer common questions", "Send to your team"]);
    expect(screen.getAllByText("Recommended").length).toBe(2);
    expect(screen.getByText("No rules yet")).toBeDefined();
  });

  it("a rule that needs the company's own words won't save until they are written", async () => {
    wrap();
    const form = await useRule("Answer price questions");
    expect(form.getByText("Write your prices, or a link to your price list.")).toBeDefined();
    expect((form.getByLabelText("Words or phrases") as HTMLTextAreaElement).value).toBe("price, cost, how much");
    fireEvent.click(form.getByRole("button", { name: "Save paused rule" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Write the reply.");
    expect(api.addAutomation).not.toHaveBeenCalled();
    fireEvent.change(form.getByLabelText("The reply"), { target: { value: "Our prices start at AED 50." } });
    fireEvent.click(form.getByRole("button", { name: "Save paused rule" }));
    await waitFor(() => expect(api.addAutomation).toHaveBeenCalledTimes(1));
    expect(api.addAutomation.mock.calls[0][0]).toMatchObject({
      name: "Answer price questions",
      templateId: "price",
      triggerType: "keyword",
      triggerCondition: "price, cost, how much",
      actionType: "reply_text",
      actionSummary: "Our prices start at AED 50.",
      config: { match: "contains" },
    });
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("one that is ready can be saved as it is, and says in a sentence what it does", async () => {
    wrap();
    const form = await useRule("Welcome new customers");
    expect(form.getByLabelText("What this rule does").textContent).toBe("When someone writes for the first time, replies “Hi {{first_name}}, thanks for contacting {{company}}!”");
    fireEvent.click(form.getByRole("button", { name: "Save paused rule" }));
    await waitFor(() => expect(api.addAutomation).toHaveBeenCalledWith(expect.objectContaining({ triggerType: "first_message", triggerCondition: "", templateId: "welcome" })));
  });

  it("handing over to a teammate lists the real teammates and keeps the confirmation", async () => {
    wrap();
    const form = await useRule("Send complaints to a manager");
    const who = form.getByLabelText("Assign to") as HTMLSelectElement;
    expect(Array.from(who.options).map((o) => o.textContent)).toEqual(["Choose a teammate…", "Olivia Owner", "Sam Agent"]);
    expect((form.getByLabelText("Also reply with") as HTMLTextAreaElement).value).toBe("We're sorry about that.");
    fireEvent.click(form.getByRole("button", { name: "Save paused rule" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Choose who gets these chats.");
    fireEvent.change(who, { target: { value: "Sam Agent" } });
    fireEvent.click(form.getByRole("button", { name: "Save paused rule" }));
    await waitFor(() => expect(api.addAutomation).toHaveBeenCalled());
    expect(api.addAutomation.mock.calls[0][0]).toMatchObject({ actionType: "assign_agent", actionSummary: "Sam Agent", config: { reply: "We're sorry about that." } });
  });

  it("opening hours are set with days, times and a time zone", async () => {
    wrap();
    const form = await useRule("Away message after hours");
    const days = within(form.getByRole("group", { name: "Days you are open" }));
    expect(days.getByRole("button", { name: "Sat" }).getAttribute("aria-pressed")).toBe("true");
    expect(days.getByRole("button", { name: "Sun" }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(days.getByRole("button", { name: "Sat" }));
    fireEvent.change(form.getByLabelText("Closes"), { target: { value: "20:00" } });
    fireEvent.change(form.getByLabelText("Time zone"), { target: { value: "Asia/Kolkata" } });
    expect(form.getByLabelText("What this rule does").textContent).toContain("outside Monday to Friday, 09:00–20:00 (Asia/Kolkata)");
    fireEvent.click(form.getByRole("button", { name: "Save paused rule" }));
    await waitFor(() => expect(api.addAutomation).toHaveBeenCalled());
    expect(api.addAutomation.mock.calls[0][0].config).toMatchObject({ cooldownHours: 12, hours: { timezone: "Asia/Kolkata", days: [1, 2, 3, 4, 5], start: "09:00", end: "20:00" } });
  });

  it("show which have already been added", async () => {
    wrap([saved()]);
    const card = (await screen.findByText("Added")).closest("article")!;
    expect(within(card).getByRole("heading", { name: "Welcome new customers" })).toBeDefined();
    expect(within(card).getByRole("button", { name: "Add another" })).toBeDefined();
  });
});

describe("your own rules", () => {
  it("builds one from nothing, choosing when and what", async () => {
    wrap();
    fireEvent.click(screen.getByRole("button", { name: "New rule" }));
    const form = await editor("New rule");
    fireEvent.change(form.getByLabelText("Rule name"), { target: { value: "Interested" } });
    fireEvent.change(form.getByLabelText("Words or phrases"), { target: { value: "demo, quote" } });
    fireEvent.change(form.getByLabelText("The message"), { target: { value: "word" } });
    fireEvent.change(form.getByLabelText("Then"), { target: { value: "add_tag" } });
    fireEvent.change(form.getByLabelText("Tag"), { target: { value: "interested" } });
    expect(form.getByLabelText("What this rule does").textContent).toBe("When a message has the word “demo”, “quote”, tags the customer “interested”");
    fireEvent.click(form.getByRole("button", { name: "Save paused rule" }));
    await waitFor(() => expect(api.addAutomation).toHaveBeenCalled());
    expect(api.addAutomation.mock.calls[0][0]).toMatchObject({ name: "Interested", triggerType: "keyword", triggerCondition: "demo, quote", actionType: "add_tag", actionSummary: "interested", config: { match: "word" } });
  });

  it("shows the server's reason when a rule is refused", async () => {
    api.addAutomation.mockRejectedValue(new Error("Sam isn't an active teammate of this company"));
    wrap();
    const form = await useRule("Welcome new customers");
    fireEvent.click(form.getByRole("button", { name: "Save paused rule" }));
    expect((await screen.findByRole("alert")).textContent).toContain("isn't an active teammate");
    expect(screen.getByRole("dialog", { name: "New rule" })).toBeDefined();
  });

  it("lists saved rules in plain words, and can pause, edit and delete them", async () => {
    wrap([saved({ isEnabled: true, actionType: "opt_out", actionSummary: "", triggerType: "keyword", triggerCondition: "stop", name: "Stop", config: { match: "exact", reply: "You're unsubscribed.", cooldownHours: 2 } })]);
    const card = (await screen.findByRole("heading", { name: "Stop", level: 2 })).closest("article")!;
    expect(within(card).getByText("Live")).toBeDefined();
    expect(within(card).getByText("When the message is exactly “stop”,")).toBeDefined();
    expect(within(card).getByText("takes them off broadcasts and replies “You're unsubscribed.”")).toBeDefined();
    expect(within(card).getByText(/Completed executions: 3 · waits 2 h before repeating/)).toBeDefined();
    fireEvent.click(within(card).getByRole("button", { name: "Pause" }));
    await waitFor(() => expect(api.toggleAutomationApi).toHaveBeenCalledWith("r1"));
    fireEvent.click(within(card).getByRole("button", { name: "Delete Stop" }));
    await waitFor(() => expect(api.removeAutomation).toHaveBeenCalledWith("r1"));
  });

  it("can add the customer to the sales pipeline, and says so in plain words", async () => {
    wrap();
    fireEvent.click(screen.getByRole("button", { name: "New rule" }));
    const form = await editor("New rule");
    fireEvent.change(form.getByLabelText("Rule name"), { target: { value: "Quotes" } });
    fireEvent.change(form.getByLabelText("Words or phrases"), { target: { value: "quote, demo" } });
    fireEvent.change(form.getByLabelText("Then"), { target: { value: "create_lead" } });
    expect(Array.from((form.getByLabelText("Then") as HTMLSelectElement).options).map((o) => o.textContent)).toContain("Add them to the sales pipeline");
    expect(form.getByLabelText("What this rule does").textContent).toBe("When a message contains “quote”, “demo”, adds them to the sales pipeline.");
    fireEvent.click(form.getByRole("button", { name: "Save paused rule" }));
    await waitFor(() => expect(api.addAutomation).toHaveBeenCalled());
    expect(api.addAutomation.mock.calls[0][0]).toMatchObject({ actionType: "create_lead", actionSummary: "", triggerCondition: "quote, demo" });
  });

  it("edits a saved rule in place", async () => {
    wrap([saved({ triggerType: "keyword", triggerCondition: "price", name: "Price", actionSummary: "AED 50", config: { match: "contains" } })]);
    fireEvent.click(await screen.findByRole("button", { name: "Edit Price" }));
    const form = await editor("Edit rule");
    expect((form.getByLabelText("Rule name") as HTMLInputElement).value).toBe("Price");
    fireEvent.change(form.getByLabelText("The reply"), { target: { value: "AED 60" } });
    fireEvent.click(form.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(api.updateAutomation).toHaveBeenCalledWith("r1", expect.objectContaining({ actionSummary: "AED 60", name: "Price" })));
    expect(api.addAutomation).not.toHaveBeenCalled();
  });
});
