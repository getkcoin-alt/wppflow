import { Check, MessageSquare } from "lucide-react";
import type { LeadTask } from "../../services/api";
import { btn } from "../ui/styles";
import { dueLabel } from "../../utils/pipeline";

// The follow-ups due today and the ones that were missed: the list a sales person starts the day with.
export function TodayList({
  tasks,
  onDone,
  onSnooze,
  onOpenLead,
  onOpenChat,
}: {
  tasks: LeadTask[];
  onDone: (task: LeadTask) => void;
  onSnooze: (task: LeadTask) => void;
  onOpenLead: (leadId: string) => void;
  onOpenChat: (conversationId: string) => void;
}) {
  if (!tasks.length)
    return (
      <div className="card p-8 text-center">
        <p className="text-[16px] font-semibold">Nothing due today</p>
        <p className="mt-1 text-[14px] text-fg-2">When you set a follow-up on a lead, it shows up here on the day.</p>
      </div>
    );
  return (
    <ul className="space-y-2.5">
      {tasks.map((t) => {
        const due = dueLabel(t.dueAt);
        return (
          <li key={t.id} className="card p-4 flex items-center gap-3">
            <button type="button" aria-label={`Mark “${t.title}” done`} onClick={() => onDone(t)} className="h-9 w-9 shrink-0 grid place-items-center rounded-full ring-1 ring-line text-fg-3 hover:text-ok hover:ring-ok transition">
              <Check className="w-4 h-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium truncate" dir="auto">
                {t.title}
              </p>
              <p className="text-[13px] text-fg-2 truncate">
                <button type="button" className="hover:underline" onClick={() => onOpenLead(t.leadId)} dir="auto">
                  {t.contactName || t.leadTitle}
                </button>
                {t.stageName ? ` · ${t.stageName}` : ""} · <span className={due.late ? "text-danger" : ""}>{due.text}</span>
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button type="button" className={btn("ghost", "sm")} onClick={() => onSnooze(t)}>
                Tomorrow
              </button>
              {t.conversationId && (
                <button type="button" className={btn("secondary", "sm")} onClick={() => onOpenChat(t.conversationId!)} aria-label={`Open the chat with ${t.contactName}`}>
                  <MessageSquare className="w-4 h-4" /> Chat
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
