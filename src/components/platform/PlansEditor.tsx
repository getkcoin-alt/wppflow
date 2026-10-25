import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet } from "../ui/Sheet";
import { Field, Notice, Pill } from "../ui/Page";
import { btn, inputCls } from "../ui/styles";
import { listPlans, updatePlan, type PlanChoice, type PlanPrice } from "../../services/api";

const INTERVALS = [
  ["monthly", "Monthly"],
  ["annual", "Yearly"],
] as const;
const CURRENCIES = ["INR", "AED"] as const;
const major = (p: PlanPrice | undefined) => (p ? String(p.amountMinor / 100) : "");

// One plan: its name, limits, features, whether it is for sale, and its prices. Saving applies at once to every
// company on the plan, so the screen says so. Nothing a company already has is deleted by an edit.
function PlanForm({ plan }: { plan: PlanChoice }) {
  const qc = useQueryClient();
  const initial = () => ({
    name: plan.name,
    numbers: plan.numbers === null ? "" : String(plan.numbers),
    seats: plan.seats === null ? "" : String(plan.seats),
    maxContacts: plan.maxContacts == null ? "" : String(plan.maxContacts),
    maxBroadcasts: plan.maxBroadcasts == null ? "" : String(plan.maxBroadcasts),
    isActive: plan.isActive,
    features: plan.features.filter((f) => f.included).map((f) => f.key),
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
        name: form.name,
        numbers: form.numbers.trim() === "" ? null : Number(form.numbers),
        seats: form.seats.trim() === "" ? null : Number(form.seats),
        maxContacts: form.maxContacts.trim() === "" ? null : Number(form.maxContacts),
        maxBroadcasts: form.maxBroadcasts.trim() === "" ? null : Number(form.maxBroadcasts),
        isActive: form.isActive,
        features: form.features,
        ...(free
          ? {}
          : {
              prices: INTERVALS.flatMap(([interval]) =>
                CURRENCIES.flatMap((currency) => {
                  const value = form.prices[`${interval}:${currency}`].trim();
                  return value === "" ? [] : [{ interval, currency, amountMinor: Math.round(Number(value) * 100) }];
                }),
              ),
            }),
      });
      await Promise.all([qc.invalidateQueries({ queryKey: ["plans"] }), qc.invalidateQueries({ queryKey: ["public-plans"] }), qc.invalidateQueries({ queryKey: ["companies"] })]);
      setSaved(true);
    } catch (e: any) {
      setError(e.message || "Could not save the plan.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="card p-5" aria-label={`${plan.name} plan`}>
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
      {!free && (
        <div className="mt-4">
          <p className="text-[13px] text-fg-2 mb-1.5">Prices before tax. Leave blank for a custom quote.</p>
          <div className="grid gap-3 sm:grid-cols-4">
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
        </div>
      )}
      {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
      <div className="mt-4 flex items-center gap-3">
        <button type="button" disabled={busy} className={btn("primary", "sm")} onClick={() => void save()} aria-label={`Save ${plan.name}`}>
          Save {plan.name}
        </button>
        {saved && <span role="status" className="text-[13px] text-ok">Saved. It applies to every company on this plan now.</span>}
      </div>
    </section>
  );
}

export function PlansEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const plans = useQuery({ queryKey: ["plans"], queryFn: listPlans, enabled: open });
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Plans and prices"
      subtitle="What each plan includes and costs. The app, the pricing on the website and checkout read these. A change applies at once and nothing a company already has is deleted."
      footer={
        <button type="button" className={btn("ghost")} onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="space-y-4">
        {plans.error && <Notice tone="error">{(plans.error as Error).message}</Notice>}
        {plans.data?.map((p) => <PlanForm key={p.id} plan={p} />)}
      </div>
    </Sheet>
  );
}
