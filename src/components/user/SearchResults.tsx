import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { searchInbox, type InboxSearchHit } from "../../services/api";
import { chatTitle } from "../../utils/chatName";
import { MIN_SEARCH_CHARS } from "../../utils/searchText";

/** The snippet with the matched words marked, like WhatsApp's message search. */
export function Marked({ snippet }: { snippet: InboxSearchHit["snippet"] }) {
  const { text, start, length } = snippet;
  if (start < 0 || length <= 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded-sm bg-gold/25 text-fg px-0.5">{text.slice(start, start + length)}</mark>
      {text.slice(start + length)}
    </>
  );
}

/** Messages that contain what was typed (pass the text once typing has paused): each with its chat, when, and the words around the match. */
export function MessageResults({
  text,
  sessionName,
  onOpen,
  formatTime,
}: {
  text: string;
  sessionName: string;
  onOpen: (conversationId: string) => void;
  formatTime: (iso: string) => string;
}) {
  const typed = text.trim();
  const ready = typed.length >= MIN_SEARCH_CHARS;
  const found = useQuery({
    queryKey: ["inbox-search", typed, sessionName],
    queryFn: () => searchInbox(typed, sessionName),
    enabled: ready,
    staleTime: 30_000,
    retry: false,
  });
  if (!ready) return null;
  return (
    <section aria-label="Messages found" className="mt-2 pt-2 border-t border-line">
      <h3 className="px-3 pb-1 text-[12px] font-semibold uppercase tracking-wide text-fg-3">Messages</h3>
      {found.isPending && (
        <div role="status" className="px-3 py-3 flex items-center gap-2 text-[13px] text-fg-3">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Searching messages…
        </div>
      )}
      {found.isError && <p className="px-3 py-3 text-[13px] text-fg-3">Messages could not be searched just now.</p>}
      {found.data && found.data.messages.length === 0 && <p className="px-3 py-3 text-[13px] text-fg-3">No messages contain “{typed}”.</p>}
      {found.data?.messages.map((hit) => {
        const name = chatTitle(hit.chat.contactName, hit.chat.phone, hit.chat.isGroup);
        return (
          <button
            key={hit.messageId}
            onClick={() => onOpen(hit.conversationId)}
            className="w-full text-left px-3 py-2.5 my-0.5 rounded-2xl flex items-center gap-3 hover:bg-surface-2/60 transition-colors"
          >
            <Avatar src={hit.chat.avatar} name={name} isGroup={hit.chat.isGroup} className="w-10 h-10 rounded-full object-cover shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[14.5px] font-medium text-fg truncate">{name}</span>
                <span className="text-[12px] text-fg-3 shrink-0 num">{formatTime(new Date(hit.timestampEpoch * 1000).toISOString())}</span>
              </span>
              <span className="block text-[13.5px] text-fg-2 line-clamp-2 break-words">
                {hit.fromMe && <span className="text-fg-3">You: </span>}
                <Marked snippet={hit.snippet} />
              </span>
            </span>
          </button>
        );
      })}
      {found.data?.partial && <p className="px-3 py-2 text-[12px] text-fg-3">Searching took long, so older messages may be missing. Try a longer word.</p>}
    </section>
  );
}
