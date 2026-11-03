import type { LucideIcon } from "lucide-react";

/**
 * The one main thing to do on a screen (start a chat, add a contact, add a lead), a round button under the thumb. Phones only: on a
 * big screen the same action is in the header. It sits above the tab bar, wherever that is (`--tabbar-h`), and steps aside when
 * the bar does.
 */
export function Fab({ label, icon: Icon, onClick, hidden = false }: { label: string; icon: LucideIcon; onClick: () => void; hidden?: boolean }) {
  if (hidden) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="lg:hidden press fixed right-4 z-40 h-14 w-14 rounded-[20px] bg-brand-solid text-white grid place-items-center pop animate-rise"
      style={{ bottom: "calc(var(--tabbar-h, 0px) + 16px)" }}
    >
      <Icon className="w-6 h-6" strokeWidth={2} aria-hidden />
    </button>
  );
}
