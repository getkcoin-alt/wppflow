import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet } from "../ui/Sheet";
import { Notice } from "../ui/Page";
import { btn, inputCls } from "../ui/styles";
import { LABEL_COLORS, createLabel, deleteLabel, getStoredTenantId, updateLabel, type Label, type LabelColor } from "../../services/api";
import { dotOf } from "./LabelChip";
import { useLabels } from "./useLabels";

function Swatches({ value, onPick, name }: { value: LabelColor; onPick: (c: LabelColor) => void; name: string }) {
  return (
    <div role="group" aria-label={`${name} colour`} className="flex flex-wrap gap-1.5">
      {LABEL_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={c}
          aria-pressed={value === c}
          onClick={() => onPick(c)}
          className={`h-6 w-6 rounded-full ${dotOf(c)} ${value === c ? "ring-2 ring-offset-2 ring-fg ring-offset-surface" : "opacity-70 hover:opacity-100"}`}
        />
      ))}
    </div>
  );
}

function Row({ label, onError, onDone }: { label: Label; onError: (m: string) => void; onDone: () => Promise<void> }) {
  const [name, setName] = useState(label.name),
    [busy, setBusy] = useState(false);
  useEffect(() => setName(label.name), [label.name]);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    onError("");
    try {
      await fn();
      await onDone();
    } catch (e: any) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <li className="rounded-2xl bg-surface-2 p-3 space-y-2.5" aria-label={label.name}>
      <div className="flex items-center gap-2">
        <input aria-label={`Name of ${label.name}`} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} className={`${inputCls} !h-9 text-[14px]`} />
        {name.trim() !== label.name && (
          <button type="button" disabled={busy || !name.trim()} className={btn("primary", "sm")} onClick={() => void run(() => updateLabel(label.id, { name: name.trim() }))}>
            Save
          </button>
        )}
      </div>
      <Swatches value={label.color} name={label.name} onPick={(c) => void run(() => updateLabel(label.id, { color: c }))} />
      <div className="flex items-center justify-between text-[13px] text-fg-3">
        <span>{label.contacts === 1 ? "1 contact" : `${label.contacts ?? 0} contacts`}</span>
        <button
          type="button"
          disabled={busy}
          className="text-danger hover:underline"
          aria-label={`Delete ${label.name}`}
          onClick={() => {
            if (confirm(`Delete the label "${label.name}"? Contacts keep everything else; only the label is removed.`)) void run(() => deleteLabel(label.id));
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

// Owners and administrators keep the company's labels tidy here: make, rename, recolour, delete.
export function LabelManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const labels = useLabels(open);
  const qc = useQueryClient();
  const [name, setName] = useState(""),
    [color, setColor] = useState<LabelColor>("blue"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const refresh = async () => {
    const tenant = getStoredTenantId();
    await Promise.all([qc.invalidateQueries({ queryKey: ["labels", tenant] }), qc.invalidateQueries({ queryKey: ["contacts", tenant] }), qc.invalidateQueries({ queryKey: ["conversations", tenant] })]);
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Labels"
      subtitle="Coloured labels the whole team can put on contacts and filter by. Renaming or deleting one changes it for everyone."
      footer={
        <button type="button" className={btn("ghost")} onClick={onClose}>
          Done
        </button>
      }
    >
      <form
        className="rounded-2xl ring-1 ring-line p-3 space-y-2.5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setBusy(true);
          setError("");
          try {
            await createLabel(name.trim(), color);
            setName("");
            await refresh();
          } catch (err: any) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="flex gap-2">
          <input aria-label="New label name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="New label, for example VIP" className={`${inputCls} !h-9 text-[14px]`} />
          <button className={btn("primary", "sm")} disabled={busy || !name.trim()}>
            Add label
          </button>
        </div>
        <Swatches value={color} name="New label" onPick={setColor} />
      </form>
      {error && (
        <div className="mt-3">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <ul className="mt-4 space-y-2.5">
        {labels.data?.length === 0 && <li className="text-[14px] text-fg-3">No labels yet.</li>}
        {labels.data?.map((l) => <Row key={l.id} label={l} onError={setError} onDone={refresh} />)}
      </ul>
    </Sheet>
  );
}
