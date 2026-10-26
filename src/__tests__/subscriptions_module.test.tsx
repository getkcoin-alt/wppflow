import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({
  listPlans: vi.fn(),
  updatePlan: vi.fn(),
  fetchBillingSettings: vi.fn(),
  saveBillingSettings: vi.fn(),
  fetchPlanChanges: vi.fn(),
  listCompanies: vi.fn(),
}));
vi.mock("../services/api", async (original) => ({ ...(await original<typeof import("../services/api")>()), ...api }));
import { SubscriptionsModule } from "../components/platform/SubscriptionsModule";
import { gstSplit } from "../utils/money";

const price = (interval: "monthly" | "annual", currency: "INR" | "AED", amountMinor: number) => ({ interval, currency, amountMinor });
const feat = (key: string, label: string, included: boolean) => ({ key, label, included });
const plan = (over = {}) => ({
  id: "growth",
  name: "Growth",
  numbers: 10,
  seats: null,
  maxContacts: 5000,
  maxBroadcasts: 20,
  trialDays: 0,
  isActive: true,
  taxMode: "exclusive",
  aiDaily: 300,
  features: [feat("broadcasts", "Broadcasts", true), feat("ai", "The AI assistant", true)],
  prices: [price("monthly", "INR", 499900), price("annual", "INR", 4999000), price("monthly", "AED", 24900), price("annual", "AED", 249000)],
  ...over,
});
const FREE = plan({ id: "free", name: "Free", numbers: 1, seats: 1, maxContacts: 100, maxBroadcasts: null, prices: [], features: [feat("broadcasts", "Broadcasts", false)] });
const settings = (over = {}) => ({
  seller: {
    legalName: "Scriza Technologies",
    tradeName: "Scriwo",
    gstin: "09AAAAA0000A1Z5",
    state: "Uttar Pradesh",
    stateCode: "09",
    addressLines: ["12 Park Road", "Sector 4"],
    city: "Lucknow",
    postalCode: "226001",
    email: "billing@scriwo.test",
  },
  sacCode: "998314",
  gstRate: 18,
  invoicePrefix: "SCZ",
  prorateUpgrades: true,
  nextInvoiceExample: "SCZ/26-27/00001",
  invoiceNumberLimit: 16,
  ...over,
});
const reply = (over = {}, history: any[] = []) => ({ settings: settings(over), history });

const wrap = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><SubscriptionsModule /></QueryClientProvider>);
const goTo = async (tab: string) => fireEvent.click(await screen.findByRole("tab", { name: tab }));

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  api.listPlans.mockResolvedValue([FREE, plan()]);
  api.fetchBillingSettings.mockResolvedValue(reply());
  api.fetchPlanChanges.mockResolvedValue([]);
  api.updatePlan.mockResolvedValue({});
  api.listCompanies.mockResolvedValue([]);
});
afterEach(cleanup);

describe("the tax a rate carries", () => {
  it("adds GST to the price, or finds it inside the price, the way the server does", () => {
    expect(gstSplit(499900, "exclusive", 18)).toEqual({ total: 589882, tax: 89982 });
    expect(gstSplit(589882, "inclusive", 18)).toEqual({ total: 589882, tax: 89982 });
    expect(gstSplit(100000, "exclusive", 0)).toEqual({ total: 100000, tax: 0 });
  });
});

