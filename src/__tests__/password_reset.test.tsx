import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";

const api = vi.hoisted(() => ({
  loginUser: vi.fn(),
  signupUser: vi.fn(),
  setStoredToken: vi.fn(),
  acceptInvitation: vi.fn(),
  getInviteInfo: vi.fn(),
  requestPasswordReset: vi.fn(),
  getResetInfo: vi.fn(),
  resetPassword: vi.fn(),
}));
vi.mock("../services/api", () => api);
import { LoginPage } from "../components/auth/LoginPage";

const GENERIC =
  "If that address has an account, we have emailed a link to choose a new password. It works for one hour.";

describe("forgot password", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    Object.values(api).forEach((fn) => fn.mockReset());
  });

  it("is offered on the sign-in screen, not on the create-workspace screen", () => {
    render(<LoginPage onAuthSuccess={() => {}} />);
    expect(screen.getByText("Forgot password?")).toBeTruthy();
    fireEvent.click(screen.getByText("Create a workspace"));
    expect(screen.queryByText("Forgot password?")).toBeNull();
  });

  it("asks for the email only and shows the same answer whatever the server says", async () => {
    api.requestPasswordReset.mockResolvedValue({ status: "success", message: GENERIC });
    render(<LoginPage onAuthSuccess={() => {}} />);
    fireEvent.click(screen.getByText("Forgot password?"));
    expect(await screen.findByText("Reset your password")).toBeTruthy();
    expect(screen.queryByLabelText("Password")).toBeNull();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "rhea@reset.test" },
    });
    fireEvent.click(screen.getByText("Send reset link"));
    await waitFor(() =>
      expect(api.requestPasswordReset).toHaveBeenCalledWith("rhea@reset.test"),
    );
    expect(await screen.findByText(GENERIC)).toBeTruthy();
    expect(api.loginUser).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Sign in"));
    expect(screen.queryByText(GENERIC)).toBeNull();
    expect(screen.getByText("Welcome back")).toBeTruthy();
  });

  it("lets the person choose a new password from the emailed link", async () => {
    window.history.replaceState(null, "", "/?reset=tok456");
    api.getResetInfo.mockResolvedValue({ status: "success", email: "rhea@reset.test" });
    api.resetPassword.mockResolvedValue({ status: "success" });
    render(<LoginPage onAuthSuccess={() => {}} />);
    expect(await screen.findByText("Choose a new password")).toBeTruthy();
    expect(api.getResetInfo).toHaveBeenCalledWith("tok456");
    expect(screen.getByText(/rhea@reset.test/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "Brand-new-pass-1" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "different-password-1" },
    });
    fireEvent.click(screen.getByText("Save password"));
    expect(await screen.findByText(/do not match/)).toBeTruthy();
    expect(api.resetPassword).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "Brand-new-pass-1" },
    });
    fireEvent.click(screen.getByText("Save password"));
    await waitFor(() =>
      expect(api.resetPassword).toHaveBeenCalledWith("tok456", "Brand-new-pass-1"),
    );
    expect(await screen.findByText(/Password changed/)).toBeTruthy();
    expect(screen.getByText("Welcome back")).toBeTruthy();
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("rhea@reset.test");
    expect(window.location.search).toBe("");
  });

  it("says so when the link has expired and offers a new one", async () => {
    window.history.replaceState(null, "", "/?reset=old");
    api.getResetInfo.mockRejectedValue(
      new Error("This link is invalid, expired or already used"),
    );
    render(<LoginPage onAuthSuccess={() => {}} />);
    expect(await screen.findByText(/invalid, expired or already used/)).toBeTruthy();
    expect(screen.queryByLabelText("New password")).toBeNull();
    fireEvent.click(screen.getByText("Email me a new link"));
    expect(await screen.findByText("Reset your password")).toBeTruthy();
    expect(window.location.search).toBe("");
  });

  it("shows the server's reason when saving the password is refused", async () => {
    window.history.replaceState(null, "", "/?reset=tok789");
    api.getResetInfo.mockResolvedValue({ status: "success", email: "a@b.test" });
    api.resetPassword.mockRejectedValue(
      new Error("This link is invalid, expired or already used"),
    );
    render(<LoginPage onAuthSuccess={() => {}} />);
    await screen.findByText("Choose a new password");
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "Brand-new-pass-1" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "Brand-new-pass-1" },
    });
    fireEvent.click(screen.getByText("Save password"));
    expect(await screen.findByText(/invalid, expired or already used/)).toBeTruthy();
    expect(screen.getByText("Choose a new password")).toBeTruthy();
  });
});
