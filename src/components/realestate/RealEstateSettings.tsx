import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2 } from "lucide-react";
import { reSaveSettings, reSettings, type ReSettings } from "../../services/realEstate";
import { Field, Notice } from "../ui/Page";
import { ChipNumber, PanelSettings, SettingsGroup } from "../ui/PanelSettings";
import { btn, selectCls } from "../ui/styles";
import { errorOf, reKey } from "./common";

const ZONES = ["Asia/Dubai", "Asia/Riyadh", "Asia/Kolkata", "Asia/Karachi", "Asia/Singapore", "Europe/London", "Europe/Istanbul", "America/New_York", "Africa/Cairo"];

// Real estate's own settings: how long a viewing is, when listings are checked again, and when a lead is flagged as slipping.
// Owners and administrators only (the server refuses everyone else).
export function RealEstateSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const q = useQuery({ queryKey: reKey("settings"), queryFn: reSettings, enabled: open });
  return (
    <PanelSettings open={open} onClose={onClose} panel="Real estate" icon={<Building2 className="w-6 h-6" />} accent="brand" subtitle="The defaults your viewings, listings and alerts use." footer={<button type="button" className={btn("ghost")} onClick={onClose}>Close</button>}>
      {q.error && <Notice tone="error">{errorOf(q.error)}</Notice>}
      {q.data ? <Form key={JSON.stringify(q.data)} saved={q.data} /> : !q.error && <p className="text-fg-3 text-[14px] pt-4">Loading…</p>}
    </PanelSettings>
  );
}

function Form({ saved }: { saved: ReSettings }) {
  const qc = useQueryClient();
  const [v, setV] = useState<ReSettings>(saved);
  const [error, setError] = useState("");
  const set = <K extends keyof ReSettings>(k: K, x: ReSettings[K]) => setV((c) => ({ ...c, [k]: x }));
  const changed = (Object.keys(v) as (keyof ReSettings)[]).filter((k) => v[k] !== saved[k]);
  const save = useMutation({
    mutationFn: () => reSaveSettings(Object.fromEntries(changed.map((k) => [k, v[k]])) as Partial<ReSettings>),
    onSuccess: async () => {
      setError("");
      await qc.invalidateQueries({ queryKey: reKey() });
    },
    onError: (e) => setError(errorOf(e)),
  });
  const zones = ZONES.includes(v.timezone) ? ZONES : [v.timezone, ...ZONES];
  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="pt-1">
        <SettingsGroup title="Viewings" hint="Used when someone books a viewing, so the form already has the usual answers.">
          <ChipNumber label="Length of a viewing" value={Number(v.viewingMinutes)} choices={[30, 45, 60, 90]} unit="min" min={10} max={480} onChange={(n) => set("viewingMinutes", n)} />
          <Field label="Time zone" hint="Times in the booking form are in this zone unless changed there.">
            <select aria-label="Time zone" value={v.timezone} onChange={(e) => set("timezone", e.target.value)} className={selectCls}>
              {zones.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </Field>
        </SettingsGroup>
      </div>
      <SettingsGroup title="Listings" hint="A listing nobody has checked lately may no longer be available.">
        <ChipNumber label="Check a listing again after" value={Number(v.freshnessDays)} choices={[7, 14, 30]} unit="days" min={1} max={365} onChange={(n) => set("freshnessDays", n)} />
      </SettingsGroup>
      <SettingsGroup title="When a lead is slipping" hint="Riwo and the Revenue screen flag these so nothing goes quiet.">
        <ChipNumber label="A new lead may wait for an owner" value={Number(v.unassignedMinutes)} choices={[5, 15, 30, 60]} unit="min" min={1} max={10080} onChange={(n) => set("unassignedMinutes", n)} />
        <ChipNumber label="A follow-up may be overdue" value={Number(v.overdueFollowupMinutes)} choices={[30, 60, 120, 240]} unit="min" min={1} max={10080} onChange={(n) => set("overdueFollowupMinutes", n)} />
        <ChipNumber label="A lead may have no next step" value={Number(v.missingNextActionHours)} choices={[2, 4, 8, 24]} unit="hours" min={1} max={720} onChange={(n) => set("missingNextActionHours", n)} />
        <ChipNumber label="A lead is stalled after" value={Number(v.stalledDays)} choices={[3, 7, 14]} unit="days quiet" min={1} max={365} onChange={(n) => set("stalledDays", n)} />
      </SettingsGroup>
      {changed.length > 0 && (
        <div className="sticky bottom-0 -mx-1 pt-2 pb-1 bg-surface">
          <button type="button" className={`${btn("primary")} w-full`} disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
            Save changes
          </button>
        </div>
      )}
      {save.isSuccess && changed.length === 0 && <Notice tone="success">Saved.</Notice>}
    </>
  );
}
