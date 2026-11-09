import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import React from "react";

const api = vi.hoisted(() => ({
  startLiveSession: vi.fn(),
  getLiveSessionQr: vi.fn(),
  getLiveSessionStatus: vi.fn(),
}));
vi.mock("../services/api", () => api);
vi.mock("../services/socket", () => ({ getSocket: () => ({ on: vi.fn(), off: vi.fn() }) }));
// the celebration needs a real canvas
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
import { SessionManager } from "../components/user/SessionManager";
import { CHECK_EVERY_MS, GIVE_UP_AFTER_SCAN, GIVE_UP_BEFORE_SCAN, giveUpAfter } from "../utils/pairingProgress";

describe("how long the pairing screen waits", () => {
  it("is patient for three minutes before the scan, and for as long as the server is after it", () => {
    expect(giveUpAfter(false) * CHECK_EVERY_MS).toBe(180_000);
    expect(giveUpAfter(true)).toBe(GIVE_UP_AFTER_SCAN);
    expect(GIVE_UP_AFTER_SCAN * CHECK_EVERY_MS).toBeGreaterThan(15 * 60_000); // the server allows a number 15 minutes to load its chats
    expect(GIVE_UP_AFTER_SCAN).toBeGreaterThan(GIVE_UP_BEFORE_SCAN * 4);
  });
});

describe("the pairing screen after the code is scanned", () => {
  beforeEach(() => {
    for (const fn of Object.values(api)) fn.mockReset();
    api.getLiveSessionQr.mockResolvedValue({});
    api.startLiveSession.mockResolvedValue({ sessionName: "sales-desk" });
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  const open = async () => {
    render(
      <SessionManager canManage sessions={[]} onAddSession={() => {}} onRestartSession={() => {}} onDeleteSession={() => {}} isPairModalOpen setIsPairModalOpen={() => {}} />,
    );
    const dialog = within(screen.getByRole("dialog", { name: "Connect a WhatsApp number" }));
    await act(async () => {
      fireEvent.click(dialog.getByRole("button", { name: "Show QR code" }));
    });
    return dialog;
  };
  const wait = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

  it("says what is happening and keeps waiting for the chats to load, instead of giving up at three minutes", async () => {
    api.getLiveSessionStatus.mockResolvedValue({ sessionStatus: "AUTHENTICATING" });
    const dialog = await open();
    await wait(4 * CHECK_EVERY_MS);
    expect(dialog.getByText(/Scanned\. WhatsApp is now loading this number's chats/)).toBeDefined();
    await wait(10 * 60_000); // ten minutes later: still waiting, not "took too long"
    expect(dialog.queryByText(/took too long/)).toBeNull();
    expect(dialog.getByText(/Scanned\. WhatsApp is now loading/)).toBeDefined();
    // and when the chats are in, it finishes
    api.getLiveSessionStatus.mockResolvedValue({ sessionStatus: "CONNECTED", phone: "+971500000009" });
    await wait(2 * CHECK_EVERY_MS);
    expect(dialog.queryByText(/Scanned\. WhatsApp is now loading/)).toBeNull();
    expect(dialog.getAllByText(/\+971500000009|connected/i).length).toBeGreaterThan(0);
  });

  it("still gives up after three minutes if the code is never scanned (nothing changed there)", async () => {
    api.getLiveSessionStatus.mockResolvedValue({ sessionStatus: "STARTING" });
    const dialog = await open();
    await wait(GIVE_UP_BEFORE_SCAN * CHECK_EVERY_MS + 5000);
    expect(dialog.getByText(/Starting took too long/)).toBeDefined();
  });

  it("shows the server's own words when the chats did not finish loading, not 'QR code expired'", async () => {
    api.getLiveSessionStatus.mockResolvedValue({ sessionStatus: "AUTHENTICATING" });
    const dialog = await open();
    await wait(3 * CHECK_EVERY_MS);
    api.getLiveSessionStatus.mockResolvedValue({
      sessionStatus: "DISCONNECTED",
      error: "WhatsApp had not finished loading this number's chats when the waiting time ran out. Keep the phone unlocked with WhatsApp open, then press Reconnect.",
    });
    await wait(2 * CHECK_EVERY_MS);
    expect(dialog.getByText(/had not finished loading this number's chats/)).toBeDefined();
    expect(dialog.queryByText(/QR code expired/)).toBeNull();
  });

  it("shows the server's own words when the phone has unlinked the number", async () => {
    api.getLiveSessionStatus.mockResolvedValue({
      sessionStatus: "EXPIRED",
      error: "WhatsApp unlinked this number (it was logged out from the phone). Scan the QR code again to link it.",
    });
    const dialog = await open();
    await wait(2 * CHECK_EVERY_MS);
    expect(dialog.getByText(/WhatsApp unlinked this number/)).toBeDefined();
  });
});
