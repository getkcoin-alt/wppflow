import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { Avatar } from "../../ui/Avatar";

/**
 * The top of an open chat on a phone: back (with how many other chats are waiting, as in WhatsApp), who this is, and one "⋯".
 * Tapping the name opens the details. Everything else (assign, pin, done, refresh) is behind the "⋯".
 */
export function PhoneThreadHeader({
  title,
  subtitle,
  avatar,
  isGroup,
  otherUnread,
  onBack,
  onDetails,
  onMore,
}: {
  title: string;
  subtitle?: string;
  avatar?: string;
  isGroup?: boolean;
  otherUnread: number;
  onBack: () => void;
  onDetails: () => void;
  onMore: () => void;
}) {
  return (
    <div className="h-14 pl-1 pr-1 glass border-b border-line flex items-center shrink-0 z-10">
      <button type="button" aria-label="Back to conversations" onClick={onBack} className="press h-11 pl-0.5 pr-2 inline-flex items-center text-brand shrink-0">
        <ChevronLeft className="w-7 h-7" strokeWidth={2.2} aria-hidden />
        {otherUnread > 0 && <span className="text-[15px] font-semibold num -ml-0.5">{otherUnread > 99 ? "99+" : otherUnread}</span>}
      </button>
      <button type="button" aria-label={`Details for ${title}`} onClick={onDetails} className="hit-none flex-1 min-w-0 h-14 flex items-center gap-3 text-left">
        <Avatar src={avatar} name={title} isGroup={isGroup} className="w-10 h-10 rounded-full object-cover shrink-0" />
        <span className="min-w-0">
          <span className="block font-semibold text-[17px] leading-tight text-fg truncate">{title}</span>
          {subtitle && <span className="block text-[13px] leading-tight text-fg-3 truncate num">{subtitle}</span>}
        </span>
      </button>
      <button type="button" aria-label="More" onClick={onMore} className="press h-11 w-11 grid place-items-center rounded-full text-fg-2 shrink-0">
        <MoreHorizontal className="w-6 h-6" aria-hidden />
      </button>
    </div>
  );
}
