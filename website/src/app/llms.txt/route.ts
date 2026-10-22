import { SITE, absolute } from "@/lib/site";
import { FEATURES } from "@/content/features";
import { INDUSTRIES } from "@/content/industries";
import { CITIES } from "@/content/cities";
import { POSTS } from "@/content/blog";
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
    "Markets: United Arab Emirates and India. Billing in AED or INR. Sign-up is through the contact form while online payments are being set up.",
    "",
    "## Pricing (monthly, before VAT/GST, no per-message fees)",
    ...PLANS.map((p) => `- ${p.name} (${p.numbers}): ${p.price.AED ? `AED ${p.price.AED.toLocaleString("en-US")} / ₹${p.price.INR?.toLocaleString("en-IN")}` : "custom quote"}`),
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
    "## Guides",
    ...POSTS.map((p) => `- [${p.title}](${absolute(`/blog/${p.slug}`)}): ${p.answer}`),
    "",
    "## Contact",
    `- [Contact and pricing](${absolute("/contact")})`,
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
