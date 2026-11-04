import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { Search, Smartphone, Sparkles } from "lucide-react";
import { fetchHome, getStoredTenantId, updateLeadTask, type HomeItem } from "../../services/api";
import { Notice, Page } from "../ui/Page";
import { btn } from "../ui/styles";
import { RiwoAvatar } from "../user/Riwo";
import { ChatCard, NumberCard, TaskCard } from "./NeedCards";
import { Performance } from "./Performance";
import { SetupCoach } from "./SetupCoach";
import { AutopilotPanel } from "./AutopilotPanel";
import { dayLine, endOfToday, greetingFor } from "./greeting";
import { useIsPhone } from "../../hooks/useMedia";
import { usePhoneChrome } from "../mobile/PhoneChrome";

export interface TodayProps {
  workspaceName: string;
  /** Riwo's drafts: whether this company can use them, or is on a plan without them */
  ai: { available: boolean; locked: boolean };
  /** Whether any number is connected (a workspace with none is shown how to start) */
  hasNumber: boolean;
  onOpenChat: (conversationId: string) => void;
  onSend: (conversationId: string, text: string) => Promise<void>;
  onSearch: () => void;
  onOpenInbox: () => void;
  onOpenNumbers: () => void;
  onConnectNumber: () => void;
  onSetupStep: (key: "connect" | "reply" | "replies" | "automation" | "team") => void;
  /** Opens the plans, for a company whose plan has no Autopilot */
  onPlan?: () => void;
}

