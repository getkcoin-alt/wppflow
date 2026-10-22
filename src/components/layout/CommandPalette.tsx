import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { CornerDownLeft, Search } from "lucide-react";

export interface Command {
  id: string;
  label: string;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  run: () => void;
}

// ⌘K / Ctrl+K: jump anywhere or start something without hunting through menus.
export function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}) {
  // Mounted only while open, so every opening starts with an empty search.
  return open ? <Palette onClose={onClose} commands={commands} /> : null;
}

function Palette({
  onClose,
  commands,
}: {
  onClose: () => void;
  commands: Command[];
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? commands.filter((c) =>
          `${c.label} ${c.hint || ""}`.toLowerCase().includes(q),
        )
      : commands;
  }, [commands, query]);

  useEffect(() => {
    requestAnimationFrame(() => input.current?.focus());
  }, []);
  const choose = (c?: Command) => {
    if (!c) return;
    onClose();
    c.run();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12dvh]">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade"
      />
      <div
        role="dialog"
        aria-label="Search and commands"
        className="relative w-full max-w-xl glass ring-1 ring-line rounded-3xl pop overflow-hidden animate-rise"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          else if (e.key === "ArrowDown") {
            e.preventDefault();
            setIndex((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") choose(results[index]);
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
            }}
            placeholder="Go to, or do anything…"
            aria-label="Search commands"
            className="flex-1 bg-transparent outline-none text-[16px] text-fg"
          />
          <kbd className="text-[11px] text-fg-3 px-1.5 h-6 grid place-items-center rounded-md bg-surface-2">
            esc
          </kbd>
        </div>
        <ul role="listbox" className="max-h-[50dvh] overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-4 py-8 text-center text-[14px] text-fg-2">
              Nothing matches “{query}”.
            </li>
          )}
          {results.map((c, i) => {
            const Icon = c.icon;
            return (
              <li key={c.id} role="option" aria-selected={i === index}>
                <button
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => choose(c)}
                  className={`w-full h-12 px-3 rounded-2xl flex items-center gap-3 text-left transition ${
                    i === index ? "bg-surface-2" : ""
                  }`}
                >
                  {Icon && <Icon className="w-[18px] h-[18px] text-fg-2" />}
                  <span className="flex-1 text-[14.5px] text-fg">
                    {c.label}
                  </span>
                  {c.hint && (
                    <span className="text-[12px] text-fg-3">{c.hint}</span>
                  )}
                  {i === index && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-fg-3" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
