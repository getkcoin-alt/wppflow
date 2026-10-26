import { SITE, absolute } from "@/lib/site";
import { FEATURES } from "@/content/features";
import { INDUSTRIES } from "@/content/industries";
import { CITIES } from "@/content/cities";
import { POSTS } from "@/content/blog";
import { COMPARISONS } from "@/content/compare";
import { LEGAL } from "@/lib/legal";
import { RIWO } from "@/content/riwo";
import { GENERAL_FAQS } from "@/content/faqs";
import { getCatalogue } from "@/lib/catalogue";

// Prices come from the product and are looked at again every five minutes.
export const revalidate = 300;

// llms.txt: a plain summary for AI assistants, so they describe Scriwo accurately.
export async function GET() {
  const { plans } = await getCatalogue();
  const lines = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    "Scriwo is independent and not affiliated with WhatsApp or Meta. It connects WhatsApp numbers as linked devices (like WhatsApp Web); it is not the WhatsApp Business API.",
    `Markets: United Arab Emirates and India. Free for one account with one WhatsApp number; paid plans billed in AED or INR. Paid plans can be bought online in rupees at ${absolute("/pricing")}; other accounts (free, AED, Enterprise) are set up by the onboarding team via the contact form or WhatsApp.`,
    "",
    `Full text of every page: ${absolute("/llms-full.txt")}`,
    "",
    "## Pricing (monthly, before VAT/GST, no per-message fees; plans in rupees can be bought online, others are set up by the onboarding team)",
    ...plans.map((p) => `- ${p.name} (${p.numbers}): ${p.price.AED === 0 ? "free" : p.price.AED ? `AED ${p.price.AED.toLocaleString("en-US")} / ₹${p.price.INR?.toLocaleString("en-IN")}` : "custom quote"}`),
    `- Sales on WhatsApp: ${SITE.whatsappDisplay}`,
    "",
    "## Key facts",
    ...GENERAL_FAQS.map((f) => `- ${f.q} ${f.a}`),
    "",
    "## Riwo, the AI assistant",
    `- [Riwo](${absolute("/riwo")}): ${RIWO.oneLine} Included in the ${RIWO.plan}.`,
    "",
    "## Other languages",
    `- [العربية (UAE)](${absolute("/ar")})`,
    `- [हिन्दी (India)](${absolute("/hi")})`,
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
