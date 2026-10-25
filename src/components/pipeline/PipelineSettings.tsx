import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import {
  applyPipelinePreset,
  getStoredTenantId,
  savePipelineStages,
  setPipelineAutoCreate,
  setPipelineCurrency,
  type PipelineSettings as Settings,
} from "../../services/api";
import { Field, Notice } from "../ui/Page";
import { Sheet } from "../ui/Sheet";
import { btn, inputCls, selectCls } from "../ui/styles";

interface Row {
  id?: string;
  name: string;
  leads: number;
}

// For managers: the steps leads move through, a ready-made template to start from, the currency, and whether
// every new customer becomes a lead on their own.
export function PipelineSettings({ open, settings, onClose }: { open: boolean; settings: Settings | undefined; onClose: () => void }) {
  return open && settings ? <Body key={settings.stages.map((s) => s.id + s.name).join()} settings={settings} onClose={onClose} /> : null;
}

function Body({ settings, onClose }: { settings: Settings; onClose: () => void }) {
  const tenant = getStoredTenantId();
  const qc = useQueryClient();
  const open = settings.stages.filter((s) => s.kind === "open");
  const [rows, setRows] = useState<Row[]>(open.map((s) => ({ id: s.id, name: s.name, leads: s.leads })));
  const [won, setWon] = useState(settings.stages.find((s) => s.kind === "won")?.name || "Won");
  const [lost, setLost] = useState(settings.stages.find((s) => s.kind === "lost")?.name || "Lost");
  const [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [saved, setSaved] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["leads", tenant] });
  const run = async (what: string, fn: () => Promise<unknown>, done: string) => {
    setBusy(what);
    setError("");
    setSaved("");
    try {
      await fn();
      await refresh();
      setSaved(done);
    } catch (e: any) {
      setError(e.message || "Couldn't save.");
    } finally {
      setBusy("");
    }
  };
  const move = (i: number, by: number) =>
    setRows((r) => {
      const next = [...r];
      [next[i], next[i + by]] = [next[i + by], next[i]];
      return next;
    });
  const dirty =
    rows.length !== open.length || rows.some((r, i) => r.id !== open[i]?.id || r.name !== open[i]?.name) || won !== settings.stages.find((s) => s.kind === "won")?.name || lost !== settings.stages.find((s) => s.kind === "lost")?.name;

  return (
    <Sheet open onClose={onClose} title="Pipeline settings" subtitle="Shape the steps your leads move through." footer={<button type="button" className={btn("ghost")} onClick={onClose}>Done</button>}>
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {saved && (
        <div className="mb-4">
          <Notice tone="success">{saved}</Notice>
        </div>
      )}
      <div className="space-y-7">
        <section aria-label="Template">
          <p className="text-[13px] font-medium text-fg-2 mb-2">Start from a template</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Templates">
            {settings.presets.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={settings.pipeline.preset === p.id}
                disabled={!!busy}
                title={p.stages.join(" → ")}
                onClick={() => void run("preset", () => applyPipelinePreset(p.id), `Steps renamed to the ${p.name} template. No lead moved.`)}
                className={`rounded-full px-3.5 h-9 text-[13.5px] ring-1 transition ${settings.pipeline.preset === p.id ? "bg-brand-solid text-white ring-transparent" : "bg-surface-2 ring-line hover:ring-gold/60"}`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[12.5px] text-fg-3">A template renames the steps. Leads stay exactly where they are.</p>
        </section>

        <section aria-label="Steps">
          <p className="text-[13px] font-medium text-fg-2 mb-2">Steps</p>
          <ol className="space-y-2">
            {rows.map((r, i) => (
              <li key={r.id || `new-${i}`} className="flex items-center gap-2">
                <input aria-label={`Step ${i + 1}`} value={r.name} maxLength={60} onChange={(e) => setRows((all) => all.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className={`${inputCls} !h-11`} dir="auto" />
                <button type="button" aria-label={`Move ${r.name || `step ${i + 1}`} up`} disabled={i === 0} onClick={() => move(i, -1)} className="h-9 w-9 grid place-items-center rounded-full text-fg-3 hover:text-fg disabled:opacity-30">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button type="button" aria-label={`Move ${r.name || `step ${i + 1}`} down`} disabled={i === rows.length - 1} onClick={() => move(i, 1)} className="h-9 w-9 grid place-items-center rounded-full text-fg-3 hover:text-fg disabled:opacity-30">
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${r.name || `step ${i + 1}`}`}
                  disabled={rows.length <= 1 || r.leads > 0}
                  title={r.leads > 0 ? `${r.leads} lead${r.leads === 1 ? " is" : "s are"} here. Move them first.` : "Remove this step"}
                  onClick={() => setRows((all) => all.filter((_, j) => j !== i))}
                  className="h-9 w-9 grid place-items-center rounded-full text-fg-3 hover:text-danger disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ol>
          {rows.length < 8 && (
            <button type="button" onClick={() => setRows((all) => [...all, { name: "", leads: 0 }])} className={`${btn("ghost", "sm")} mt-2`}>
              <Plus className="w-4 h-4" /> Add a step
            </button>
          )}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Field label="When a deal is won">
              <input aria-label="Won step" value={won} maxLength={60} onChange={(e) => setWon(e.target.value)} className={inputCls} />
            </Field>
            <Field label="When a deal is lost">
              <input aria-label="Lost step" value={lost} maxLength={60} onChange={(e) => setLost(e.target.value)} className={inputCls} />
            </Field>
          </div>
          {dirty && (
            <button
              type="button"
              disabled={!!busy}
              className={`${btn("primary")} mt-4`}
              onClick={() => void run("steps", () => savePipelineStages({ open: rows.map((r) => ({ ...(r.id ? { id: r.id } : {}), name: r.name })), wonName: won, lostName: lost }), "Steps saved.")}
            >
              {busy === "steps" && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              Save steps
            </button>
          )}
        </section>

        <section aria-label="Money">
          <Field label="Currency" hint="Used for the value of every lead.">
            <select aria-label="Currency" value={settings.currency} disabled={!!busy} onChange={(e) => void run("currency", () => setPipelineCurrency(e.target.value as "AED" | "INR"), "Currency saved.")} className={selectCls}>
              <option value="AED">AED, UAE dirham</option>
              <option value="INR">INR, Indian rupee</option>
            </select>
          </Field>
        </section>

        <section aria-label="New customers">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[15px] font-medium">Add every new customer as a lead</p>
              <p className="mt-1 text-[13px] text-fg-2">When someone writes to you for the first time, they join the first step and the owner of that number is told. People who already have an open lead keep it. Groups are never added.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoCreate.enabled}
              aria-label="Add every new customer as a lead"
              disabled={!!busy}
              onClick={() => void run("auto", () => setPipelineAutoCreate(!settings.autoCreate.enabled), settings.autoCreate.enabled ? "New customers are no longer added automatically." : "New customers will be added as leads.")}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${settings.autoCreate.enabled ? "bg-brand-solid" : "bg-surface-2 ring-1 ring-line"}`}
            >
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${settings.autoCreate.enabled ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        </section>
      </div>
    </Sheet>
  );
}
