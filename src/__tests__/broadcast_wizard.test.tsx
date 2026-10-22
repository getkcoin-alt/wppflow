import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({
  fetchCampaignTemplates: vi.fn(),
  fetchAudience: vi.fn(),
  fetchAutomationTemplates: vi.fn(),
  addAutomation: vi.fn(),
  toggleAutomationApi: vi.fn(),
  recordPermission: vi.fn(),
  getStoredTenantId: () => "t1",
}));
vi.mock("../services/api", () => api);
import { BroadcastWizard } from "../components/user/BroadcastWizard";

const TEMPLATES = [
  { id: "offer", name: "Special offer", description: "Tell customers about a deal.", text: "Hi {{first_name}}! {{company}} has an offer: [your offer]. Reply STOP to unsubscribe.", blanks: ["[your offer]"] },
  { id: "feedback", name: "Ask for feedback", description: "Ask how it went.", text: "Hi {{first_name}}, how was your visit to {{company}}?", blanks: [] },
];
const audience = (over = {}) => ({
  tag: "All Contacts",
  total: 10,
  willReceive: 6,
  notAsked: 3,
  optedOut: 1,
  tags: [
    { tag: "vip", count: 4, willReceive: 3 },
    { tag: "lead", count: 5, willReceive: 1 },
  ],
  unsubscribeRule: { exists: true, enabled: true },
  ...over,
});
const sessions: any[] = [
  { id: "s1", sessionKey: "shop", displayName: "Shop phone", status: "CONNECTED" },
  { id: "s2", sessionKey: "old", displayName: "Old phone", status: "DISCONNECTED" },
];
const onCreate = vi.fn();
const onClose = vi.fn();

const wrap = (props: Record<string, unknown> = {}) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <BroadcastWizard open onClose={onClose} sessions={sessions} companyName="Bloom Florist" onCreate={onCreate} {...props} />
    </QueryClientProvider>,
  );
const dialog = () => within(screen.getByRole("dialog", { name: "New broadcast" }));
const next = () => fireEvent.click(dialog().getByRole("button", { name: "Next" }));

beforeEach(() => {
  for (const fn of [api.fetchCampaignTemplates, api.fetchAudience, api.fetchAutomationTemplates, api.addAutomation, api.toggleAutomationApi, api.recordPermission, onCreate, onClose]) fn.mockReset();
  api.fetchCampaignTemplates.mockResolvedValue({ templates: TEMPLATES, variables: ["name", "first_name", "company"] });
  api.fetchAudience.mockImplementation(async (tag?: string) => audience(tag === "vip" ? { tag: "vip", total: 4, willReceive: 3, notAsked: 1, optedOut: 0 } : {}));
  onCreate.mockResolvedValue({});
});
afterEach(cleanup);

// Writes a finished message and moves to the audience step.
async function toAudience() {
  wrap();
  fireEvent.click(await dialog().findByRole("button", { name: "Ask for feedback" }));
  next();
  await dialog().findByText(/people will/);
}

describe("step 1: the message", () => {
  it("starts from a ready-made message and shows it the way a customer sees it", async () => {
    wrap();
    fireEvent.click(await dialog().findByRole("button", { name: "Ask for feedback" }));
    expect((dialog().getByLabelText("Your message") as HTMLTextAreaElement).value).toContain("how was your visit to {{company}}?");
    expect(screen.getByTestId("preview").textContent).toBe("Hi Aisha, how was your visit to Bloom Florist?");
  });

  it("won't go on while parts are still to be written, and highlights them", async () => {
    wrap();
    fireEvent.click(await dialog().findByRole("button", { name: "Special offer" }));
    expect(screen.getByTestId("preview").querySelector("mark")?.textContent).toBe("[your offer]");
    next();
    expect((await screen.findByRole("alert")).textContent).toContain("Fill in [your offer] before you continue.");
    expect(api.fetchAudience).not.toHaveBeenCalled();
    fireEvent.change(dialog().getByLabelText("Your message"), { target: { value: "Hi {{first_name}}! Free delivery this week." } });
    next();
    expect(await dialog().findByText(/people will receive this|person will receive this/)).toBeDefined();
  });

  it("needs a message, and can add the customer's name where the cursor is", async () => {
    wrap();
    next();
    expect((await screen.findByRole("alert")).textContent).toContain("Write your message first");
    const box = dialog().getByLabelText("Your message") as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: "Hello !" } });
    box.setSelectionRange(6, 6);
    fireEvent.click(dialog().getByRole("button", { name: "First name" }));
    expect(box.value).toBe("Hello {{first_name}}!");
  });
});

