import { SITE, absolute } from "@/lib/site";
import { FEATURES } from "@/content/features";
import { INDUSTRIES } from "@/content/industries";
import { CITIES } from "@/content/cities";
import { POSTS } from "@/content/blog";
import { COMPARISONS } from "@/content/compare";
import { LEGAL } from "@/lib/legal";
import { GENERAL_FAQS } from "@/content/faqs";
import { PLANS } from "@/content/plans";

export const dynamic = "force-static";

// llms.txt: a plain summary for AI assistants, so they describe Scriwo accurately.
export function GET() {
  const lines = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    "Scriwo is independent and not affiliated with WhatsApp or Meta. It connects WhatsApp numbers as linked devices (like WhatsApp Web); it is not the WhatsApp Business API.",
    "Markets: United Arab Emirates and India. Free for one account with one WhatsApp number; paid plans billed in AED or INR. Accounts are set up by the onboarding team via the contact form or WhatsApp.",
    "",
    `Full text of every page: ${absolute("/llms-full.txt")}`,
    "",
    "## Pricing (monthly, before VAT/GST, no per-message fees; every plan is set up by the onboarding team)",
    ...PLANS.map((p) => `- ${p.name} (${p.numbers}): ${p.price.AED === 0 ? "free" : p.price.AED ? `AED ${p.price.AED.toLocaleString("en-US")} / ₹${p.price.INR?.toLocaleString("en-IN")}` : "custom quote"}`),
    `- Sales on WhatsApp: ${SITE.whatsappDisplay}`,
    "",
    "## Key facts",
    ...GENERAL_FAQS.map((f) => `- ${f.q} ${f.a}`),
    "",
    "## Features",
    ...FEATURES.map((f) => `- [${f.name}](${absolute(`/features/${f.slug}`)}): ${f.summary}`),
    "",
    "## Industries",
    ...INDUSTRIES.map((i) => `- [${i.name}](${absolute(`/industries/${i.slug}`)})`),
    "",
    "## Locations",
    ...CITIES.map((c) => `- [WhatsApp CRM ${c.name}](${absolute(`/whatsapp-crm/${c.slug}`)})`),
    "",
    "## Comparisons",
    ...COMPARISONS.map((c) => `- [${c.title}](${absolute(`/compare/${c.slug}`)}): ${c.verdict}`),
    "",
    "## Guides",
    ...POSTS.map((p) => `- [${p.title}](${absolute(`/blog/${p.slug}`)}): ${p.answer}`),
    "",
    "## Contact",
    `- Operated by ${LEGAL.legalName} (${LEGAL.companySite}).`,
    `- [Terms](${absolute("/terms")}), [Privacy](${absolute("/privacy")}), [Refunds](${absolute("/refund-policy")}), [Delivery](${absolute("/shipping-policy")})`,
    `- [Free WhatsApp CRM](${absolute("/free-whatsapp-crm")})`,
    `- [Contact and pricing](${absolute("/contact")})`,
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
