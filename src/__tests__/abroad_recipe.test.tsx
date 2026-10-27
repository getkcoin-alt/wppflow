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

const COUNTRIES = [
  { code: "91", name: "India" },
  { code: "44", name: "United Kingdom" },
  { code: "966", name: "Saudi Arabia" },
  { code: "971", name: "United Arab Emirates" },
];
const context = (over: Record<string, unknown> = {}) => ({
  countries: COUNTRIES,
  homeCodes: ["971"],
  homeFrom: "the WhatsApp number you linked",
  riwo: { available: true, reason: null },
  chat: { defaultReplies: 5, maxReplies: 10, sources: ["AI", "Website", "Social media", "Word of mouth"], handoff: "Thanks! I've passed this to our team and someone will get back to you soon." },
  ...over,
});
const TEMPLATES = [
  {
    id: "foreign-welcome-riwo",
    group: "People from other countries",
    recommended: true,
    name: "Welcome people from abroad, and let Riwo chat until your team replies",
    description: "A welcome, a question, and Riwo until your team replies.",
    rule: { triggerType: "foreign_number", triggerCondition: "", actionType: "ai_chat", actionSummary: "", config: { homeCodes: [], onlyNew: true, reply: "Hi {{first_name}}, welcome to {{company}}! How did you find us?", knowledge: "", maxReplies: 5, sourceOptions: ["AI", "Website"] } },
    needs: ["country", "about"],
  },
  {
    id: "foreign-welcome",
    group: "People from other countries",
    name: "Welcome people from abroad (message only)",
    description: "One welcome message.",
    rule: { triggerType: "foreign_number", triggerCondition: "", actionType: "reply_text", actionSummary: "Welcome to {{company}}, {{first_name}}!", config: { homeCodes: [], onlyNew: true } },
    needs: ["country"],
  },
  { id: "welcome", group: "Start here", name: "Welcome new customers", description: "Greets someone.", rule: { triggerType: "first_message", triggerCondition: "", actionType: "reply_text", actionSummary: "Hi!", config: {} }, needs: [] },
];
const ABOUT = "We are a property brokerage in Dubai Marina. We help people buy, rent and sell apartments.";
const onChanged = vi.fn();
const wrap = (automations: any[] = []) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Automations automations={automations} teammates={[]} onChanged={onChanged} />
    </QueryClientProvider>,
  );
const sheet = async () => within(await screen.findByRole("dialog", { name: "Welcome people from other countries" }));
const saved = (over = {}) => ({
  id: "r9",
  name: "Welcome people from other countries",
  triggerType: "foreign_number",
  triggerCondition: "",
  actionType: "ai_chat",
  actionSummary: "",
  isEnabled: false,
  executionsCount: 2,
  templateId: "foreign-welcome-riwo",
  config: { homeCodes: ["971"], onlyNew: true, reply: "Hello there!", knowledge: ABOUT, maxReplies: 5, handoff: "A person will be in touch.", sourceOptions: ["AI", "Website"] },
  ...over,
});

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  onChanged.mockReset();
  api.getStoredTenantId.mockReturnValue("t1");
  api.fetchAutomationContext.mockResolvedValue(context());
  api.fetchAutomationTemplates.mockResolvedValue({ templates: TEMPLATES });
  api.fetchAssignment.mockResolvedValue({ enabled: false, mode: "round_robin", team: "", sessionNames: [], keepOwner: true, maxOpen: null, useHours: false, timezone: "Asia/Dubai", workDays: [1, 2, 3, 4, 5], workStart: "09:00", workEnd: "18:00", members: [], teams: [], numbers: [] });
  api.addAutomation.mockResolvedValue({ automation: saved() });
  api.updateAutomation.mockResolvedValue({ automation: saved() });
  api.toggleAutomationApi.mockResolvedValue({});
});
afterEach(cleanup);

