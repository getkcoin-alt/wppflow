import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";

const api = vi.hoisted(() => ({
  loginUser: vi.fn(),
  signupUser: vi.fn(),
  setStoredToken: vi.fn(),
  acceptInvitation: vi.fn().mockResolvedValue({ status: "success" }),
  getInviteInfo: vi.fn(),
  fetchAuthProviders: vi.fn(),
  googleSignInUrl: vi.fn(() => "/api/auth/google/start"),
}));
vi.mock("../services/api", () => api);
import { LoginPage } from "../components/auth/LoginPage";

describe("owner set-password link", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/?invite=tok123");
    api.acceptInvitation.mockClear();
  });

  it("lets a new owner choose a password with confirmation", async () => {
    api.getInviteInfo.mockResolvedValue({
      email: "olivia@acme.test",
      name: "Olivia",
      company: "Acme",
      setPassword: true,
      existingAccount: false,
    });
    render(<LoginPage onAuthSuccess={() => {}} />);
    expect(await screen.findByText("Set your password")).toBeTruthy();
    expect(screen.getByText(/olivia@acme.test/)).toBeTruthy();
    expect(screen.queryByText(/current password/i)).toBeNull();

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "Owner-chosen-pass-1" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "different-password-1" },
    });
    fireEvent.click(screen.getByText("Save password"));
    expect(await screen.findByText(/do not match/)).toBeTruthy();
    expect(api.acceptInvitation).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "Owner-chosen-pass-1" },
    });
    fireEvent.click(screen.getByText("Save password"));
    await waitFor(() =>
      expect(api.acceptInvitation).toHaveBeenCalledWith(
        "tok123",
        "Owner-chosen-pass-1",
      ),
    );
    expect(await screen.findByText(/Password saved/)).toBeTruthy();
  });

  it("still asks existing staff for their current password", async () => {
    api.getInviteInfo.mockResolvedValue({
      email: "sam@acme.test",
      name: "Sam",
      company: "Acme",
      setPassword: false,
    });
    render(<LoginPage onAuthSuccess={() => {}} />);
    expect(await screen.findByText("Join your team on Scriwo")).toBeTruthy();
    expect(
      screen.getByText(/current password of your existing account/),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Confirm new password")).toBeNull();
  });
});
