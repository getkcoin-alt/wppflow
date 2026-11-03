import { useEffect, useState, type RefObject } from "react";
import { ArrowUp, FileText, Lock, MessageSquareText, Plus, Reply, Sparkles, StickyNote, X } from "lucide-react";
import { ActionSheet, type SheetAction } from "../../mobile/ActionSheet";
import { RiwoAvatar } from "../Riwo";
import { haptic } from "../../../utils/haptics";

/**
 * The reply box on a phone: one row. A "+" for everything that is not words (a file, a saved reply, a private note, Riwo), a box
 * that grows with what is written, and one button on the right: send, or, with nothing written and a customer waiting, Riwo's
 * draft. A private note says so in yellow, and is one tap to leave.
 */
export function PhoneComposer({
  value,
  onChange,
  onSend,
  inputRef,
  note,
  onNote,
  replyingTo,
  onCancelReply,
  writing,
  attach,
  onQuickReplies,
  riwo,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
  note: boolean;
  onNote: (on: boolean) => void;
  replyingTo: { senderName: string; text: string } | null;
  onCancelReply: () => void;
  /** teammates writing a reply to this customer right now */
  writing?: string;
  /** attaching a file: unavailable (with why) or ready */
  attach: { enabled: boolean; onPick: () => void };
  onQuickReplies: () => void;
  /** Riwo's draft and summary, when the company has the assistant */
  riwo?: { draft: (() => void) | null; summarize: () => void } | null;
}) {
  const [tray, setTray] = useState(false);
  const textarea = inputRef as RefObject<HTMLTextAreaElement>;
  // the box grows with what is written, up to five lines, then scrolls
  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    // measured only when it can be (a box inside a hidden screen measures 0 and would stay collapsed once shown)
    const h = el.scrollHeight;
    el.style.height = h > 0 ? `${Math.min(h, 132)}px` : "";
  }, [value, textarea]);

  const has = value.trim().length > 0;
  const send = () => {
    if (!has) return;
    haptic.tick();
    onSend();
  };

  const actions: SheetAction[] = [
    { key: "file", label: "Photo or file", icon: FileText, hint: attach.enabled ? "Up to 10 MB" : "Media storage is not set up", disabled: !attach.enabled, onSelect: attach.onPick },
    { key: "quick", label: "Quick replies", icon: MessageSquareText, hint: "Saved answers you use often", onSelect: onQuickReplies },
    { key: "note", label: note ? "Back to replying" : "Private team note", icon: note ? Reply : StickyNote, hint: note ? undefined : "Only your team sees it", onSelect: () => onNote(!note) },
  ];
  if (riwo?.draft) actions.push({ key: "riwo-draft", label: "Riwo: write a reply", icon: Sparkles, hint: "A draft you read and edit first", onSelect: riwo.draft });
  if (riwo) actions.push({ key: "riwo-summary", label: "Riwo: summarize this chat", icon: Sparkles, onSelect: riwo.summarize });

  const spark = !has && riwo?.draft ? riwo.draft : null;

  return (
    <div className="shrink-0 bg-app px-2 pt-1.5 relative z-30" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}>
      {writing && (
        <p role="status" className="mb-1.5 mx-1 px-3 py-1 rounded-full bg-warn/10 text-warn text-[13px] font-medium flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" aria-hidden />
          {writing}
        </p>
      )}
      {note && (
        <div className="mb-1.5 mx-1 pl-3 pr-1 h-9 rounded-xl bg-note text-warn text-[13.5px] font-medium flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span className="flex-1 truncate">Private note · only your team sees it</span>
          <button type="button" aria-label="Leave the private note" onClick={() => onNote(false)} className="h-9 w-9 grid place-items-center">
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>
      )}
      {replyingTo && !note && (
        <div className="mb-1.5 mx-1 pl-3 pr-1 py-1.5 rounded-xl bg-surface-2 border-l-4 border-brand-solid flex items-start gap-2 animate-fade">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-semibold text-brand truncate">Replying to {replyingTo.senderName}</div>
            <p className="text-[13px] text-fg-2 truncate">{replyingTo.text || "Media"}</p>
          </div>
          <button type="button" aria-label="Cancel reply" onClick={onCancelReply} className="h-9 w-9 shrink-0 grid place-items-center text-fg-3">
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>
      )}
      <div className="flex items-end gap-1.5">
        <button type="button" aria-label="More to send" aria-haspopup="dialog" onClick={() => setTray(true)} className="press h-11 w-11 shrink-0 grid place-items-center rounded-full text-fg-2 bg-surface-2">
          <Plus className="w-6 h-6" strokeWidth={2} aria-hidden />
        </button>
        <textarea
          ref={textarea}
          rows={1}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (e.target.value === "/") onQuickReplies();
          }}
          aria-label={note ? "Write a private team note" : "Write a message"}
          placeholder={note ? "Private note for your team" : "Message"}
          enterKeyHint="enter"
          className={`flex-1 min-w-0 resize-none rounded-3xl px-4 py-[11px] text-[16px] leading-snug max-h-[132px] focus:outline-none ring-1 ${note ? "bg-note ring-warn/40" : "bg-surface ring-line"}`}
        />
        {spark ? (
          <button type="button" aria-label="Ask Riwo for a reply" onClick={spark} className="press h-11 w-11 shrink-0 grid place-items-center rounded-full bg-surface-2">
            <RiwoAvatar size={26} />
          </button>
        ) : (
          <button
            type="button"
            aria-label={note ? "Save note" : "Send message"}
            disabled={!has}
            onClick={send}
            className={`press h-11 w-11 shrink-0 grid place-items-center rounded-full text-white transition-colors ${note ? "bg-warn" : "bg-brand-solid"} disabled:opacity-35`}
          >
            <ArrowUp className="w-6 h-6" strokeWidth={2.4} aria-hidden />
          </button>
        )}
      </div>
      <ActionSheet open={tray} onClose={() => setTray(false)} title="Add to this chat" actions={actions} />
    </div>
  );
}
