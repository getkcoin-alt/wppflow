import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { FeatureLocked } from "../components/ui/FeatureLocked";

const api = vi.hoisted(() => ({
  getAiStatus: vi.fn(),
  setAiEnabled: vi.fn(),
  testAi: vi.fn(),
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
  api.testAi.mockReset();
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

  it("says where the text goes: free models through OpenRouter may keep it", async () => {
    api.getAiStatus.mockResolvedValue({ ...on, provider: "openrouter", free: true });
    wrap();
    await screen.findByText("On");
    fireEvent.click(screen.getByText("What Riwo sees"));
    expect(screen.getByText(/passes it to a free AI model/)).toBeDefined();
    expect(screen.getByText(/may use it to improve their models/)).toBeDefined();
    expect(screen.getByText(/Keep Riwo off for conversations that must stay private/)).toBeDefined();
    expect(screen.queryByText(/Anthropic/)).toBeNull();
  });

  it("says so when Claude writes the answers, and stays general when the service isn't named", async () => {
    api.getAiStatus.mockResolvedValue({ ...on, provider: "anthropic", free: false });
    const first = wrap();
    await screen.findByText("On");
    expect(screen.getByText(/processed by Anthropic's Claude/)).toBeDefined();
    first.unmount();
    api.getAiStatus.mockResolvedValue(on);
    wrap();
    await screen.findByText("On");
    expect(screen.getByText(/processed by an AI service/)).toBeDefined();
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

  it("a test shows the account, the models found and what each attempt said", async () => {
    api.getAiStatus.mockResolvedValue({ ...on, provider: "openrouter", free: true });
    api.testAi.mockResolvedValue({
      provider: "openrouter",
      ok: true,
      model: "openai/gpt-oss-120b:free",
      sample: "OK",
      account: { freeTier: true, used: 0, limit: null },
      freeModels: 18,
      topModels: ["google/gemma-4-31b-it:free", "openai/gpt-oss-120b:free"],
      attempts: [
        { model: "google/gemma-4-31b-it:free", ok: false, status: 429, message: "Google AI Studio: rate limited upstream", ms: 800 },
        { model: "openai/gpt-oss-120b:free", ok: true, ms: 2300 },
      ],
    });
    wrap();
    fireEvent.click(await screen.findByRole("button", { name: "Run a test" }));
    expect(await screen.findByText("Working")).toBeDefined();
    expect(screen.getByText(/answered through/).textContent).toContain("openai/gpt-oss-120b");
    expect(screen.getByText(/about 50 free-model requests a day/)).toBeDefined();
    expect(screen.getByText(/buying \$10 of credit/i)).toBeDefined();
    expect(screen.getByText(/18 free models found/)).toBeDefined();
    expect(screen.getByText(/failed \(429\): Google AI Studio: rate limited upstream/)).toBeDefined();
    expect(screen.getByText(/answered in 2\.3s/)).toBeDefined();
    expect(api.testAi).toHaveBeenCalledTimes(1);
  });

  it("a failed test says why, in the words of the account and the models", async () => {
    api.getAiStatus.mockResolvedValue({ ...on, provider: "openrouter", free: true });
    api.testAi.mockResolvedValue({
      provider: "openrouter",
      ok: false,
      error: "The AI assistant isn't set up correctly. Ask your administrator to check it.",
      account: { error: "No auth credentials found" },
      attempts: [{ model: "google/gemma-4-31b-it:free", ok: false, status: 401, message: "No auth credentials found" }],
    });
    wrap();
    fireEvent.click(await screen.findByRole("button", { name: "Run a test" }));
    expect(await screen.findByText("Not working")).toBeDefined();
    expect(screen.getByText(/isn't set up correctly/)).toBeDefined();
    expect(screen.getByText(/OpenRouter rejected the key: No auth credentials found/)).toBeDefined();
    expect(screen.getByText(/failed \(401\)/)).toBeDefined();
  });

  it("the test is available while the key is missing too, and says so", async () => {
    api.getAiStatus.mockResolvedValue({ available: false, reason: "not_configured", enabled: true, used: 0, limit: 300, remaining: 300 });
    api.testAi.mockResolvedValue({ provider: null, ok: false, error: "No AI key is set on the server." });
    wrap();
    fireEvent.click(await screen.findByRole("button", { name: "Run a test" }));
    expect(await screen.findByText("No AI key is set on the server.")).toBeDefined();
  });

  it("a test that can't be run says why", async () => {
    api.getAiStatus.mockResolvedValue(on);
    api.testAi.mockRejectedValue(new Error("You do not have permission for this action"));
    wrap();
    fireEvent.click(await screen.findByRole("button", { name: "Run a test" }));
    expect((await screen.findByRole("alert")).textContent).toContain("do not have permission");
  });

  it("a plan without Riwo has nothing to test", async () => {
    api.getAiStatus.mockResolvedValue({ available: false, reason: "plan", enabled: true, used: 0, limit: 300, remaining: 300 });
    wrap();
    await screen.findByText(/part of the Growth plan/);
    expect(screen.queryByRole("button", { name: "Run a test" })).toBeNull();
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
