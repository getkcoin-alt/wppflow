import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({ apiGet: vi.fn() }));
vi.mock("../services/api", async (original) => ({ ...(await original<typeof import("../services/api")>()), ...api }));
import { DeveloperGuide } from "../components/developer/DeveloperGuide";
import { FeatureLocked } from "../components/ui/FeatureLocked";
import { Dock } from "../components/layout/Dock";
import { TabBar } from "../components/layout/TabBar";
import { NAV, NAV_SECONDARY, type NavItem } from "../components/layout/navigation";

afterEach(() => {
  cleanup();
  api.apiGet.mockReset();
});

const guide = (props: Partial<React.ComponentProps<typeof DeveloperGuide>> = {}) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <DeveloperGuide canManage activeDevTab="docs" onSelectDevTab={() => {}} {...props} />
    </QueryClientProvider>,
  );

describe("the Developers module on a plan without it", () => {
  it("is locked as a whole: it says which plan has it, what it adds, and nothing behind it is shown", () => {
    guide({ apiPlan: "Growth", onOpenPlan: vi.fn() });
    expect(screen.getByText("Developer access is part of the Business plan")).toBeDefined();
    expect(screen.getByText(/Your company is on the Growth plan\. Choose Business or above and developer access will switch on straight away\./)).toBeDefined();
    expect(screen.getByText(/API keys, signed webhooks, the API tester and SDK samples/)).toBeDefined();
    // none of the module's tabs or tools
    for (const name of ["API tester", "SDKs", "API keys", "Webhooks"]) expect(screen.queryByText(name)).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("button", { name: /Run|Send|Create/ })).toBeNull();
  });

  it("an owner or administrator is taken to the plans; nothing is asked of the server", () => {
    const open = vi.fn();
    guide({ apiPlan: "Starter", onOpenPlan: open });
    fireEvent.click(screen.getByRole("button", { name: "See the plans" }));
    expect(open).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Ask your company's owner/)).toBeNull();
    expect(api.apiGet).not.toHaveBeenCalled();
  });

  it("a teammate who cannot change the plan is told to ask the owner, and can read the plans", () => {
    guide({ apiPlan: "Free", canManage: false });
    expect(screen.getByText(/Ask your company's owner or an administrator to change the plan\./)).toBeDefined();
    expect(screen.getByRole("link", { name: "See the plans" }).getAttribute("href")).toBe("https://www.scriwo.com/pricing");
  });

  it("when a Business plan is more than the grace period late, it says the payment switched it off", () => {
    const open = vi.fn();
    guide({ apiPlan: "Free", lapsed: true, onOpenPlan: open });
    expect(screen.getByText("Developer access is off until the payment is received")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Pay now" }));
    expect(open).toHaveBeenCalled();
  });

  it("a Business plan sees the whole module", () => {
    guide({});
    expect(screen.getByText("API tester")).toBeDefined();
    expect(screen.getByText("API keys")).toBeDefined();
    expect(screen.queryByText(/Developer access is/)).toBeNull();
  });
});

describe("a lock reads naturally mid-sentence", () => {
  it("lowers an ordinary first word and keeps capitals such as API", () => {
    render(<FeatureLocked feature="Broadcasts" plan="Starter" needs="Growth" />);
    expect(screen.getByText(/Choose Growth or above and broadcasts will switch on/)).toBeDefined();
    cleanup();
    render(<FeatureLocked feature="The audit log" plan="Starter" needs="Growth" />);
    expect(screen.getByText(/and the audit log will switch on/)).toBeDefined();
    cleanup();
    render(<FeatureLocked feature="API access" plan="Growth" needs="Business" />);
    expect(screen.getByText(/and API access will switch on/)).toBeDefined();
  });
});

describe("the navigation marks what the plan does not include", () => {
  const needsOf = (key: string) => [...NAV, ...NAV_SECONDARY].find((i) => i.key === key)?.needs;
  it("knows which screens belong to which plan", () => {
    expect(needsOf("developers")).toEqual({ feature: "api", plan: "Business" });
    expect(needsOf("pipeline")).toEqual({ feature: "leads", plan: "Growth" });
    expect(needsOf("campaigns")).toEqual({ feature: "broadcasts", plan: "Growth" });
    expect(needsOf("automations")).toEqual({ feature: "automations", plan: "Growth" });
    expect(needsOf("inbox")).toBeUndefined();
    expect(needsOf("contacts")).toBeUndefined();
  });

  const dock = (isLocked: (i: NavItem) => boolean, onNavigate = vi.fn()) =>
    render(<Dock view="user" tab="inbox" onNavigate={onNavigate} unreadChats={0} manager bell={null} profile={null} onSearch={() => {}} isLocked={isLocked} />);

  it("keeps a locked item in the dock with a lock and a hover text, and it still opens", () => {
    const onNavigate = vi.fn();
    dock((i) => i.needs?.feature === "api", onNavigate);
    const button = screen.getByRole("button", { name: "Developers" });
    expect(button.getAttribute("title")).toBe("Developers is part of the Business plan");
    expect(within(button).getByTestId("locked-developers")).toBeDefined();
    expect(screen.queryByTestId("locked-pipeline")).toBeNull();
    expect(screen.queryByTestId("locked-inbox")).toBeNull();
    fireEvent.click(button);
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ key: "developers" }));
  });

  it("marks every plan-gated item a Free company lacks, and none for a plan that has them all", () => {
    dock((i) => Boolean(i.needs));
    expect(screen.getAllByTestId(/^locked-/).map((e) => e.getAttribute("data-testid")).sort()).toEqual(["locked-automations", "locked-campaigns", "locked-developers", "locked-pipeline"]);
    cleanup();
    dock(() => false);
    expect(screen.queryAllByTestId(/^locked-/)).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Developers" }).getAttribute("title")).toBeNull();
  });

  it("marks it in the phone's More sheet too", () => {
    render(<TabBar view="user" tab="inbox" onNavigate={() => {}} unreadChats={0} manager bell={null} sheetExtras={null} isLocked={(i) => i.needs?.feature === "api"} />);
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    const sheet = within(screen.getByRole("dialog", { name: "More" }));
    expect(sheet.getByTestId("locked-developers")).toBeDefined();
    expect(sheet.getByRole("button", { name: /Developers/ }).getAttribute("title")).toBe("Developers is part of the Business plan");
    expect(sheet.queryByTestId("locked-pipeline")).toBeNull();
  });
});
