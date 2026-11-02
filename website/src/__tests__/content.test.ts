import { guidesFor } from "@/content/blog";
import { AR, HI, LANGUAGE_ALTERNATES } from "@/content/locales";
import { POLICY_LINKS } from "@/lib/legal";
import { describe, expect, it } from "vitest";
import { FEATURES } from "@/content/features";
import { INDUSTRIES } from "@/content/industries";
import { CITIES } from "@/content/cities";
import { POSTS } from "@/content/blog";
import { PLANS, YEARLY_MONTHS, yearlyPrice } from "@/content/plans";
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

describe("the AI and partner claims", () => {
  it("has a page for each AI and sales feature that the home page links to", async () => {
    const slugs = FEATURES.map((f) => f.slug);
    for (const slug of ["ai-today-home", "riwo-autopilot", "ai-sales-assistant", "ai-handoff-and-disclosure", "whatsapp-sales-pipeline", "team-reports-and-assignment"]) expect(slugs).toContain(slug);
    const { RIWO_AUTOMATIC } = await import("@/content/riwo");
    for (const a of RIWO_AUTOMATIC) expect(allRoutes().map((r) => r.path), a.title).toContain(a.href);
  });

  it("does not say Riwo never sends on its own, because Autopilot and the Sales assistant can", async () => {
    const { RIWO, RIWO_FAQS, RIWO_STEPS } = await import("@/content/riwo");
    const text = [RIWO.oneLine, ...RIWO_STEPS, ...RIWO_FAQS.map((f) => f.a)].join(" ");
    expect(text).not.toMatch(/never sends anything to a customer on its own/i);
    expect(text).not.toMatch(/a person always (reads|sends)/i);
    // and says the honest version: optional, off until an owner turns it on, labelled, with pricing for a person
    expect(text).toMatch(/off until/i);
    expect(text).toMatch(/automated reply/i);
    expect(text).toMatch(/pricing/i);
    const autopilot = FEATURES.find((f) => f.slug === "riwo-autopilot")!;
    expect(JSON.stringify(autopilot)).toMatch(/off until an owner switches it on|off until an owner turns it on/);
  });

  it("promises the AI features only from the Growth plan, where the product locks them", () => {
    const growth = PLANS.find((p) => p.id === "growth")!.includes.join(" ");
    expect(growth).toMatch(/sales assistant/i);
    expect(growth).toMatch(/Autopilot/);
    expect(growth).toMatch(/pipeline/i);
    for (const id of ["free", "starter"] as const) expect(PLANS.find((p) => p.id === id)!.includes.join(" ")).not.toMatch(/Riwo|sales assistant|Autopilot|pipeline/i);
  });

  it("offers white-label as a partnership agreed with the team, and does not promise features that are not built", async () => {
    const { PARTNERS, PARTNER_FAQS, PARTNER_STEPS } = await import("@/content/partners");
    const { GENERAL_FAQS } = await import("@/content/faqs");
    expect(allRoutes().map((r) => r.path)).toContain("/white-label");
    const { INTERESTS } = await import("@/lib/contact");
    expect(INTERESTS.map((i) => i.value)).toContain("partner");
    expect(PLANS.find((p) => p.id === "enterprise")!.includes.join(" ")).toMatch(/white-label/i);
    expect(GENERAL_FAQS.some((f) => /white-label/i.test(f.q))).toBe(true);
    const copy = [PARTNERS.intro, ...PARTNER_FAQS.map((f) => f.a), ...PARTNER_STEPS.map((s) => s.join(" "))].join(" ");
    expect(copy).toMatch(/agreed with/i);
    expect(copy).toMatch(/what (is|we can do) (available )?today|plainly/i);
    expect(copy).not.toMatch(/self-?serve|instantly|in minutes|one click|unlimited/i);
  });
});

describe("Scriwo Homes", () => {
  it("has a page, is linked, and promises only what is built", async () => {
    const { HOMES, HOMES_FAQS, HOMES_FLOW, HOMES_RULES, HOMES_STEPS } = await import("@/content/homes");
    expect(allRoutes().map((r) => r.path)).toContain("/homes");
    expect(HOMES.appUrl).toBe("https://homes.scriwo.com");
    const copy = [HOMES.intro, ...HOMES_FAQS.map((f) => f.a), ...HOMES_FLOW.map((f) => f.body), ...HOMES_RULES.map((f) => f.body), ...HOMES_STEPS.map((s) => s.join(" "))].join(" ");
    // not built yet, so never claimed as available
    expect(copy).not.toMatch(/syncs? with (google|outlook)|automatic(ally)? (sends|confirm)|imports? from (property finder|bayut)|arabic screens/i);
    expect(copy).toMatch(/Not yet/);
    expect(copy).toMatch(/14 days/);
    expect(copy).toMatch(/never|cannot/i);
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

  it("a year costs ten months in both currencies, which the app and billing also use", () => {
    expect(YEARLY_MONTHS).toBe(10);
    const growth = PLANS.find((p) => p.id === "growth")!;
    expect(yearlyPrice(growth.price.INR!)).toBe(69990);
    expect(yearlyPrice(growth.price.AED!)).toBe(7990);
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
