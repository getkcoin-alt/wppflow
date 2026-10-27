import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CalendarPlus, Download, Loader2 } from "lucide-react";
import { EmptyState, Field, Notice, Pill, Segmented } from "../ui/Page";
import { Sheet } from "../ui/Sheet";
import { btn, inputCls } from "../ui/styles";
import { apiDownload } from "../../services/api";
import {
  reViewingAction,
  reViewings,
  viewingIcsPath,
  type ReViewing,
} from "../../services/realEstate";
import { VIEWING_STATUS_LABEL, errorOf, reKey } from "./common";
import { Dotted } from "./Isolate";

type Filter = "upcoming" | "past" | "all";
const day = (offset: number) =>
  new Date(Date.now() + offset * 86400000).toISOString();

export function ViewingsView({ onBook }: { onBook: () => void }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("upcoming");
  const q = useQuery({
    queryKey: reKey("viewings", filter),
    queryFn: () =>
      filter === "past"
        ? reViewings(day(-60), new Date().toISOString())
        : filter === "all"
          ? reViewings(day(-30), day(60))
          : reViewings(new Date(Date.now() - 3600000).toISOString(), day(60)),
  });
  const [error, setError] = useState("");
  const [moving, setMoving] = useState<ReViewing | null>(null);
  const [cancelling, setCancelling] = useState<ReViewing | null>(null);
  const act = useMutation({
    mutationFn: ({
      id,
      action,
      body,
    }: {
      id: string;
      action: "confirm" | "complete" | "no-show" | "cancel" | "reschedule";
      body?: object;
    }) => reViewingAction(id, action, body),
    onSuccess: async () => {
      setError("");
      await qc.invalidateQueries({ queryKey: reKey() });
    },
    onError: (e) => setError(errorOf(e)),
  });
  const download = async (v: ReViewing) => {
    try {
      const blob = await apiDownload(viewingIcsPath(v.id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `viewing-${v.propertyReference}.ics`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(errorOf(e));
    }
  };
  const list = (q.data?.viewings || []).slice();
  if (filter === "past") list.reverse();
  const days = new Map<string, ReViewing[]>();
  for (const v of list)
    days.set(v.local.date, [...(days.get(v.local.date) || []), v]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented<Filter>
          label="Which viewings"
          value={filter}
          onChange={setFilter}
          items={[
            { key: "upcoming", label: "Upcoming" },
            { key: "past", label: "Past" },
            { key: "all", label: "All" },
          ]}
        />
        <button type="button" className={btn("primary", "sm")} onClick={onBook}>
          <CalendarPlus className="w-4 h-4" aria-hidden /> Book a viewing
        </button>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {q.isPending && (
        <Loader2
          className="w-5 h-5 animate-spin text-fg-3"
          aria-label="Loading viewings"
        />
      )}
      {q.error && <Notice tone="error">{errorOf(q.error)}</Notice>}
      {q.data && list.length === 0 && (
        <EmptyState
          icon={<CalendarClock className="w-6 h-6" aria-hidden />}
          title={
            filter === "past" ? "No past viewings" : "No viewings coming up"
          }
          body="Book one from a lead's matching listings, or here."
          action={
            <button type="button" className={btn("primary")} onClick={onBook}>
              Book a viewing
            </button>
          }
        />
      )}
      {[...days.entries()].map(([date, items]) => (
        <section key={date} aria-label={date} className="space-y-2">
          <p className="text-[13px] font-medium text-fg-2">
            {items[0].local.text.replace(/, \d\d:\d\d$/, "")}
          </p>
          <ul className="space-y-2">
            {items.map((v) => {
              const started = new Date(v.startsAt).getTime() <= Date.now();
              return (
                <li
                  key={v.id}
                  className="card p-4 flex flex-wrap items-center justify-between gap-3"
                  data-testid={`viewing-${v.id}`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[15px]">
                      {v.local.time}–{v.local.endTime} · {v.propertyReference}
                    </p>
                    <p className="text-[13px] text-fg-2 break-words">
                      <Dotted
                        items={[
                          v.leadName,
                          v.community || v.propertyTitle,
                          v.agentName ? `with ${v.agentName}` : "",
                        ]}
                      />
                    </p>
                    {v.status === "cancelled" && v.cancelReason && (
                      <p className="text-[12.5px] text-fg-3">
                        Cancelled: {v.cancelReason}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill
                      tone={
                        v.status === "confirmed" || v.status === "completed"
                          ? "ok"
                          : v.status === "cancelled" || v.status === "no_show"
                            ? "danger"
                            : "gold"
                      }
                    >
                      {VIEWING_STATUS_LABEL[v.status]}
                    </Pill>
                    {v.allowed.includes("confirmed") && (
                      <button
                        type="button"
                        className={btn("secondary", "sm")}
                        disabled={act.isPending}
                        onClick={() =>
                          act.mutate({ id: v.id, action: "confirm" })
                        }
                      >
                        Confirm
                      </button>
                    )}
                    {(v.status === "scheduled" || v.status === "confirmed") && (
                      <button
                        type="button"
                        className={btn("ghost", "sm")}
                        onClick={() => setMoving(v)}
                      >
                        Reschedule
                      </button>
                    )}
                    {started && v.allowed.includes("completed") && (
                      <>
                        <button
                          type="button"
                          className={btn("secondary", "sm")}
                          disabled={act.isPending}
                          onClick={() =>
                            act.mutate({ id: v.id, action: "complete" })
                          }
                        >
                          Mark done
                        </button>
                        <button
                          type="button"
                          className={btn("ghost", "sm")}
                          disabled={act.isPending}
                          onClick={() =>
                            act.mutate({ id: v.id, action: "no-show" })
                          }
                        >
                          No-show
                        </button>
                      </>
                    )}
                    {v.allowed.includes("cancelled") && (
                      <button
                        type="button"
                        className={btn("ghost", "sm")}
                        onClick={() => setCancelling(v)}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      className={btn("ghost", "sm")}
                      aria-label={`Download the calendar file for ${v.propertyReference}`}
                      onClick={() => void download(v)}
                    >
                      <Download className="w-4 h-4" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <RescheduleSheet
        viewing={moving}
        onClose={() => setMoving(null)}
        onDone={async (v, body) => {
          await act.mutateAsync({ id: v.id, action: "reschedule", body });
          setMoving(null);
        }}
      />
      <CancelSheet
        viewing={cancelling}
        onClose={() => setCancelling(null)}
        onDone={async (v, reason) => {
          await act.mutateAsync({
            id: v.id,
            action: "cancel",
            body: { reason },
          });
          setCancelling(null);
        }}
      />
    </div>
  );
}

function RescheduleSheet({
  viewing,
  onClose,
  onDone,
}: {
  viewing: ReViewing | null;
  onClose: () => void;
  onDone: (
    v: ReViewing,
    body: { date: string; time: string; timeZone: string },
  ) => Promise<void>;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!viewing)
    return (
      <Sheet open={false} onClose={onClose} title="">
        {null}
      </Sheet>
    );
  return (
    <Sheet
      open
      onClose={onClose}
      title="Reschedule"
      subtitle={`${viewing.propertyReference} · now ${viewing.local.text} (${viewing.timeZone})`}
      footer={
        <>
          <button
            type="button"
            className={btn("primary")}
            disabled={!date || !time || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onDone(viewing, {
                  date,
                  time,
                  timeZone: viewing.timeZone,
                });
              } catch (e) {
                setError(errorOf(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Move the viewing
          </button>
          <button type="button" className={btn("ghost")} onClick={onClose}>
            Keep it
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-[13.5px] text-fg-2">
          It goes back to “Scheduled”, because the new time has not been
          confirmed with anyone. Its reminder and follow-up move with it.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="New date">
            <input
              aria-label="New date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="New time">
            <input
              aria-label="New time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </Sheet>
  );
}

function CancelSheet({
  viewing,
  onClose,
  onDone,
}: {
  viewing: ReViewing | null;
  onClose: () => void;
  onDone: (v: ReViewing, reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  if (!viewing)
    return (
      <Sheet open={false} onClose={onClose} title="">
        {null}
      </Sheet>
    );
  return (
    <Sheet
      open
      onClose={onClose}
      title="Cancel this viewing?"
      subtitle={`${viewing.propertyReference} · ${viewing.local.text}`}
      footer={
        <>
          <button
            type="button"
            className={btn("primary")}
            onClick={async () => {
              try {
                await onDone(viewing, reason);
              } catch (e) {
                setError(errorOf(e));
              }
            }}
          >
            Cancel the viewing
          </button>
          <button type="button" className={btn("ghost")} onClick={onClose}>
            Keep it
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-[13.5px] text-fg-2">
          Its reminder and follow-up are closed. Tell the client yourself:
          nothing is sent automatically.
        </p>
        <Field label="Reason (optional)">
          <input
            aria-label="Reason"
            value={reason}
            maxLength={255}
            onChange={(e) => setReason(e.target.value)}
            className={inputCls}
            dir="auto"
          />
        </Field>
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </Sheet>
  );
}
