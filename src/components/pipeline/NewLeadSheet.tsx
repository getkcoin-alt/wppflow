import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Sparkles } from "lucide-react";
import {
  addLeadTask,
  aiLeadSuggestion,
  createLead,
  fetchContacts,
  getStoredTenantId,
  type Lead,
  type PipelineStage,
} from "../../services/api";
import { Field, Notice } from "../ui/Page";
import { Sheet } from "../ui/Sheet";
import { btn, inputCls, selectCls } from "../ui/styles";

const FOLLOW_UP_DAYS = [0, 1, 3, 7];
const dayLabel = (d: number) => (d === 0 ? "No follow-up" : d === 1 ? "Tomorrow" : `In ${d} days`);

interface Picked {
  id?: string;
  conversationId?: string;
  name: string;
  phone?: string;
}

// Adds a customer to the pipeline: from the chat that is open (and Riwo can suggest the details), or by picking
// a contact. Someone who already has an open lead is taken to it instead of getting a second one.
export function NewLeadSheet({
  open,
  from,
  contact,
  stages,
  teammates,
  aiAvailable,
  onClose,
  onCreated,
}: {
  open: boolean;
  /** The chat this is started from, if any */
  from?: { conversationId: string; name: string };
  /** The contact this is started from, if any */
  contact?: { id: string; name: string; phone?: string };
  stages: PipelineStage[];
  teammates: { id: number; name: string }[];
  aiAvailable: boolean;
  onClose: () => void;
  onCreated: (lead: Lead, existing: boolean) => void;
}) {
  return open ? <Body key={from?.conversationId || contact?.id || "pick"} from={from} contact={contact} stages={stages} teammates={teammates} aiAvailable={aiAvailable} onClose={onClose} onCreated={onCreated} /> : null;
}

