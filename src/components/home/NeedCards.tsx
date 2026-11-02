import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, Check, Clock, Loader2, Lock, MessageSquare, Send, Sparkles, Smartphone, UserRound, X } from "lucide-react";
import { aiSuggestReply, type AiTone, type HomeItem } from "../../services/api";
import { Avatar } from "../ui/Avatar";
import { RiwoAvatar } from "../user/Riwo";
import { btn } from "../ui/styles";
import { formatDuration } from "../../utils/duration";

type ChatItem = Extract<HomeItem, { kind: "chat" }>;
type TaskItem = Extract<HomeItem, { kind: "task" }>;
type NumberItem = Extract<HomeItem, { kind: "number" }>;

const TONES: { key: AiTone; label: string }[] = [
  { key: "friendly", label: "Friendly" },
  { key: "professional", label: "Professional" },
  { key: "brief", label: "Brief" },
];

const MOOD_DOT = { positive: "bg-ok", neutral: "bg-fg-3", frustrated: "bg-danger", urgent: "bg-warn" } as const;
const MOOD_LABEL = { positive: "Positive", neutral: "Neutral", frustrated: "Frustrated", urgent: "Urgent" } as const;

const card = "rounded-3xl bg-surface border border-line p-4 sm:p-5 shadow-card transition-shadow hover:shadow-pop";

/** A customer who is waiting: who, for how long, what they said, and Riwo's draft one tap away. */
export function ChatCard({
  item,
  ai,
  onOpenChat,
  onSend,
  onSent,
}: {
  item: ChatItem;
  ai: { available: boolean; locked: boolean };
  onOpenChat: (conversationId: string) => void;
  onSend: (conversationId: string, text: string) => Promise<void>;
  onSent: () => void;
}) {
  const prep = item.prep;
  const [draft, setDraft] = useState<{ text: string; tone: AiTone; prepared?: boolean } | null>(prep?.draft ? { text: prep.draft, tone: "friendly", prepared: true } : null);
  const [busy, setBusy] = useState<"draft" | "send" | null>(null);
  const [error, setError] = useState("");
  // Riwo finished preparing after the card was shown: offer it, unless the person has already started something else
  const [declined, setDeclined] = useState(false);
  useEffect(() => {
    if (prep?.draft && !declined) setDraft((d) => d ?? { text: prep.draft, tone: "friendly", prepared: true });
  }, [prep?.draft, declined]);
  // a draft with a [bracketed placeholder] is Riwo saying it needs a fact only a person has
  const needsFilling = draft ? /\[[^\]\n]+\]/.test(draft.text) : false;

  const write = async (tone: AiTone) => {
    setBusy("draft");
    setError("");
    try {
      const out = await aiSuggestReply(item.conversationId, tone);
      setDraft({ text: out.text, tone });
      setDeclined(false);
    } catch (e: any) {
      setError(e.message || "Riwo couldn't write a reply just now.");
    } finally {
      setBusy(null);
    }
  };
  const send = async () => {
    if (!draft?.text.trim()) return;
    setBusy("send");
    setError("");
    try {
      await onSend(item.conversationId, draft.text.trim());
      onSent();
    } catch (e: any) {
      setError(e.message || "The message wasn't sent.");
      setBusy(null);
    }
  };

  return (
    <li className={`${card} ${item.askedForPerson ? "ring-2 ring-danger/40" : ""}`} data-testid={`need-${item.id}`}>
      <div className="flex items-start gap-3.5">
        <Avatar src={item.avatar} name={item.title} className="h-12 w-12 rounded-full object-cover shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h3 className="text-[16px] font-semibold text-fg truncate">{item.title}</h3>
            {item.askedForPerson && (
              <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[12px] font-semibold bg-danger text-white" title="The customer asked to talk to a person. Riwo has stopped answering them.">
                <UserRound className="w-3 h-3" aria-hidden />
                Asked for a person
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[12px] font-medium ${item.overdue ? "bg-danger/10 text-danger" : "bg-warn/10 text-warn"}`}
              title={item.overdue ? "Past your reply target" : "Waiting for a reply"}
            >
              <Clock className="w-3 h-3" aria-hidden />
              Waiting {formatDuration(item.waitingSeconds)}
            </span>
            {item.assignedTo && <span className="text-[12px] text-fg-3">Assigned to {item.assignedTo}</span>}
          </div>
          {prep && (prep.summary || prep.mood) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-fg-2">
              {prep.mood && (
                <span className="inline-flex items-center gap-1.5 text-fg-2" title={prep.moodNote || undefined}>
                  <span aria-hidden className={`h-2 w-2 rounded-full ${MOOD_DOT[prep.mood]}`} />
                  {MOOD_LABEL[prep.mood]}
                </span>
              )}
              {prep.summary && <span className="text-fg-2">{prep.summary}</span>}
              {prep.nextStep && <span className="text-fg-3">Next: {prep.nextStep}</span>}
            </div>
          )}
          {item.preview && (
            <p dir="auto" className="mt-1.5 text-[14.5px] text-fg-2 leading-relaxed line-clamp-2">
              “{item.preview}”
            </p>
          )}
        </div>
      </div>

      {draft && (
        <div className="mt-4 rounded-2xl bg-surface-2 p-3.5 animate-rise" role="group" aria-label={`Riwo's draft reply to ${item.title}`}>
          <div className="flex items-center gap-2 mb-2">
            <RiwoAvatar size={24} />
            <span className="text-[12.5px] font-medium text-fg-2">{draft.prepared ? "Riwo prepared this reply. Read it, change it, then send." : "Riwo's draft. Read it, change it, then send."}</span>
          </div>
          <textarea
            aria-label="Reply"
            dir="auto"
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            rows={3}
            className="w-full resize-y rounded-xl bg-surface border border-line px-3 py-2.5 text-[14.5px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-gold/60"
          />
          {needsFilling && <p className="mt-2 text-[12.5px] text-warn">Riwo left a [bracketed] part for you to fill in before this can be sent.</p>}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {TONES.map((t) => (
              <button
                key={t.key}
                type="button"
                disabled={busy !== null}
                onClick={() => void write(t.key)}
                aria-pressed={draft.tone === t.key}
                className={`h-8 px-3 rounded-full text-[12.5px] font-medium ring-1 transition ${draft.tone === t.key ? "bg-brand/10 text-brand ring-brand/30" : "bg-surface text-fg-2 ring-line hover:text-fg"}`}
              >
                {t.label}
              </button>
            ))}
            <span className="flex-1" />
            <button type="button" className={btn("ghost", "sm")} onClick={() => { setDraft(null); setDeclined(true); }} disabled={busy !== null}>
              <X className="w-4 h-4" aria-hidden /> Discard
            </button>
            <button type="button" className={btn("secondary", "sm")} onClick={() => onOpenChat(item.conversationId)} disabled={busy !== null}>
              Edit in chat
            </button>
            <button type="button" className={btn("primary", "sm")} onClick={() => void send()} disabled={busy !== null || !draft.text.trim() || needsFilling} title={needsFilling ? "Fill in the [bracketed] part first" : undefined}>
              {busy === "send" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Send className="w-4 h-4" aria-hidden />} Send
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-[13.5px] text-danger">
          {error}
        </p>
      )}

      {!draft && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {ai.available && (
            <button type="button" className={btn("primary", "sm")} disabled={busy !== null} onClick={() => void write("friendly")}>
              {busy === "draft" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Sparkles className="w-4 h-4" aria-hidden />}
              {busy === "draft" ? "Riwo is writing…" : "Draft a reply with Riwo"}
            </button>
          )}
          {!ai.available && ai.locked && (
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12.5px] text-fg-3 bg-surface-2" title="Riwo drafts replies on the Growth plan and above">
              <Lock className="w-3.5 h-3.5" aria-hidden /> Riwo drafts replies on Growth
            </span>
          )}
          <button type="button" className={btn(ai.available ? "secondary" : "primary", "sm")} onClick={() => onOpenChat(item.conversationId)}>
            <MessageSquare className="w-4 h-4" aria-hidden /> Open chat
          </button>
        </div>
      )}
    </li>
  );
}

