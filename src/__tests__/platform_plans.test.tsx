import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({
  listCompanies: vi.fn(),
  listPlans: vi.fn(),
  createCompany: vi.fn(),
  updateCompany: vi.fn(),
  resendOwnerCredentials: vi.fn(),
}));
vi.mock("../services/api", () => api);
import { PlatformAdmin } from "../components/platform/PlatformAdmin";
import { PlanCard } from "../components/admin/PlanCard";

const feature = (key: string, label: string, included: boolean) => ({ key, label, included });
const features = (on: string[]) => [
  feature("broadcasts", "Broadcasts", on.includes("broadcasts")),
  feature("automations", "Automations", on.includes("automations")),
  feature("audit", "The audit log", on.includes("audit")),
  feature("api", "API keys and webhooks", on.includes("api")),
  feature("ai", "The AI assistant", on.includes("ai")),
];
const PLANS = [
  { id: "free", name: "Free", numbers: 1, seats: 1, features: features([]) },
  { id: "starter", name: "Starter", numbers: 3, seats: null, features: features([]) },
  { id: "growth", name: "Growth", numbers: 10, seats: null, features: features(["broadcasts", "automations", "audit", "ai"]) },
  { id: "business", name: "Business", numbers: 25, seats: null, features: features(["broadcasts", "automations", "audit", "ai", "api"]) },
  { id: "enterprise", name: "Enterprise", numbers: null, seats: null, features: features(["broadcasts", "automations", "audit", "ai", "api"]) },
];
const company = (over = {}) => ({
  id: "t1",
  name: "Acme Retail",
  plan: "Starter",
  planId: "starter",
  status: "active",
  sessionsLimit: 3,
  staffCount: 2,
  sessionsCount: 1,
  connectedSessions: 1,
  createdAt: "2026-10-01",
  owner: { name: "Olivia", email: "olivia@acme.test", activated: true },
  ...over,
});

const wrap = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PlatformAdmin adminName="Root" onLogout={() => {}} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  api.listPlans.mockResolvedValue(PLANS);
  api.listCompanies.mockResolvedValue([company()]);
});
afterEach(cleanup);

const openAdd = async () => {
  wrap();
  await screen.findByText("Acme Retail");
  fireEvent.click(screen.getAllByRole("button", { name: /Add company/ })[0]);
  return within(await screen.findByRole("dialog", { name: "Add a company" }));
};
const fillOwner = (dialog: ReturnType<typeof within>) => {
  fireEvent.change(dialog.getByLabelText("Company name"), { target: { value: "Globex" } });
  fireEvent.change(dialog.getByLabelText("Owner name"), { target: { value: "Hank" } });
  fireEvent.change(dialog.getByLabelText("Owner email"), { target: { value: "hank@globex.test" } });
};

describe("choosing a plan when a company is added", () => {
  it("offers the five plans, and a company can't be added without choosing one", async () => {
    const dialog = await openAdd();
    const select = (await dialog.findByLabelText("Plan")) as HTMLSelectElement;
    await waitFor(() => expect(select.options.length).toBe(6));
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual(["Choose a plan…", "Free", "Starter", "Growth", "Business", "Enterprise"]);
    expect(select.value).toBe("");
    expect(select.required).toBe(true);
    fillOwner(dialog);
    fireEvent.click(screen.getByRole("button", { name: /Add company & email setup link/ }));
    expect(api.createCompany).not.toHaveBeenCalled();
  });

  it("explains what the plan gives, and fills in the number limit it includes", async () => {
    const dialog = await openAdd();
    const select = await dialog.findByLabelText("Plan");
    await waitFor(() => expect((select as HTMLSelectElement).options.length).toBe(6));
    const limit = dialog.getByLabelText("WhatsApp session limit") as HTMLInputElement;
    fireEvent.change(select, { target: { value: "free" } });
    expect(limit.value).toBe("1");
    expect(dialog.getByText(/One WhatsApp number, for one person\. No broadcasts, automations, audit log, API or AI assistant\./)).toBeDefined();
    fireEvent.change(select, { target: { value: "growth" } });
    expect(limit.value).toBe("10");
    expect(dialog.getByText(/Up to 10 WhatsApp numbers\. Adds Broadcasts, Automations, Audit log, AI assistant\./)).toBeDefined();
    fireEvent.change(select, { target: { value: "business" } });
    expect(limit.value).toBe("25");
    expect(dialog.getByText(/Adds Broadcasts, Automations, Audit log, API keys and webhooks, AI assistant\./)).toBeDefined();
    fireEvent.change(select, { target: { value: "enterprise" } });
    expect(limit.value).toBe("");
    expect(dialog.getByText(/Enterprise has no standard limit/)).toBeDefined();
  });

  it("sends the chosen plan with the company, and the limit it was given", async () => {
    api.createCompany.mockResolvedValue({ message: "Company created." });
    const dialog = await openAdd();
    const select = await dialog.findByLabelText("Plan");
    await waitFor(() => expect((select as HTMLSelectElement).options.length).toBe(6));
    fillOwner(dialog);
    fireEvent.change(select, { target: { value: "growth" } });
    fireEvent.click(screen.getByRole("button", { name: /Add company & email setup link/ }));
    await waitFor(() =>
      expect(api.createCompany).toHaveBeenCalledWith({
        companyName: "Globex",
        ownerName: "Hank",
        ownerEmail: "hank@globex.test",
        plan: "growth",
        sessionsLimit: 10,
      }),
    );
    expect(await screen.findByText("Company created.")).toBeDefined();
  });

  it("lets the admin change the limit for a special agreement", async () => {
    api.createCompany.mockResolvedValue({ message: "ok" });
    const dialog = await openAdd();
    const select = await dialog.findByLabelText("Plan");
    await waitFor(() => expect((select as HTMLSelectElement).options.length).toBe(6));
    fillOwner(dialog);
    fireEvent.change(select, { target: { value: "enterprise" } });
    fireEvent.change(dialog.getByLabelText("WhatsApp session limit"), { target: { value: "60" } });
    fireEvent.click(screen.getByRole("button", { name: /Add company & email setup link/ }));
    await waitFor(() => expect(api.createCompany).toHaveBeenCalledWith(expect.objectContaining({ plan: "enterprise", sessionsLimit: 60 })));
  });

  it("shows why a company could not be added", async () => {
    api.createCompany.mockRejectedValue(new Error("Choose a plan: Free, Starter, Growth, Business, Enterprise"));
    const dialog = await openAdd();
    const select = await dialog.findByLabelText("Plan");
    await waitFor(() => expect((select as HTMLSelectElement).options.length).toBe(6));
    fillOwner(dialog);
    fireEvent.change(select, { target: { value: "starter" } });
    fireEvent.click(screen.getByRole("button", { name: /Add company & email setup link/ }));
    expect(await screen.findByText(/Choose a plan: Free, Starter/)).toBeDefined();
  });
});

