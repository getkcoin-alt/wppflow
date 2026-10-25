import { useEffect, useState } from "react";
import { Sheet } from "../ui/Sheet";
import { Field, Notice } from "../ui/Page";
import { btn, inputCls, selectCls } from "../ui/styles";
import { lookupNumber, startChat, type NumberLookup, type StartedChat } from "../../services/api";
import type { WhatsAppSession } from "../../types";
import { numberName, phoneText } from "../../utils/numbers";

export interface NewChatPerson {
  /** A saved contact: the number is fixed */
  contactId?: string;
  name?: string;
  phone?: string;
  optIn?: boolean;
}

// Starts a chat with a number typed in (or a saved contact) from one of the WhatsApp numbers this person may use.
export function NewChatSheet({
  open,
  person,
  sessions,
  currentUserId,
  preferredNumber,
  onClose,
  onStarted,
}: {
  open: boolean;
  person?: NewChatPerson;
  sessions: WhatsAppSession[];
  currentUserId?: number | string | null;
  /** The number the Inbox is looking at, if any */
  preferredNumber?: string;
  onClose: () => void;
  onStarted: (result: StartedChat) => void;
}) {
  const usable = sessions.filter((s) => s.status === "CONNECTED");
  const [phone, setPhone] = useState(""),
    [name, setName] = useState(""),
    [from, setFrom] = useState(""),
    [looked, setLooked] = useState<NumberLookup | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const fixed = Boolean(person?.contactId);

  useEffect(() => {
    if (!open) return;
    setPhone(person?.phone ?? "");
    setName("");
    setLooked(null);
    setError("");
    setFrom((cur) => (usable.some((s) => s.sessionKey === cur) ? cur : usable.find((s) => s.sessionKey === preferredNumber)?.sessionKey ?? usable[0]?.sessionKey ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, person?.contactId, person?.phone]);

  // Looks the number up as it is typed, so a bad number or a known contact shows before anything is sent.
  useEffect(() => {
    if (!open || fixed) return;
    if (phone.trim().length < 5) return setLooked(null);
    let stale = false;
    const timer = setTimeout(() => {
      lookupNumber(phone)
        .then((r) => !stale && setLooked(r))
        .catch(() => !stale && setLooked(null));
    }, 350);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [phone, open, fixed]);

  const known = fixed ? { name: person?.name, optIn: person?.optIn } : looked?.contact ? { name: looked.contact.name, optIn: looked.contact.optIn } : null;
  const showWarning = (fixed || looked?.valid) && !known?.optIn;
  const canStart = Boolean(from) && !busy && (fixed || looked?.valid === true);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canStart) return;
    setBusy(true);
    setError("");
    try {
      const result = await startChat(fixed ? { contactId: person!.contactId, sessionName: from } : { phone, sessionName: from, ...(name.trim() && !looked?.contact ? { name: name.trim() } : {}) });
      onStarted(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New chat"
      subtitle={fixed ? `Start a chat with ${person?.name ?? "this contact"}.` : "Message someone you have not chatted with yet."}
      footer={
        <>
          <button type="button" className={btn("ghost")} onClick={onClose}>
            Cancel
          </button>
          <button form="new-chat-form" disabled={!canStart} className={btn("primary")}>
            Start chat
          </button>
        </>
      }
    >
      <form id="new-chat-form" className="space-y-4" onSubmit={submit}>
        {usable.length === 0 ? (
          <Notice tone="error">None of your WhatsApp numbers is connected right now. Connect one under Numbers, then start the chat.</Notice>
        ) : (
          <Field label="Send from" hint={usable.length > 1 ? "The WhatsApp number the message goes out on." : undefined}>
            <select aria-label="Send from" value={from} onChange={(e) => setFrom(e.target.value)} className={selectCls}>
              {usable.map((s) => (
                <option key={s.sessionKey} value={s.sessionKey}>
                  {[numberName(s, currentUserId), phoneText(s.phone)].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join(" · ")}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="WhatsApp number" hint={fixed ? undefined : "With the country code, for example +971 50 123 4567"}>
          <input
            aria-label="WhatsApp number"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            required
            readOnly={fixed}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`${inputCls} ${fixed ? "opacity-60" : ""}`}
            placeholder="+971 50 123 4567"
          />
        </Field>
        {!fixed && looked && !looked.valid && <p role="alert" className="text-[13.5px] text-danger -mt-2">{looked.message}</p>}
        {!fixed && looked?.valid && (
          <p className="text-[13.5px] text-fg-2 -mt-2">
            {looked.contact ? (
              <>
                Saved as <strong className="text-fg">{looked.contact.name}</strong>. This opens your chat with them.
              </>
            ) : (
              <>
                {looked.display} is new. It will be saved as a contact.
              </>
            )}
          </p>
        )}
        {!fixed && looked?.valid && !looked.contact && (
          <Field label="Name" hint="Optional. You can rename them later.">
            <input aria-label="Name" value={name} maxLength={255} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
        )}
        {showWarning && (
          <div className="rounded-2xl bg-warn/10 text-warn px-4 py-3 text-[13.5px]" role="note" data-testid="consent-warning">
            This person has not agreed to hear from you here yet, so broadcasts skip them. Only message people who expect to hear from you.
          </div>
        )}
        {error && <Notice tone="error">{error}</Notice>}
      </form>
    </Sheet>
  );
}
