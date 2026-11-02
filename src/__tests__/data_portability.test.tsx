import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import React from "react";

const api = vi.hoisted(() => ({ downloadCompanyData: vi.fn(), downloadAllMessages: vi.fn(), verifyAutomatedRecord: vi.fn() }));
vi.mock("../services/api", () => api);
import { DataPortabilityCard } from "../components/admin/DataPortabilityCard";

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  api.downloadCompanyData.mockResolvedValue(undefined);
  api.downloadAllMessages.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("your data, and what Riwo said", () => {
  it("downloads the data and the messages", async () => {
    render(<DataPortabilityCard />);
    fireEvent.click(screen.getByRole("button", { name: /Download my data/ }));
    await waitFor(() => expect(api.downloadCompanyData).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: /Download all messages/ }));
    await waitFor(() => expect(api.downloadAllMessages).toHaveBeenCalledTimes(1));
  });

  it("says plainly when a download fails", async () => {
    api.downloadCompanyData.mockRejectedValue(new Error("You've exported a lot just now. Please try again in a while."));
    render(<DataPortabilityCard />);
    fireEvent.click(screen.getByRole("button", { name: /Download my data/ }));
    expect(await screen.findByText(/exported a lot just now/)).toBeDefined();
  });

  it("checks the record and reports an intact one and a broken one differently", async () => {
    api.verifyAutomatedRecord.mockResolvedValueOnce({ ok: true, checked: 15, brokenAtId: null });
    render(<DataPortabilityCard />);
    fireEvent.click(screen.getByRole("button", { name: /Check the record/ }));
    expect(await screen.findByText(/The record is intact: 15 automatic messages checked/)).toBeDefined();
    api.verifyAutomatedRecord.mockResolvedValueOnce({ ok: false, checked: 15, brokenAtId: 4 });
    fireEvent.click(screen.getByRole("button", { name: /Check the record/ }));
    expect(await screen.findByText(/something was changed or removed/)).toBeDefined();
  });
});
