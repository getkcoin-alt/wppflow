import { SITE, absolute } from "@/lib/site";
import { FEATURES } from "@/content/features";
import { INDUSTRIES } from "@/content/industries";
import { CITIES } from "@/content/cities";
import { POSTS } from "@/content/blog";
import { COMPARISONS } from "@/content/compare";
import { GENERAL_FAQS } from "@/content/faqs";
import { PLANS, TAX_NOTE } from "@/content/plans";

export const dynamic = "force-static";

// llms-full.txt: the whole site as plain text, so AI assistants can read every page in one fetch.
export function GET() {
  const out: string[] = [
    `# ${SITE.name}: full site content`,
    "",
    `> ${SITE.description}`,
    "",
    `Website: ${SITE.url}. Short summary: ${absolute("/llms.txt")}.`,
    "Scriwo is independent and not affiliated with WhatsApp or Meta. It links WhatsApp numbers as linked devices (like WhatsApp Web); it is not the WhatsApp Business API.",
    "",
    "## Pricing",
    ...PLANS.map((p) => `- ${p.name} (${p.numbers}): ${p.price.AED === 0 ? "free" : p.price.AED ? `AED ${p.price.AED.toLocaleString("en-US")} / ₹${p.price.INR?.toLocaleString("en-IN")} a month` : "custom quote"}. ${p.for}.`),
    `- ${TAX_NOTE.AED} ${TAX_NOTE.INR}`,
    "- No per-message fees. Every account is set up by the onboarding team.",
    "",
    "## Frequently asked questions",
    ...GENERAL_FAQS.flatMap((f) => [`### ${f.q}`, f.a, ""]),
  ];
  for (const f of FEATURES) {
    out.push(`## ${f.title}`, `URL: ${absolute(`/features/${f.slug}`)}`, "", f.summary, "");
    out.push(...f.points.map((p) => `- ${p.title}: ${p.body}`), "", "How it works:", ...f.howTo.map((s, i) => `${i + 1}. ${s}`), "");
    out.push(...f.faqs.flatMap((q) => [`Q: ${q.q}`, `A: ${q.a}`]), "");
  }
  for (const i of INDUSTRIES) {
    out.push(`## ${i.title}`, `URL: ${absolute(`/industries/${i.slug}`)}`, "", i.intro, "", "Problems:", ...i.problems.map((p) => `- ${p}`), "");
    out.push("Workflow:", ...i.workflow.map((w) => `- ${w.title}: ${w.body}`), "", `Tip: ${i.tip}`, "");
  }
  for (const c of COMPARISONS) {
    out.push(`## ${c.title}`, `URL: ${absolute(`/compare/${c.slug}`)}`, "", c.intro, "");
    out.push(...c.rows.map((r) => `- ${r.label}: Scriwo: ${r.scriwo}. ${c.them}: ${r.them}.`), "", `Verdict: ${c.verdict}`, "");
  }
  for (const p of POSTS) {
    out.push(`## ${p.title}`, `URL: ${absolute(`/blog/${p.slug}`)}`, "", p.answer, "");
    for (const s of p.sections) out.push(`### ${s.heading}`, ...s.body, ...(s.list || []).map((l) => `- ${l}`), "");
  }
  out.push("## Locations", ...CITIES.map((c) => `- WhatsApp CRM ${c.name} (${c.region}, ${c.country}): ${c.local} ${absolute(`/whatsapp-crm/${c.slug}`)}`), "");
  out.push("## Contact", `- Contact form: ${absolute("/contact")}`, `- Sales on WhatsApp: ${SITE.whatsappDisplay}`);
  return new Response(out.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
