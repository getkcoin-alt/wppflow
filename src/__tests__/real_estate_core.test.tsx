import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, within, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { STAGES, TEAM, lead, settings } from "./pipelineFixtures";
import { META } from "./realEstateFixtures";

const api = vi.hoisted(() => ({
  fetchLead: vi.fn(),
  fetchPipelineSettings: vi.fn(),
  moveLead: vi.fn(),
  updateLead: vi.fn(),
  addLeadTask: vi.fn(),
  deleteLead: vi.fn(),
  fetchLeads: vi.fn(),
  getStoredTenantId: () => "t1",
}));
const re = vi.hoisted(() => ({
  reMeta: vi.fn(),
  reProfile: vi.fn(),
  reNextActions: vi.fn(),
  reMatches: vi.fn(),
  reLeadViewings: vi.fn(),
  reSaveProfile: vi.fn(),
  reProposal: vi.fn(),
  reDraft: vi.fn(),
  reProperties: vi.fn(),
  reBook: vi.fn(),
}));
vi.mock("../services/api", () => api);
vi.mock("../services/realEstate", () => re);
import { LeadSheet } from "../components/pipeline/LeadSheet";
import { Dock } from "../components/layout/Dock";
import { TabBar } from "../components/layout/TabBar";
import { NAV, navVisible } from "../components/layout/navigation";
import { SolutionsContext } from "../hooks/useSolutions";

const wrap = (ui: React.ReactElement, solutions: string[] = []) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SolutionsContext.Provider value={solutions}>{ui}</SolutionsContext.Provider>
    </QueryClientProvider>,
  );

beforeEach(() => {
  for (const group of [api, re]) for (const fn of Object.values(group)) if (typeof fn === "function" && "mockReset" in fn) (fn as any).mockReset();
  api.fetchPipelineSettings.mockResolvedValue(settings());
  api.fetchLead.mockResolvedValue({ lead: lead(), tasks: [], timeline: [] });
  re.reMeta.mockResolvedValue(META);
  re.reProfile.mockResolvedValue({ profile: null, missing: ["lead type", "buy or rent"] });
  re.reNextActions.mockResolvedValue({ actions: [] });
  re.reMatches.mockResolvedValue({ eligible: false, reason: "Qualify this lead first: say what they are looking for.", requirements: [], total: 0, candidates: 0, leftOut: {}, freshnessDays: 14, matches: [] });
  re.reLeadViewings.mockResolvedValue({ viewings: [] });
  re.reProperties.mockResolvedValue({ properties: [], total: 0, counts: {} });
});
afterEach(cleanup);

describe("an industry solution is part of the navigation only for a company that has it", () => {
  const dock = (solutions?: string[], manager = true) =>
    render(<Dock view="user" tab="inbox" onNavigate={() => {}} unreadChats={0} manager={manager} bell={null} profile={null} onSearch={() => {}} solutions={solutions} />);

  it("is not in the dock for a company with no solution, so the universal product looks as it always did", () => {
    dock();
    expect(screen.queryByRole("button", { name: "Real estate" })).toBeNull();
    expect(screen.getByRole("button", { name: "Inbox" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Pipeline" })).toBeDefined();
  });

  it("is not shown for a different solution either", () => {
    dock(["clinics"]);
    expect(screen.queryByRole("button", { name: "Real estate" })).toBeNull();
  });

  it("appears for a company that has Scriwo Real Estate, for managers and for staff", () => {
    dock(["real_estate"]);
    expect(screen.getByRole("button", { name: "Real estate" })).toBeDefined();
    cleanup();
    dock(["real_estate"], false);
    expect(screen.getByRole("button", { name: "Real estate" })).toBeDefined();
  });

  it("is in the phone navigation under More, only when the company has it", () => {
    const tabs = (solutions?: string[]) => render(<TabBar view="user" tab="inbox" onNavigate={() => {}} unreadChats={0} manager bell={null} sheetExtras={null} solutions={solutions} />);
    tabs();
    fireMore();
    expect(screen.queryByRole("button", { name: /Real estate/ })).toBeNull();
    cleanup();
    tabs(["real_estate"]);
    fireMore();
    expect(screen.getByRole("button", { name: /Real estate/ })).toBeDefined();
  });

  it("the rule itself", () => {
    const item = NAV.find((i) => i.key === "realestate")!;
    expect(item.solution).toBe("real_estate");
    expect(navVisible(item, { manager: true, solutions: [] })).toBe(false);
    expect(navVisible(item, { manager: false, solutions: ["real_estate"] })).toBe(true);
    const campaigns = NAV.find((i) => i.key === "campaigns")!;
    expect(navVisible(campaigns, { manager: false, solutions: ["real_estate"] })).toBe(false);
    expect(navVisible(campaigns, { manager: true })).toBe(true);
  });
});
function fireMore() {
  fireEvent.click(screen.getByRole("button", { name: /More/ }));
}

describe("the lead sheet", () => {
  const open = (solutions: string[]) =>
    wrap(<LeadSheet leadId="l1" currency="AED" stages={STAGES} teammates={TEAM} isManager aiAvailable currentUserId={1} onClose={() => {}} onOpenChat={() => {}} />, solutions);

  it("is exactly the universal sheet for a company without the solution, and asks the real-estate service for nothing", async () => {
    open([]);
    const d = within(await screen.findByRole("dialog", { name: "Aisha Khan" }));
    await d.findByDisplayValue("2BR Marina");
    expect(d.queryByLabelText("Qualification")).toBeNull();
    expect(re.reProfile).not.toHaveBeenCalled();
    expect(re.reMatches).not.toHaveBeenCalled();
    expect(d.getByLabelText("Details")).toBeDefined();
  });

  it("gains the qualification, matching and viewings for a company that has Real Estate", async () => {
    open(["real_estate"]);
    const d = within(await screen.findByRole("dialog", { name: "Aisha Khan" }));
    expect(await d.findByLabelText("Qualification")).toBeDefined();
    expect(await d.findByLabelText("Matching listings")).toBeDefined();
    expect(await d.findByLabelText("Viewings")).toBeDefined();
    expect(d.getByLabelText("Details")).toBeDefined();
    expect(re.reProfile).toHaveBeenCalledWith("l1");
    expect(await d.findByText("Qualify this lead first: say what they are looking for.")).toBeDefined();
  });
});
