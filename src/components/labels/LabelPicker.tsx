import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { createLabel, getStoredTenantId, type Label } from "../../services/api";
import { btn, inputCls } from "../ui/styles";
import { LabelChip, dotOf } from "./LabelChip";
import { useLabels } from "./useLabels";

// A contact's labels: the ones it has as chips, and a list to tick more from. Anyone can make a new label while tagging.
// `onChange` receives the full set of label ids the contact should have.
export function LabelPicker({
  value,
  onChange,
  busy = false,
}: {
  value: Label[];
  onChange: (ids: string[]) => void | Promise<void>;
  busy?: boolean;
}) {
  const labels = useLabels();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false),
    [name, setName] = useState(""),
    [error, setError] = useState(""),
    [making, setMaking] = useState(false);
  const have = new Set(value.map((l) => l.id));
  const toggle = (id: string) => void onChange(have.has(id) ? value.filter((l) => l.id !== id).map((l) => l.id) : [...value.map((l) => l.id), id]);
  const make = async () => {
    const typed = name.trim();
    if (!typed) return;
    setMaking(true);
    setError("");
    try {
      const label = await createLabel(typed);
      await qc.invalidateQueries({ queryKey: ["labels", getStoredTenantId()] });
      setName("");
      await onChange([...value.map((l) => l.id), label.id]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setMaking(false);
    }
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {value.length === 0 && <span className="text-[13px] text-fg-3">No labels yet</span>}
        {value.map((l) => (
          <LabelChip key={l.id} label={l} onRemove={busy ? undefined : () => toggle(l.id)} />
        ))}
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[12.5px] font-medium text-fg-2 ring-1 ring-line hover:text-fg"
        >
          <Plus className="w-3 h-3" aria-hidden /> Label
        </button>
      </div>
      {open && (
        <div role="group" aria-label="Choose labels" className="rounded-2xl bg-surface-2 p-3 space-y-2">
          <ul className="max-h-44 overflow-y-auto space-y-1">
            {labels.data?.length === 0 && <li className="text-[13px] text-fg-3">No labels yet. Make the first one below.</li>}
            {labels.data?.map((l) => (
              <li key={l.id}>
                <label className="flex items-center gap-2.5 py-1 text-[14px] cursor-pointer">
                  <input type="checkbox" checked={have.has(l.id)} disabled={busy} onChange={() => toggle(l.id)} className="h-4 w-4 accent-brand-solid" aria-label={l.name} />
                  <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${dotOf(l.color)}`} />
                  <span className="truncate">{l.name}</span>
                </label>
              </li>
            ))}
          </ul>
          {/* not a <form>: the picker also sits inside the contact form, and forms cannot nest */}
          <div className="flex gap-2">
            <input
              aria-label="New label"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void make();
                }
              }}
              placeholder="New label"
              className={`${inputCls} !h-9 text-[14px]`}
            />
            <button type="button" className={btn("secondary", "sm")} disabled={making || !name.trim()} onClick={() => void make()}>
              Add
            </button>
          </div>
          {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
        </div>
      )}
    </div>
  );
}