/** A follow-up that is due: do it, push it to tomorrow, or open the chat. */
export function TaskCard({
  item,
  onOpenChat,
  onDone,
  onSnooze,
}: {
  item: TaskItem;
  onOpenChat: (conversationId: string) => void;
  onDone: (item: TaskItem) => Promise<void>;
  onSnooze: (item: TaskItem) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const run = async (fn: (i: TaskItem) => Promise<void>) => {
    setBusy(true);
    try {
      await fn(item);
    } finally {
      setBusy(false);
    }
  };
  const due = new Date(item.dueAt);
  return (
    <li className={card} data-testid={`need-${item.id}`}>
      <div className="flex items-start gap-3.5">
        <span className={`h-12 w-12 rounded-full grid place-items-center shrink-0 ${item.overdue ? "bg-danger/10 text-danger" : "bg-gold/15 text-gold"}`}>
          <CalendarClock className="w-5 h-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-semibold text-fg">{item.title}</h3>
          <p className="mt-0.5 text-[13.5px] text-fg-2">
            {item.who && <span>{item.who} · </span>}
            <span className={item.overdue ? "text-danger font-medium" : ""}>
              {item.overdue ? "Late, was due " : "Due "}
              {due.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
            {item.escalated && <span className="text-danger"> · Your manager has been told</span>}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" className={btn("primary", "sm")} disabled={busy} onClick={() => void run(onDone)}>
          <Check className="w-4 h-4" aria-hidden /> Done
        </button>
        <button type="button" className={btn("secondary", "sm")} disabled={busy} onClick={() => void run(onSnooze)}>
          Tomorrow
        </button>
        {item.conversationId && (
          <button type="button" className={btn("ghost", "sm")} onClick={() => onOpenChat(item.conversationId!)}>
            <MessageSquare className="w-4 h-4" aria-hidden /> Open chat
          </button>
        )}
      </div>
    </li>
  );
}

/** A WhatsApp number that is down or struggling. */
export function NumberCard({ item, onOpenNumbers }: { item: NumberItem; onOpenNumbers: () => void }) {
  return (
    <li className={card} data-testid={`need-${item.id}`}>
      <div className="flex items-start gap-3.5">
        <span className="h-12 w-12 rounded-full grid place-items-center shrink-0 bg-warn/10 text-warn">
          {item.level === "warn" ? <AlertTriangle className="w-5 h-5" aria-hidden /> : <Smartphone className="w-5 h-5" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-semibold text-fg">{item.title}</h3>
          <p className="mt-0.5 text-[13.5px] text-fg-2">{item.problem}</p>
        </div>
        <button type="button" className={btn("primary", "sm")} onClick={onOpenNumbers}>
          Fix it
        </button>
      </div>
    </li>
  );
}
