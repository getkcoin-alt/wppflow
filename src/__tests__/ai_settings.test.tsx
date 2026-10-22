import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { FeatureLocked } from "../components/ui/FeatureLocked";

const api = vi.hoisted(() => ({
  getAiStatus: vi.fn(),
  setAiEnabled: vi.fn(),
  getStoredTenantId: () => "t1",
}));
vi.mock("../services/api", () => api);
import { AiAssistantCard } from "../components/admin/AiAssistantCard";

const wrap = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AiAssistantCard />
    </QueryClientProvider>,
  );
const on = { available: true, reason: null, enabled: true, used: 37, limit: 300, remaining: 263, model: "claude-opus-5-5" };

beforeEach(() => {
  api.getAiStatus.mockReset();
  api.setAiEnabled.mockReset();
});

describe("the AI assistant settings", () => {
  it("shows that it is on, how much of today's allowance is used, and what Riwo sees", async () => {
    api.getAiStatus.mockResolvedValue(on);
    wrap();
    expect(await screen.findByText("On")).toBeDefined();
    expect(screen.getByText("37")).toBeDefined();
    expect(screen.getByText(/of 300/)).toBeDefined();
    expect(screen.getByText("What Riwo sees")).toBeDefined();
    expect(screen.getByText(/Phone numbers, photos and files are not sent/)).toBeDefined();
    expect(screen.getByRole("switch", { name: "Use Riwo in this company" }).getAttribute("aria-checked")).toBe("true");
  });

  it("an owner can switch it off, and the screen follows", async () => {
    api.getAiStatus.mockResolvedValueOnce(on).mockResolvedValue({ ...on, available: false, reason: "disabled", enabled: false });
    api.setAiEnabled.mockResolvedValue({});
    wrap();
    fireEvent.click(await screen.findByRole("switch"));
    expect(api.setAiEnabled).toHaveBeenCalledWith(false);
    expect(await screen.findByText("Off")).toBeDefined();
    expect(screen.getByText("Riwo is switched off for your company.")).toBeDefined();
    expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("false");
  });

  it("says plainly what is missing when the server has no key", async () => {
    api.getAiStatus.mockResolvedValue({ available: false, reason: "not_configured", enabled: true, used: 0, limit: 300, remaining: 300 });
    wrap();
    expect(await screen.findByText("Unavailable")).toBeDefined();
    expect(screen.getByText(/adds the AI key/)).toBeDefined();
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.queryByText("Used today")).toBeNull();
  });

  it("says when the plan doesn't include it", async () => {
    api.getAiStatus.mockResolvedValue({ available: false, reason: "plan", enabled: true, used: 0, limit: 300, remaining: 300 });
    wrap();
    expect(await screen.findByText(/part of the Growth plan and above/)).toBeDefined();
    expect(screen.queryByRole("switch")).toBeNull();
  });

  it("shows why a change failed", async () => {
    api.getAiStatus.mockResolvedValue(on);
    api.setAiEnabled.mockRejectedValue(new Error("You do not have permission for this action"));
    wrap();
    fireEvent.click(await screen.findByRole("switch"));
    expect((await screen.findByRole("alert")).textContent).toContain("do not have permission");
    await waitFor(() => expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("true"));
  });
});

describe("a feature that is not in the company's plan", () => {
  it("says which plan has it and points to the plans", () => {
    render(<FeatureLocked feature="Broadcasts" plan="Starter" needs="Growth" />);
    expect(screen.getByText("Broadcasts is part of the Growth plan")).toBeDefined();
    expect(screen.getByText(/Your company is on the Starter plan/)).toBeDefined();
    expect(screen.getByRole("link", { name: "See the plans" }).getAttribute("href")).toBe("https://www.scriwo.com/pricing");
  });
});