// The first screen: what needs the person now, with the work already prepared, then everything else, quieter.
export function Today(props: TodayProps) {
  const tenant = getStoredTenantId();
  const qc = useQueryClient();
  const home = useQuery({
    queryKey: ["home", tenant],
    queryFn: () => fetchHome(endOfToday()),
    refetchInterval: 30_000,
  });
  const data = home.data;
  const refresh = () => qc.invalidateQueries({ queryKey: ["home", tenant] });
  const phone = useIsPhone();
  const chrome = usePhoneChrome();
  // on a phone the list is the first three things; the rest is one tap away
  const [expanded, setExpanded] = useState(false);

  // a small celebration when the last waiting thing is dealt with, never on first load
  const total = data ? data.counts.waiting + data.counts.tasksDue + data.counts.numbersNeedingCare : null;
  const before = useRef<number | null>(null);
  useEffect(() => {
    if (total === null) return;
    if (before.current !== null && before.current > 0 && total === 0 && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.35 } });
    before.current = total;
  }, [total]);

  const done = async (item: Extract<HomeItem, { kind: "task" }>) => {
    await updateLeadTask(item.taskId, { done: true });
    await refresh();
  };
  const snooze = async (item: Extract<HomeItem, { kind: "task" }>) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    await updateLeadTask(item.taskId, { dueAt: tomorrow.toISOString() });
    await refresh();
  };

  if (home.error)
    return (
      <Page>
        <Notice tone="error">{home.error.message}</Notice>
        <button className={`${btn("secondary", "sm")} mt-3`} onClick={() => void home.refetch()}>
          Try again
        </button>
      </Page>
    );
  if (!data)
    return (
      <Page>
        <div className="skeleton h-10 w-80 max-w-full mb-3" />
        <div className="skeleton h-5 w-[28rem] max-w-full mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-32 !rounded-3xl" />
          ))}
        </div>
        <span className="sr-only">Loading what needs you</span>
      </Page>
    );

  // Older backends provide only setup; a completed new setup must not fall back to the legacy checklist.
  const setup = data.activation?.setup !== undefined ? data.activation.setup : data.setup;
  const firstEnquiry = setup?.steps.some((s) => s.key === "reply" && !s.done);
  const dayText = props.hasNumber || data.needsYou.length ? dayLine(data.counts, data.replyTargetMinutes) : "Connect your WhatsApp number and your customers' messages will appear here.";
  const shown = phone && !expanded ? data.needsYou.slice(0, 3) : data.needsYou;
  const hiddenHere = data.needsYou.length - shown.length;

  return (
    <Page>
      {phone ? (
        // A phone gets a greeting, one line of what is going on, and the alerts: the work starts right under it.
        <header className="pt-1">
          <div className="flex items-center gap-1">
            <h1 className="flex-1 min-w-0 font-serif text-[27px] leading-[1.15] text-fg tracking-tight">
              {greetingFor()}
              {data.firstName ? `, ${data.firstName}` : ""}
            </h1>
            <button type="button" onClick={props.onSearch} aria-label="Search and commands" className="press h-11 w-11 shrink-0 grid place-items-center rounded-full text-fg-2">
              <Search className="w-[22px] h-[22px]" strokeWidth={1.9} aria-hidden />
            </button>
            {chrome?.bell}
          </div>
          <p className="mt-0.5 text-[14.5px] leading-snug text-fg-2" aria-live="polite">
            {dayText}
          </p>
        </header>
      ) : (
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <RiwoAvatar size={52} className="mt-1" />
          <div className="min-w-0">
            <p className="eyebrow">{props.workspaceName}</p>
            <h1 className="mt-1 font-serif text-[34px] sm:text-[40px] leading-[1.1] text-fg tracking-tight">
              {greetingFor()}
              {data.firstName ? `, ${data.firstName}` : ""}
            </h1>
            <p className="mt-2 text-[15.5px] text-fg-2 max-w-2xl" aria-live="polite">
              {dayText}
            </p>
          </div>
        </div>
        <button type="button" onClick={props.onSearch} className="inline-flex items-center gap-2.5 h-11 pl-4 pr-3 rounded-full bg-surface border border-line text-[14px] text-fg-3 hover:text-fg hover:border-gold/50 transition shadow-card" aria-label="Search and commands (Command K)">
          <Search className="w-4 h-4" aria-hidden />
          Search or jump to…
          <kbd className="ml-3 hidden sm:inline-block rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] text-fg-3">⌘K</kbd>
        </button>
      </header>
      )}

      {firstEnquiry && setup && (
        <div className="mt-5"><SetupCoach setup={setup} onStep={props.onSetupStep} /></div>
      )}

      {data.brief && (
        <section aria-label="Morning brief" className={`${phone ? "mt-3 px-4 py-3" : "mt-6 px-5 py-4"} rounded-3xl border border-gold/30 bg-gold/[0.06] flex items-start gap-3.5`}>
          <Sparkles className="w-5 h-5 mt-0.5 shrink-0 text-gold" aria-hidden />
          <div className="min-w-0">
            <p className="eyebrow">Morning brief</p>
            <p className="mt-1 text-[15px] leading-relaxed text-fg">{data.brief.text}</p>
          </div>
        </section>
      )}

      <div className={`${phone ? "mt-4" : "mt-8"} grid gap-6 lg:grid-cols-[1fr_20rem] items-start`}>
        {(!firstEnquiry || data.needsYou.length > 0) && <section aria-labelledby="needs-title">
          <h2 id="needs-title" className="eyebrow mb-3">
            Needs you now
          </h2>
          {!props.hasNumber && data.needsYou.length === 0 ? (
            <div className="rounded-3xl bg-surface border border-line p-8 text-center shadow-card">
              <img src="/brand/riwo-wave.webp" alt="" width={96} height={96} className="mx-auto h-24 w-24 rounded-3xl object-cover" />
              <h3 className="mt-3 text-[20px] font-semibold text-fg">Let's connect your WhatsApp number</h3>
              <p className="mt-1.5 text-[14.5px] text-fg-2 max-w-md mx-auto">Scan the code from WhatsApp’s Linked devices. Owners and administrators can see company chats; staff see their own number’s chats and chats assigned to them.</p>
              <button type="button" className={`${btn("primary")} mt-5`} onClick={props.onConnectNumber}>
                <Smartphone className="w-4 h-4" aria-hidden /> Connect a number
              </button>
            </div>
          ) : data.needsYou.length === 0 ? (
            <div className="rounded-3xl bg-surface border border-line p-8 text-center shadow-card">
              <RiwoAvatar size={64} className="mx-auto" />
              <h3 className="mt-3 text-[20px] font-semibold text-fg">{firstEnquiry ? "Ready for your first enquiry" : "All clear"}</h3>
              <p className="mt-1.5 text-[14.5px] text-fg-2 max-w-md mx-auto">There are no waiting enquiries or due follow-ups here. New messages will appear as they arrive.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {shown.map((item) =>
                item.kind === "chat" ? (
                  <ChatCard key={item.id} item={item} ai={props.ai} onOpenChat={props.onOpenChat} onSend={props.onSend} onSent={() => void refresh()} />
                ) : item.kind === "task" ? (
                  <TaskCard key={item.id} item={item} onOpenChat={props.onOpenChat} onDone={done} onSnooze={snooze} />
                ) : (
                  <NumberCard key={item.id} item={item} onOpenNumbers={props.onOpenNumbers} />
                ),
              )}
            </ul>
          )}
          {phone && hiddenHere > 0 && (
            <button type="button" className={`${btn("secondary")} mt-3 w-full`} onClick={() => setExpanded(true)}>
              Show {hiddenHere} more
            </button>
          )}
          {data.more > 0 && (
            <button type="button" className={`${btn("ghost", "sm")} mt-3`} onClick={props.onOpenInbox}>
              And {data.more} more. Open the inbox to see them all.
            </button>
          )}
        </section>}
        <aside className="space-y-6">
          {!firstEnquiry && setup && <SetupCoach setup={setup} onStep={props.onSetupStep} />}
          {!firstEnquiry && <AutopilotPanel onOpenChat={props.onOpenChat} onPlan={props.onPlan} />}
        </aside>
      </div>

      <Performance />
    </Page>
  );
}
