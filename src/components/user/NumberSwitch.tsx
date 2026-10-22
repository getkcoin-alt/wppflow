import type { WhatsAppSession } from "../../types";
import { numberName, phoneText } from "../../utils/numbers";

// Switches the inbox between the workspace's WhatsApp numbers. Shown when there is more than one.
export function NumberSwitch({
  sessions,
  value,
  onChange,
  currentUserId,
}: {
  sessions: WhatsAppSession[];
  /** The chosen number's key, or "" for every number */
  value: string;
  onChange: (key: string) => void;
  currentUserId?: number | string | null;
}) {
  if (sessions.length < 2) return null;
  const chip = (active: boolean) =>
    `shrink-0 h-8 px-3 rounded-full text-[13px] font-medium inline-flex items-center gap-2 transition ring-1 ${
      active
        ? "bg-brand-solid text-white ring-transparent"
        : "bg-surface-2 text-fg-2 ring-line hover:text-fg"
    }`;
  return (
    <div
      role="group"
      aria-label="WhatsApp number"
      className="flex flex-wrap items-center gap-1.5 max-h-[76px] overflow-y-auto"
    >
      <button
        type="button"
        aria-pressed={value === ""}
        onClick={() => onChange("")}
        className={chip(value === "")}
      >
        All numbers
      </button>
      {sessions.map((s) => {
        const active = value === s.sessionKey;
        return (
          <button
            key={s.sessionKey}
            type="button"
            aria-pressed={active}
            title={[numberName(s, currentUserId), phoneText(s.phone)]
              .filter(Boolean)
              .join(" · ")}
            onClick={() => onChange(s.sessionKey)}
            className={chip(active)}
          >
            <span
              aria-hidden
              className={`h-2 w-2 rounded-full ${
                s.status === "CONNECTED" ? "bg-ok" : "bg-fg-3"
              }`}
            />
            {numberName(s, currentUserId)}
            <span className="sr-only">
              {s.status === "CONNECTED" ? ", connected" : ", not connected"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