describe("the subscriptions module", () => {
  it("has four parts: rates, services and limits, invoice and tax, change history", async () => {
    wrap();
    for (const name of ["Rates", "Services & limits", "Invoice & tax", "Change history"]) expect(await screen.findByRole("tab", { name })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Rates" }).getAttribute("aria-selected")).toBe("true");
  });

  it("rates: shows what a customer pays with GST, switching with the tax setting", async () => {
    wrap();
    const growth = within(await screen.findByRole("region", { name: "Growth rates" }));
    const preview = within(growth.getByTestId("growth-preview"));
    expect(preview.getByText(/₹5,898\.82 a month/)).toBeDefined();
    expect(preview.getByText(/₹4,999 \+ ₹899\.82 GST/)).toBeDefined();
    expect(preview.getByText("Yearly is 10 months of the monthly price.")).toBeDefined();
    fireEvent.change(growth.getByLabelText("growth tax"), { target: { value: "inclusive" } });
    expect(preview.getByText(/₹4,999 a month/)).toBeDefined();
    expect(preview.getByText(/includes ₹762\.56 GST/)).toBeDefined();
  });

  it("rates: the preview follows the GST rate chosen in Invoice & tax", async () => {
    api.fetchBillingSettings.mockResolvedValue(reply({ gstRate: 12 }));
    wrap();
    const growth = within(await screen.findByRole("region", { name: "Growth rates" }));
    await waitFor(() => expect(growth.getByText("What a customer pays at 12% GST")).toBeDefined());
    expect(growth.getByText(/₹5,598\.88 a month/)).toBeDefined();
  });

  it("rates: saves the price, the tax setting and whether it is for sale, and nothing about services", async () => {
    wrap();
    const growth = within(await screen.findByRole("region", { name: "Growth rates" }));
    fireEvent.change(growth.getByLabelText("growth monthly INR"), { target: { value: "5499.50" } });
    fireEvent.change(growth.getByLabelText("growth tax"), { target: { value: "inclusive" } });
    fireEvent.click(growth.getByRole("checkbox", { name: "Growth is for sale" }));
    fireEvent.click(growth.getByRole("button", { name: "Save Growth rates" }));
    await waitFor(() => expect(api.updatePlan).toHaveBeenCalledTimes(1));
    const [code, body] = api.updatePlan.mock.calls[0];
    expect(code).toBe("growth");
    expect(Object.keys(body).sort()).toEqual(["isActive", "prices", "taxMode"]);
    expect(body.isActive).toBe(false);
    expect(body.taxMode).toBe("inclusive");
    expect(body.prices).toContainEqual(price("monthly", "INR", 549950));
    expect(body.prices).toContainEqual(price("annual", "AED", 249000));
    expect((await growth.findByRole("status")).textContent).toContain("applies to every new order");
  });

  it("rates: a blank price is left out (a custom quote) and the Free plan has none to edit", async () => {
    wrap();
    const growth = within(await screen.findByRole("region", { name: "Growth rates" }));
    fireEvent.change(growth.getByLabelText("growth annual AED"), { target: { value: "" } });
    fireEvent.click(growth.getByRole("button", { name: "Save Growth rates" }));
    await waitFor(() => expect(api.updatePlan).toHaveBeenCalled());
    expect(api.updatePlan.mock.calls[0][1].prices).toHaveLength(3);
    const free = within(screen.getByRole("region", { name: "Free rates" }));
    expect(free.getByText(/no price and is always available/)).toBeDefined();
    expect(free.queryByRole("button")).toBeNull();
    expect(free.queryByLabelText("free monthly INR")).toBeNull();
  });

  it("rates: shows the server's reason when a rate is refused", async () => {
    api.updatePlan.mockRejectedValue(new Error("A price can be at most 10000000000"));
    wrap();
    const growth = within(await screen.findByRole("region", { name: "Growth rates" }));
    fireEvent.click(growth.getByRole("button", { name: "Save Growth rates" }));
    expect(await growth.findByText(/A price can be at most/)).toBeDefined();
  });

  it("services: saves the name, limits and what is included, and nothing about prices", async () => {
    wrap();
    await goTo("Services & limits");
    const section = within(await screen.findByRole("region", { name: "Growth plan" }));
    fireEvent.change(section.getByLabelText("growth name"), { target: { value: "Growth Plus" } });
    fireEvent.change(section.getByLabelText("growth contacts"), { target: { value: "" } });
    fireEvent.change(section.getByLabelText("growth numbers"), { target: { value: "12" } });
    fireEvent.click(section.getByRole("checkbox", { name: "growth includes The AI assistant" }));
    fireEvent.click(section.getByRole("button", { name: "Save Growth" }));
    await waitFor(() => expect(api.updatePlan).toHaveBeenCalledTimes(1));
    const [code, body] = api.updatePlan.mock.calls[0];
    expect(code).toBe("growth");
    expect(Object.keys(body).sort()).toEqual(["features", "maxBroadcasts", "maxContacts", "name", "numbers", "seats"]);
    expect(body).toMatchObject({ name: "Growth Plus", numbers: 12, maxContacts: null, maxBroadcasts: 20, seats: null, features: ["broadcasts"] });
    expect((await section.findByRole("status")).textContent).toContain("applies to every company on this plan");
  });

  it("services: a limit that is not a number is refused here, never saved as 'no limit'", async () => {
    wrap();
    await goTo("Services & limits");
    const section = within(await screen.findByRole("region", { name: "Growth plan" }));
    // a number box holding text it cannot read reports "" as its value and badInput as its validity
    const box = section.getByLabelText("growth contacts") as HTMLInputElement;
    Object.defineProperty(box, "validity", { value: { badInput: true } });
    fireEvent.change(box, { target: { value: "" } });
    fireEvent.click(section.getByRole("button", { name: "Save Growth" }));
    expect(await section.findByText(/must be a number/)).toBeDefined();
    expect(api.updatePlan).not.toHaveBeenCalled();
  });
});

const co = (id: string, planId: string, over: Record<string, unknown> = {}) => ({ id, name: id, planId, status: "active", subscription: { lapsed: false }, ...over });

describe("switching modules on and off for a plan", () => {
  const open = async () => {
    wrap();
    await goTo("Services & limits");
    return within(await screen.findByRole("region", { name: "Growth plan" }));
  };
  const tick = (section: ReturnType<typeof within>, name: string) => fireEvent.click(section.getByRole("checkbox", { name }));

  it("says that ticking unlocks and unticking locks, for every company on the plan, and names the modules as people see them", async () => {
    api.listPlans.mockResolvedValue([plan({ features: [feat("broadcasts", "Broadcasts", true), feat("api", "API keys and webhooks", false), feat("ai", "The AI assistant", true)] })]);
    const section = await open();
    expect(section.getByText(/Ticking one unlocks it, unticking one locks it, for every company on the plan/)).toBeDefined();
    expect(section.getByText("Developers (API keys, webhooks, API tester)")).toBeDefined();
    expect(section.getByText("Riwo, the AI assistant")).toBeDefined();
  });

  it("before saving, says what will be locked or switched on, for how many companies, and that their owners are told", async () => {
    api.listCompanies.mockResolvedValue([co("a", "growth"), co("b", "growth"), co("late", "growth", { subscription: { lapsed: true } }), co("off", "growth", { status: "suspended" }), co("s", "starter")]);
    api.listPlans.mockResolvedValue([plan({ features: [feat("broadcasts", "Broadcasts", true), feat("api", "API keys and webhooks", false)] })]);
    const section = await open();
    expect(section.queryByTestId("growth-modules-preview")).toBeNull();
    tick(section, "growth includes Broadcasts");
    await waitFor(() => expect(section.getByTestId("growth-modules-preview").textContent).toContain("the 2 companies paying for Growth"));
    expect(section.getByTestId("growth-modules-preview").textContent).toBe("Saving will lock Broadcasts for the 2 companies paying for Growth, and tell their owners and administrators. Nothing a company already has is deleted.");
    tick(section, "growth includes API keys and webhooks");
    expect(section.getByTestId("growth-modules-preview").textContent).toContain("Saving will switch on Developers (API keys, webhooks, API tester) and lock Broadcasts for");
    // putting both back leaves nothing to say
    tick(section, "growth includes Broadcasts");
    tick(section, "growth includes API keys and webhooks");
    expect(section.queryByTestId("growth-modules-preview")).toBeNull();
  });

  it("says when nobody is on the plan, so nobody will be told", async () => {
    api.listPlans.mockResolvedValue([plan({ features: [feat("broadcasts", "Broadcasts", true)] })]);
    const section = await open();
    tick(section, "growth includes Broadcasts");
    await waitFor(() => expect(section.getByTestId("growth-modules-preview").textContent).toContain("None is on it now, so nobody will be told."));
    expect(section.getByTestId("growth-modules-preview").textContent).not.toContain("tell their owners");
  });

  it("a change to limits or the name alone says nothing about telling anyone", async () => {
    const section = await open();
    fireEvent.change(section.getByLabelText("growth contacts"), { target: { value: "9000" } });
    expect(section.queryByTestId("growth-modules-preview")).toBeNull();
  });

  it("after saving, says who was told and about what", async () => {
    api.listPlans.mockResolvedValue([plan({ features: [feat("broadcasts", "Broadcasts", true), feat("automations", "Automations", false)] })]);
    api.updatePlan.mockResolvedValue({ plan: {}, notified: { companies: 3, told: 5, added: ["Automations"], removed: ["Broadcasts"] } });
    const section = await open();
    tick(section, "growth includes Broadcasts");
    tick(section, "growth includes Automations");
    fireEvent.click(section.getByRole("button", { name: "Save Growth" }));
    expect((await section.findByRole("status")).textContent).toBe(
      "Saved. It applies to every company on this plan now. Nothing a company already has is deleted. 5 owners and administrators in 3 companies were told: Automations switched on, Broadcasts locked.",
    );
    cleanup();
    api.updatePlan.mockResolvedValue({ plan: {}, notified: { companies: 1, told: 1, added: [], removed: ["Broadcasts"] } });
    const again = await open();
    tick(again, "growth includes Broadcasts");
    fireEvent.click(again.getByRole("button", { name: "Save Growth" }));
    expect((await again.findByRole("status")).textContent).toContain("1 owner or administrator in 1 company was told: Broadcasts locked.");
    cleanup();
    api.updatePlan.mockResolvedValue({ plan: {}, notified: { companies: 0, told: 0, added: [], removed: ["Broadcasts"] } });
    const none = await open();
    tick(none, "growth includes Broadcasts");
    fireEvent.click(none.getByRole("button", { name: "Save Growth" }));
    expect((await none.findByRole("status")).textContent).toContain("No company is paying for this plan right now, so nobody needed telling (Broadcasts locked).");
  });
});

describe("invoice and tax settings", () => {
  const open = async () => {
    wrap();
    await goTo("Invoice & tax");
    return within(await screen.findByRole("region", { name: "Invoice and tax settings" }));
  };

  it("shows what invoices carry now, the state read from the GSTIN, and how the number will look", async () => {
    const form = await open();
    expect((form.getByLabelText("Service code (SAC)") as HTMLInputElement).value).toBe("998314");
    expect((form.getByLabelText("GST rate") as HTMLInputElement).value).toBe("18");
    expect((form.getByLabelText("GSTIN") as HTMLInputElement).value).toBe("09AAAAA0000A1Z5");
    expect((form.getByLabelText("Address") as HTMLTextAreaElement).value).toBe("12 Park Road\nSector 4");
    expect(form.getByText(/State: Uttar Pradesh \(09\)/)).toBeDefined();
    expect(form.getByTestId("invoice-example").textContent).toContain("SCZ/26-27/00001 (15 of the 16 characters the law allows)");
  });

  it("answers where the service code and the invoice fields come from", async () => {
    const form = await open();
    expect(form.getByText("Where do I get the service code and the invoice fields?")).toBeDefined();
    expect(form.getByText(/Rule 46 of the CGST Rules/)).toBeDefined();
    expect(form.getByText(/Your chartered accountant decides/)).toBeDefined();
  });

  it("the invoice number preview follows the prefix as it is typed", async () => {
    const form = await open();
    fireEvent.change(form.getByLabelText("Invoice prefix"), { target: { value: "ab" } });
    expect(form.getByTestId("invoice-example").textContent).toContain("AB/26-27/00001 (14 of the 16 characters");
  });

  it("saves a change that does not alter tax straight away, and shows the new values", async () => {
    api.saveBillingSettings.mockResolvedValue(reply({ seller: { ...settings().seller, email: "accounts@scriwo.test" } }, [{ id: 1, actor: "Root", at: "2026-10-26T10:00:00Z", changes: [{ field: "Billing email", from: "billing@scriwo.test", to: "accounts@scriwo.test" }] }]));
    const form = await open();
    fireEvent.change(form.getByLabelText("Billing email"), { target: { value: "accounts@scriwo.test" } });
    fireEvent.click(form.getByRole("button", { name: /Save invoice & tax settings/ }));
    await waitFor(() => expect(api.saveBillingSettings).toHaveBeenCalledTimes(1));
    const patch = api.saveBillingSettings.mock.calls[0][0];
    expect(patch).toMatchObject({ sacCode: "998314", gstRate: 18, invoicePrefix: "SCZ", prorateUpgrades: true });
    expect(patch.seller).toMatchObject({ email: "accounts@scriwo.test", gstin: "09AAAAA0000A1Z5", addressLines: ["12 Park Road", "Sector 4"], postalCode: "226001" });
    expect((await form.findByRole("status")).textContent).toContain("New invoices use these now");
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("asks before the service code or the GST rate changes, and saves only after confirming", async () => {
    api.saveBillingSettings.mockResolvedValue(reply({ sacCode: "998315", gstRate: 12 }));
    const form = await open();
    fireEvent.change(form.getByLabelText("Service code (SAC)"), { target: { value: "998315" } });
    fireEvent.change(form.getByLabelText("GST rate"), { target: { value: "12" } });
    fireEvent.click(form.getByRole("button", { name: /Save invoice & tax settings/ }));
    const check = within(await screen.findByRole("alertdialog", { name: "Confirm tax change" }));
    expect(check.getByText(/the service code from 998314 to 998315, and the GST rate from 18% to 12%/)).toBeDefined();
    expect(check.getByText(/Invoices already issued keep what they were issued with/)).toBeDefined();
    expect(api.saveBillingSettings).not.toHaveBeenCalled();
    fireEvent.click(check.getByRole("button", { name: "Confirm and save" }));
    await waitFor(() => expect(api.saveBillingSettings).toHaveBeenCalledTimes(1));
    expect(api.saveBillingSettings.mock.calls[0][0]).toMatchObject({ sacCode: "998315", gstRate: 12 });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("'Keep editing' saves nothing, and editing again drops the question", async () => {
    const form = await open();
    fireEvent.change(form.getByLabelText("GSTIN"), { target: { value: "29AAAAA0000A1Z5" } });
    fireEvent.click(form.getByRole("button", { name: /Save invoice & tax settings/ }));
    await screen.findByRole("alertdialog", { name: "Confirm tax change" });
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    fireEvent.click(form.getByRole("button", { name: /Save invoice & tax settings/ }));
    await screen.findByRole("alertdialog");
    fireEvent.change(form.getByLabelText("City"), { target: { value: "Noida" } });
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(api.saveBillingSettings).not.toHaveBeenCalled();
  });

  it("shows the server's reason when the settings are refused", async () => {
    api.saveBillingSettings.mockRejectedValue(new Error("That GSTIN is not valid. It has 15 characters and ends with a check character; copy it from the registration certificate."));
    const form = await open();
    fireEvent.change(form.getByLabelText("City"), { target: { value: "Noida" } });
    fireEvent.click(form.getByRole("button", { name: /Save invoice & tax settings/ }));
    expect(await screen.findByText(/That GSTIN is not valid/)).toBeDefined();
  });
});

describe("change history", () => {
  it("lists plan changes and invoice setting changes together, newest first, with who and from-to", async () => {
    api.fetchPlanChanges.mockResolvedValue([
      { id: 7, plan: "growth", name: "Growth", actor: "Root", at: "2026-10-20T09:00:00Z", changes: [{ field: "Price, INR monthly", from: "INR 4,999 a month", to: "INR 5,499 a month" }] },
    ]);
    api.fetchBillingSettings.mockResolvedValue(reply({}, [
      { id: 2, actor: "Asha", at: "2026-10-25T09:00:00Z", changes: [{ field: "Service code (SAC)", from: "998314", to: "998315" }] },
      { id: 1, actor: "Asha", at: "2026-10-01T09:00:00Z", changes: [] },
    ]));
    wrap();
    await goTo("Change history");
    const region = await screen.findByRole("region", { name: "Change history" });
    await waitFor(() => expect(region.querySelectorAll(":scope > ul > li").length).toBe(2));
    const items2 = Array.from(region.querySelectorAll<HTMLElement>(":scope > ul > li"));
    expect(within(items2[0]).getByText("Invoice & tax settings")).toBeDefined();
    expect(items2[0].textContent).toContain("Asha");
    expect(items2[0].textContent).toContain("Service code (SAC): 998314");
    expect(items2[0].textContent).toContain("998315");
    expect(within(items2[1]).getByText("Growth plan")).toBeDefined();
    expect(items2[1].textContent).toContain("Root");
    expect(items2[1].textContent).toContain("INR 4,999 a month");
    expect(items2[1].textContent).toContain("INR 5,499 a month");
  });

  it("says so when nothing has been changed, and why a load failed", async () => {
    wrap();
    await goTo("Change history");
    expect(await screen.findByText(/Nothing has been changed yet/)).toBeDefined();
    cleanup();
    api.fetchPlanChanges.mockRejectedValue(new Error("Could not load the history"));
    wrap();
    await goTo("Change history");
    expect(await screen.findByText("Could not load the history")).toBeDefined();
  });
});
