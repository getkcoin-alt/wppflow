import { CalendarCheck, CreditCard, KeyRound, LogIn, ShieldCheck, Truck, UserCog, UserPlus, type LucideIcon } from "lucide-react";
import type { OtpSettings, OtpSettingsPatch, OtpTemplate } from "../../../services/api";
import { Segmented } from "../../ui/Page";
import { inputCls, selectCls } from "../../ui/styles";

const ICONS: Record<string, LucideIcon> = { login: LogIn, signup: UserPlus, reset: KeyRound, payment: CreditCard, delivery: Truck, booking: CalendarCheck, change: UserCog, verify: ShieldCheck };

/** What the code is for. One tap sets the wording, the digits, the time and the tries that suit it. */
export function UseCaseTiles({ templates, value, onPick, disabled }: { templates: OtpTemplate[]; value: string; onPick: (key: string) => void; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label="What is the code for?" className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {templates.map((t) => {
        const Icon = ICONS[t.key] || ShieldCheck;
        const on = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onPick(t.key)}
            className={`press text-left rounded-2xl p-3.5 min-h-[88px] transition ${on ? "bg-brand-solid/10 ring-2 ring-brand-solid" : "bg-surface-2 hover:bg-surface-3"}`}
          >
            <Icon className={`w-5 h-5 ${on ? "text-brand" : "text-fg-2"}`} aria-hidden />
            <span className="block mt-2 text-[14px] font-semibold text-fg">{t.title}</span>
            <span className="block mt-0.5 text-[12px] leading-snug text-fg-3">{t.blurb}</span>
          </button>
        );
      })}
    </div>
  );
}

const EXPIRY = [60, 120, 300, 600, 900, 1800, 3600];
const expiryLabel = (s: number) => (s >= 3600 ? `${s / 3600} hour${s === 3600 ? "" : "s"}` : `${s / 60} minute${s === 60 ? "" : "s"}`);
const RESEND = [15, 30, 60, 120, 300];

/** Everything else, for people who want to change it. Nobody has to open this. */
export function FineTune({ settings, locales, onChange, brand, onBrand, brandError }: { settings: OtpSettings; locales: { key: string; name: string }[]; onChange: (patch: OtpSettingsPatch) => void; brand: string; onBrand: (value: string) => void; brandError?: string }) {
  const times = EXPIRY.includes(settings.ttlSeconds) ? EXPIRY : [...EXPIRY, settings.ttlSeconds].sort((a, b) => a - b);
  const waits = RESEND.includes(settings.resendSeconds) ? RESEND : [...RESEND, settings.resendSeconds].sort((a, b) => a - b);
  const label = "block text-[13px] font-medium text-fg-2 mb-1.5 ml-1";
  return (
    <details className="mt-4 group">
      <summary className="cursor-pointer select-none text-[14px] font-medium text-fg-2 hover:text-fg list-none flex items-center gap-1.5">
        <span className="inline-block transition group-open:rotate-90" aria-hidden>›</span> Fine-tune
      </summary>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="otp-brand">
            Name shown in the message
          </label>
          <input id="otp-brand" value={brand} onChange={(e) => onBrand(e.target.value)} maxLength={30} placeholder={settings.brandResolved || "Your company"} aria-invalid={Boolean(brandError)} aria-describedby="otp-brand-note" className={inputCls} />
          <span id="otp-brand-note" role={brandError ? "alert" : undefined} className={`block text-[12.5px] mt-1.5 ml-1 ${brandError ? "text-danger" : "text-fg-3"}`}>
            {brandError || "Letters, numbers, spaces, & - and '. Left empty, your company name is used."}
          </span>
        </div>
        <div className="sm:col-span-2">
          <span className={label}>Language of the message</span>
          <Segmented label="Language of the message" items={locales.map((l) => ({ key: l.key, label: l.name }))} value={settings.locale} onChange={(locale) => onChange({ locale })} />
        </div>
        <div>
          <label className={label} htmlFor="otp-digits">Digits in the code</label>
          <select id="otp-digits" value={settings.codeLength} onChange={(e) => onChange({ codeLength: Number(e.target.value) })} className={selectCls}>
            {[4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n} digits</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="otp-ttl">The code works for</label>
          <select id="otp-ttl" value={settings.ttlSeconds} onChange={(e) => onChange({ ttlSeconds: Number(e.target.value) })} className={selectCls}>
            {times.map((s) => <option key={s} value={s}>{expiryLabel(s)}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="otp-tries">Tries before it locks</label>
          <select id="otp-tries" value={settings.maxAttempts} onChange={(e) => onChange({ maxAttempts: Number(e.target.value) })} className={selectCls}>
            {[1, 2, 3, 4, 5, 7, 10].map((n) => <option key={n} value={n}>{n} {n === 1 ? "try" : "tries"}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="otp-wait">Wait before sending another</label>
          <select id="otp-wait" value={settings.resendSeconds} onChange={(e) => onChange({ resendSeconds: Number(e.target.value) })} className={selectCls}>
            {waits.map((s) => <option key={s} value={s}>{s >= 60 ? `${s / 60} minute${s === 60 ? "" : "s"}` : `${s} seconds`}</option>)}
          </select>
        </div>
      </div>
    </details>
  );
}
