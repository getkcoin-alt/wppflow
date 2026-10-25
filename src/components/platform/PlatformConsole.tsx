import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Sheet } from "../ui/Sheet";
import { Field, Notice, Pill, Segmented } from "../ui/Page";
import { btn, selectCls } from "../ui/styles";
import {
  endSupportSession,
  fetchBillingAudit,
  fetchPlatformNumberHealth,
  fetchPlatformOverview,
  fetchSupportSection,
  fetchSupportSessions,
  startSupportSession,
  type BillingAudit,
  type NumberHealthRow,
  type SupportActivity,
  type SupportSection,
  type SupportSession,
  type SupportTeamMember,
} from "../../services/api";
import { formatMinor, type Currency } from "../../utils/money";
import { formatDuration } from "../../utils/duration";
import { timeAgo } from "../../utils/timeAgo";
import { useNow } from "../../hooks/useNow";

import type { Company } from "./types";

const closeButton = (onClose: () => void) => (
  <button type="button" className={btn("ghost")} onClick={onClose}>
    Close
  </button>
);
const when = (iso: string) => new Date(iso).toLocaleString("en", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const money = (minor: number, currency: string) => formatMinor(minor, (currency === "AED" ? "AED" : "INR") as Currency);

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-4">
      <p className="text-[12.5px] text-fg-3">{label}</p>
      <p className="mt-1 text-[26px] leading-none font-semibold num">{value}</p>
      {hint && <p className="mt-1.5 text-[12.5px] text-fg-3">{hint}</p>}
    </div>
  );
}

