// @vitest-environment jsdom
// @vitest-environment-options {"url": "https://homes.scriwo.com/"}
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
  fetchAuthProviders: vi.fn(),
  googleSignInUrl: vi.fn(),
}));
vi.mock("../services/api", () => api);
import { LoginPage } from "../components/auth/LoginPage";

// Opened at https://homes.scriwo.com itself, as a property agent arriving on the Homes site would.
beforeEach(() => {
  window.sessionStorage.clear();
  Object.values(api).forEach((fn) => fn.mockReset());
  api.googleSignInUrl.mockImplementation((_i: unknown, v?: string | null) => `/api/auth/google/start?origin=${encodeURIComponent(window.location.origin)}${v ? `&vertical=${v}` : ""}`);
});
afterEach(cleanup);

describe("Continue with Google on the Homes site", () => {
  it("is the Homes address (the test really is at homes.scriwo.com)", () => {
    expect(window.location.origin).toBe("https://homes.scriwo.com");
  });

  it("is offered there, and says it came from the homes address, so Google brings the person back to it", async () => {
    api.fetchAuthProviders.mockResolvedValue({ google: true });
    render(<LoginPage onAuthSuccess={vi.fn()} />);
    const link = await screen.findByRole("link", { name: /Continue with Google/ });
    expect(link.getAttribute("href")).toBe("/api/auth/google/start?origin=https%3A%2F%2Fhomes.scriwo.com&vertical=homes");
    expect(api.googleSignInUrl).toHaveBeenCalledWith(null, "homes");
  });

  it("is still left out when the server does not have Google set up", async () => {
    api.fetchAuthProviders.mockResolvedValue({ google: false });
    render(<LoginPage onAuthSuccess={vi.fn()} />);
    await waitFor(() => expect(api.fetchAuthProviders).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 30));
    expect(screen.queryByRole("link", { name: /Continue with Google/ })).toBeNull();
  });
});
