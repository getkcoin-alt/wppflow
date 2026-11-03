import { useQuery } from "@tanstack/react-query";
import { fetchAutomationContext, type OpeningHours, type RuleDraft, type WorkflowNeed } from "../../../services/api";
import { DAY_NAMES, DEFAULT_HOURS, TIMEZONES, browserTimezone } from "../../../utils/automationText";
import { Field, Notice } from "../../ui/Page";
import { inputCls, selectCls, textareaCls } from "../../ui/styles";

/**
 * What a workflow still needs from the owner before it can be saved: words for Riwo to talk from, the countries that count as
 * home, or the opening hours. Each is shown only when it is needed.
 */
export function NeedsPanel({ needs, rule, onChange }: { needs: WorkflowNeed[]; rule: RuleDraft; onChange: (patch: Partial<RuleDraft["config"]>) => void }) {
  const context = useQuery({ queryKey: ["automation-context"], queryFn: fetchAutomationContext, staleTime: 60_000, enabled: needs.includes("countries") });
  if (!needs.length) return null;
  const c = rule.config;
  const hours: OpeningHours = c.hours || { ...DEFAULT_HOURS, timezone: browserTimezone() };
  const zones = TIMEZONES.includes(hours.timezone) ? TIMEZONES : [hours.timezone, ...TIMEZONES];
  return (
    <section aria-label="Still needed" className="space-y-3">
      {needs.includes("knowledge") && (
        <div className="rounded-2xl ring-1 ring-gold/50 bg-gold/5 p-4">
          <p className="text-[13.5px] font-semibold">Riwo needs something to talk from</p>
          <p className="text-[12.5px] text-fg-2 mt-0.5">Add your website in the Knowledge base above, or write a few sentences about your business here. Riwo never says anything that is not in them.</p>
          <textarea aria-label="What Riwo may talk about" rows={3} maxLength={3000} value={c.knowledge || ""} onChange={(e) => onChange({ knowledge: e.target.value })} className={`${textareaCls} mt-2`} placeholder="We build websites and business software for companies in India and the UAE. A first call is 30 minutes…" />
        </div>
      )}
      {needs.includes("countries") && (
        <Field label="Which countries are home?" hint="Numbers from anywhere else start this workflow.">
          <select aria-label="Home country" multiple value={c.homeCodes || []} onChange={(e) => onChange({ homeCodes: [...e.target.selectedOptions].map((o) => o.value) })} className={`${selectCls} !h-28 py-2`}>
            {(context.data?.countries || []).map((x) => (
              <option key={x.code} value={x.code}>
                {x.name} (+{x.code})
              </option>
            ))}
          </select>
        </Field>
      )}
      {needs.includes("hours") && (
        <div className="rounded-2xl ring-1 ring-gold/50 bg-gold/5 p-4 space-y-3">
          <p className="text-[13.5px] font-semibold">Your opening hours</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Days open">
            {DAY_NAMES.map((d, i) => {
              const on = hours.days.includes(i + 1);
              return (
                <button key={d} type="button" aria-pressed={on} onClick={() => onChange({ hours: { ...hours, days: on ? hours.days.filter((x) => x !== i + 1) : [...hours.days, i + 1].sort() } })} className={`h-8 px-3 rounded-full text-[13px] ${on ? "bg-brand-solid text-white" : "bg-surface-2"}`}>
                  {d}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input aria-label="Opens at" type="time" value={hours.start} onChange={(e) => onChange({ hours: { ...hours, start: e.target.value } })} className={inputCls} />
            <input aria-label="Closes at" type="time" value={hours.end} onChange={(e) => onChange({ hours: { ...hours, end: e.target.value } })} className={inputCls} />
            <select aria-label="Time zone" value={hours.timezone} onChange={(e) => onChange({ hours: { ...hours, timezone: e.target.value } })} className={selectCls}>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <Notice tone="info">Outside these hours, this workflow starts.</Notice>
        </div>
      )}
    </section>
  );
}
