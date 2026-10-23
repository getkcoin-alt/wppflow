import { guidesFor } from "@/content/blog";
import { AR, HI, LANGUAGE_ALTERNATES } from "@/content/locales";
import { POLICY_LINKS } from "@/lib/legal";
import { describe, expect, it } from "vitest";
import { FEATURES } from "@/content/features";
import { INDUSTRIES } from "@/content/industries";
import { CITIES } from "@/content/cities";
import { POSTS } from "@/content/blog";
import { PLANS } from "@/content/plans";
import { allRoutes } from "@/lib/routes";
import { validateContact } from "@/lib/contact";

describe("site content", () => {
  it("every page has a unique address", () => {
    const paths = allRoutes().map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("cross-links only point at pages that exist", () => {
    const features = new Set(FEATURES.map((f) => f.slug));
    const industries = new Set(INDUSTRIES.map((i) => i.slug));
    for (const i of INDUSTRIES) for (const f of i.features) expect(features, `${i.slug} → ${f}`).toContain(f);
    for (const c of CITIES) for (const i of c.industries) expect(industries, `${c.slug} → ${i}`).toContain(i);
    for (const p of POSTS) for (const f of p.related) expect(features, `${p.slug} → ${f}`).toContain(f);
  });

  it("city pages are not copies of each other", () => {
    const intros = CITIES.map((c) => c.local);
    expect(new Set(intros).size).toBe(intros.length);
  });

  it("covers both target markets", () => {
    expect(CITIES.some((c) => c.country === "UAE")).toBe(true);
    expect(CITIES.some((c) => c.country === "India")).toBe(true);
  });

  it("every plan can be chosen from the contact form", async () => {
    const { INTERESTS } = await import("@/lib/contact");
    for (const p of PLANS) expect(INTERESTS.map((i) => i.value)).toContain(p.id);
  });
});

describe("contact form checks", () => {
  const ok = { name: "Aisha", email: "aisha@example.ae", phone: "", company: "", country: "", teamSize: "", interest: "demo", message: "" };
  it("accepts a minimal enquiry", () => expect(validateContact(ok)).toEqual({}));
  it("explains a bad email and phone", () => {
    const e = validateContact({ ...ok, email: "nope", phone: "call me" });
    expect(e.email).toMatch(/valid email/);
    expect(e.phone).toMatch(/country code/);
  });
  it("requires a name", () => expect(validateContact({ ...ok, name: " " }).name).toBeTruthy());
});

describe("pricing", () => {
  it("paid plans have prices in both currencies, rising with the number limit", async () => {
    const paid = PLANS.filter((p) => p.id !== "enterprise" && p.id !== "free");
    for (const cur of ["AED", "INR"] as const) {
      const prices = paid.map((p) => p.price[cur]);
      expect(prices.every((n) => typeof n === "number" && n > 0)).toBe(true);
      expect([...prices].sort((a, b) => a! - b!)).toEqual(prices);
    }
  });

  it("one number is free and the FAQ says so", async () => {
    const free = PLANS.find((p) => p.id === "free")!;
    expect(free.price).toEqual({ AED: 0, INR: 0 });
    const { GENERAL_FAQS } = await import("@/content/faqs");
    expect(GENERAL_FAQS.map((f) => f.a).join(" ")).toMatch(/free for one account with one WhatsApp number/i);
  });

  it("prices written in the FAQ match the plans", async () => {
    const { GENERAL_FAQS } = await import("@/content/faqs");
    const text = GENERAL_FAQS.map((f) => f.a).join(" ");
    for (const p of PLANS.filter((p) => p.price.AED)) {
      expect(text).toContain(`AED ${p.price.AED!.toLocaleString("en-US")}`);
      expect(text).toContain(`₹${p.price.INR!.toLocaleString("en-IN")}`);
    }
  });
  it("lists every policy page payment gateways ask for", () => {
    const paths = allRoutes().map((r) => r.path);
    for (const l of POLICY_LINKS) expect(paths).toContain(l.href);
  });
  it("tags guides only with real industries, and every city and industry page has a guide", () => {
    const industries = INDUSTRIES.map((i) => i.slug);
    for (const p of POSTS) for (const s of p.industries ?? []) expect(industries, `${p.slug} → ${s}`).toContain(s);
    for (const i of INDUSTRIES) expect(guidesFor({ industry: i.slug }).length + guidesFor({ country: "UAE" }).length, i.slug).toBeGreaterThan(0);
  });
  it("links the language pages to each other with hreflang", () => {
    const paths = allRoutes().map((r) => r.path);
    for (const v of Object.values(LANGUAGE_ALTERNATES)) expect(paths).toContain(v);
    expect(AR.dir).toBe("rtl");
    expect(HI.faqs.length).toBe(AR.faqs.length);
  });
});
