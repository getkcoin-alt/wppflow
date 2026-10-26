"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { track } from "@/lib/analytics";
import {
  CheckoutError,
  createOrder,
  emptyValues,
  getQuote,
  loadRazorpay,
  orderBody,
  priceOf,
  rupees,
  validateCheckout,
  verifyPayment,
  type CheckoutOptions,
  type CheckoutValues,
  type Interval,
  type Quote,
} from "@/lib/checkout";
import { SITE } from "@/lib/site";

const field = "mt-1.5 w-full rounded-xl bg-surface-2 px-4 py-3 text-[15px] hairline placeholder:text-fg-3 focus:bg-surface";

export function CheckoutForm({ options }: { options: CheckoutOptions }) {
  const first = options.plans.find((p) => p.id === "growth") || options.plans[0];
  const [planId, setPlanId] = useState(first?.id || "");
  const [interval, setInterval] = useState<Interval>("monthly");
  const [values, setValues] = useState<CheckoutValues>(emptyValues);
  const [errors, setErrors] = useState<ReturnType<typeof validateCheckout>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; account?: boolean } | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  // /checkout?plan=growth&interval=yearly picks the plan, without making the page dynamic.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const wanted = q.get("plan");
    if (wanted && options.plans.some((p) => p.id === wanted)) setPlanId(wanted);
    const i = q.get("interval");
    if (i === "yearly" || i === "annual") setInterval("annual");
  }, [options.plans]);

  const plan = options.plans.find((p) => p.id === planId);
  const base = priceOf(plan, interval);
  // Editing a field takes its message away, so what is left on the screen is only what still needs fixing.
  const forget = (k: keyof CheckoutValues) => setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  const set = (k: keyof CheckoutValues) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    forget(k);
  };

  // The exact price, with the tax split, once the state is known: asked of the server, not worked out here.
  useEffect(() => {
    setQuote(null);
    setQuoteError("");
    if (!plan || !values.stateCode) return;
    let current = true;
    getQuote(plan.id, interval, values.stateCode)
      .then((q) => current && setQuote(q))
      .catch((e) => current && setQuoteError(e.message));
    return () => {
      current = false;
    };
  }, [plan, interval, values.stateCode]);

  const gotoSuccess = (order: string, token: string) => window.location.assign(`/checkout/success?order=${encodeURIComponent(order)}&token=${encodeURIComponent(token)}`);

  async function pay(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!plan || busy) return;
    const found = validateCheckout(values);
    setErrors(found);
    setMessage(null);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const order = await createOrder(orderBody(values, plan.id, interval, honeypot.current?.value || ""));
      track("checkout_start", { plan: plan.id, interval, total: order.checkout.amount / 100 });
      const Razorpay = await loadRazorpay();
      const c = order.checkout;
      const rzp = new Razorpay({
        key: c.key,
        order_id: c.orderId,
        amount: c.amount,
        currency: c.currency,
        name: c.name,
        description: c.description,
        prefill: c.prefill,
        theme: { color: "#0f6b4f" },
        // The payment is confirmed by our server asking Razorpay, not by this browser saying so. If asking fails here
        // (a dropped connection), the success page keeps checking: the webhook completes it either way.
        handler: async (result) => {
          setMessage({ text: "Payment received. Setting up your workspace…" });
          try {
            await verifyPayment(result);
            track("checkout_paid", { plan: plan.id, interval });
          } catch {
            // the success page asks the server what happened
          }
          gotoSuccess(order.orderRef, order.statusToken);
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setMessage({ text: "You closed the payment window. You have not been charged. Press Pay when you are ready." });
          },
        },
      });
      rzp.on("payment.failed", (r) => setMessage({ text: `${r.error?.description || "The payment did not go through"}. You can try again.` }));
      rzp.open();
    } catch (err) {
      setBusy(false);
      const code = err instanceof CheckoutError ? err.code : "";
      setMessage({ text: err instanceof Error ? err.message : "Something went wrong. Please try again.", account: code === "account_exists" });
    }
  }

  if (!plan) return null;

  return (
    <form onSubmit={pay} noValidate className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-8">
        <fieldset>
          <legend className="text-lg font-semibold">1. Choose your plan</legend>
          <div role="radiogroup" aria-label="Plan" className="mt-3 grid gap-3 sm:grid-cols-3">
            {options.plans.map((p) => {
              const price = priceOf(p, interval);
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={p.id === planId}
                  onClick={() => setPlanId(p.id)}
                  className={`rounded-2xl p-4 text-left hairline transition ${p.id === planId ? "bg-surface ring-2 ring-gold/70" : "bg-surface-2 hover:bg-surface"}`}
                >
                  <span className="block font-semibold">{p.name}</span>
                  <span className="mt-1 block text-sm text-fg-2">{p.numbers ? `Up to ${p.numbers} numbers` : "Custom numbers"}</span>
                  <span className="mt-3 block text-lg font-semibold">{price === null ? "Custom" : rupees(price)}<span className="text-sm font-normal text-fg-3"> / {interval === "annual" ? "year" : "month"}</span></span>
                </button>
              );
            })}
          </div>
          <div role="radiogroup" aria-label="Billing period" className="mt-4 inline-flex rounded-full bg-surface p-1 hairline">
            {(["monthly", "annual"] as const).map((i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={interval === i}
                onClick={() => setInterval(i)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${interval === i ? "bg-brand-solid text-white" : "text-fg-2 hover:text-fg"}`}
              >
                {i === "monthly" ? "Monthly" : "Yearly · 2 months free"}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="text-lg font-semibold">2. Your company and you</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Company name" error={errors.companyName} required>
              <input name="companyName" autoComplete="organization" className={field} value={values.companyName} onChange={set("companyName")} aria-invalid={!!errors.companyName} />
            </Field>
            <Field label="Your name" error={errors.ownerName} required>
              <input name="ownerName" autoComplete="name" className={field} value={values.ownerName} onChange={set("ownerName")} aria-invalid={!!errors.ownerName} />
            </Field>
            <Field label="Work email" error={errors.ownerEmail} required hint="We send your sign-in link and invoice here.">
              <input name="ownerEmail" type="email" autoComplete="email" className={field} value={values.ownerEmail} onChange={set("ownerEmail")} aria-invalid={!!errors.ownerEmail} />
            </Field>
            <Field label="WhatsApp or phone, with country code" error={errors.phone}>
              <input name="phone" type="tel" autoComplete="tel" placeholder="+91 98100 00000" className={field} value={values.phone} onChange={set("phone")} aria-invalid={!!errors.phone} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="text-lg font-semibold">3. Details for your GST invoice</legend>
          <Field label="Legal name on the invoice" hint="Leave blank to use the company name.">
            <input name="legalName" className={field} value={values.legalName} onChange={set("legalName")} />
          </Field>
          <Field label="Address" error={errors.addressLine1} required>
            <input name="addressLine1" autoComplete="street-address" className={field} value={values.addressLine1} onChange={set("addressLine1")} aria-invalid={!!errors.addressLine1} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="City" error={errors.city} required>
              <input name="city" autoComplete="address-level2" className={field} value={values.city} onChange={set("city")} aria-invalid={!!errors.city} />
            </Field>
            <Field label="State" error={errors.stateCode} required>
              <select name="stateCode" className={field} value={values.stateCode} onChange={set("stateCode")} aria-invalid={!!errors.stateCode}>
                <option value="">Choose…</option>
                {options.states.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="PIN code" error={errors.postalCode} required>
              <input name="postalCode" inputMode="numeric" autoComplete="postal-code" maxLength={6} className={field} value={values.postalCode} onChange={set("postalCode")} aria-invalid={!!errors.postalCode} />
            </Field>
          </div>
          <Field label="GSTIN (optional)" error={errors.gstin} hint="Add it if your company is GST registered, so you can claim input credit.">
            <input name="gstin" maxLength={15} autoCapitalize="characters" className={field} value={values.gstin} onChange={(e) => {
              setValues((v) => ({ ...v, gstin: e.target.value.toUpperCase() }));
              forget("gstin");
            }} aria-invalid={!!errors.gstin} />
          </Field>
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card space-y-4 p-6" aria-live="polite">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <p className="text-sm text-fg-2">{plan.name} plan, {interval === "annual" ? "paid yearly" : "paid monthly"}</p>
          <dl className="space-y-2 text-sm">
            {quote ? (
              <>
                <Row label={quote.taxMode === "inclusive" ? "Price (GST included)" : "Price"} value={rupees(quote.taxMode === "inclusive" ? quote.totalMinor : quote.baseMinor)} />
                {quote.taxMode === "inclusive" && <Row label={`Of which ${quote.gstRate}% GST`} value={rupees(quote.taxMinor)} muted />}
                {quote.taxMode === "exclusive" && quote.intraState && (
                  <>
                    <Row label={`CGST ${quote.gstRate / 2}%`} value={rupees(quote.cgstMinor)} muted />
                    <Row label={`SGST ${quote.gstRate / 2}%`} value={rupees(quote.sgstMinor)} muted />
                  </>
                )}
                {quote.taxMode === "exclusive" && !quote.intraState && <Row label={`IGST ${quote.gstRate}%`} value={rupees(quote.igstMinor)} muted />}
                <div className="border-t border-line pt-3"><Row label="Total today" value={rupees(quote.totalMinor)} strong /></div>
              </>
            ) : (
              <>
                <Row label="Price" value={base === null ? "Custom" : rupees(base)} />
                <Row label={`GST ${options.gstRate}%`} value={values.stateCode ? "…" : "Choose your state"} muted />
              </>
            )}
          </dl>
          {quoteError && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">{quoteError}</p>}

          {/* Hidden from people; bots fill it in and are ignored. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>Website<input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" /></label>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={values.acceptedTerms} onChange={(e) => {
                setValues((v) => ({ ...v, acceptedTerms: e.target.checked }));
                forget("acceptedTerms");
              }} aria-invalid={!!errors.acceptedTerms} />
            <span>I agree to the <Link href="/terms" target="_blank" className="underline">Terms of Service</Link> and the <Link href="/refund-policy" target="_blank" className="underline">Refund policy</Link>.</span>
          </label>
          {errors.acceptedTerms && <p className="text-xs text-danger">{errors.acceptedTerms}</p>}

          {message && (
            <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
              {message.text}
              {message.account && <> <a href={SITE.appUrl} className="underline">Sign in</a>.</>}
            </p>
          )}
          <button type="submit" disabled={busy || !quote} className="btn-primary w-full disabled:opacity-60">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Opening payment…</> : <><Lock className="h-4 w-4" aria-hidden="true" /> {quote ? `Pay ${rupees(quote.totalMinor)}` : "Choose your state to see the total"}</>}
          </button>
          <p className="flex items-start gap-2 text-xs text-fg-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />Paid securely through Razorpay by card, UPI or net banking. We never see your card details. Your workspace is created as soon as the payment is confirmed.</p>
        </div>
        <p className="mt-4 text-center text-sm text-fg-3">Paying in AED or want to talk first? <Link href={`/contact?interest=${plan.id}`} className="underline">Message our team</Link>.</p>
      </aside>
    </form>
  );
}

function Row({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={muted ? "text-fg-3" : strong ? "font-semibold" : "text-fg-2"}>{label}</dt>
      <dd className={strong ? "text-lg font-semibold" : muted ? "text-fg-3" : ""}>{value}</dd>
    </div>
  );
}

function Field({ label, error, required, hint, children }: { label: string; error?: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {required && <span className="text-danger" aria-hidden="true"> *</span>}
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs font-normal text-fg-3">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs font-normal text-danger">{error}</span>}
    </label>
  );
}
