import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { CornerDownLeft, Loader2, MessageSquare, Search, Sparkles } from "lucide-react";
import { chatTitle } from "../../utils/chatName";

export interface Command {
  id: string;
  label: string;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  run: () => void;
}
export interface ChatHit {
  id: string;
  title: string;
  /** The number, or the words that matched */
  subtitle?: string;
}

// ⌘K / Ctrl+K: jump anywhere, find a chat, or say what you want in your own words, without hunting through menus.
export function CommandPalette({
  open,
  onClose,
  commands,
  onFindChats,
  onOpenChat,
  onAsk,
}: {
  open: boolean;
  onClose: () => void;
  commands: Command[];
  /** Finds chats and messages for what was typed (the same search as the inbox) */
  onFindChats?: (text: string) => Promise<ChatHit[]>;
  onOpenChat?: (conversationId: string) => void;
  /** Riwo: which command the typed words ask for, as its id (null when none fits). Not given when Riwo is unavailable. */
  onAsk?: (text: string, commands: Command[]) => Promise<string | null>;
}) {
  // Mounted only while open, so every opening starts with an empty search.
  return open ? <Palette onClose={onClose} commands={commands} onFindChats={onFindChats} onOpenChat={onOpenChat} onAsk={onAsk} /> : null;
}

type Row = { kind: "command"; command: Command } | { kind: "chat"; chat: ChatHit } | { kind: "ask"; text: string };

function Palette({
  onClose,
  commands,
  onFindChats,
  onOpenChat,
  onAsk,
}: {
  onClose: () => void;
  commands: Command[];
  onFindChats?: (text: string) => Promise<ChatHit[]>;
  onOpenChat?: (conversationId: string) => void;
  onAsk?: (text: string, commands: Command[]) => Promise<string | null>;
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [chats, setChats] = useState<ChatHit[]>([]);
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => (q ? commands.filter((c) => `${c.label} ${c.hint || ""}`.toLowerCase().includes(q)) : commands), [commands, q]);

  // chats and messages, once typing pauses
  useEffect(() => {
    if (!onFindChats || q.length < 2) {
      setChats([]);
      return;
    }
    let stale = false;
    const timer = setTimeout(() => {
      onFindChats(query.trim())
        .then((hits) => !stale && setChats(hits.slice(0, 5)))
        .catch(() => !stale && setChats([]));
    }, 300);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [q, query, onFindChats]);

  const rows: Row[] = useMemo(
    () => [
      ...matches.map((command): Row => ({ kind: "command", command })),
      ...(onOpenChat ? chats.map((chat): Row => ({ kind: "chat", chat })) : []),
      // Riwo is offered for anything typed in words, in addition to what matched
      ...(onAsk && q.length >= 3 ? [{ kind: "ask", text: query.trim() } as Row] : []),
    ],
    [matches, chats, onAsk, onOpenChat, q, query],
  );

  useEffect(() => {
    requestAnimationFrame(() => input.current?.focus());
  }, []);

  const ask = async (text: string) => {
    if (!onAsk) return;
    setAsking(true);
    setNote("");
    try {
      const id = await onAsk(text, commands);
      const command = commands.find((c) => c.id === id);
      if (command) {
        onClose();
        command.run();
      } else setNote("Riwo couldn't match that to anything. Try other words.");
    } catch (e: any) {
      setNote(e?.message || "Riwo couldn't be asked just now.");
    } finally {
      setAsking(false);
    }
  };
  const choose = (row?: Row) => {
    if (!row) return;
    if (row.kind === "command") {
      onClose();
      row.command.run();
    } else if (row.kind === "chat") {
      onClose();
      onOpenChat?.(row.chat.id);
    } else void ask(row.text);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12dvh]">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade" />
      <div
        role="dialog"
        aria-label="Search and commands"
        className="relative w-full max-w-xl glass ring-1 ring-line rounded-3xl pop overflow-hidden animate-rise"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          else if (e.key === "ArrowDown") {
            e.preventDefault();
            setIndex((i) => Math.min(i + 1, rows.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") choose(rows[index]);
        }}
      >
        <div className="flex items-center gap-3 px-5 h-14 border-b border-line">
          <Search className="w-5 h-5 text-fg-3" />
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
              setNote("");
            }}
            placeholder={onAsk ? "Go to, find a chat, or tell Riwo what you want…" : "Go to, or do anything…"}
            aria-label="Search commands"
            className="flex-1 bg-transparent outline-none text-[16px] text-fg"
          />
          <kbd className="text-[11px] text-fg-3 px-1.5 h-6 grid place-items-center rounded-md bg-surface-2">esc</kbd>
        </div>
        <ul role="listbox" className="max-h-[50dvh] overflow-y-auto p-2">
          {rows.length === 0 && <li className="px-4 py-8 text-center text-[14px] text-fg-2">Nothing matches “{query}”.</li>}
          {rows.map((row, i) => {
            const selected = i === index;
            const base = `w-full min-h-12 px-3 py-2 rounded-2xl flex items-center gap-3 text-left transition ${selected ? "bg-surface-2" : ""}`;
            const key = row.kind === "command" ? `c:${row.command.id}` : row.kind === "chat" ? `h:${row.chat.id}` : "ask";
            const first = (kind: Row["kind"]) => rows.findIndex((r) => r.kind === kind) === i;
            return (
              <li key={key} role="option" aria-selected={selected}>
                {row.kind === "chat" && first("chat") && <div className="px-3 pt-2 pb-1 eyebrow">Chats</div>}
                {row.kind === "ask" && <div className="mx-3 my-1 h-px bg-line/70" />}
                <button onMouseEnter={() => setIndex(i)} onClick={() => choose(row)} disabled={asking && row.kind === "ask"} className={base}>
                  {row.kind === "command" ? (
                    <>
                      {row.command.icon && <row.command.icon className="w-[18px] h-[18px] text-fg-2" />}
                      <span className="flex-1 text-[14.5px] text-fg">{row.command.label}</span>
                      {row.command.hint && <span className="text-[12px] text-fg-3">{row.command.hint}</span>}
                    </>
                  ) : row.kind === "chat" ? (
                    <>
                      <MessageSquare className="w-[18px] h-[18px] text-fg-2" aria-hidden />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[14.5px] text-fg truncate">{chatTitle(row.chat.title, "")}</span>
                        {row.chat.subtitle && <span className="block text-[12.5px] text-fg-3 truncate">{row.chat.subtitle}</span>}
                      </span>
                    </>
                  ) : (
                    <>
                      {asking ? <Loader2 className="w-[18px] h-[18px] animate-spin text-gold" aria-hidden /> : <Sparkles className="w-[18px] h-[18px] text-gold" aria-hidden />}
                      <span className="flex-1 min-w-0 text-[14.5px] text-fg truncate">Ask Riwo: “{row.text}”</span>
                    </>
                  )}
                  {selected && <CornerDownLeft className="w-3.5 h-3.5 text-fg-3" />}
                </button>
              </li>
            );
          })}
          {note && (
            <li role="status" className="px-4 py-3 text-[13.5px] text-fg-2">
              {note}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