function Body({ from, contact, stages, teammates, aiAvailable, onClose, onCreated }: Omit<Parameters<typeof NewLeadSheet>[0], "open">) {
  const tenant = getStoredTenantId();
  const qc = useQueryClient();
  const [picked, setPicked] = useState<Picked | null>(from ? { conversationId: from.conversationId, name: from.name } : contact ? { id: contact.id, name: contact.name, phone: contact.phone } : null);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState(""),
    [value, setValue] = useState(""),
    [stageId, setStageId] = useState(""),
    [owner, setOwner] = useState(""),
    [days, setDays] = useState(0),
    [followTitle, setFollowTitle] = useState("Follow up");
  const [busy, setBusy] = useState(false),
    [thinking, setThinking] = useState(false),
    [error, setError] = useState(""),
    [hint, setHint] = useState("");
  const results = useQuery({
    queryKey: ["contacts", tenant, "pick", search],
    queryFn: () => fetchContacts({ search }),
    enabled: !picked && search.trim().length >= 2,
  });
  const days_ = FOLLOW_UP_DAYS.includes(days) ? FOLLOW_UP_DAYS : [...FOLLOW_UP_DAYS, days].sort((a, b) => a - b);

  const suggest = async () => {
    if (!from) return;
    setThinking(true);
    setError("");
    try {
      const s = await aiLeadSuggestion(from.conversationId);
      if (s.title) setTitle(s.title);
      if (s.value > 0) setValue(String(s.value));
      if (s.nextStep) setFollowTitle(s.nextStep);
      setDays(s.followUpDays);
      setHint("Riwo's suggestion. Check it and change anything before you save.");
    } catch (e: any) {
      setError(e.message || "Riwo couldn't suggest anything.");
    } finally {
      setThinking(false);
    }
  };

  const save = async () => {
    if (!picked) return setError("Choose who this lead is for.");
    setBusy(true);
    setError("");
    try {
      const res = await createLead({
        ...(picked.conversationId ? { conversationId: picked.conversationId } : { contactId: picked.id }),
        title: title.trim() || undefined,
        value: Number(value) || 0,
        ...(stageId ? { stageId } : {}),
        ...(owner ? { ownerUserId: Number(owner) } : {}),
      });
      if (!res.existing && days > 0)
        await addLeadTask(res.lead.id, { title: followTitle.trim() || "Follow up", dueAt: new Date(new Date().setHours(9, 0, 0, 0) + days * 86_400_000).toISOString() });
      await Promise.all(["leads", "lead", "lead-tasks"].map((k) => qc.invalidateQueries({ queryKey: [k, tenant] })));
      onCreated(res.lead, res.existing);
    } catch (e: any) {
      setError(e.message || "Couldn't create the lead.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Add to pipeline"
      subtitle={picked ? picked.name : "Choose who this lead is for"}
      footer={
        <>
          <button type="button" className={btn("ghost")} onClick={onClose}>
            Cancel
          </button>
          <button type="button" disabled={busy || !picked} className={btn("primary")} onClick={() => void save()}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
            Add lead
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <div className="space-y-4">
        {!from && (
          <div>
            {picked ? (
              <p className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 h-12 text-[15px]">
                <span dir="auto">
                  {picked.name} <span className="text-fg-3 num">{picked.phone}</span>
                </span>
                <button type="button" className="text-[13px] text-gold hover:underline" onClick={() => setPicked(null)}>
                  Change
                </button>
              </p>
            ) : (
              <>
                <Field label="Find a contact" hint="Type a name or a phone number.">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-3" aria-hidden />
                    <input aria-label="Find a contact" value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} pl-11`} autoFocus />
                  </div>
                </Field>
                <ul className="mt-2 space-y-1" aria-label="Contacts">
                  {results.data?.contacts.slice(0, 8).map((c: any) => (
                    <li key={c.id}>
                      <button type="button" className="w-full text-left rounded-xl px-3 h-11 hover:bg-surface-2 flex items-center justify-between" onClick={() => setPicked({ id: c.id, name: c.name, phone: c.phone })}>
                        <span dir="auto">{c.name}</span>
                        <span className="text-[12.5px] text-fg-3 num">{c.phone}</span>
                      </button>
                    </li>
                  ))}
                  {results.data && !results.data.contacts.length && <li className="px-3 text-[13.5px] text-fg-3">No contact matches.</li>}
                </ul>
              </>
            )}
          </div>
        )}

        {aiAvailable && from && (
          <button type="button" disabled={thinking} onClick={() => void suggest()} className={btn("secondary", "sm")}>
            {thinking ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Sparkles className="w-4 h-4" aria-hidden />}
            Suggest with Riwo
          </button>
        )}
        {hint && <p className="text-[13px] text-fg-2">{hint}</p>}

        <Field label="What is it for?" hint="For example “2 bedroom in Marina”. Leave empty to use their name.">
          <input aria-label="What is it for?" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} className={inputCls} dir="auto" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Value">
            <input aria-label="Value" type="number" min={0} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Step">
            <select aria-label="Step" value={stageId} onChange={(e) => setStageId(e.target.value)} className={selectCls}>
              <option value="">{stages.find((s) => s.kind === "open")?.name || "First step"}</option>
              {stages
                .filter((s) => s.kind === "open")
                .slice(1)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </Field>
        </div>
        <Field label="Owner" hint="Leave empty to use whoever the chat is assigned to.">
          <select aria-label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} className={selectCls}>
            <option value="">Keep as it is</option>
            {teammates.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Remind me">
            <select aria-label="Remind me" value={days} onChange={(e) => setDays(Number(e.target.value))} className={selectCls}>
              {days_.map((d) => (
                <option key={d} value={d}>
                  {dayLabel(d)}
                </option>
              ))}
            </select>
          </Field>
          {days > 0 && (
            <Field label="To">
              <input aria-label="Reminder" value={followTitle} onChange={(e) => setFollowTitle(e.target.value)} maxLength={255} className={inputCls} dir="auto" />
            </Field>
          )}
        </div>
      </div>
    </Sheet>
  );
}
