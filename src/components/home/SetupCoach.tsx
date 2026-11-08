import { Check, ChevronRight } from "lucide-react";
import type { HomeData } from "../../services/api";
import { btn } from "../ui/styles";

type Setup = NonNullable<HomeData["setup"]>;

/** Real progress comes from the server, never a dismissed guide or a button click. */
export function SetupCoach({ setup, onStep }: { setup: Setup; onStep: (key: Setup["steps"][number]["key"]) => void }) {
  const pct = Math.round((setup.done / setup.total) * 100);
  const next = setup.steps.find((step) => !step.done);
  const activation = setup.steps.some((step) => step.key === "reply");
  const firstReplyDone = setup.steps.some((step) => step.key === "reply" && step.done);
  const detail = next?.key === "connect"
    ? "In WhatsApp on your phone, open Linked devices, then Link a device and scan the code shown here. Your phone keeps working."
    : next?.key === "reply"
      ? "Ask someone to send a message to your linked number from another WhatsApp number. Open the inbox and reply. This step completes when WhatsApp reports delivery; a private note or an automatic reply does not count."
      : next?.key === "team"
        ? "Invite a teammate from Team. This step completes when they accept and join. Staff see their own number’s chats and chats assigned to them; owners and administrators see company chats."
        : null;
  const action = next?.key === "connect" ? "Connect my number" : next?.key === "reply" ? "Open inbox and reply" : next?.key === "team" ? "Invite a teammate" : null;
  return (
    <section aria-labelledby="setup-title" className="rounded-3xl bg-surface border border-line p-5 sm:p-6 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="setup-title" className="text-[17px] font-semibold text-fg">
          {activation ? firstReplyDone ? "Your first enquiry is handled" : "Handle your first enquiry" : "Get set up"}
        </h2>
        <span className="text-[13px] text-fg-3 num">{setup.done} of {setup.total}</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-label="Workspace setup" aria-valuemin={0} aria-valuemax={setup.total} aria-valuenow={setup.done}>
        <div className="h-full rounded-full bg-gold-gradient transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
      {activation && detail && <p className="mt-4 text-[14.5px] leading-relaxed text-fg-2">{detail}</p>}
      {activation && next?.key === "connect" && (
        <p className="mt-2 text-[13px] leading-relaxed text-fg-3">Owners and administrators can see company chats. Staff see their own number’s chats and those assigned to them. You can remove the link from Numbers.</p>
      )}
      {activation && next && action && (
        <button type="button" className={`${btn("primary")} mt-4`} onClick={() => onStep(next.key)}>{action}<ChevronRight className="h-4 w-4" aria-hidden /></button>
      )}
      <ul className="mt-4 divide-y divide-line/60">
        {setup.steps.map((step) => (
          <li key={step.key}>
            <button type="button" disabled={step.done} onClick={() => onStep(step.key)} className="w-full flex items-center gap-3 py-3 text-left disabled:cursor-default group">
              <span className={`h-6 w-6 rounded-full grid place-items-center shrink-0 ${step.done ? "bg-ok/15 text-ok" : "ring-1 ring-line text-transparent"}`}><Check className="w-3.5 h-3.5" aria-hidden /></span>
              <span className={`flex-1 text-[14.5px] ${step.done ? "text-fg-3 line-through" : "text-fg font-medium"}`}>{step.label}</span>
              {!step.done && <ChevronRight className="w-4 h-4 text-fg-3" aria-hidden />}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
