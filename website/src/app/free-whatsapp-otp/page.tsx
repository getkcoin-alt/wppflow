import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Container, PageHero, SectionTitle, FaqList, CtaBand, Crumbs } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { OtpProofCode, OtpServerCode, OtpWidgetCode } from "@/components/OtpCode";
import { OTP_FAQS, OTP_LIMITS, OTP_REASONS, OTP_STEPS, OTP_USES } from "@/content/otp";
import { faqPage, howTo, speakable } from "@/lib/jsonld";
import { trackAttrs } from "@/lib/analytics";
import { signupUrl } from "@/lib/signup";

export const metadata: Metadata = {
  title: "Free WhatsApp OTP API — Code for Node.js, Python, PHP, Java, cURL",
  description: `Send verification codes on WhatsApp for free: ${OTP_LIMITS.perDay} a day and ${OTP_LIMITS.perMonth.toLocaleString("en-US")} a month on every Scriwo plan, from your own number. Eight ready-made uses, English, Hindi and Arabic, copy-paste code and a no-code widget.`,
  alternates: { canonical: "/free-whatsapp-otp" },
};

export default function FreeOtpPage() {
  const start = signupUrl("free");
  return (
    <>
      <JsonLd data={[faqPage(OTP_FAQS), howTo("How to set up free WhatsApp OTP with Scriwo", OTP_STEPS.map((s) => `${s.title}: ${s.body}`)), speakable("/free-whatsapp-otp", ["[data-speakable]"])]} />
      <Crumbs items={[{ name: "Home", path: "/" }, { name: "Developers", path: "/developers" }, { name: "Free WhatsApp OTP", path: "/free-whatsapp-otp" }]} />
      <PageHero
        eyebrow="Free WhatsApp OTP"
        title={<>Verification codes on WhatsApp, <span className="gold-text">free on every plan.</span></>}
        intro={`Send sign-in, sign-up, payment and delivery codes on WhatsApp from your own number: up to ${OTP_LIMITS.perDay} codes a day and ${OTP_LIMITS.perMonth.toLocaleString("en-US")} a month at no cost. Pick what the code is for, paste a few lines of code, and you are live.`}
      >
        <a href={start} {...trackAttrs("trial_click", { place: "otp-hero" })} className="btn-primary">Get free OTP <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
        <a href="#code" className="btn-ghost">See the code</a>
      </PageHero>

      <Container>
        <p data-speakable className="sr-only">Scriwo's free WhatsApp OTP sends one-time codes from your own linked WhatsApp number, free on every plan up to {OTP_LIMITS.perDay} a day and {OTP_LIMITS.perMonth} a month, with ready code for Node.js, Python, PHP, Java and cURL.</p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [`${OTP_LIMITS.perDay} / day`, `${OTP_LIMITS.perMonth.toLocaleString("en-US")} codes a month, free`],
            ["No per-message fees", "Sent from your own WhatsApp number"],
            ["3 languages", "English, Hindi and Arabic messages"],
            ["Test mode", `A test key sends nothing; the code is always ${OTP_LIMITS.testCode}`],
          ].map(([t, b]) => (
            <li key={t} className="card p-5">
              <p className="font-display text-xl font-bold">{t}</p>
              <p className="mt-1 text-sm text-fg-2">{b}</p>
            </li>
          ))}
        </ul>
      </Container>

      <Container className="mt-24">
        <SectionTitle eyebrow="Step by step" title="Live in five simple steps" />
        <ol className="mt-8 grid gap-4 md:grid-cols-2">
          {OTP_STEPS.map((s, i) => (
            <li key={s.title} className="card flex gap-4 p-6">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 font-display font-bold text-gold">{i + 1}</span>
              <div>
                <h3 className="text-lg">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-2">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>

      <Container className="mt-24">
        <SectionTitle eyebrow="What is the code for?" title="Eight ready-made uses, each set up for you" intro="One tap in the app picks the message, the digits, how long the code works, how many tries are allowed and how long to wait before sending another. You can fine-tune any of them." />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {OTP_USES.map((u) => (
            <article key={u.key} className="card lift p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-xl">{u.title}</h3>
                <code className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-fg-3">{u.key}</code>
              </div>
              <p className="mt-2 text-sm text-fg-2">{u.blurb}</p>
              <dl className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                {[["Digits", String(u.digits)], ["Works for", u.expires], ["Tries", String(u.tries)], ["Resend after", u.resend]].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-surface-2 px-2 py-2"><dt className="text-fg-3">{k}</dt><dd className="mt-0.5 font-semibold text-fg">{v}</dd></div>
                ))}
              </dl>
              <p className="mt-4 whitespace-pre-line rounded-2xl rounded-tl-md bg-bubble-in px-4 py-3 text-sm shadow-card hairline">{u.sample.replace(/\*/g, "")}</p>
            </article>
          ))}
        </div>
      </Container>

      <Container className="mt-24 scroll-mt-24" >
        <div id="code" className="scroll-mt-24" />
        <SectionTitle eyebrow="The code" title="Two calls from your server: send, then verify" intro="Create a secret key in the app (Developers, Free OTP, Connect your site) and replace YOUR_SECRET_KEY. Keep a secret key on your server only, never in a web page or an app." />
        <div className="mt-8"><OtpServerCode /></div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h3 className="text-lg">What the check answers</h3>
            <p className="mt-2 text-sm text-fg-2"><code>&quot;valid&quot;: true</code> means the code was right. Otherwise <code>reason</code> says why:</p>
            <ul className="mt-4 space-y-3 text-sm">
              {OTP_REASONS.map((r) => (
                <li key={r.reason}><code className="rounded bg-surface-2 px-1.5 py-0.5 text-fg">{r.reason}</code> <span className="text-fg-2">{r.meaning}</span></li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="text-lg">Built-in protection</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-fg-2">
              {[
                `At most ${OTP_LIMITS.perPhoneIn10Min} codes to one number in 10 minutes, and ${OTP_LIMITS.perPhonePerDay} a day.`,
                "Each code expires, has limited tries and works once.",
                "Codes are stored only as one-way hashes, never in plain text.",
                "Fixed message wording: only your company name and the code change, so it cannot carry links or offers.",
                "Sending is paced so a burst cannot get your number restricted.",
              ].map((t) => <li key={t} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />{t}</li>)}
            </ul>
          </div>
        </div>
      </Container>

      <Container className="mt-24">
        <SectionTitle eyebrow="No server?" title="Add the ready-made widget to any web page" intro="One script gives your visitors a box to verify their phone. Create a widget key in the app and list your websites: a widget key is safe in a page and only works on those sites." />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div><h3 className="mb-3 text-lg">1. Paste this in your page</h3><OtpWidgetCode /></div>
          <div><h3 className="mb-3 text-lg">2. Check the proof on your server</h3><OtpProofCode /><p className="mt-3 text-sm text-fg-2">The widget hands your page a proof. Send it with your form and ask Scriwo if it is real. A proof works once, for {OTP_LIMITS.proofMinutes} minutes.</p></div>
        </div>
      </Container>

      <Container className="mt-24">
        <SectionTitle eyebrow="Questions" title="Free WhatsApp OTP: FAQ" />
        <div className="mt-8"><FaqList faqs={OTP_FAQS} /></div>
        <p className="mt-6 text-sm text-fg-3">Want webhooks, API keys and SDK samples for the rest of Scriwo? See <Link href="/developers" className="underline">Developers</Link>.</p>
      </Container>

      <CtaBand title="Start sending free WhatsApp OTP today" body={`Create a free account, link your number and send your first code in minutes. ${OTP_LIMITS.perDay} codes a day, free, on every plan.`} cta={{ href: start, label: "Get free OTP" }} />
    </>
  );
}
