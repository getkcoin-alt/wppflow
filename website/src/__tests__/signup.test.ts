import { describe, it, expect } from "vitest";
import { signupUrl, trialUrl } from "@/lib/signup";

describe("where the pricing buttons go", () => {
  it("Get started free opens the app's sign-up with the Free plan, and no billing period", () => {
    const u = new URL(signupUrl("free", "yearly"));
    expect(u.origin).toBe("https://app.scriwo.com");
    expect(Object.fromEntries(u.searchParams)).toEqual({ signup: "1", plan: "free" });
  });
  it("Buy carries the plan and how it is paid, in the words the app reads", () => {
    expect(Object.fromEntries(new URL(signupUrl("growth", "yearly")).searchParams)).toEqual({ signup: "1", plan: "growth", interval: "annual" });
    expect(Object.fromEntries(new URL(signupUrl("starter", "monthly")).searchParams)).toEqual({ signup: "1", plan: "starter", interval: "monthly" });
    expect(Object.fromEntries(new URL(signupUrl("business")).searchParams)).toEqual({ signup: "1", plan: "business" });
  });
  it("the 14-day trial signs up first, on the Growth plan, and carries no price and no payment", () => {
    const u = new URL(trialUrl());
    expect(u.origin).toBe("https://app.scriwo.com");
    expect(Object.fromEntries(u.searchParams)).toEqual({ signup: "1", plan: "growth", trial: "1" });
  });
  it("never carries a price: the server works that out when the payment opens", () => {
    expect(signupUrl("growth", "yearly")).not.toMatch(/price|amount|total|\d{3,}/i);
  });
});
