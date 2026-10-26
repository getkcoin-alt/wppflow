import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Field, Notice, Pill, Segmented } from "../ui/Page";
import { btn, inputCls, selectCls, textareaCls } from "../ui/styles";
import {
  fetchBillingSettings,
  fetchPlanChanges,
  listPlans,
  saveBillingSettings,
  updatePlan,
  type BillingSettings,
  type BillingSettingsPatch,
  type ChangeLine,
  type PlanChoice,
  type PlanPrice,
} from "../../services/api";
import { formatMinor, gstSplit } from "../../utils/money";

type Tab = "rates" | "services" | "invoice" | "history";
const TABS: { key: Tab; label: string }[] = [
  { key: "rates", label: "Rates" },
  { key: "services", label: "Services & limits" },
  { key: "invoice", label: "Invoice & tax" },
  { key: "history", label: "Change history" },
];
const INTERVALS = [
  ["monthly", "Monthly"],
  ["annual", "Yearly"],
] as const;
const CURRENCIES = ["INR", "AED"] as const;
const major = (p: PlanPrice | undefined) => (p ? String(p.amountMinor / 100) : "");
const limit = (v: number | null | undefined) => (v == null ? "" : String(v));
// A blank box means "no limit". A number box holding text it cannot read (a stray "e") also reports itself as blank,
// so the box itself is asked: a typing slip is never saved as "no limit".
const limitValue = (v: string) => (v.trim() === "" ? null : Number(v));
const hasUnreadableNumber = (root: HTMLElement | null) => Array.from(root?.querySelectorAll("input") ?? []).some((i) => i.validity.badInput);
const when = (iso: string) => new Date(iso).toLocaleString("en", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

// After a plan changes, everything that shows plans or what a company may do has to look again.
const refreshPlans = (qc: ReturnType<typeof useQueryClient>) =>
  Promise.all(["plans", "public-plans", "companies", "plan-changes"].map((key) => qc.invalidateQueries({ queryKey: [key] })));

function Saved({ children }: { children: string }) {
  return (
    <span role="status" className="text-[13px] text-ok">
      {children}
    </span>
  );
}

// ── Rates: the price of each plan, whether tax is added to it, and whether it can be bought ──────────────────
function RatesCard({ plan, gstRate }: { plan: PlanChoice; gstRate: number }) {
  const qc = useQueryClient();
  const initial = () => ({
    isActive: plan.isActive,
    taxMode: plan.taxMode,
    prices: Object.fromEntries(
      INTERVALS.flatMap(([i]) => CURRENCIES.map((c) => [`${i}:${c}`, major(plan.prices.find((p) => p.interval === i && p.currency === c))])),
    ) as Record<string, string>,
  });
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  useEffect(() => setForm(initial()), [plan]); // eslint-disable-line react-hooks/exhaustive-deps
  const free = plan.id === "free";
  const save = async () => {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await updatePlan(plan.id, {
        isActive: form.isActive,
        taxMode: form.taxMode,
        prices: INTERVALS.flatMap(([interval]) =>
          CURRENCIES.flatMap((currency) => {
            const value = form.prices[`${interval}:${currency}`].trim();
            if (value === "") return [];
            const amount = Number(value);
            if (!Number.isFinite(amount) || amount < 0) throw new Error(`The ${interval === "annual" ? "yearly" : "monthly"} ${currency} price must be a number.`);
            return [{ interval, currency, amountMinor: Math.round(amount * 100) }];
          }),
        ),
      });
      await refreshPlans(qc);
      setSaved(true);
    } catch (e: any) {
      setError(e.message || "Could not save the rates.");
    } finally {
      setBusy(false);
    }
  };
  const inr = (interval: "monthly" | "annual") => {
    const v = form.prices[`${interval}:INR`]?.trim();
    return v && Number.isFinite(Number(v)) && Number(v) > 0 ? Math.round(Number(v) * 100) : null;
  };
  const monthly = inr("monthly"),
    yearly = inr("annual");
  const months = monthly && yearly ? Math.round((yearly / monthly) * 10) / 10 : null;
  return (
    <section className="card p-5" aria-label={`${plan.name} rates`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[16px] font-semibold flex items-center gap-2">
          {plan.name}
          {!plan.isActive && <Pill tone="warn">Off sale</Pill>}
        </h3>
        {!free && (
          <label className="flex items-center gap-2 text-[13.5px] text-fg-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} aria-label={`${plan.name} is for sale`} />
            For sale
          </label>
        )}
      </div>
      {free ? (
        <p className="mt-3 text-[14px] text-fg-2">The Free plan has no price and is always available.</p>
      ) : (
        <>
          <p className="mt-3 text-[13px] text-fg-2">Leave a price blank for a custom quote. Prices are in rupees and dirhams.</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-4">
            {INTERVALS.flatMap(([interval, label]) =>
              CURRENCIES.map((currency) => (
                <Field key={`${interval}:${currency}`} label={`${label} ${currency}`}>
                  <input
                    aria-label={`${plan.id} ${interval} ${currency}`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.prices[`${interval}:${currency}`]}
                    onChange={(e) => setForm({ ...form, prices: { ...form.prices, [`${interval}:${currency}`]: e.target.value } })}
                    className={inputCls}
                  />
                </Field>
              )),
            )}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Tax on rupee prices" hint="Dirham prices carry no GST.">
              <select
                aria-label={`${plan.id} tax`}
                value={form.taxMode}
                onChange={(e) => setForm({ ...form, taxMode: e.target.value as "exclusive" | "inclusive" })}
                className={selectCls}
              >
                <option value="exclusive">GST is added to the price</option>
                <option value="inclusive">The price already includes GST</option>
              </select>
            </Field>
            <div className="rounded-2xl bg-surface-2 px-4 py-3 text-[13.5px]" data-testid={`${plan.id}-preview`}>
              <p className="text-fg-3 text-[12.5px] mb-1">What a customer pays at {gstRate}% GST</p>
              {monthly === null && yearly === null && <p className="text-fg-2">No rupee price set.</p>}
              {([
                ["a month", monthly],
                ["a year", yearly],
              ] as const).map(([word, amount]) =>
                amount === null ? null : (
                  <p key={word} className="num">
                    {formatMinor(gstSplit(amount, form.taxMode, gstRate).total, "INR")} {word}
                    <span className="text-fg-3">
                      {form.taxMode === "exclusive"
                        ? ` (${formatMinor(amount, "INR")} + ${formatMinor(gstSplit(amount, "exclusive", gstRate).tax, "INR")} GST)`
                        : ` (includes ${formatMinor(gstSplit(amount, "inclusive", gstRate).tax, "INR")} GST)`}
                    </span>
                  </p>
                ),
              )}
              {months !== null && <p className="mt-1 text-[12.5px] text-fg-3">Yearly is {months} months of the monthly price.</p>}
            </div>
          </div>
        </>
      )}
      {error && (
        <div className="mt-3">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {!free && (
        <div className="mt-4 flex items-center gap-3">
          <button type="button" disabled={busy} className={btn("primary", "sm")} onClick={() => void save()} aria-label={`Save ${plan.name} rates`}>
            Save {plan.name} rates
          </button>
          {saved && <Saved>Saved. It applies to every new order now. Plans already paid for keep running to the end of their period.</Saved>}
        </div>
      )}
    </section>
  );
}

// ── Services & limits: what each plan includes ──────────────────────────────────────────────────────────────
function ServicesCard({ plan }: { plan: PlanChoice }) {
  const qc = useQueryClient();
  const initial = () => ({
    name: plan.name,
    numbers: limit(plan.numbers),
    seats: limit(plan.seats),
    maxContacts: limit(plan.maxContacts),
    maxBroadcasts: limit(plan.maxBroadcasts),
    features: plan.features.filter((f) => f.included).map((f) => f.key),
  });
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const card = useRef<HTMLElement>(null);
  useEffect(() => setForm(initial()), [plan]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async () => {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      if (hasUnreadableNumber(card.current)) throw new Error("A limit must be a number, or blank for no limit.");
      await updatePlan(plan.id, {
        name: form.name,
        numbers: limitValue(form.numbers),
        seats: limitValue(form.seats),
        maxContacts: limitValue(form.maxContacts),
        maxBroadcasts: limitValue(form.maxBroadcasts),
        features: form.features,
      });
      await refreshPlans(qc);
      setSaved(true);
    } catch (e: any) {
      setError(e.message || "Could not save the plan.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section ref={card} className="card p-5" aria-label={`${plan.name} plan`}>
      <h3 className="text-[16px] font-semibold flex items-center gap-2">
        {plan.name}
        {!plan.isActive && <Pill tone="warn">Off sale</Pill>}
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Field label="Name">
          <input aria-label={`${plan.id} name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </Field>
        <Field label="WhatsApp numbers" hint="Blank: agreed per company.">
          <input aria-label={`${plan.id} numbers`} type="number" min={1} max={500} value={form.numbers} onChange={(e) => setForm({ ...form, numbers: e.target.value })} className={inputCls} />
        </Field>
        <Field label="People" hint="Blank: no limit.">
          <input aria-label={`${plan.id} people`} type="number" min={1} max={1000} value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Contacts" hint="Blank: no limit. Customers who write in are never turned away.">
          <input aria-label={`${plan.id} contacts`} type="number" min={1} max={100000000} value={form.maxContacts} onChange={(e) => setForm({ ...form, maxContacts: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Broadcasts a month" hint="Blank: no limit. Counted when one is first started.">
          <input aria-label={`${plan.id} broadcasts a month`} type="number" min={1} max={100000} value={form.maxBroadcasts} onChange={(e) => setForm({ ...form, maxBroadcasts: e.target.value })} className={inputCls} />
        </Field>
      </div>
      <fieldset className="mt-4">
        <legend className="text-[13px] text-fg-2 mb-1.5">Includes</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {plan.features.map((f) => (
            <label key={f.key} className="flex items-center gap-2 text-[13.5px]">
              <input
                type="checkbox"
                checked={form.features.includes(f.key)}
                onChange={(e) => setForm({ ...form, features: e.target.checked ? [...form.features, f.key] : form.features.filter((k) => k !== f.key) })}
                aria-label={`${plan.id} includes ${f.label}`}
              />
              {f.label.replace(/^The /, "")}
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <div className="mt-3">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <div className="mt-4 flex items-center gap-3">
        <button type="button" disabled={busy} className={btn("primary", "sm")} onClick={() => void save()} aria-label={`Save ${plan.name}`}>
          Save {plan.name}
        </button>
        {saved && <Saved>Saved. It applies to every company on this plan now. Nothing a company already has is deleted.</Saved>}
      </div>
    </section>
  );
}

// ── Invoice & tax: who sells, the service code, the GST rate and the invoice number ─────────────────────────
const settingsForm = (s: BillingSettings) => ({
  sacCode: s.sacCode,
  gstRate: String(s.gstRate),
  invoicePrefix: s.invoicePrefix,
  prorateUpgrades: s.prorateUpgrades,
  legalName: s.seller.legalName,
  tradeName: s.seller.tradeName,
  gstin: s.seller.gstin,
  addressLines: s.seller.addressLines.join("\n"),
  city: s.seller.city,
  postalCode: s.seller.postalCode,
  email: s.seller.email,
});

// The changes that alter how every later invoice is worked out or printed. They are confirmed before they are saved.
const weighty = (s: BillingSettings, f: ReturnType<typeof settingsForm>) => {
  const out: string[] = [];
  if (f.sacCode.trim() !== s.sacCode) out.push(`the service code from ${s.sacCode} to ${f.sacCode.trim() || "blank"}`);
  if (Number(f.gstRate) !== s.gstRate) out.push(`the GST rate from ${s.gstRate}% to ${f.gstRate}%`);
  if (f.gstin.trim().toUpperCase() !== s.seller.gstin) out.push(`the GSTIN from ${s.seller.gstin} to ${f.gstin.trim().toUpperCase() || "blank"}`);
  if (f.invoicePrefix.trim().toUpperCase() !== s.invoicePrefix) out.push(`the invoice prefix from ${s.invoicePrefix} to ${f.invoicePrefix.trim().toUpperCase() || "blank"}`);
  return out;
};

function InvoiceTax({ settings }: { settings: BillingSettings }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(() => settingsForm(settings));
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [confirming, setConfirming] = useState<string[] | null>(null);
  useEffect(() => setForm(settingsForm(settings)), [settings]);
  const set = (patch: Partial<typeof form>) => {
    setForm({ ...form, ...patch });
    setConfirming(null);
  };
  const doSave = async () => {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const patch: BillingSettingsPatch = {
        sacCode: form.sacCode.trim(),
        gstRate: Number(form.gstRate),
        invoicePrefix: form.invoicePrefix.trim(),
        prorateUpgrades: form.prorateUpgrades,
        seller: {
          legalName: form.legalName,
          tradeName: form.tradeName,
          gstin: form.gstin,
          addressLines: form.addressLines.split("\n").map((l) => l.trim()).filter(Boolean),
          city: form.city,
          postalCode: form.postalCode,
          email: form.email,
        },
      };
      const reply = await saveBillingSettings(patch);
      qc.setQueryData(["billing-settings"], reply);
      await qc.invalidateQueries({ queryKey: ["plan-changes"] });
      setConfirming(null);
      setSaved(true);
    } catch (e: any) {
      setError(e.message || "Could not save the invoice settings.");
      setConfirming(null);
    } finally {
      setBusy(false);
    }
  };
  const submit = () => {
    setSaved(false);
    const heavy = weighty(settings, form);
    if (heavy.length && !confirming) setConfirming(heavy);
    else void doSave();
  };
  const sample = `${form.invoicePrefix.trim().toUpperCase() || "---"}${settings.nextInvoiceExample.slice(settings.invoicePrefix.length)}`;
  return (
    <section className="space-y-4" aria-label="Invoice and tax settings">
      <div className="card p-5">
        <h3 className="text-[16px] font-semibold">Tax on invoices</h3>
        <p className="mt-1 text-[13.5px] text-fg-2">
          New invoices use these straight away. An invoice that has already been issued is never changed: it keeps the code, the rate and the seller details it was issued with.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Service code (SAC)" hint="Six digits starting 99. Your accountant confirms which one applies.">
            <input aria-label="Service code (SAC)" inputMode="numeric" maxLength={6} value={form.sacCode} onChange={(e) => set({ sacCode: e.target.value })} className={inputCls} />
          </Field>
          <Field label="GST rate (%)" hint="A whole number. Software services are usually 18.">
            <input aria-label="GST rate" type="number" min={0} max={28} step={1} value={form.gstRate} onChange={(e) => set({ gstRate: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Invoice prefix" hint="One to three letters or digits.">
            <input aria-label="Invoice prefix" maxLength={3} value={form.invoicePrefix} onChange={(e) => set({ invoicePrefix: e.target.value.toUpperCase() })} className={inputCls} />
          </Field>
        </div>
        <p className="mt-3 text-[13px] text-fg-2" data-testid="invoice-example">
          Invoice numbers look like <span className="font-medium text-fg num">{sample}</span> ({sample.length} of the {settings.invoiceNumberLimit} characters the law allows). The count starts again each April and carries on when the prefix changes.
        </p>
        <label className="mt-3 flex items-center gap-2 text-[13.5px]">
          <input type="checkbox" checked={form.prorateUpgrades} onChange={(e) => set({ prorateUpgrades: e.target.checked })} aria-label="Credit unused days on an upgrade" />
          Credit the unused days when a company upgrades part-way through a period
        </label>
      </div>

      <div className="card p-5">
        <h3 className="text-[16px] font-semibold">Who sells</h3>
        <p className="mt-1 text-[13.5px] text-fg-2">Printed on every invoice. Copy these from the GST registration certificate.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Legal name">
            <input aria-label="Legal name" value={form.legalName} onChange={(e) => set({ legalName: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Trade name" hint="Optional.">
            <input aria-label="Trade name" value={form.tradeName} onChange={(e) => set({ tradeName: e.target.value })} className={inputCls} />
          </Field>
          <Field label="GSTIN" hint={`State: ${settings.seller.state} (${settings.seller.stateCode}), read from the first two digits. It decides CGST and SGST or IGST.`}>
            <input aria-label="GSTIN" maxLength={15} value={form.gstin} onChange={(e) => set({ gstin: e.target.value.toUpperCase() })} className={inputCls} />
          </Field>
          <Field label="Billing email" hint="Shown on invoices for questions about them.">
            <input aria-label="Billing email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address" hint="One to three lines.">
              <textarea aria-label="Address" rows={3} value={form.addressLines} onChange={(e) => set({ addressLines: e.target.value })} className={textareaCls} />
            </Field>
          </div>
          <Field label="City">
            <input aria-label="City" value={form.city} onChange={(e) => set({ city: e.target.value })} className={inputCls} />
          </Field>
          <Field label="PIN code">
            <input aria-label="PIN code" inputMode="numeric" maxLength={6} value={form.postalCode} onChange={(e) => set({ postalCode: e.target.value })} className={inputCls} />
          </Field>
        </div>
      </div>

      <details className="card p-5 text-[13.5px] text-fg-2">
        <summary className="cursor-pointer text-[14px] font-medium text-fg">Where do I get the service code and the invoice fields?</summary>
        <div className="mt-3 space-y-2">
          <p>
            <span className="font-medium text-fg">Service code (SAC).</span> There is no single code the law fixes for software sold online. Accountants commonly choose 998314 (hosting and IT infrastructure provisioning), 998315 or 997331 (the right to use software), depending on how the service is supplied. Your chartered accountant decides; the code you declared when you registered for GST is listed under Goods and Services in your GST portal profile.
          </p>
          <p>
            <span className="font-medium text-fg">Seller details and GSTIN.</span> Copy them from the GST registration certificate (Form GST REG-06) or your GST portal profile.
          </p>
          <p>
            <span className="font-medium text-fg">What an invoice must show.</span> Rule 46 of the CGST Rules lists it: seller name, address and GSTIN, an invoice number of at most 16 characters that is unique in the financial year, the date, the buyer&apos;s details, the service code, the taxable value, the tax split into CGST and SGST or IGST, the place of supply, and whether tax is payable on reverse charge. Each invoice here carries all of these.
          </p>
        </div>
      </details>

      {error && <Notice tone="error">{error}</Notice>}
      {confirming && (
        <div role="alertdialog" aria-label="Confirm tax change" className="rounded-2xl bg-warn/10 px-4 py-3 text-[14px] text-fg">
          <p className="font-medium">Check before saving</p>
          <p className="mt-1">
            This changes {confirming.join(", and ")}. Every new invoice uses it. Invoices already issued keep what they were issued with.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button type="button" disabled={busy} className={btn("primary", "sm")} onClick={() => void doSave()}>
              Confirm and save
            </button>
            <button type="button" className={btn("ghost", "sm")} onClick={() => setConfirming(null)}>
              Keep editing
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button type="button" disabled={busy || confirming !== null} className={btn("primary")} onClick={submit}>
          Save invoice &amp; tax settings
        </button>
        {saved && <Saved>Saved. New invoices use these now.</Saved>}
      </div>
    </section>
  );
}

// ── Change history: who changed a plan or the invoice settings, when, and from what to what ────────────────
function ChangeLines({ lines }: { lines: ChangeLine[] }) {
  return (
    <ul className="mt-1.5 space-y-0.5 text-[13.5px] text-fg-2">
      {lines.map((c, i) => (
        <li key={i}>
          <span className="text-fg">{c.field}:</span> {c.from || "blank"} <span aria-hidden>→</span>
          <span className="sr-only"> changed to </span> {c.to || "blank"}
        </li>
      ))}
    </ul>
  );
}

function History() {
  const plans = useQuery({ queryKey: ["plan-changes"], queryFn: fetchPlanChanges });
  const settings = useQuery({ queryKey: ["billing-settings"], queryFn: fetchBillingSettings });
  const rows = [
    ...(plans.data || []).map((c) => ({ key: `p${c.id}`, at: c.at, actor: c.actor, what: `${c.name} plan`, changes: c.changes })),
    ...(settings.data?.history || []).map((c) => ({ key: `s${c.id}`, at: c.at, actor: c.actor, what: "Invoice & tax settings", changes: c.changes })),
  ]
    .filter((r) => r.changes.length > 0)
    .sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const failed = (plans.error || settings.error) as Error | null;
  return (
    <section className="space-y-3" aria-label="Change history">
      {failed && <Notice tone="error">{failed.message}</Notice>}
      {!failed && !plans.isPending && !settings.isPending && rows.length === 0 && (
        <p className="text-[14.5px] text-fg-2">Nothing has been changed yet. Every change to a plan or to the invoice settings is listed here.</p>
      )}
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.key} className="card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[14.5px] font-medium">{r.what}</p>
              <p className="text-[12.5px] text-fg-3">
                {r.actor || "The platform"} · {when(r.at)}
              </p>
            </div>
            <ChangeLines lines={r.changes} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SubscriptionsModule() {
  const [tab, setTab] = useState<Tab>("rates");
  const plans = useQuery({ queryKey: ["plans"], queryFn: listPlans });
  const settings = useQuery({ queryKey: ["billing-settings"], queryFn: fetchBillingSettings });
  const gstRate = settings.data?.settings.gstRate ?? 18;
  return (
    <div data-testid="subscriptions-module">
      <div className="mb-6">
        <div className="eyebrow mb-2">Platform</div>
        <h1 className="text-[32px] sm:text-[40px] leading-[1.1] font-semibold">Subscriptions</h1>
        <p className="text-[16px] text-fg-2 mt-1.5 max-w-2xl">
          What is sold, what it costs and how it is invoiced. The app, the checkout and the pricing page read these, so a change applies at once. Nothing a company already has is deleted, and invoices already issued are never altered.
        </p>
      </div>
      <div className="mb-5">
        <Segmented label="Subscription settings" items={TABS} value={tab} onChange={setTab} />
      </div>
      {(plans.error || settings.error) && tab !== "history" && <Notice tone="error">{((plans.error || settings.error) as Error).message}</Notice>}
      {tab === "rates" && (
        <div className="space-y-4">
          <p className="text-[13.5px] text-fg-2">
            Rupee prices below are worked out at <span className="font-medium text-fg">{gstRate}% GST</span>
            {settings.data ? ` (service code ${settings.data.settings.sacCode})` : ""}. Change the rate or the code under{" "}
            <button type="button" className="underline underline-offset-2 text-fg" onClick={() => setTab("invoice")}>
              Invoice &amp; tax
            </button>
            .
          </p>
          {plans.data?.map((p) => <RatesCard key={p.id} plan={p} gstRate={gstRate} />)}
        </div>
      )}
      {tab === "services" && <div className="space-y-4">{plans.data?.map((p) => <ServicesCard key={p.id} plan={p} />)}</div>}
      {tab === "invoice" && settings.data && <InvoiceTax settings={settings.data.settings} />}
      {tab === "history" && <History />}
    </div>
  );
}
