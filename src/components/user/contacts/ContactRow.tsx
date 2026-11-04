import { Check } from "lucide-react";
import { Avatar } from "../../ui/Avatar";
import { useLongPress } from "../../../hooks/useLongPress";
import { mobileText } from "../../../utils/chatName";

/**
 * One person in the phone's contact list: a picture, a name, a number, and a small dot for whether they have given permission for
 * broadcasts. A tap opens what can be done with them; holding a row starts choosing several, and while choosing a tap picks.
 */
export function ContactRow({
  contact,
  selecting,
  selected,
  onOpen,
  onToggle,
}: {
  contact: { id: string; name: string; phone: string; avatar?: string; optIn?: boolean };
  selecting: boolean;
  selected: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const press = useLongPress(onToggle);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selecting ? selected : undefined}
      {...press}
      onClick={selecting ? onToggle : onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") (selecting ? onToggle : onOpen)();
      }}
      className={`hit-none relative flex items-center gap-3 px-4 min-h-[68px] select-none active:bg-surface-2 transition-colors ${selected ? "bg-brand/10" : ""}`}
    >
      <span className="relative shrink-0">
        <Avatar src={contact.avatar} name={contact.name} className="h-12 w-12 rounded-full object-cover" />
        {selected && (
          <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-brand-solid text-white grid place-items-center ring-2 ring-surface">
            <Check className="w-3 h-3" strokeWidth={3} aria-hidden />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 py-2">
        <span className="block text-[16.5px] font-medium text-fg truncate" dir="auto">
          {contact.name}
        </span>
        <span className="block text-[14px] text-fg-2 truncate num">{mobileText(contact.phone)}</span>
      </span>
      <span
        role="img"
        aria-label={contact.optIn ? "Opted in to broadcasts" : "No broadcast permission"}
        title={contact.optIn ? "Opted in to broadcasts" : "No broadcast permission"}
        className={`h-2.5 w-2.5 rounded-full shrink-0 ${contact.optIn ? "bg-ok" : "bg-fg/15"}`}
      />
      <span aria-hidden className="absolute bottom-0 left-[76px] right-0 h-px bg-fg/[0.07]" />
    </div>
  );
}
