import { Smartphone } from "lucide-react";
import type { OtpOverview } from "../../../services/api";
import { Notice, Pill } from "../../ui/Page";
import { btn } from "../../ui/styles";

const show = (phone: string | null, name: string) => (phone ? `+${String(phone).replace(/\D/g, "")}` : name);

/** Which of the company's own WhatsApp numbers the codes leave from. */
export function NumberCard({ numbers, selected, onPick, onConnect }: { numbers: OtpOverview["numbers"]; selected: string | null; onPick: (name: string | null) => void; onConnect?: () => void }) {
  const connected = numbers.filter((n) => n.connected);
  // nothing chosen means the first connected number; say which that is
  const using = selected && numbers.some((n) => n.sessionName === selected) ? selected : connected[0]?.sessionName;
  return (
    <div className="space-y-4">
      {numbers.length === 0 ? (
        <p className="text-[14.5px] text-fg-2">Codes are sent from your own WhatsApp number, the way you would send a message yourself. It takes one scan to link it.</p>
      ) : (
        <div role="radiogroup" aria-label="Number the codes are sent from" className="space-y-2">
          {numbers.map((n) => {
            const on = n.sessionName === using;
            return (
              <button key={n.sessionName} type="button" role="radio" aria-checked={on} onClick={() => onPick(n.sessionName)} className={`press w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left min-h-[52px] transition ${on ? "bg-brand-solid/10 ring-2 ring-brand-solid" : "bg-surface-2 hover:bg-surface-3"}`}>
                <Smartphone className="w-5 h-5 text-fg-2 shrink-0" aria-hidden />
                <span className="flex-1 min-w-0">
                  <span className="block text-[14.5px] font-medium text-fg truncate">{show(n.phone, n.sessionName)}</span>
                  <span className="block text-[12.5px] text-fg-3 truncate">{n.sessionName}</span>
                </span>
                <Pill tone={n.connected ? "ok" : "warn"} dot>
                  {n.connected ? "Connected" : "Offline"}
                </Pill>
              </button>
            );
          })}
        </div>
      )}
      {onConnect && (
        <button type="button" onClick={onConnect} className={btn(numbers.length ? "secondary" : "primary", "md")}>
          <Smartphone className="w-4 h-4" aria-hidden /> {numbers.length ? "Link another number" : "Link a WhatsApp number"}
        </button>
      )}
      {connected.length > 0 && selected === null && <p className="text-[13px] text-fg-3">Using the first connected number. Pick another above to change it.</p>}
      <Notice tone="info">
        Codes appear in that number's WhatsApp as ordinary messages, and not in your Scriwo inbox. If you can, use a number you do not use with customers. WhatsApp can restrict a number that sends many automated messages, so keep to the free limit.
      </Notice>
    </div>
  );
}
