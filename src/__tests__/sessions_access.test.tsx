import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { SessionManager } from "../components/user/SessionManager";
import { ChangePassword } from "../components/auth/ChangePassword";
import type { AuthUser, WhatsAppSession } from "../types";

vi.mock("../services/socket", () => ({
  getSocket: () => ({ on: vi.fn(), off: vi.fn() }),
}));

const session = (over: Partial<WhatsAppSession> = {}): WhatsAppSession => ({
  id: "s1",
  sessionKey: "staff-7",
  displayName: "staff-7",
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
  ownerName: "Sam Staff",
  ...over,
});
const noop = () => {};
const props = {
  onAddSession: noop,
  onRestartSession: noop,
  onDeleteSession: noop,
  isPairModalOpen: false,
  setIsPairModalOpen: noop,
};

describe("per-staff WhatsApp sessions", () => {
  it("shows the staff owner of every session to managers", () => {
    render(<SessionManager {...props} canManage sessions={[session()]} />);
    expect(screen.getByText("Sam Staff")).toBeTruthy();
    expect(screen.getByText("Connect a number")).toBeTruthy();
  });

  it("lets staff connect their own number without manager controls", () => {
    render(<SessionManager {...props} sessions={[]} />);
    expect(screen.getByText("Connect my WhatsApp")).toBeTruthy();
    expect(screen.queryByText("Sam Staff")).toBeNull();
  });

  it("offers reconnect once the staff member already has a session", () => {
    render(<SessionManager {...props} sessions={[session()]} />);
    expect(screen.getByText("Reconnect my WhatsApp")).toBeTruthy();
    expect(screen.queryByText("Sam Staff")).toBeNull();
  });

  it("forces a temporary password to be replaced", () => {
    const user = { email: "o@acme.test", mustChangePassword: true } as AuthUser;
    render(<ChangePassword user={user} onChanged={noop} onLogout={noop} />);
    expect(screen.getByText("Choose a new password")).toBeTruthy();
    expect(screen.getByLabelText("New password")).toBeTruthy();
  });
});
