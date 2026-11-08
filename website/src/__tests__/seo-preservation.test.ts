import { describe, expect, it, vi, afterEach } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { allRoutes } from "@/lib/routes";
import { POSTS } from "@/content/blog";
import { GENERAL_FAQS } from "@/content/faqs";
import { GETTING_STARTED } from "@/content/getting-started";
import { PLANS } from "@/content/plans";
import nextConfig from "../../next.config";

vi.mock("@/lib/catalogue", () => ({ getCatalogue: async () => ({ plans: PLANS, gstRate: 18, live: false, yearlyMonths: 10 }), taxNote: () => "See plan tax information." }));
import { GET as shortFacts } from "@/app/llms.txt/route";
import { GET as fullFacts } from "@/app/llms-full.txt/route";

afterEach(() => vi.restoreAllMocks());

describe("conservative search improvements", () => {
  it("keeps every contextual guide link on an existing canonical route", () => {
    const paths = new Set(allRoutes().map((r) => r.path));
    for (const post of POSTS) for (const section of post.sections) for (const link of section.links || []) {
      expect(link.label.trim().length).toBeGreaterThan(0);
      expect(paths.has(link.href), `${post.slug}: ${link.href}`).toBe(true);
    }
  });
  it("publishes the new guides in both the sitemap and AI reference", async () => {
    const text = await (await fullFacts()).text();
    const urls = sitemap().map((r) => r.url);
    for (const slug of ["test-whatsapp-crm-before-buying", "whatsapp-car-dealership-lead-follow-up"]) {
      const url = `https://www.scriwo.com/blog/${slug}`;
      expect(urls).toContain(url);
      expect(text).toContain(url);
    }
    expect(text).toContain("https://www.scriwo.com/security");
  });
  it("keeps signup answers consistent for people and AI readers", async () => {
    const short = await (await shortFacts()).text();
    const full = await (await fullFacts()).text();
    expect(GENERAL_FAQS.find((f) => f.q === "How do I get started?")?.a).toBe(GETTING_STARTED.trial);
    for (const text of [short, full]) {
      expect(text).toContain(GETTING_STARTED.trial);
      expect(text).toContain(GETTING_STARTED.payment);
      expect(text).not.toContain("free, AED and Enterprise accounts are set up by the onboarding team");
      expect(text).toContain("not the WhatsApp Business API");
    }
  });
  it("keeps search and AI crawler access while excluding API and checkout", () => {
    const rules = robots().rules;
    expect(rules).toEqual([
      expect.objectContaining({ userAgent: expect.arrayContaining(["Googlebot", "Bingbot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot"]), allow: "/", disallow: ["/api/", "/checkout"] }),
      { userAgent: "*", allow: "/", disallow: ["/api/", "/checkout"] },
    ]);
    expect(robots().sitemap).toBe("https://www.scriwo.com/sitemap.xml");
  });
  it("repairs only the malformed sitemap address and keeps invitation redirects", async () => {
    const redirects = await nextConfig.redirects!();
    expect(redirects).toContainEqual({ source: "/sitemap.xml.", destination: "/sitemap.xml", permanent: true });
    expect(redirects).toContainEqual(expect.objectContaining({ source: "/", destination: "https://app.scriwo.com/", has: [{ type: "query", key: "invite" }], permanent: false }));
  });
});
