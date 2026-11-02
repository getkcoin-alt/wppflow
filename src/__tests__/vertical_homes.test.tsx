import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
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
import { VerticalOpener } from "../components/layout/VerticalOpener";
import { currentVertical, verticalOfHostname } from "../utils/vertical";
import { recaptureStartup } from "../utils/signupIntent";

const arrive = (address: string) => {
  window.sessionStorage.clear();
  window.history.replaceState(null, "", address);
  recaptureStartup();
};

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset());
  api.fetchAuthProviders.mockResolvedValue({ google: true });
  api.googleSignInUrl.mockImplementation((_i: unknown, v?: string | null) => `/api/auth/google/start${v ? `?vertical=${v}` : ""}`);
});
afterEach(() => {
  cleanup();
  arrive("/");
});

describe("Scriwo Homes: the same app on the property address", () => {
  it("knows its address, and ignores every other one", () => {
    expect(verticalOfHostname("homes.scriwo.com")?.name).toBe("Scriwo Homes");
    expect(verticalOfHostname("HOMES.localhost")?.key).toBe("homes");
    for (const other of ["app.scriwo.com", "www.scriwo.com", "", null, undefined, "__proto__.example", "constructor.example"]) expect(verticalOfHostname(other)).toBeNull();
  });

  it("can be tried on any address with ?vertical=homes, and keeps it for the visit", () => {
    arrive("/?vertical=homes");
    expect(currentVertical()?.key).toBe("homes");
    window.history.replaceState(null, "", "/");
    expect(currentVertical()?.key).toBe("homes");
    arrive("/?vertical=banks");
    expect(currentVertical()).toBeNull();
  });

  it("the sign-in page speaks to property agencies, and sign-up says what the trial is", () => {
    arrive("/?vertical=homes&signup=1");
    render(<LoginPage onAuthSuccess={vi.fn()} />);
    expect(screen.getAllByText(/Every property enquiry,/).length).toBeGreaterThan(0);
    expect(screen.getByText("Homes")).toBeDefined();
    expect(screen.getByText("14 days of everything, free. No card needed.")).toBeDefined();
    expect(screen.getByText("Rashid Al Mansoori")).toBeDefined();
    // the small print agrees with the trial, and does not say the workspace starts on Free
    expect(screen.getByText(/starts with 14 days of the Growth plan/)).toBeDefined();
    expect(screen.queryByText(/starts on the Free plan/)).toBeNull();
  });

  it("an ordinary address looks as it always did", () => {
    arrive("/?signup=1");
    render(<LoginPage onAuthSuccess={vi.fn()} />);
    expect(screen.getAllByText(/thoughtfully handled/).length).toBeGreaterThan(0);
    expect(screen.queryByText("Homes")).toBeNull();
    expect(screen.queryByText(/14 days of everything/)).toBeNull();
    expect(screen.getByText(/starts on the Free plan: one person and one WhatsApp number/)).toBeDefined();
  });

  it("signing up and continuing with Google both say they came from the homes address", async () => {
    arrive("/?vertical=homes&signup=1");
    api.signupUser.mockResolvedValue({ status: "success", token: "t", user: { id: 1 } });
    render(<LoginPage onAuthSuccess={vi.fn()} />);
    const link = await screen.findByRole("link", { name: /Google/ });
    expect(link.getAttribute("href")).toBe("/api/auth/google/start?vertical=homes");
    fireEvent.change(screen.getByPlaceholderText("Jane Doe"), { target: { value: "Hana Broker" } });
    fireEvent.change(screen.getByPlaceholderText("Acme Logistics"), { target: { value: "Marina Homes Realty" } });
    fireEvent.change(screen.getByPlaceholderText("name@company.com"), { target: { value: "hana@homes.test" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "Password@1234" } });
    fireEvent.click(screen.getByRole("button", { name: /Create (workspace|account)|Sign up|Get started/i }));
    await waitFor(() => expect(api.signupUser).toHaveBeenCalled());
    expect(api.signupUser.mock.calls[0][0]).toBe("Hana Broker");
    expect(api.signupUser.mock.calls[0][5]).toBe("homes");
  });

  it("a company with real estate opens on its hub, once; one without it is left where it is", () => {
    arrive("/?vertical=homes");
    const open = vi.fn();
    const { rerender } = render(<VerticalOpener solutions={[]} open={open} />);
    expect(open).not.toHaveBeenCalled();
    rerender(<VerticalOpener solutions={["real_estate"]} open={open} />);
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith("realestate");
    rerender(<VerticalOpener solutions={["real_estate", "x"]} open={open} />);
    expect(open).toHaveBeenCalledTimes(1);
    cleanup();
    arrive("/");
    const other = vi.fn();
    render(<VerticalOpener solutions={["real_estate"]} open={other} />);
    expect(other).not.toHaveBeenCalled();
  });
});