describe("each company shows its plan and can be moved to another", () => {
  it("shows the plan on the company", async () => {
    api.listCompanies.mockResolvedValue([company(), company({ id: "t2", name: "Old Co", plan: "Workspace", planId: null })]);
    wrap();
    expect(await screen.findByText("Starter")).toBeDefined();
    expect(screen.getByText("Workspace")).toBeDefined();
  });

  it("moves a company to another plan and reports what it keeps", async () => {
    api.updateCompany.mockResolvedValue({
      company: company({ plan: "Free", planId: "free", sessionsLimit: 1 }),
      warnings: ["Free is for one person, but Acme Retail has 3. They keep their access; no one new can be added."],
    });
    wrap();
    await screen.findByText("Acme Retail");
    fireEvent.click(screen.getByRole("button", { name: "Change plan" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Change plan for Acme Retail" }));
    expect(dialog.getByText(/Now on/).textContent).toContain("Starter with 3 WhatsApp numbers");
    const select = dialog.getByLabelText("Plan") as HTMLSelectElement;
    expect(select.value).toBe("starter");
    expect((dialog.getByLabelText("WhatsApp session limit") as HTMLInputElement).value).toBe("3");
    fireEvent.change(select, { target: { value: "free" } });
    expect((dialog.getByLabelText("WhatsApp session limit") as HTMLInputElement).value).toBe("1");
    fireEvent.click(screen.getByRole("button", { name: "Save plan" }));
    await waitFor(() => expect(api.updateCompany).toHaveBeenCalledWith("t1", { plan: "free", sessionsLimit: 1 }));
    const notice = await screen.findByText(/Acme Retail is now on the Free plan\./);
    expect(notice.textContent).toContain("They keep their access; no one new can be added.");
  });

  it("a company from before plans must be given one, and keeps its limit until then", async () => {
    api.listCompanies.mockResolvedValue([company({ plan: "Workspace", planId: null, sessionsLimit: 5 })]);
    wrap();
    await screen.findByText("Acme Retail");
    fireEvent.click(screen.getByRole("button", { name: "Change plan" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Change plan for Acme Retail" }));
    expect((dialog.getByLabelText("Plan") as HTMLSelectElement).value).toBe("");
    expect((dialog.getByLabelText("WhatsApp session limit") as HTMLInputElement).value).toBe("5");
    fireEvent.click(screen.getByRole("button", { name: "Save plan" }));
    expect(api.updateCompany).not.toHaveBeenCalled();
  });
});

describe("the company's own view of its plan", () => {
  const plan = (name: string, features: Record<string, boolean>, seats: number | null = null) => ({ name, restricted: true, seats, features });
  it("lists what is included and what is not, with the numbers used", () => {
    render(
      <PlanCard
        plan={plan("Starter", { broadcasts: false, automations: false, leads: false, audit: false, api: false, ai: false })}
        numbersLimit={3}
        numbersUsed={2}
      />,
    );
    expect(screen.getByText("Starter")).toBeDefined();
    expect(screen.getByText("WhatsApp numbers").parentElement?.textContent).toContain("2 of 3");
    expect(screen.getAllByLabelText("Not included").length).toBe(6);
    expect(screen.getByText(/ask the Scriwo team to move your company to a bigger plan/)).toBeDefined();
    expect(screen.getByRole("link", { name: "See the plans" }).getAttribute("href")).toBe("https://www.scriwo.com/pricing");
  });

  it("shows a business plan as including everything", () => {
    render(<PlanCard plan={plan("Business", { broadcasts: true, automations: true, leads: true, audit: true, api: true, ai: true })} numbersLimit={25} numbersUsed={4} />);
    expect(screen.getAllByLabelText("Included").length).toBe(6);
    expect(screen.queryByLabelText("Not included")).toBeNull();
    expect(screen.queryByText(/bigger plan/)).toBeNull();
  });

  it("says the Free plan is for one person", () => {
    render(<PlanCard plan={plan("Free", { broadcasts: false, automations: false, leads: false, audit: false, api: false, ai: false }, 1)} numbersLimit={1} numbersUsed={1} />);
    expect(screen.getByText("This plan is for one person.")).toBeDefined();
  });

  it("an older workspace plan has everything and says so", () => {
    render(<PlanCard plan={{ name: "Workspace", restricted: false, features: { broadcasts: true, automations: true, leads: true, audit: true, api: true, ai: true } }} numbersLimit={5} />);
    expect(screen.getByText("Everything included")).toBeDefined();
  });
});