describe("step 2: the audience", () => {
  it("counts who will receive it, and who is left out and why", async () => {
    await toAudience();
    expect(screen.getByTestId("audience").textContent).toContain("6people will receive this");
    expect(dialog().getByText("3 haven't been asked yet, so they are left out.")).toBeDefined();
    expect(dialog().getByText("1 said STOP or are blocked, so they are left out.")).toBeDefined();
  });

  it("offers the groups from contact tags, with how many in each would receive it", async () => {
    await toAudience();
    const groups = within(dialog().getByRole("group", { name: "Audience" }));
    expect(groups.getAllByRole("button").map((b) => b.textContent)).toEqual(["Everyone who agreed", "vip3", "lead1"]);
    fireEvent.click(groups.getByRole("button", { name: /vip/ }));
    await waitFor(() => expect(api.fetchAudience).toHaveBeenCalledWith("vip"));
    expect(await dialog().findByText("1 haven't been asked yet, so they are left out.")).toBeDefined();
  });

  it("records permission only after the owner confirms, then recounts", async () => {
    api.recordPermission.mockResolvedValue({ recorded: 3, audience: audience({ willReceive: 9, notAsked: 0 }) });
    await toAudience();
    const record = dialog().getByRole("button", { name: "Record their permission" }) as HTMLButtonElement;
    expect(record.disabled).toBe(true);
    api.fetchAudience.mockResolvedValue(audience({ willReceive: 9, notAsked: 0 }));
    fireEvent.click(dialog().getByLabelText(/I confirm these 3 contacts agreed to receive messages from Bloom Florist/));
    expect(record.disabled).toBe(false);
    fireEvent.click(record);
    await waitFor(() => expect(api.recordPermission).toHaveBeenCalledWith("All Contacts"));
    expect(await dialog().findByText(/people will receive this/)).toBeDefined();
    await waitFor(() => expect(screen.getByTestId("audience").textContent).toContain("9people will"));
    expect(dialog().queryByRole("button", { name: "Record their permission" })).toBeNull();
  });

  it("won't go on when nobody would receive it, or no number is connected", async () => {
    api.fetchAudience.mockResolvedValue(audience({ willReceive: 0, notAsked: 0, optedOut: 4 }));
    await toAudience();
    next();
    expect((await screen.findByRole("alert")).textContent).toContain("Nobody in this audience has agreed");
    cleanup();
    api.fetchAudience.mockResolvedValue(audience());
    wrap({ sessions: [sessions[1]] });
    fireEvent.click(await dialog().findByRole("button", { name: "Ask for feedback" }));
    next();
    await dialog().findByText(/people will/);
    next();
    expect((await screen.findByRole("alert")).textContent).toContain("Connect a WhatsApp number first");
  });
});

