"use client";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { COUNTRIES, INTERESTS, TEAM_SIZES, validateContact, type ContactInput } from "@/lib/contact";

const empty: ContactInput = { name: "", email: "", phone: "", company: "", country: "", teamSize: "", interest: "demo", message: "" };
const field = "mt-1.5 w-full rounded-xl bg-surface-2 px-4 py-3 text-[15px] hairline placeholder:text-fg-3 focus:bg-surface";

export function ContactForm() {
  const [values, setValues] = useState(empty);
  const [plan, setPlan] = useState("");
  const [errors, setErrors] = useState<ReturnType<typeof validateContact>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [serverMessage, setServerMessage] = useState("");

  // Pre-fill from links such as /contact?interest=growth&plan=Growth, without making the page dynamic.
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const q = new URLSearchParams(window.location.search);
    const interest = q.get("interest");
    if (interest && INTERESTS.some((i) => i.value === interest)) setValues((v) => ({ ...v, interest }));
    setPlan(q.get("plan")?.slice(0, 40) || "");
    const guess = zone === "Asia/Dubai" ? "United Arab Emirates" : zone === "Asia/Kolkata" || zone === "Asia/Calcutta" ? "India" : "";
    if (guess) setValues((v) => ({ ...v, country: v.country || guess }));
  }, []);

  const set = (k: keyof ContactInput) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found = validateContact(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setState("sending");
    setServerMessage("");
    const honeypot = (new FormData(e.currentTarget).get("website") as string) || "";
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, plan, website: honeypot, sourcePage: sourcePage() }),
      });
      if (res.ok) {
        setState("sent");
        return;
      }
      const body = await res.json().catch(() => null);
      setServerMessage(body?.message || "We could not send your message. Please try again in a moment.");
      setState("failed");
    } catch {
      setServerMessage("You appear to be offline. Check your connection and try again.");
      setState("failed");
    }
  }

  if (state === "sent")
    return (
      <div className="card p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto h-12 w-12 text-ok" aria-hidden="true" />
        <h2 className="mt-4 text-2xl">Thank you, {values.name.split(" ")[0]}.</h2>
        <p className="mt-3 text-fg-2">Your message reached our team. A real person will reply within one business day, UAE and India hours.</p>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="card space-y-5 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" error={errors.name} required>
          <input name="name" autoComplete="name" className={field} value={values.name} onChange={set("name")} aria-invalid={!!errors.name} />
        </Field>
        <Field label="Work email" error={errors.email} required>
          <input name="email" type="email" autoComplete="email" className={field} value={values.email} onChange={set("email")} aria-invalid={!!errors.email} />
        </Field>
        <Field label="WhatsApp or phone, with country code" error={errors.phone}>
          <input name="phone" type="tel" autoComplete="tel" placeholder="+971 50 123 4567" className={field} value={values.phone} onChange={set("phone")} aria-invalid={!!errors.phone} />
        </Field>
        <Field label="Company">
          <input name="company" autoComplete="organization" className={field} value={values.company} onChange={set("company")} />
        </Field>
        <Field label="Country">
          <select name="country" className={field} value={values.country} onChange={set("country")}>
            <option value="">Choose…</option>
            {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="People who answer WhatsApp">
          <select name="teamSize" className={field} value={values.teamSize} onChange={set("teamSize")}>
            <option value="">Choose…</option>
            {TEAM_SIZES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <Field label="What can we help with?">
        <select name="interest" className={field} value={values.interest} onChange={set("interest")}>
          {INTERESTS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
        </select>
      </Field>
      <Field label="Message" error={errors.message}>
        <textarea name="message" rows={4} className={field} placeholder="For example: 12 sales agents in Dubai, each on their own number." value={values.message} onChange={set("message")} />
      </Field>
      {/* Hidden from people; bots fill it in and are ignored. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {state === "failed" && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{serverMessage}</p>}
      <button type="submit" disabled={state === "sending"} className="btn-primary w-full disabled:opacity-70">
        {state === "sending" ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending…</> : "Send message"}
      </button>
      <p className="text-center text-xs text-fg-3">We use these details only to reply to you. See our <a href="/privacy" className="underline">privacy notice</a>.</p>
    </form>
  );
}

// The page that sent the visitor here, when it was a page on this site.
function sourcePage() {
  try {
    const from = new URL(document.referrer);
    if (from.origin === window.location.origin) return from.pathname;
  } catch {}
  return "/contact";
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {required && <span className="text-danger" aria-hidden="true"> *</span>}
      {children}
      {error && <span className="mt-1.5 block text-xs font-normal text-danger">{error}</span>}
    </label>
  );
}
