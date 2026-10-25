import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import React from "react";

const api = vi.hoisted(() => ({
  startLiveSession: vi.fn(),
  getLiveSessionQr: vi.fn(),
  getLiveSessionStatus: vi.fn(),
}));
vi.mock("../services/api", () => api);
vi.mock("../services/socket", () => ({ getSocket: () => ({ on: vi.fn(), off: vi.fn() }) }));
import { SessionManager } from "../components/user/SessionManager";
import { nameInUse, nextFreeLabel, sessionKeyFor } from "../utils/sessionNames";
import type { WhatsAppSession } from "../types";

const session = (sessionKey: string): WhatsAppSession => ({
  id: sessionKey,
  sessionKey,
  displayName: sessionKey,
  phone: "+15550100",
  status: "CONNECTED",
  battery: 100,
  isCharging: false,
  antiBanHealth: 100,
  warmupDay: 1,
  proxyIp: "",
  messagesSentToday: 0,
  messagesLimitToday: 0,
  lastActive: "",
  wppVersion: "",
  channel: "general",
});

describe("names of linked numbers", () => {
  it("turns a label into the name a number is stored under", () => {
    expect(sessionKeyFor("Primary WhatsApp")).toBe("primary-whatsapp");
    expect(sessionKeyFor("  ")).toBe("whatsapp-line");
  });
  it("offers the first label that is not taken", () => {
    expect(nextFreeLabel([])).toBe("Primary WhatsApp");
    expect(nextFreeLabel([session("primary-whatsapp")])).toBe("WhatsApp 2");
    expect(nextFreeLabel([session("primary-whatsapp"), session("whatsapp-2")])).toBe("WhatsApp 3");
    expect(nameInUse([session("Primary-WhatsApp")], "primary-whatsapp")).toBe(true);
  });
});

describe("linking a new number", () => {
  beforeEach(() => {
    for (const fn of Object.values(api)) fn.mockReset();
    api.getLiveSessionQr.mockResolvedValue({});
    api.getLiveSessionStatus.mockResolvedValue({ sessionStatus: "STARTING" });
  });
  const open = (sessions: WhatsAppSession[]) =>
    render(
      <SessionManager
        canManage
        sessions={sessions}
        onAddSession={() => {}}
        onRestartSession={() => {}}
        onDeleteSession={() => {}}
        isPairModalOpen
        setIsPairModalOpen={() => {}}
      />,
    );

  it("starts with a name that is not already a linked number", async () => {
    open([session("primary-whatsapp")]);
    const dialog = within(await screen.findByRole("dialog", { name: "Connect a WhatsApp number" }));
    expect((dialog.getByLabelText("Label") as HTMLInputElement).value).toBe("WhatsApp 2");
  });

  it("will not start a number whose name is already linked, and says why", async () => {
    open([session("primary-whatsapp")]);
    const dialog = within(await screen.findByRole("dialog", { name: "Connect a WhatsApp number" }));
    fireEvent.change(dialog.getByLabelText("Label"), { target: { value: "Primary WhatsApp" } });
    expect(dialog.getByText(/already have a number with this name/)).toBeDefined();
    fireEvent.click(dialog.getByRole("button", { name: "Show QR code" }));
    expect(await dialog.findByText(/You already have a number called "Primary WhatsApp"/)).toBeDefined();
    expect(api.startLiveSession).not.toHaveBeenCalled();
  });

  it("asks the server for a NEW number, so it can refuse a name in use", async () => {
    api.startLiveSession.mockResolvedValue({ sessionName: "sales-desk" });
    open([session("primary-whatsapp")]);
    const dialog = within(await screen.findByRole("dialog", { name: "Connect a WhatsApp number" }));
    fireEvent.change(dialog.getByLabelText("Label"), { target: { value: "Sales desk" } });
    fireEvent.click(dialog.getByRole("button", { name: "Show QR code" }));
    await waitFor(() => expect(api.startLiveSession).toHaveBeenCalledWith("sales-desk", true));
  });

  it("shows the server's reason if it refuses", async () => {
    api.startLiveSession.mockRejectedValue(new Error('You already have a number called "line-1". Choose another name for the new one, or use Reconnect on that one.'));
    open([]);
    const dialog = within(await screen.findByRole("dialog", { name: "Connect a WhatsApp number" }));
    fireEvent.click(dialog.getByRole("button", { name: "Show QR code" }));
    expect(await dialog.findByText(/already have a number called "line-1"/)).toBeDefined();
  });
});
