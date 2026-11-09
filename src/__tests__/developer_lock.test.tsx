import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const api = vi.hoisted(() => ({ apiGet: vi.fn(), getOtp: vi.fn(), getOtpPreview: vi.fn(), getOtpLog: vi.fn() }));
vi.mock("../services/api", async (original) => ({ ...(await original<typeof import("../services/api")>()), ...api }));
import { overview, MESSAGE } from "./otpFixtures";
import { DeveloperGuide } from "../components/developer/DeveloperGuide";
import { FeatureLocked } from "../components/ui/FeatureLocked";
import { Dock } from "../components/layout/Dock";
import { TabBar } from "../components/layout/TabBar";
import { NAV, NAV_SECONDARY, type NavItem } from "../components/layout/navigation";

beforeEach(() => {
  api.getOtp.mockResolvedValue(overview());
  api.getOtpPreview.mockResolvedValue(MESSAGE);
  api.getOtpLog.mockResolvedValue([]);
});
afterEach(() => {
  cleanup();
  for (const f of Object.values(api)) f.mockReset();
});

const guide = (props: Partial<React.ComponentProps<typeof DeveloperGuide>> = {}) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <DeveloperGuide canManage activeDevTab="docs" onSelectDevTab={() => {}} {...props} />
    </QueryClientProvider>,
  );

describe("the Developers module on a plan without the API tools", () => {
  it("keeps Free OTP open and says the rest is a Business-plan tool, without showing any of it", async () => {
    guide({ apiPlan: "Growth", onOpenPlan: vi.fn() });
    expect(screen.getByText("More developer tools are part of the Business plan")).toBeDefined();
    expect(screen.getByText(/Your company is on the Growth plan\. Business adds API keys, signed webhooks, the API tester and SDK samples/)).toBeDefined();
    expect(await screen.findByRole("heading", { name: "What is the code for?" })).toBeDefined();
    // none of the Business tools or their tabs
    for (const name of ["API tester", "SDKs", "API keys", "Webhooks"]) expect(screen.queryByText(name)).toBeNull();
    expect(screen.queryByRole("tablist", { name: "Developer sections" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Execute request" })).toBeNull();
  });

  it("an owner or administrator is taken to the plans; none of the Business tools is asked for", async () => {
    const open = vi.fn();
    guide({ apiPlan: "Starter", onOpenPlan: open });
    fireEvent.click(screen.getByRole("button", { name: "See the plans" }));
    expect(open).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Ask your company's owner/)).toBeNull();
    await screen.findByRole("heading", { name: "What is the code for?" });
    expect(api.apiGet).not.toHaveBeenCalled();
  });

  it("a teammate who cannot change the plan is told to ask the owner, and can read the plans", () => {
    guide({ apiPlan: "Free", canManage: false });
    expect(screen.getByText(/Ask your company's owner or an administrator to change the plan\./)).toBeDefined();
    expect(screen.getByRole("link", { name: "See the plans" }).getAttribute("href")).toBe("https://www.scriwo.com/pricing");
    expect(screen.getByText(/Free OTP is set up by your company's owner or an administrator/)).toBeDefined();
    expect(api.getOtp).not.toHaveBeenCalled();
  });

  it("when a Business plan is more than the grace period late, it says the payment switched the tools off and that Free OTP still works", () => {
    const open = vi.fn();
    guide({ apiPlan: "Free", lapsed: true, onOpenPlan: open });
    expect(screen.getByText("The other developer tools are off until the payment is received")).toBeDefined();
    expect(screen.getByText(/Free OTP keeps working\./)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Pay now" }));
    expect(open).toHaveBeenCalled();
  });

  it("a Business plan sees the whole module, Free OTP first", () => {
    guide({});
    expect(screen.getByText("Free OTP")).toBeDefined();
    expect(screen.getByText("API tester")).toBeDefined();
    expect(screen.getByText("API keys")).toBeDefined();
    expect(screen.queryByText(/More developer tools are part/)).toBeNull();
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
    expect(needsOf("developers"), "Free OTP is open to every plan, so the Developers item is never locked").toBeUndefined();
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
    dock((i) => i.needs?.feature === "automations", onNavigate);
    const button = screen.getByRole("button", { name: "Automations" });
    expect(button.getAttribute("title")).toBe("Automations is part of the Growth plan");
    expect(within(button).getByTestId("locked-automations")).toBeDefined();
    expect(screen.queryByTestId("locked-pipeline")).toBeNull();
    expect(screen.queryByTestId("locked-inbox")).toBeNull();
    fireEvent.click(button);
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ key: "automations" }));
  });

  it("marks every plan-gated item a Free company lacks, and none for a plan that has them all", () => {
    dock((i) => Boolean(i.needs));
    expect(screen.getAllByTestId(/^locked-/).map((e) => e.getAttribute("data-testid")).sort()).toEqual(["locked-automations", "locked-campaigns", "locked-pipeline"]);
    cleanup();
    dock(() => false);
    expect(screen.queryAllByTestId(/^locked-/)).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Developers" }).getAttribute("title")).toBeNull();
    cleanup();
    dock((i) => Boolean(i.needs));
    expect(screen.getByRole("button", { name: "Developers" }).getAttribute("title")).toBeNull();
  });

  it("marks it in the phone's Menu too", () => {
    render(<TabBar view="user" tab="inbox" onNavigate={() => {}} unreadChats={0} manager isLocked={(i) => i.needs?.feature === "automations"} />);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const sheet = within(screen.getByRole("dialog", { name: "Menu" }));
    expect(sheet.getByTestId("locked-automations")).toBeDefined();
    expect(sheet.getByRole("button", { name: /Automations/ }).getAttribute("title")).toBe("Automations is part of the Growth plan");
    expect(sheet.queryByTestId("locked-pipeline")).toBeNull();
    expect(sheet.queryByTestId("locked-developers")).toBeNull();
  });
});