describe("welcoming people from other countries", () => {
  it("is offered as one clear card, and opens a form that is already filled in with sensible answers", async () => {
    wrap();
    const card = (await screen.findByRole("region", { name: "Welcome people from other countries" })) as HTMLElement;
    expect(within(card).getByText(/ask where they found you, and let Riwo answer their short questions until your team replies/)).toBeDefined();
    fireEvent.click(within(card).getByRole("button", { name: /Set it up/ }));
    const form = await sheet();
    // the country comes from the number the company linked, and says so
    expect(form.getByText("United Arab Emirates (+971)")).toBeDefined();
    expect(form.getByText(/We chose this from the WhatsApp number you linked/)).toBeDefined();
    // the welcome already says hello, asks where they found you, and promises a person
    const welcome = (form.getByLabelText("Your welcome message") as HTMLTextAreaElement).value;
    expect(welcome).toMatch(/welcome to \{\{company\}\}/);
    expect(welcome).toMatch(/how did you find us\? AI, our website, social media or word of mouth\?/i);
    expect(welcome).toMatch(/Our team will be in touch with you soon/);
    expect(welcome).toMatch(/ask me anything about/);
    // Riwo is on, with the four usual answers and a hand-over message ready
    expect(form.getByRole("switch", { name: "Let Riwo chat" }).getAttribute("aria-checked")).toBe("true");
    expect(within(form.getByRole("list", { name: "Answers we recognise" })).getAllByRole("listitem").map((l) => l.textContent)).toEqual(["AI", "Website", "Social media", "Word of mouth"]);
    expect((form.getByLabelText("When Riwo can't help") as HTMLTextAreaElement).value).toMatch(/passed this to our team/);
    expect((form.getByLabelText("Riwo answers at most") as HTMLInputElement).value).toBe("5");
    expect(form.getByRole("list", { name: "What this does" }).textContent).toMatch(/Riwo answers their short questions, only from what you write below, until a teammate replies/);
  });

  it("needs only what the company alone knows: what to tell people about the business", async () => {
    wrap();
    fireEvent.click(within((await screen.findByRole("region", { name: "Welcome people from other countries" })) as HTMLElement).getByRole("button", { name: /Set it up/ }));
    const form = await sheet();
    fireEvent.click(form.getByRole("button", { name: "Save and turn on" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/few sentences about your business/);
    expect(api.addAutomation).not.toHaveBeenCalled();
    fireEvent.change(form.getByLabelText("About your business"), { target: { value: "Too short" } });
    fireEvent.click(form.getByRole("button", { name: "Save and turn on" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/few sentences/);
    expect(api.addAutomation).not.toHaveBeenCalled();
  });

  it("saves the rule and turns it on in one step", async () => {
    wrap();
    fireEvent.click(within((await screen.findByRole("region", { name: "Welcome people from other countries" })) as HTMLElement).getByRole("button", { name: /Set it up/ }));
    const form = await sheet();
    fireEvent.change(form.getByLabelText("About your business"), { target: { value: ABOUT } });
    fireEvent.click(form.getByRole("button", { name: "Save and turn on" }));
    await waitFor(() => expect(api.toggleAutomationApi).toHaveBeenCalledWith("r9"));
    const sent = api.addAutomation.mock.calls[0][0];
    expect(sent).toMatchObject({
      name: "Welcome people from other countries",
      triggerType: "foreign_number",
      actionType: "ai_chat",
      actionSummary: "",
      templateId: "foreign-welcome-riwo",
      config: { homeCodes: ["971"], onlyNew: true, knowledge: ABOUT, maxReplies: 5, sourceOptions: ["AI", "Website", "Social media", "Word of mouth"] },
    });
    expect(sent.config.reply).toMatch(/how did you find us/i);
    expect(sent.config.handoff).toMatch(/passed this to our team/);
    expect(onChanged).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("can be saved paused instead, and then nothing is switched on", async () => {
    wrap();
    fireEvent.click(within((await screen.findByRole("region", { name: "Welcome people from other countries" })) as HTMLElement).getByRole("button", { name: /Set it up/ }));
    const form = await sheet();
    fireEvent.change(form.getByLabelText("About your business"), { target: { value: ABOUT } });
    fireEvent.click(form.getByRole("button", { name: "Save paused" }));
    await waitFor(() => expect(api.addAutomation).toHaveBeenCalled());
    expect(api.toggleAutomationApi).not.toHaveBeenCalled();
  });

  it("says plainly when it was saved but could not be switched on", async () => {
    api.toggleAutomationApi.mockRejectedValue(new Error("Try again in a moment"));
    wrap();
    fireEvent.click(within((await screen.findByRole("region", { name: "Welcome people from other countries" })) as HTMLElement).getByRole("button", { name: /Set it up/ }));
    const form = await sheet();
    fireEvent.change(form.getByLabelText("About your business"), { target: { value: ABOUT } });
    fireEvent.click(form.getByRole("button", { name: "Save and turn on" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Saved, but it is still paused: Try again in a moment");
    expect(onChanged).toHaveBeenCalled();
  });

  it("asks for a country when the company has none linked, and lets countries be added and taken away", async () => {
    api.fetchAutomationContext.mockResolvedValue(context({ homeCodes: [], homeFrom: "" }));
    wrap();
    fireEvent.click(within((await screen.findByRole("region", { name: "Welcome people from other countries" })) as HTMLElement).getByRole("button", { name: /Set it up/ }));
    const form = await sheet();
    fireEvent.change(form.getByLabelText("About your business"), { target: { value: ABOUT } });
    fireEvent.click(form.getByRole("button", { name: "Save paused" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/Choose your own country/);
    expect(api.addAutomation).not.toHaveBeenCalled();
    fireEvent.change(form.getByLabelText("Add a country"), { target: { value: "971" } });
    fireEvent.change(form.getByLabelText("Add a country"), { target: { value: "966" } });
    expect(within(form.getByRole("list", { name: "Your countries" })).getAllByRole("listitem").map((l) => l.textContent)).toEqual(["United Arab Emirates (+971)", "Saudi Arabia (+966)"]);
    expect(within(form.getByLabelText("Add a country") as HTMLElement).queryByRole("option", { name: /United Arab Emirates/ }), "a country already chosen is not offered again").toBeNull();
    fireEvent.click(form.getByRole("button", { name: "Remove Saudi Arabia" }));
    fireEvent.click(form.getByRole("button", { name: "Save paused" }));
    await waitFor(() => expect(api.addAutomation).toHaveBeenCalled());
    expect(api.addAutomation.mock.calls[0][0].config.homeCodes).toEqual(["971"]);
  });

  it("lets the answers it recognises be changed", async () => {
    wrap();
    fireEvent.click(within((await screen.findByRole("region", { name: "Welcome people from other countries" })) as HTMLElement).getByRole("button", { name: /Set it up/ }));
    const form = await sheet();
    fireEvent.click(form.getByRole("button", { name: "Remove AI" }));
    fireEvent.change(form.getByLabelText("Add an answer"), { target: { value: "Newspaper" } });
    fireEvent.keyDown(form.getByLabelText("Add an answer"), { key: "Enter" });
    fireEvent.change(form.getByLabelText("Add an answer"), { target: { value: "newspaper" } });
    fireEvent.click(form.getByRole("button", { name: /^Add$/ }));
    expect(within(form.getByRole("list", { name: "Answers we recognise" })).getAllByRole("listitem").map((l) => l.textContent)).toEqual(["Website", "Social media", "Word of mouth", "Newspaper"]);
    fireEvent.change(form.getByLabelText("About your business"), { target: { value: ABOUT } });
    fireEvent.click(form.getByRole("button", { name: "Save paused" }));
    await waitFor(() => expect(api.addAutomation).toHaveBeenCalled());
    expect(api.addAutomation.mock.calls[0][0].config.sourceOptions).toEqual(["Website", "Social media", "Word of mouth", "Newspaper"]);
  });

  it("with Riwo switched off it only sends the welcome, and sends nothing about Riwo", async () => {
    wrap();
    fireEvent.click(within((await screen.findByRole("region", { name: "Welcome people from other countries" })) as HTMLElement).getByRole("button", { name: /Set it up/ }));
    const form = await sheet();
    fireEvent.click(form.getByRole("switch", { name: "Let Riwo chat" }));
    expect(form.queryByLabelText("About your business")).toBeNull();
    expect(form.getByRole("list", { name: "What this does" }).textContent).toMatch(/Your team takes it from there/);
    fireEvent.click(form.getByRole("button", { name: "Save paused" }));
    await waitFor(() => expect(api.addAutomation).toHaveBeenCalled());
    const sent = api.addAutomation.mock.calls[0][0];
    expect(sent.actionType).toBe("reply_text");
    expect(sent.actionSummary).toMatch(/how did you find us/i);
    expect(sent.config).toEqual({ homeCodes: ["971"], onlyNew: true });
  });

  it("does not offer Riwo to a company whose plan or administrator has not allowed it, and says why", async () => {
    api.fetchAutomationContext.mockResolvedValue(context({ riwo: { available: false, reason: "plan" } }));
    wrap();
    fireEvent.click(within((await screen.findByRole("region", { name: "Welcome people from other countries" })) as HTMLElement).getByRole("button", { name: /Set it up/ }));
    const form = await sheet();
    const toggle = form.getByRole("switch", { name: "Let Riwo chat" }) as HTMLButtonElement;
    expect(toggle.disabled).toBe(true);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(form.getByText(/Riwo is part of the Growth plan and above/)).toBeDefined();
    fireEvent.click(form.getByRole("button", { name: "Save paused" }));
    await waitFor(() => expect(api.addAutomation).toHaveBeenCalled());
    expect(api.addAutomation.mock.calls[0][0].actionType).toBe("reply_text");
  });

  it("opens from the ready-made list too, with the recipe's own words, instead of the general rule editor", async () => {
    wrap([saved({ id: "other", triggerType: "first_message", actionType: "reply_text", name: "Another", templateId: "welcome", config: {} })]);
    const heading = await screen.findByRole("heading", { name: "Welcome people from abroad (message only)" });
    expect(screen.queryByRole("region", { name: "Welcome people from other countries" }), "the card is for companies that have not set it up").not.toBeNull();
    fireEvent.click(within(heading.closest("article")!).getByRole("button", { name: /Use this rule/ }));
    const form = await sheet();
    expect(screen.queryByRole("dialog", { name: "New rule" })).toBeNull();
    expect((form.getByLabelText("Rule name") as HTMLInputElement).value).toBe("Welcome people from abroad (message only)");
    expect(form.getByRole("switch", { name: "Let Riwo chat" }).getAttribute("aria-checked")).toBe("false");
    expect((form.getByLabelText("Your welcome message") as HTMLTextAreaElement).value).toBe("Welcome to {{company}}, {{first_name}}!");
    expect(form.getByText("United Arab Emirates (+971)")).toBeDefined();
  });

  it("describes a saved rule in plain words, with the country's name, and edits it in the same form", async () => {
    wrap([saved({ isEnabled: true })]);
    const article = (await screen.findByRole("heading", { name: "Welcome people from other countries", level: 2 })).closest("article")!;
    expect(await within(article).findByText("When a number from outside United Arab Emirates writes for the first time,")).toBeDefined();
    expect(within(article).getByText(/lets Riwo answer their short questions, from what you wrote about your business, until your team replies/)).toBeDefined();
    expect(screen.queryByRole("region", { name: "Welcome people from other countries" }), "no card once it is set up").toBeNull();
    fireEvent.click(within(article).getByRole("button", { name: "Edit Welcome people from other countries" }));
    const form = await sheet();
    expect((form.getByLabelText("About your business") as HTMLTextAreaElement).value).toBe(ABOUT);
    expect((form.getByLabelText("Your welcome message") as HTMLTextAreaElement).value).toBe("Hello there!");
    expect((form.getByLabelText("When Riwo can't help") as HTMLTextAreaElement).value).toBe("A person will be in touch.");
    fireEvent.change(form.getByLabelText("Riwo answers at most"), { target: { value: "3" } });
    expect(form.queryByRole("button", { name: "Save and turn on" }), "an existing rule keeps being live or paused as it was").toBeNull();
    fireEvent.click(form.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(api.updateAutomation).toHaveBeenCalledWith("r9", expect.objectContaining({ actionType: "ai_chat", config: expect.objectContaining({ maxReplies: 3, homeCodes: ["971"] }) })));
    expect(api.addAutomation).not.toHaveBeenCalled();
  });

  it("shows the server's reason when it will not save, and keeps what was typed", async () => {
    api.addAutomation.mockRejectedValue(new Error("Write a few sentences about your business for Riwo to answer from."));
    wrap();
    fireEvent.click(within((await screen.findByRole("region", { name: "Welcome people from other countries" })) as HTMLElement).getByRole("button", { name: /Set it up/ }));
    const form = await sheet();
    fireEvent.change(form.getByLabelText("About your business"), { target: { value: ABOUT } });
    fireEvent.click(form.getByRole("button", { name: "Save paused" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/Write a few sentences/);
    expect((form.getByLabelText("About your business") as HTMLTextAreaElement).value).toBe(ABOUT);
  });

  it("the general rule editor does not offer this trigger or action, so there is one way to build it", async () => {
    wrap();
    fireEvent.click(await screen.findByRole("button", { name: /New rule/ }));
    const dialog = within(await screen.findByRole("dialog", { name: "New rule" }));
    expect(dialog.getAllByRole("option").map((o) => o.textContent)).not.toContain("A number from another country writes");
    expect(dialog.getAllByRole("option").map((o) => o.textContent)).not.toContain("Let Riwo chat until your team replies");
  });
});

describe("saying what a rule does", () => {
  it("names the countries, and says whether only the first message counts", () => {
    const names = (code: string) => ({ "971": "United Arab Emirates", "966": "Saudi Arabia" })[code] || "";
    expect(describeRule({ triggerType: "foreign_number", triggerCondition: "", actionType: "reply_text", actionSummary: "Hi", config: { homeCodes: ["971", "966"], onlyNew: true } }, names).when).toBe("When a number from outside United Arab Emirates and Saudi Arabia writes for the first time");
    expect(describeRule({ triggerType: "foreign_number", triggerCondition: "", actionType: "reply_text", actionSummary: "Hi", config: { homeCodes: ["971"], onlyNew: false } }, names).when).toBe("When a number from outside United Arab Emirates writes");
    expect(describeRule({ triggerType: "foreign_number", triggerCondition: "", actionType: "reply_text", actionSummary: "Hi", config: { homeCodes: ["91"] } }).when).toBe("When a number from outside +91 writes for the first time");
  });
});
