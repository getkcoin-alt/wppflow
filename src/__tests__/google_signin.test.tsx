import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, within } from "@testing-library/react";
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
import { captureStartup, clearIntent, cleanIntent, isPayable, readIntent, recaptureStartup } from "../utils/signupIntent";

// the page is opened at an address, as a visitor arriving from the website would
const arrive = (address: string) => {
  window.sessionStorage.clear();
  window.history.replaceState(null, "", address);
  recaptureStartup();
};
const show = () => render(<LoginPage onAuthSuccess={vi.fn()} />);

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset());
  api.fetchAuthProviders.mockResolvedValue({ google: true });
  api.googleSignInUrl.mockImplementation((i?: { plan?: string; interval?: string }) => `/api/auth/google/start${i?.plan ? `?plan=${i.plan}${i.interval ? `&interval=${i.interval}` : ""}` : ""}`);
});
afterEach(() => {
  cleanup();
  arrive("/");
});

describe("arriving from the website's pricing page", () => {
  it("opens the sign-up form with the chosen plan, and takes our own words out of the address", () => {
    arrive("/?signup=1&plan=growth&interval=annual");
    expect(window.location.search).toBe("");
    show();
    expect(screen.getByRole("heading", { name: "Create your workspace" })).toBeDefined();
    expect(screen.getByText(/You chose the Growth plan, paid yearly\. Create your account, then you will be taken to the payment\./)).toBeDefined();
    expect(readIntent()).toEqual({ plan: "growth", interval: "annual" });
  });
  it("says so plainly for Free, which needs no payment", () => {
    arrive("/?signup=1&plan=free");
    show();
    expect(screen.getByText("You chose the Free plan. Create your account and you are in.")).toBeDefined();
    expect(isPayable(readIntent())).toBe(false);
  });
  it("is the ordinary sign-in page for anyone else, with no plan note", () => {
    arrive("/");
    show();
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeDefined();
    expect(screen.queryByText(/You chose/)).toBeNull();
  });
  it("leaves an invitation or password-reset link alone", () => {
    arrive("/?invite=tok123&plan=growth&signup=1");
    expect(window.location.search).toBe("?invite=tok123");
    arrive("/?reset=abc");
    expect(window.location.search).toBe("?reset=abc");
  });
});

describe("Continue with Google", () => {
  it("is offered when the server has Google set up, carrying the plan chosen, on both the sign-in and sign-up pages", async () => {
    arrive("/?signup=1&plan=growth&interval=annual");
    show();
    const link = (await screen.findByRole("link", { name: /Continue with Google/ })) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/api/auth/google/start?plan=growth&interval=annual");
    expect(screen.getByText(/or use your email/)).toBeDefined();
    cleanup();
    arrive("/");
    show();
    expect(((await screen.findByRole("link", { name: /Continue with Google/ })) as HTMLAnchorElement).getAttribute("href")).toBe("/api/auth/google/start");
  });
  it("is not shown when the server has no Google set up, or cannot say", async () => {
    api.fetchAuthProviders.mockResolvedValue({ google: false });
    arrive("/");
    show();
    await waitFor(() => expect(api.fetchAuthProviders).toHaveBeenCalled());
    expect(screen.queryByRole("link", { name: /Continue with Google/ })).toBeNull();
    cleanup();
    api.fetchAuthProviders.mockRejectedValue(new Error("offline"));
    show();
    await waitFor(() => expect(api.fetchAuthProviders).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("link", { name: /Continue with Google/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Sign in" }), "email sign-in still works").toBeDefined();
  });
  it("is not shown on the forgot-password page", async () => {
    arrive("/");
    show();
    await screen.findByRole("link", { name: /Continue with Google/ });
    screen.getByRole("button", { name: "Forgot password?" }).click();
    await waitFor(() => expect(screen.queryByRole("link", { name: /Continue with Google/ })).toBeNull());
  });
  it.each([
    ["cancelled", /cancelled/],
    ["unverified", /isn't verified/],
    ["disabled", /switched off/],
    ["closed", /can't be created on their own/],
    ["expired", /took too long/],
    ["unavailable", /isn't switched on yet/],
    ["failed", /didn't work/],
    ["something-new", /didn't work/],
  ])("says in plain words when Google sign-in ends with '%s'", (code, pattern) => {
    arrive(`/?google_error=${code}`);
    show();
    expect(screen.getByText(pattern)).toBeDefined();
    expect(window.location.search).toBe("");
  });
});

describe("what a person came to do", () => {
  it("is kept only if it is a plan name and a known billing period", () => {
    expect(cleanIntent("Growth", "yearly")).toEqual({ plan: "growth", interval: "annual" });
    expect(cleanIntent("starter", "monthly")).toEqual({ plan: "starter", interval: "monthly" });
    expect(cleanIntent("starter", "weekly")).toEqual({ plan: "starter", interval: "" });
    expect(cleanIntent("<script>", "monthly")).toBeNull();
    expect(cleanIntent("https://evil.example", null)).toBeNull();
    expect(cleanIntent(null, null)).toBeNull();
    expect(cleanIntent("a".repeat(31), null)).toBeNull();
  });
  it("lasts the visit, and is gone once used", () => {
    arrive("/?plan=business&interval=monthly");
    expect(readIntent()).toEqual({ plan: "business", interval: "monthly" });
    expect(isPayable(readIntent())).toBe(true);
    clearIntent();
    expect(readIntent()).toBeNull();
  });
  it("is never payable for Free or Enterprise, which are not paid for in the app", () => {
    expect(isPayable({ plan: "free", interval: "" })).toBe(false);
    expect(isPayable({ plan: "enterprise", interval: "annual" })).toBe(false);
    expect(isPayable(null)).toBe(false);
  });
  it("survives a trip to Google and back: the return address carries it again", () => {
    arrive("/?google=new&plan=growth&interval=annual");
    expect(captureStartup).toBeTypeOf("function");
    expect(readIntent()).toEqual({ plan: "growth", interval: "annual" });
    expect(window.location.search).toBe("");
  });
});
