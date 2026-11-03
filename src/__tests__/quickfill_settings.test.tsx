import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { QuickFill } from "../components/ui/QuickFill";
import { understandViewing, type ViewingFill } from "../utils/quickFill";

const re = vi.hoisted(() => ({ reSettings: vi.fn(), reSaveSettings: vi.fn(), reMeta: vi.fn() }));
vi.mock("../services/realEstate", () => re);
vi.mock("../services/api", () => ({ getStoredTenantId: () => "t1" }));
import { RealEstateSettings } from "../components/realestate/RealEstateSettings";

const SAVED = { timezone: "Asia/Dubai", freshnessDays: 14, viewingMinutes: 45, unassignedMinutes: 15, overdueFollowupMinutes: 60, missingNextActionHours: 4, stalledDays: 7 };
const wrap = (ui: React.ReactNode) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

describe("QuickFill", () => {
  it("shows what it understood and fills on Enter", () => {
    const apply = vi.fn();
    render(<QuickFill<ViewingFill> example="tomorrow 4pm" understand={(t) => understandViewing(t, new Date(2026, 10, 4))} onApply={apply} />);
    const box = screen.getByLabelText("Say it in one line");
    fireEvent.change(box, { target: { value: "tomorrow 4pm 30 min" } });
    expect(screen.getByText("at 16:00")).toBeTruthy();
    fireEvent.keyDown(box, { key: "Enter" });
    expect(apply).toHaveBeenCalledWith({ date: "2026-11-05", time: "16:00", minutes: "30" });
    expect(screen.getByText(/Filled\./)).toBeTruthy();
  });
  it("does nothing, and says so, when it understood nothing", () => {
    const apply = vi.fn();
    render(<QuickFill<ViewingFill> example="x" understand={(t) => understandViewing(t)} onApply={apply} />);
    fireEvent.change(screen.getByLabelText("Say it in one line"), { target: { value: "hello there" } });
    expect(screen.getByText(/Nothing to fill/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Fill" }) as HTMLButtonElement).disabled).toBe(true);
    expect(apply).not.toHaveBeenCalled();
  });
});

describe("Real estate settings panel", () => {
  beforeEach(() => Object.values(re).forEach((f) => f.mockReset()));
  it("is its own panel, and saves only what changed", async () => {
    re.reSettings.mockResolvedValue(SAVED);
    re.reSaveSettings.mockResolvedValue({ ...SAVED, viewingMinutes: 60 });
    wrap(<RealEstateSettings open onClose={() => {}} />);
    expect(await screen.findByRole("dialog", { name: "Real estate settings" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();
    fireEvent.click((await screen.findAllByRole("button", { name: "60 min" }))[0]);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(re.reSaveSettings).toHaveBeenCalledWith({ viewingMinutes: 60 }));
  });
  it("shows the refusal when the server says no", async () => {
    re.reSettings.mockResolvedValue(SAVED);
    re.reSaveSettings.mockRejectedValue(new Error("Only owners and administrators can change this"));
    wrap(<RealEstateSettings open onClose={() => {}} />);
    fireEvent.click((await screen.findAllByRole("button", { name: "30 min" }))[0]);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText(/Only owners and administrators/)).toBeTruthy();
  });
});
