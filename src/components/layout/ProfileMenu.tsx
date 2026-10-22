import { useEffect, useRef, useState } from "react";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { safeAvatarFallback } from "../../utils/avatar";
import type { ThemeChoice } from "../../hooks/useTheme";
import type { AuthUser } from "../../types";

const THEMES: { key: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { key: "system", label: "Auto", icon: Monitor },
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
];

export function ThemeSwitch({
  value,
  onChange,
}: {
  value: ThemeChoice;
  onChange: (t: ThemeChoice) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="flex p-1 bg-surface-2 rounded-xl"
    >
      {THEMES.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          role="radio"
          aria-checked={value === key}
          onClick={() => onChange(key)}
          className={`flex-1 h-8 rounded-lg text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition ${
            value === key
              ? "bg-surface text-fg shadow-card"
              : "text-fg-2 hover:text-fg"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

export function ProfileMenu({
  user,
  theme,
  onTheme,
  onLogout,
  workspaces = [],
  currentWorkspace,
  onSwitchWorkspace,
  placement = "right",
  status,
  connected,
}: {
  user: AuthUser;
  theme: ThemeChoice;
  onTheme: (t: ThemeChoice) => void;
  onLogout: () => void;
  workspaces?: { id: string; name: string }[];
  currentWorkspace?: string | null;
  onSwitchWorkspace?: (id: string) => void;
  placement?: "right" | "below";
  /** Engine health dot on the avatar: ok (green) or warn (amber); omitted while unknown */
  status?: "ok" | "warn";
  /** Number of WhatsApp numbers currently connected */
  connected?: number;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="relative" ref={box}>
      <button
        aria-label="Account menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative h-11 w-11 rounded-full ring-2 ring-transparent hover:ring-gold/50 transition"
      >
        <img
          src={safeAvatarFallback(user.name)}
          alt=""
          className="w-full h-full rounded-full"
        />
        {status && (
          <span
            aria-hidden
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-surface ${
              status === "ok" ? "bg-ok" : "bg-warn"
            }`}
          />
        )}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-50 w-72 glass ring-1 ring-line rounded-3xl pop p-2 animate-rise ${
            placement === "right" ? "left-full ml-3 bottom-0" : "right-0 mt-2"
          }`}
        >
          <div className="px-3 pt-3 pb-3">
            <div className="font-semibold text-[15px] text-fg truncate">
              {user.name}
            </div>
            <div className="text-[13px] text-fg-2 truncate">{user.email}</div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium">
              <span className="inline-flex items-center gap-1.5 text-gold">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                {user.company_name}
              </span>
              {status && (
                <span
                  className={`inline-flex items-center gap-1.5 ${status === "ok" ? "text-ok" : "text-warn"}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {status === "ok" ? "All systems normal" : "Reconnecting"}
                </span>
              )}
              {typeof connected === "number" && (
                <span className="text-fg-2">
                  {connected} {connected === 1 ? "number" : "numbers"} live
                </span>
              )}
            </div>
          </div>
          {workspaces.length > 1 && (
            <label className="block px-3 pb-3 text-[12px] text-fg-2">
              Workspace
              <select
                value={currentWorkspace || ""}
                onChange={(e) => onSwitchWorkspace?.(e.target.value)}
                className="mt-1 w-full h-10 rounded-xl bg-surface-2 px-3 text-[14px] text-fg"
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="px-2 pb-2">
            <ThemeSwitch value={theme} onChange={onTheme} />
          </div>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full h-11 px-3 rounded-2xl flex items-center gap-2.5 text-[14px] text-danger hover:bg-danger/10 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
