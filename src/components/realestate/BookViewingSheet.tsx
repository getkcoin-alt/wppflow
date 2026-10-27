import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2 } from "lucide-react";
import { Field, Notice } from "../ui/Page";
import { Sheet } from "../ui/Sheet";
import { btn, inputCls, selectCls, textareaCls } from "../ui/styles";
import { fetchLeads, getStoredTenantId, moveLead } from "../../services/api";
import { reBook, reProperties } from "../../services/realEstate";
import { errorOf, reKey, useReMeta } from "./common";

const ZONES = [
  "Asia/Dubai",
  "Asia/Kolkata",
  "Europe/London",
  "Asia/Riyadh",
  "Asia/Karachi",
  "Europe/Berlin",
  "America/New_York",
];
const today = () => new Date().toISOString().slice(0, 10);

type Conflict = {
  with: "agent" | "property" | "lead";
  reference: string;
  local: string;
};

// Books a viewing: who is going, to see what, when, and with whom. The server checks that nobody involved is already busy.
export function BookViewingSheet({
  open,
  onClose,
  teammates,
  currentUserId,
  isManager,
  leadId,
  propertyId,
}: {
  open: boolean;
  onClose: () => void;
  teammates: { id: number; name: string }[];
  currentUserId: number;
  isManager: boolean;
  leadId?: string;
  propertyId?: string;
}) {
  const qc = useQueryClient();
  const tenant = getStoredTenantId();
  const meta = useReMeta();
  const leads = useQuery({
    queryKey: ["leads", tenant, "open-for-viewing"],
    queryFn: () => fetchLeads({ status: "open", limit: 100 }),
    enabled: open && !leadId,
  });
  const props = useQuery({
    queryKey: reKey("properties", "bookable"),
    queryFn: () => reProperties({ status: "available" }),
    enabled: open,
  });
  const [lead, setLead] = useState(leadId || "");
  const [property, setProperty] = useState(propertyId || "");
  const [agent, setAgent] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [zone, setZone] = useState("");
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [copied, setCopied] = useState(false);
  // one key per opening of the sheet: pressing the button twice books once
  const key = useRef(crypto.randomUUID());
  // the sheet scrolls and its buttons stay at the bottom: a refusal has to be brought into view or it hides behind them
  const errorBox = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) errorBox.current?.scrollIntoView?.({ block: "nearest" });
  }, [error]);
  const defaultZone = meta.data?.settings.timezone || "Asia/Dubai";
  const zoneValue = zone || defaultZone;
  const defaultMinutes = meta.data?.settings.viewingMinutes || 45;

  const book = useMutation({
    mutationFn: () =>
      reBook({
        leadId: lead,
        propertyId: property,
        ...(agent ? { agentUserId: Number(agent) } : {}),
        date,
        time,
        timeZone: zoneValue,
        durationMinutes: Number(minutes) || defaultMinutes,
        notes,
        idempotencyKey: key.current,
      }),
    onSuccess: async () => {
      setError("");
      setConflicts([]);
      await qc.invalidateQueries({ queryKey: reKey() });
    },
    onError: (e) => {
      setError(errorOf(e));
      setConflicts(
        (e as Error & { data?: { conflicts?: Conflict[] } }).data?.conflicts ||
          [],
      );
    },
  });
  const result = book.data;
  const options = useMemo(() => props.data?.properties || [], [props.data]);
  const ready = lead && property && date && time;

  const close = () => {
    book.reset();
    key.current = crypto.randomUUID();
    onClose();
  };
  const moveStage = useMutation({
    mutationFn: () => moveLead(lead, { stageId: result!.suggestedStage!.id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads", tenant] }),
  });

  return (
    <Sheet
      open={open}
      onClose={close}
      title={result ? "Viewing booked" : "Book a viewing"}
      subtitle={
        result
          ? `${result.viewing.propertyReference} · ${result.viewing.local.text}`
          : "The server checks that the agent, the property and the client are all free."
      }
      footer={
        result ? (
          <button type="button" className={btn("primary")} onClick={close}>
            Done
          </button>
        ) : (
          <>
            <button
              type="button"
              className={btn("primary")}
              disabled={!ready || book.isPending}
              onClick={() => book.mutate()}
            >
              {book.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              )}
              Book the viewing
            </button>
            <button type="button" className={btn("ghost")} onClick={close}>
              Cancel
            </button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-4">
          <Notice tone="success">
            {result.existing
              ? "This viewing was already booked."
              : `Booked with ${result.viewing.agentName}. A reminder and a follow-up are on their list.`}
          </Notice>
          <div>
            <p className="text-[13px] font-medium text-fg-2 mb-1.5">
              A message you can send to confirm
            </p>
            <textarea
              readOnly
              aria-label="Confirmation message"
              className={textareaCls}
              value={result.confirmationText}
              dir="auto"
            />
            <p className="text-[12.5px] text-fg-3 mt-1">
              Nothing has been sent. Paste it into the chat when you are ready.
            </p>
            <button
              type="button"
              className={`${btn("secondary", "sm")} mt-2`}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(result.confirmationText);
                  setCopied(true);
                } catch {
                  /* it is on screen to select */
                }
              }}
            >
              {copied ? (
                <Check className="w-4 h-4" aria-hidden />
              ) : (
                <Copy className="w-4 h-4" aria-hidden />
              )}{" "}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {result.suggestedStage && (
            <div className="rounded-2xl bg-surface-2 p-3.5 text-[13.5px]">
              <p>Move this lead to “{result.suggestedStage.name}”?</p>
              <button
                type="button"
                className={`${btn("secondary", "sm")} mt-2`}
                disabled={moveStage.isPending || moveStage.isSuccess}
                onClick={() => moveStage.mutate()}
              >
                {moveStage.isSuccess
                  ? "Moved"
                  : `Move to ${result.suggestedStage.name}`}
              </button>
              {moveStage.error && (
                <p className="text-danger mt-2">{errorOf(moveStage.error)}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {!leadId && (
            <Field label="Lead">
              <select
                aria-label="Lead"
                value={lead}
                onChange={(e) => setLead(e.target.value)}
                className={selectCls}
              >
                <option value="">Choose a lead</option>
                {(leads.data?.leads || []).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.contactName}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Property">
            <select
              aria-label="Property"
              value={property}
              onChange={(e) => setProperty(e.target.value)}
              className={selectCls}
            >
              <option value="">Choose a property</option>
              {options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.reference} · {p.community}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Agent"
            hint={isManager ? "Defaults to the lead's owner." : "You."}
          >
            <select
              aria-label="Agent"
              value={isManager ? agent : String(currentUserId)}
              disabled={!isManager}
              onChange={(e) => setAgent(e.target.value)}
              className={selectCls}
            >
              <option value="">{isManager ? "The lead's owner" : "Me"}</option>
              {teammates.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input
                aria-label="Date"
                type="date"
                min={today()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Time">
              <input
                aria-label="Time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Time zone" hint="The time above is in this zone.">
              <input
                aria-label="Time zone"
                list="re-zones"
                value={zoneValue}
                onChange={(e) => setZone(e.target.value)}
                className={inputCls}
              />
              <datalist id="re-zones">
                {ZONES.map((z) => (
                  <option key={z} value={z} />
                ))}
              </datalist>
            </Field>
            <Field label="Length (minutes)">
              <input
                aria-label="Length in minutes"
                type="number"
                min={10}
                max={480}
                value={minutes}
                placeholder={String(defaultMinutes)}
                onChange={(e) => setMinutes(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              aria-label="Notes"
              value={notes}
              maxLength={500}
              onChange={(e) => setNotes(e.target.value)}
              className={textareaCls}
              dir="auto"
            />
          </Field>
          {error && (
            <div ref={errorBox}>
              <Notice tone="error">
                {error}
                {conflicts.length > 1 && (
                  <span className="block mt-1">
                    Also:{" "}
                    {conflicts
                      .slice(1)
                      .map((c) => `${c.with} at ${c.local}`)
                      .join("; ")}
                    .
                  </span>
                )}
              </Notice>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
