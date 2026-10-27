import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellOff,
  CheckCircle2,
  Loader2,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { EmptyState, Notice, Pill } from "../ui/Page";
import { btn } from "../ui/styles";
import { formatMoney } from "../../utils/pipeline";
import {
  reAlertAction,
  reAlerts,
  reOverview,
  reScan,
  type ReAlert,
  type ReOverview,
} from "../../services/realEstate";
import { ALERT_LABEL, errorOf, reKey } from "./common";
import { NameIn } from "./Isolate";

const pct = (n: number | null) => (n === null ? "–" : `${n}%`);

// Where money is leaking, from the company's own records. The three money lines mean different things and are labelled so.
export function RevenueView({
  isManager,
  onOpenLead,
  onOpenChat,
}: {
  isManager: boolean;
  onOpenLead: (leadId: string) => void;
  onOpenChat: (conversationId: string) => void;
}) {
  const qc = useQueryClient();
  const overview = useQuery({
    queryKey: reKey("overview"),
    queryFn: () => reOverview(30),
    refetchInterval: 60000,
  });
  const alerts = useQuery({
    queryKey: reKey("alerts", "open"),
    queryFn: () => reAlerts("open"),
    refetchInterval: 60000,
  });
  const [error, setError] = useState("");
  const after = async () => {
    setError("");
    await qc.invalidateQueries({ queryKey: reKey() });
  };
  const act = useMutation({
    mutationFn: ({
      id,
      action,
      body,
    }: {
      id: string;
      action: "resolve" | "dismiss" | "snooze";
      body?: object;
    }) => reAlertAction(id, action, body),
    onSuccess: after,
    onError: (e) => setError(errorOf(e)),
  });
  const scan = useMutation({
    mutationFn: reScan,
    onSuccess: after,
    onError: (e) => setError(errorOf(e)),
  });
  const o = overview.data;
  return (
    <div className="space-y-8">
      {error && <Notice tone="error">{error}</Notice>}
      {overview.isPending && (
        <Loader2
          className="w-5 h-5 animate-spin text-fg-3"
          aria-label="Loading the numbers"
        />
      )}
      {overview.error && (
        <Notice tone="error">{errorOf(overview.error)}</Notice>
      )}
      {o && <Money o={o} />}
      {o && <Funnel o={o} />}
      <section aria-label="Revenue leaks" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-semibold">
            Revenue leaks{o ? ` (${o.alerts.open})` : ""}
          </h2>
          {isManager && (
            <button
              type="button"
              className={btn("ghost", "sm")}
              disabled={scan.isPending}
              onClick={() => scan.mutate()}
              title="Look again now. This also runs by itself every few minutes."
            >
              {scan.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="w-4 h-4" aria-hidden />
              )}{" "}
              Check now
            </button>
          )}
        </div>
        {alerts.isPending && (
          <Loader2
            className="w-5 h-5 animate-spin text-fg-3"
            aria-label="Loading alerts"
          />
        )}
        {alerts.error && <Notice tone="error">{errorOf(alerts.error)}</Notice>}
        {alerts.data && alerts.data.alerts.length === 0 && (
          <EmptyState
            icon={<ShieldCheck className="w-6 h-6" aria-hidden />}
            title="No leaks found"
            body="Every open lead has an owner, a next step and a timely reply. Scriwo checks again every few minutes."
          />
        )}
        <ul className="space-y-3">
          {(alerts.data?.alerts || []).map((a) => (
            <AlertCard
              key={a.id}
              a={a}
              busy={act.isPending}
              onOpenLead={onOpenLead}
              onOpenChat={onOpenChat}
              onAct={(action, body) => act.mutate({ id: a.id, action, body })}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function Money({ o }: { o: ReOverview }) {
  const v = o.values;
  const card = (
    label: string,
    amount: number,
    caption: string,
    meaning: string,
    sub: string,
  ) => (
    <div className="card p-5" aria-label={label}>
      <p className="text-[13px] font-medium text-fg-2 flex items-center justify-between">
        {label}
        <Pill tone={meaning === "recorded" ? "ok" : "gold"}>
          {meaning === "recorded" ? "Recorded" : "Hypothetical"}
        </Pill>
      </p>
      <p className="mt-2 text-[28px] font-semibold num">
        {formatMoney(amount, o.currency)}
      </p>
      <p className="text-[12.5px] text-fg-3 mt-1">{sub}</p>
      <p className="text-[12.5px] text-fg-3 mt-1">{caption}</p>
    </div>
  );
  return (
    <section aria-label="Money" className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-3">
        {card(
          "Open pipeline",
          v.pipeline.amount,
          v.pipeline.note,
          v.pipeline.meaning,
          `${v.pipeline.leads} open lead${v.pipeline.leads === 1 ? "" : "s"}`,
        )}
        {card(
          "At risk",
          v.atRisk.amount,
          v.atRisk.note,
          v.atRisk.meaning,
          `${v.atRisk.leads} lead${v.atRisk.leads === 1 ? "" : "s"} with a leak`,
        )}
        {card(
          "Won",
          v.won.amount,
          v.won.note,
          v.won.meaning,
          `${v.won.deals} deal${v.won.deals === 1 ? "" : "s"}`,
        )}
      </div>
      <p className="text-[12.5px] text-fg-3">
        Open pipeline and at risk are what leads are marked at. They are not
        revenue. Only “Won” has been earned, and it is the value written on each
        won lead.
      </p>
    </section>
  );
}

function Funnel({ o }: { o: ReOverview }) {
  const f = o.funnel;
  const steps: [string, number, number | null][] = [
    ["Enquiries", f.enquiries, f.enquiries ? 100 : null],
    ["Qualified", f.qualified, f.rates.qualified],
    ["Viewing booked", f.viewingBooked, f.rates.viewingBooked],
    ["Viewing held", f.viewingHeld, f.rates.viewingHeld],
    ["Won", f.won, f.rates.won],
  ];
  return (
    <section aria-label="From enquiry to deal" className="space-y-3">
      <h2 className="text-[18px] font-semibold">From enquiry to deal</h2>
      <p className="text-[13px] text-fg-3">{f.note}</p>
      <ol className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        {steps.map(([label, n, rate]) => (
          <li key={label} className="card p-4">
            <p className="text-[12.5px] text-fg-2">{label}</p>
            <p className="text-[24px] font-semibold num">{n}</p>
            <p className="text-[12.5px] text-fg-3">
              {pct(rate)}
              {label === "Enquiries" ? "" : " of enquiries"}
            </p>
          </li>
        ))}
      </ol>
      {o.upcomingViewings > 0 && (
        <p className="text-[13px] text-fg-2">
          {o.upcomingViewings} viewing{o.upcomingViewings === 1 ? "" : "s"} in
          the next 7 days.
        </p>
      )}
    </section>
  );
}

function AlertCard({
  a,
  busy,
  onOpenLead,
  onOpenChat,
  onAct,
}: {
  a: ReAlert;
  busy: boolean;
  onOpenLead: (id: string) => void;
  onOpenChat: (id: string) => void;
  onAct: (action: "resolve" | "dismiss" | "snooze", body?: object) => void;
}) {
  return (
    <li className="card p-4 space-y-2" data-testid={`alert-${a.kind}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-[15px]">
            <NameIn text={a.title} name={a.leadName} />
          </p>
          <p className="text-[12.5px] text-fg-3">
            {a.stageName ? `${a.stageName} · ` : ""}
            {a.leadId
              ? a.ownerName
                ? `Owner ${a.ownerName}`
                : "No owner"
              : "Automation"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Pill tone={a.severity === "high" ? "danger" : "warn"}>
            {ALERT_LABEL[a.kind]}
          </Pill>
          {a.valueAtRisk > 0 && (
            <span
              className="text-[12.5px] text-fg-2 num"
              title="The lead's value as recorded. Not revenue."
            >
              {formatMoney(a.valueAtRisk, a.currency)} at risk
            </span>
          )}
        </div>
      </div>
      <p className="text-[13.5px] text-fg-2">{a.reason}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        {a.leadId && (
          <button
            type="button"
            className={btn("secondary", "sm")}
            onClick={() => onOpenLead(a.leadId!)}
          >
            Open the lead
          </button>
        )}
        {a.conversationId && (
          <button
            type="button"
            className={btn("ghost", "sm")}
            onClick={() => onOpenChat(a.conversationId!)}
          >
            <MessageSquare className="w-4 h-4" aria-hidden /> Open the chat
          </button>
        )}
        <button
          type="button"
          className={btn("ghost", "sm")}
          disabled={busy}
          onClick={() => onAct("snooze", { hours: 24 })}
        >
          <BellOff className="w-4 h-4" aria-hidden /> Snooze a day
        </button>
        <button
          type="button"
          className={btn("ghost", "sm")}
          disabled={busy}
          onClick={() => onAct("resolve")}
          title="You have dealt with it. If it is still true at the next check it comes back."
        >
          <CheckCircle2 className="w-4 h-4" aria-hidden /> Done
        </button>
        <button
          type="button"
          className={btn("ghost", "sm")}
          disabled={busy}
          onClick={() => onAct("dismiss")}
          title="Keeps this alert quiet for a week."
        >
          Not a problem
        </button>
      </div>
    </li>
  );
}
