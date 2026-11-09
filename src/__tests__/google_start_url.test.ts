import { describe, expect, it } from "vitest";
import { googleSignInUrl } from "../services/api";

const params = (url: string) => new URL(url, "http://localhost").searchParams;

describe("where 'Continue with Google' goes", () => {
  it("says which address the person is on, so Google sends them back to it (app. and homes. each keep their own sign-in cookies)", () => {
    const p = params(googleSignInUrl());
    expect(p.get("origin")).toBe(window.location.origin);
  });

  it("keeps the plan, the trial and the industry the person came for", () => {
    const p = params(googleSignInUrl({ plan: "growth", interval: "annual", trial: true }, "homes"));
    expect(Object.fromEntries(p)).toEqual({ trial: "growth", vertical: "homes", plan: "growth", interval: "annual", origin: window.location.origin });
  });

  it("goes to the server's start address", () => {
    expect(googleSignInUrl()).toContain("/api/auth/google/start?");
  });
});
