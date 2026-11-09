import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mocks = vi.hoisted(() => ({ apiGet: vi.fn(), runMediaCheck: vi.fn() }));
vi.mock("../services/api", () => ({ apiGet: mocks.apiGet, getStoredTenantId: () => "t1" }));
vi.mock("../services/mediaCheck", () => ({ runMediaCheck: mocks.runMediaCheck }));
import { MediaStorageCard } from "../components/admin/MediaStorageCard";

const RULE = JSON.stringify([{ AllowedOrigins: ["https://app.scriwo.com", "https://homes.scriwo.com"], AllowedMethods: ["PUT", "GET", "HEAD"] }], null, 2);
const show = () => {
  mocks.apiGet.mockResolvedValue({ media: true });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MediaStorageCard />
    </QueryClientProvider>,
  );
};

describe("the media storage card (platform admin)", () => {
  it("says how to fix the storage rules, with the rule to paste, when browsers are blocked from uploading", async () => {
    mocks.runMediaCheck.mockResolvedValue({
      server: { ok: true, note: "The server can read and write the bucket (120 ms)." },
      browser: { ok: false, note: "This browser was blocked from uploading.", corsRule: RULE },
    });
    show();
    fireEvent.click(screen.getByRole("button", { name: /Run test/ }));
    const fix = await screen.findByRole("group", { name: "How to fix the storage rules" });
    expect(fix.textContent).toMatch(/CORS Policy/);
    expect(fix.textContent).toMatch(/Run test again/);
    const rule = within(fix).getByLabelText("CORS rule for the storage bucket");
    expect(rule.textContent).toContain("https://app.scriwo.com");
    expect(rule.textContent).toContain("https://homes.scriwo.com");
    expect(within(fix).getByRole("button", { name: /Copy/ })).toBeDefined();
  });

  it("shows no fix when uploads work", async () => {
    mocks.runMediaCheck.mockResolvedValue({
      server: { ok: true, note: "The server can read and write the bucket." },
      browser: { ok: true, note: "This browser can upload files to the bucket." },
    });
    show();
    fireEvent.click(screen.getByRole("button", { name: /Run test/ }));
    await waitFor(() => expect(screen.getByText("This browser can upload files to the bucket.")).toBeDefined());
    expect(screen.queryByRole("group", { name: "How to fix the storage rules" })).toBeNull();
  });

  it("shows no fix when the storage answered and refused: that is not a CORS problem", async () => {
    mocks.runMediaCheck.mockResolvedValue({
      server: { ok: true, note: "The server can read and write the bucket." },
      browser: { ok: false, note: "Storage refused the upload (HTTP 403). Check the bucket's access rules." },
    });
    show();
    fireEvent.click(screen.getByRole("button", { name: /Run test/ }));
    await waitFor(() => expect(screen.getByText(/Storage refused the upload/)).toBeDefined());
    expect(screen.queryByRole("group", { name: "How to fix the storage rules" })).toBeNull();
  });
});
