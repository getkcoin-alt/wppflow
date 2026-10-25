import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Field, Notice } from "../ui/Page";
import { btn, inputCls, selectCls } from "../ui/styles";
import { getStoredTenantId, saveBillingProfile, type BillingProfile } from "../../services/api";

const EMPTY: BillingProfile = { legalName: "", addressLine1: "", addressLine2: "", city: "", stateCode: "", postalCode: "", gstin: null, billingEmail: "" };

// Who the invoice is made out to. The state decides whether the GST is split into CGST and SGST or charged as IGST.
export function BillingProfileForm({
  profile,
  states,
  onSaved,
}: {
  profile: BillingProfile | null;
  states: { code: string; name: string }[];
  onSaved?: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<BillingProfile>(profile ?? EMPTY),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const set = (patch: Partial<BillingProfile>) => {
    setSaved(false);
    setForm((f) => ({ ...f, ...patch }));
  };
  return (
    <form
      className="space-y-4"
      aria-label="Billing details"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await saveBillingProfile({ ...form, gstin: form.gstin?.trim() || null });
          await qc.invalidateQueries({ queryKey: ["billing", getStoredTenantId()] });
          setSaved(true);
          onSaved?.();
        } catch (err: any) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company legal name">
          <input aria-label="Company legal name" required maxLength={150} value={form.legalName} onChange={(e) => set({ legalName: e.target.value })} className={inputCls} autoComplete="organization" />
        </Field>
        <Field label="GSTIN" hint="Leave blank if the company is not registered for GST.">
          <input aria-label="GSTIN" maxLength={15} value={form.gstin ?? ""} onChange={(e) => set({ gstin: e.target.value.toUpperCase() })} className={`${inputCls} uppercase`} placeholder="27AAPFU0939F1ZV" />
        </Field>
        <Field label="Address">
          <input aria-label="Address" required maxLength={200} value={form.addressLine1} onChange={(e) => set({ addressLine1: e.target.value })} className={inputCls} autoComplete="address-line1" />
        </Field>
        <Field label="Address line 2" hint="Optional.">
          <input aria-label="Address line 2" maxLength={200} value={form.addressLine2} onChange={(e) => set({ addressLine2: e.target.value })} className={inputCls} autoComplete="address-line2" />
        </Field>
        <Field label="City">
          <input aria-label="City" required maxLength={100} value={form.city} onChange={(e) => set({ city: e.target.value })} className={inputCls} autoComplete="address-level2" />
        </Field>
        <Field label="State" hint="Where the company is registered or receives the service.">
          <select aria-label="State" required value={form.stateCode} onChange={(e) => set({ stateCode: e.target.value })} className={selectCls}>
            <option value="" disabled>
              Choose a state…
            </option>
            {states.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="PIN code">
          <input aria-label="PIN code" required inputMode="numeric" maxLength={6} value={form.postalCode} onChange={(e) => set({ postalCode: e.target.value.replace(/\D/g, "") })} className={inputCls} autoComplete="postal-code" />
        </Field>
        <Field label="Billing email" hint="Where invoices are sent. Optional.">
          <input aria-label="Billing email" type="email" maxLength={255} value={form.billingEmail} onChange={(e) => set({ billingEmail: e.target.value })} className={inputCls} />
        </Field>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex items-center gap-3">
        <button className={btn("primary")} disabled={busy}>
          Save billing details
        </button>
        {saved && (
          <span role="status" className="text-[13.5px] text-ok">
            Saved.
          </span>
        )}
      </div>
    </form>
  );
}