// Across every company: how big the platform is and how it is being used. Counts only: nothing here is a chat.
export function OverviewSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const q = useQuery({ queryKey: ["platform-overview"], queryFn: () => fetchPlatformOverview(), enabled: open, refetchInterval: 120000 });
  const o = q.data;
  const states: [string, string][] = [
    ["active", "Paid and current"],
    ["due_soon", "Renewing in 14 days"],
    ["overdue", "Overdue (grace period)"],
    ["expired", "Expired"],
    ["unrecorded", "No payment recorded"],
    ["cancelling", "Cancelling"],
    ["changing", "Changing plan"],
    ["free", "Free"],
    ["legacy", "Original workspace plan"],
  ];
  return (
    <Sheet open={open} onClose={onClose} title="Platform overview" subtitle="Counts across every company. Nothing here shows a chat, a contact or a file." footer={closeButton(onClose)}>
      <div className="space-y-6">
        {q.error && <Notice tone="error">{(q.error as Error).message}</Notice>}
        {!o && !q.error && <p className="text-[14px] text-fg-3">Loading…</p>}
        {o && (
          <>
            <section aria-label="Companies and numbers" className="grid grid-cols-2 gap-3">
              <Stat label="Companies" value={o.companies.total} hint={`${o.companies.active} active · ${o.companies.suspended} suspended · ${o.companies.newLast30Days} new in 30 days`} />
              <Stat label="People" value={o.people.active} />
              <Stat label="Numbers connected" value={`${o.numbers.connected} / ${o.numbers.linked}`} hint={o.numbers.notConnected ? `${o.numbers.notConnected} not connected` : "All linked numbers are connected"} />
              <Stat label="Companies active this week" value={o.messages.activeCompaniesLast7Days} />
            </section>
            <section aria-label="Messages">
              <h3 className="text-[13px] font-semibold text-fg-2 mb-2">Messages</h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[14px]">
                {(
                  [
                    ["Sent, last 24 hours", o.messages.sentLast24h],
                    ["Sent, last 7 days", o.messages.sentLast7Days],
                    ["Sent, last 30 days", o.messages.sentLast30Days],
                    ["Received, last 7 days", o.messages.receivedLast7Days],
                    ["Failed, last 7 days", o.messages.failedLast7Days],
                  ] as [string, number][]
                ).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-fg-3">{k}</dt>
                    <dd className={`num ${k.startsWith("Failed") && v > 0 ? "text-danger font-medium" : "text-fg"}`}>{v.toLocaleString()}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section aria-label="Riwo">
              <h3 className="text-[13px] font-semibold text-fg-2 mb-2">Riwo this month</h3>
              <p className="text-[14px] text-fg">
                <span className="num">{o.ai.requestsThisMonth.toLocaleString()}</span> requests from <span className="num">{o.ai.companiesUsing}</span> {o.ai.companiesUsing === 1 ? "company" : "companies"} ·{" "}
                <span className="num">{o.ai.tokensThisMonth.toLocaleString()}</span> tokens
              </p>
            </section>
            <section aria-label="Where companies stand">
              <h3 className="text-[13px] font-semibold text-fg-2 mb-2">Where companies stand on payment</h3>
              <div className="flex flex-wrap gap-2">
                {states
                  .filter(([key]) => o.companies.bySubscription[key])
                  .map(([key, label]) => (
                    <Pill key={key} tone={key === "overdue" || key === "expired" ? "danger" : key === "unrecorded" || key === "due_soon" ? "warn" : "neutral"}>
                      {label} {o.companies.bySubscription[key]}
                    </Pill>
                  ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(o.companies.byPlan).map(([plan, n]) => (
                  <Pill key={plan}>
                    {plan} {n}
                  </Pill>
                ))}
              </div>
            </section>
            <section aria-label="Payments recorded">
              <h3 className="text-[13px] font-semibold text-fg-2 mb-2">Payments recorded, last 30 days</h3>
              {o.payments.last30Days.length === 0 ? (
                <p className="text-[14px] text-fg-3">None yet.</p>
              ) : (
                <ul className="text-[14px] space-y-1">
                  {o.payments.last30Days.map((p) => (
                    <li key={p.currency}>
                      <span className="num font-medium">{money(Math.round(p.amount * 100), p.currency)}</span> in <span className="num">{p.payments}</span> {p.payments === 1 ? "payment" : "payments"}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <p className="text-[12.5px] text-fg-3">Worked out {timeAgo(o.generatedAt)}. Refreshed at most once a minute.</p>
          </>
        )}
      </div>
    </Sheet>
  );
}

const LEVEL_TONE = { down: "danger", warn: "warn", ok: "ok", unpaired: "neutral" } as const;
const LEVEL_TEXT = { down: "Down", warn: "Needs a look", ok: "Healthy", unpaired: "Being linked" } as const;

function NumberLine({ n }: { n: NumberHealthRow }) {
  const now = useNow();
  return (
    <li className="py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14.5px] text-fg">
          {n.label} <span className="text-fg-3 num">{n.phone}</span>
        </p>
        <Pill tone={LEVEL_TONE[n.level]} dot>
          {LEVEL_TEXT[n.level]}
        </Pill>
      </div>
      {n.problems.map((p) => (
        <p key={p.code} className={`text-[13px] mt-0.5 ${n.level === "down" ? "text-danger" : "text-warn"}`}>
          {p.text}
        </p>
      ))}
      <p className="text-[12.5px] text-fg-3 mt-0.5">
        {n.lastHeartbeatAt ? `Checked ${timeAgo(n.lastHeartbeatAt)}` : "Not checked yet"}
        {n.connectedSince ? ` · connected for ${formatDuration((now - new Date(n.connectedSince).getTime()) / 1000)}` : ""} · {n.sends.failedLast24h} failed and {n.queued.count} waiting
      </p>
    </li>
  );
}

// Every company's numbers, the ones that need attention first. Phone numbers are shortened to their last four digits.
export function NumberHealthSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [problemsOnly, setProblemsOnly] = useState(true);
  const q = useQuery({ queryKey: ["platform-number-health", problemsOnly], queryFn: () => fetchPlatformNumberHealth(problemsOnly), enabled: open, refetchInterval: 60000 });
  const d = q.data;
  return (
    <Sheet open={open} onClose={onClose} title="Number health" subtitle="How every company's WhatsApp numbers are doing. Phone numbers are shortened." footer={closeButton(onClose)}>
      <div className="space-y-5">
        {q.error && <Notice tone="error">{(q.error as Error).message}</Notice>}
        <Segmented
          label="Show"
          value={problemsOnly ? "problems" : "all"}
          onChange={(v) => setProblemsOnly(v === "problems")}
          items={[
            { key: "problems", label: "Needs attention" },
            { key: "all", label: "All numbers" },
          ]}
        />
        {d && (
          <div className="flex flex-wrap gap-2" aria-label="Totals">
            <Pill tone="danger">Down {d.totals.down}</Pill>
            <Pill tone="warn">Needs a look {d.totals.warn}</Pill>
            <Pill tone="ok">Healthy {d.totals.ok}</Pill>
          </div>
        )}
        {d && d.companies.length === 0 && <p className="text-[14px] text-fg-3">{problemsOnly ? "Every number is healthy." : "No numbers yet."}</p>}
        {d?.companies.map((c) => (
          <section key={c.id} aria-label={c.name}>
            <h3 className="text-[15px] font-semibold">
              {c.name}
              {c.status !== "active" && <span className="ml-2 text-[12.5px] text-fg-3 font-normal">suspended</span>}
            </h3>
            <ul className="divide-y divide-line">
              {c.numbers.map((n) => (
                <NumberLine key={n.sessionName} n={n} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Sheet>
  );
}

const EXCEPTIONS: { key: keyof BillingAudit["exceptions"]; title: string; why: string }[] = [
  { key: "amountMismatch", title: "Payment did not match the order", why: "Nothing was activated. Check it in the Razorpay dashboard." },
  { key: "notSettled", title: "Paid at the gateway, not settled here", why: "The gateway has a payment for these orders but they are still open." },
  { key: "paidButNoSubscriptionRecord", title: "Order marked paid, no subscription payment", why: "The money is in but the period was not recorded." },
  { key: "paymentWithoutInvoice", title: "Payment with no invoice", why: "Issue the invoice from the company's payment history." },
  { key: "webhooksNotProcessed", title: "Gateway messages not processed", why: "Razorpay will retry. If this stays, look at the server log." },
  { key: "invoiceNumberGaps", title: "Gaps in invoice numbers", why: "A skipped number in a series needs an accountant's explanation." },
  { key: "invalidSignatures", title: "Payment with a bad signature", why: "Someone sent a payment result that was not signed by Razorpay." },
];

function ExceptionRow({ k, x }: { k: keyof BillingAudit["exceptions"]; x: any }) {
  switch (k) {
    case "amountMismatch":
    case "notSettled":
    case "paidButNoSubscriptionRecord":
      return (
        <>
          {x.company} · {money(x.totalMinor, x.currency)} · order {x.orderId}
          {x.paymentId ? ` · ${x.paymentId}` : ""}
          {x.reason ? ` · ${x.reason}` : ""}
        </>
      );
    case "paymentWithoutInvoice":
      return (
        <>
          {x.company} · {x.plan} · {money(Math.round(x.amount * 100), x.currency)} · {x.source === "gateway" ? "online" : "recorded by hand"}
        </>
      );
    case "webhooksNotProcessed":
      return (
        <>
          {x.event} · {x.eventId} · received {when(x.receivedAt)}
        </>
      );
    case "invoiceNumberGaps":
      return (
        <>
          {x.series}/{String(x.missing).padStart(5, "0")} was never issued
        </>
      );
    default:
      return (
        <>
          {x.company} · {when(x.at)}
        </>
      );
  }
}

// The books: what came in against the invoices that went out, and everything that does not add up.
export function BillingAuditSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [days, setDays] = useState("30");
  const q = useQuery({ queryKey: ["billing-audit", days], queryFn: () => fetchBillingAudit(Number(days)), enabled: open });
  const a = q.data;
  return (
    <Sheet open={open} onClose={onClose} title="Billing audit" subtitle="Money that came in against the invoices issued, and anything that does not add up." footer={closeButton(onClose)}>
      <div className="space-y-6">
        {q.error && <Notice tone="error">{(q.error as Error).message}</Notice>}
        <Field label="Period">
          <select aria-label="Period" value={days} onChange={(e) => setDays(e.target.value)} className={selectCls}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="366">Last year</option>
          </select>
        </Field>
        {!a && !q.error && <p className="text-[14px] text-fg-3">Loading…</p>}
        {a && (
          <>
            <section aria-label="Exceptions">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-[13px] font-semibold text-fg-2">To look at</h3>
                <Pill tone={a.exceptionCount ? "danger" : "ok"}>{a.exceptionCount ? `${a.exceptionCount} found` : "Nothing found"}</Pill>
              </div>
              {EXCEPTIONS.map(({ key, title, why }) => {
                const list = a.exceptions[key] as any[];
                if (!list.length) return null;
                return (
                  <div key={key} className="mb-4">
                    <h4 className="text-[14.5px] font-medium">
                      {title} <span className="num text-danger">{list.length}</span>
                    </h4>
                    <p className="text-[12.5px] text-fg-3 mb-1">{why}</p>
                    <ul className="text-[13.5px] text-fg-2 space-y-1">
                      {list.map((x, i) => (
                        <li key={i}>
                          <ExceptionRow k={key} x={x} />
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>
            <section aria-label="Takings">
              <h3 className="text-[13px] font-semibold text-fg-2 mb-2">Payments recorded</h3>
              {a.payments.takings.length === 0 ? (
                <p className="text-[14px] text-fg-3">None in this period.</p>
              ) : (
                <ul className="text-[14px] space-y-1">
                  {a.payments.takings.map((t) => (
                    <li key={`${t.currency}-${t.source}`}>
                      <span className="num font-medium">{money(Math.round(t.amount * 100), t.currency)}</span> from <span className="num">{t.payments}</span> {t.source === "gateway" ? "online" : t.source === "autopay" ? "autopay" : "recorded by hand"}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section aria-label="Invoices">
              <h3 className="text-[13px] font-semibold text-fg-2 mb-2">Invoices issued</h3>
              {a.invoices.length === 0 ? (
                <p className="text-[14px] text-fg-3">None in this period.</p>
              ) : (
                <ul className="text-[14px] space-y-1">
                  {a.invoices.map((i) => (
                    <li key={i.currency}>
                      <span className="num">{i.invoices}</span> invoices · taxable <span className="num">{money(i.taxableMinor, i.currency)}</span> · GST <span className="num">{money(i.taxMinor, i.currency)}</span> · total <span className="num font-medium">{money(i.totalMinor, i.currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {a.refunds.map((r) => (
                <p key={r.currency} className="mt-2 text-[13.5px] text-fg-2">
                  Refunded: <span className="num">{money(r.amountMinor, r.currency)}</span> in {r.refunds}
                </p>
              ))}
            </section>
            <section aria-label="Orders">
              <h3 className="text-[13px] font-semibold text-fg-2 mb-2">Online orders</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(a.orders).map(([status, n]) => (
                  <Pill key={status} tone={status === "paid" ? "ok" : status === "mismatch" || status === "failed" ? "danger" : "neutral"}>
                    {status} {n}
                  </Pill>
                ))}
                {Object.keys(a.orders).length === 0 && <span className="text-[14px] text-fg-3">None.</span>}
              </div>
            </section>
            <section aria-label="Activity">
              <h3 className="text-[13px] font-semibold text-fg-2 mb-2">Billing activity</h3>
              <ul className="divide-y divide-line text-[13.5px]">
                {a.events.slice(0, 30).map((e) => (
                  <li key={e.id} className="py-1.5 flex justify-between gap-3">
                    <span className="min-w-0 truncate">
                      {e.company} · {e.type}
                      {e.actor ? ` · ${e.actor}` : ""}
                    </span>
                    <span className="shrink-0 text-fg-3">{when(e.at)}</span>
                  </li>
                ))}
                {a.events.length === 0 && <li className="py-1.5 text-fg-3">Nothing in this period.</li>}
              </ul>
            </section>
          </>
        )}
      </div>
    </Sheet>
  );
}

const SECTION_LABEL: Record<SupportSection, string> = { team: "Team", numbers: "Numbers", activity: "Account activity" };

// Looking at one company's account takes a stated reason and a short session. The company is told, and every look
// is written where it can read it. Chats, contacts and files are not part of this.
export function SupportSheet({ company, onClose }: { company: Company | null; onClose: () => void }) {
  const qc = useQueryClient();
  const id = company?.id ?? "";
  const sessions = useQuery({ queryKey: ["support-sessions", id], queryFn: () => fetchSupportSessions(id), enabled: !!company });
  const open = sessions.data?.find((s) => s.active) ?? null;
  const [reason, setReason] = useState(""),
    [minutes, setMinutes] = useState("60"),
    [section, setSection] = useState<SupportSection>("team"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const look = useQuery({
    queryKey: ["support-look", id, section, open?.id],
    queryFn: () => fetchSupportSection<SupportTeamMember | NumberHealthRow | SupportActivity>(id, section),
    enabled: !!company && !!open,
    retry: false,
  });
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ["support-sessions", id] });
      await qc.invalidateQueries({ queryKey: ["support-look", id] });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const close = () => {
    setReason("");
    setError("");
    onClose();
  };
  return (
    <Sheet open={!!company} onClose={close} title="Support access" subtitle={company ? `${company.name}: look at the account, on the record.` : ""} footer={closeButton(close)}>
      <div className="space-y-6">
        {error && <Notice tone="error">{error}</Notice>}
        {!open ? (
          <form
            aria-label="Open a support session"
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void run(() => startSupportSession(id, reason.trim(), Number(minutes)));
            }}
          >
            <p className="text-[14px] text-fg-2">
              A support session shows this company's team, the health of its numbers and its account activity. It never shows chats, contacts or files. The owner is told, and can read your reason and everything you looked at.
            </p>
            <Field label="Why do you need to look?" hint="At least 10 characters. The company will read this.">
              <textarea aria-label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} className="w-full rounded-2xl bg-surface-2 px-4 py-3 text-[15px]" />
            </Field>
            <Field label="For how long">
              <select aria-label="Session length" value={minutes} onChange={(e) => setMinutes(e.target.value)} className={selectCls}>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </select>
            </Field>
            <button className={btn("primary")} disabled={busy || reason.trim().length < 10}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              Open support session
            </button>
          </form>
        ) : (
          <>
            <div className="rounded-2xl bg-surface-2 p-3.5 text-[14px] flex flex-wrap items-center justify-between gap-3">
              <p>
                <Pill tone="ok" dot>
                  Open
                </Pill>{" "}
                until {when(open.expiresAt)} · “{open.reason}”
              </p>
              <button type="button" className={btn("secondary", "sm")} disabled={busy} onClick={() => void run(() => endSupportSession(id))}>
                End session
              </button>
            </div>
            <Segmented
              label="Look at"
              value={section}
              onChange={setSection}
              items={(Object.keys(SECTION_LABEL) as SupportSection[]).map((k) => ({ key: k, label: SECTION_LABEL[k] }))}
            />
            {look.error && <Notice tone="error">{(look.error as Error).message}</Notice>}
            {look.isPending && <p className="text-[14px] text-fg-3">Loading…</p>}
            {look.data && section === "team" && (
              <ul className="divide-y divide-line" aria-label="Team">
                {(look.data as SupportTeamMember[]).map((m) => (
                  <li key={m.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-[14px]">
                    <span>
                      {m.name} <span className="text-fg-3">· {m.email}</span>
                    </span>
                    <span className="text-fg-2 capitalize">
                      {m.role} · {m.team}
                      {m.status !== "active" ? ` · ${m.status}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {look.data && section === "numbers" && (
              <ul className="divide-y divide-line" aria-label="Numbers">
                {(look.data as NumberHealthRow[]).map((n) => (
                  <NumberLine key={n.sessionName} n={n} />
                ))}
                {look.data.length === 0 && <li className="py-2 text-[14px] text-fg-3">No numbers yet.</li>}
              </ul>
            )}
            {look.data && section === "activity" && (
              <ul className="divide-y divide-line text-[13.5px]" aria-label="Account activity">
                {(look.data as SupportActivity[]).map((e) => (
                  <li key={e.id} className="py-1.5 flex justify-between gap-3">
                    <span className="min-w-0 truncate">
                      {e.type}
                      {e.actor ? ` · ${e.actor}` : ""}
                    </span>
                    <span className="shrink-0 text-fg-3">{when(e.at)}</span>
                  </li>
                ))}
                {look.data.length === 0 && <li className="py-2 text-fg-3">Nothing yet.</li>}
              </ul>
            )}
          </>
        )}
        <SupportHistory sessions={sessions.data ?? []} />
      </div>
    </Sheet>
  );
}

const ACTION_TEXT: Record<string, string> = { viewed_team: "the team list", viewed_numbers: "the health of the numbers", viewed_activity: "the account activity" };

// The record: each session with its reason and everything that was looked at. The company sees the same list.
export function SupportHistory({ sessions, empty = "No support sessions yet." }: { sessions: SupportSession[]; empty?: string }) {
  return (
    <section aria-label="Support sessions">
      <h3 className="text-[13px] font-semibold text-fg-2 mb-2">Support sessions on this account</h3>
      {sessions.length === 0 && <p className="text-[14px] text-fg-3">{empty}</p>}
      <ul className="space-y-3">
        {sessions.map((s) => (
          <li key={s.id} className="rounded-2xl bg-surface-2 p-3.5 text-[13.5px]">
            <p className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-fg">{s.adminName || "Scriwo support"}</span>
              <span className="text-fg-3">{when(s.startedAt)}</span>
              <Pill tone={s.active ? "ok" : "neutral"}>{s.active ? "Open" : s.endedAt ? "Ended" : "Expired"}</Pill>
            </p>
            <p className="mt-1 text-fg" dir="auto">
              {s.reason}
            </p>
            <p className="mt-1 text-fg-3">
              {s.actions.length === 0 ? "Nothing was looked at." : `Looked at ${[...new Set(s.actions.map((a) => ACTION_TEXT[a.action] || a.action))].join(", ")}.`}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