describe("step 3: review and send", () => {
  const toReview = async () => {
    await toAudience();
    next();
    await dialog().findByLabelText("Sending speed");
  };

  it("sends now from the connected number to the chosen group at a standard speed", async () => {
    await toAudience();
    fireEvent.click(within(dialog().getByRole("group", { name: "Audience" })).getByRole("button", { name: /vip/ }));
    await dialog().findByText("1 haven't been asked yet, so they are left out.");
    next();
    expect((dialog().getByLabelText("Sending speed") as HTMLSelectElement).value).toBe("8");
    expect(dialog().getByText(/under a minute for 3 people/)).toBeDefined();
    expect(dialog().getByText("Sending from Shop phone")).toBeDefined();
    fireEvent.click(dialog().getByRole("button", { name: "Send to 3 people" }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
    expect(onCreate.mock.calls[0][0]).toMatchObject({
      sessionName: "shop",
      targetSegment: "vip",
      antiBanDelaySeconds: 8,
      launch: "now",
      scheduledFor: "",
      templateText: expect.stringContaining("how was your visit"),
    });
    expect(onCreate.mock.calls[0][0].name).toMatch(/^Ask for feedback · /);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("schedules for a time in the future and refuses a time that has passed", async () => {
    await toReview();
    fireEvent.click(dialog().getByLabelText("Schedule for later"));
    const when = dialog().getByLabelText("Start time") as HTMLInputElement;
    fireEvent.change(when, { target: { value: "2020-01-01T09:00" } });
    fireEvent.click(dialog().getByRole("button", { name: "Schedule for 6" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Choose a start time in the future.");
    expect(onCreate).not.toHaveBeenCalled();
    const later = new Date(Date.now() + 86400_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    fireEvent.change(when, { target: { value: `${later.getFullYear()}-${pad(later.getMonth() + 1)}-${pad(later.getDate())}T10:30` } });
    fireEvent.click(dialog().getByRole("button", { name: "Schedule for 6" }));
    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    const sent = onCreate.mock.calls[0][0];
    expect(sent.launch).toBe("schedule");
    expect(new Date(sent.scheduledFor).getTime()).toBeGreaterThan(Date.now());
  });

  it("can save a draft instead, and the speed and name are the person's choice", async () => {
    await toReview();
    fireEvent.change(dialog().getByLabelText("Name"), { target: { value: "Spring feedback" } });
    fireEvent.change(dialog().getByLabelText("Sending speed"), { target: { value: "15" } });
    fireEvent.click(dialog().getByLabelText("Save as a draft for now"));
    fireEvent.click(dialog().getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    expect(onCreate.mock.calls[0][0]).toMatchObject({ name: "Spring feedback", antiBanDelaySeconds: 15, launch: "draft" });
  });

  it("shows why it could not be created and stays open", async () => {
    onCreate.mockRejectedValue(new Error("That number isn't connected right now."));
    await toReview();
    fireEvent.click(dialog().getByRole("button", { name: "Send to 6 people" }));
    expect((await screen.findByRole("alert")).textContent).toContain("That number isn't connected right now.");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("warns when customers can't reply STOP, and adds the rule in one click", async () => {
    api.fetchAudience.mockResolvedValue(audience({ unsubscribeRule: { exists: false, enabled: false } }));
    api.fetchAutomationTemplates.mockResolvedValue({ templates: [{ id: "stop", name: "Unsubscribe when someone replies STOP", rule: { triggerType: "keyword", triggerCondition: "stop", actionType: "opt_out", actionSummary: "", config: { match: "exact" } } }] });
    api.addAutomation.mockResolvedValue({ automation: { id: "rule-1" } });
    api.toggleAutomationApi.mockResolvedValue({});
    await toReview();
    expect(dialog().getByText(/Customers can't reply STOP to leave your list yet/)).toBeDefined();
    api.fetchAudience.mockResolvedValue(audience());
    fireEvent.click(dialog().getByRole("button", { name: "Add the STOP rule" }));
    await waitFor(() => expect(api.addAutomation).toHaveBeenCalledWith(expect.objectContaining({ templateId: "stop", actionType: "opt_out" })));
    expect(api.toggleAutomationApi).toHaveBeenCalledWith("rule-1");
    expect(await dialog().findByText("Customers can reply STOP to unsubscribe")).toBeDefined();
  });

  it("notes the checklist and goes back without losing the message", async () => {
    await toReview();
    expect(dialog().getByText("6 people have agreed to receive it")).toBeDefined();
    expect(dialog().getByText("Nothing left to fill in")).toBeDefined();
    fireEvent.click(dialog().getByRole("button", { name: "Back" }));
    fireEvent.click(dialog().getByRole("button", { name: "Back" }));
    expect((dialog().getByLabelText("Your message") as HTMLTextAreaElement).value).toContain("how was your visit");
  });
});
