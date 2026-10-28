import { useEffect, useState, useMemo } from "react";
import { MessageSquare, Users, Plus, X, Search, Check, Loader2 } from "lucide-react";
import { Sheet } from "../ui/Sheet";
import { Field, Notice } from "../ui/Page";
import { btn, inputCls, selectCls } from "../ui/styles";
import {
  lookupNumber,
  startChat,
  createGroup,
  getContacts,
  type NumberLookup,
  type StartedChat,
} from "../../services/api";
import type { WhatsAppSession } from "../../types";
import { numberName, phoneText } from "../../utils/numbers";
import { Avatar } from "../ui/Avatar";

export interface NewChatPerson {
  /** A saved contact: the number is fixed */
  contactId?: string;
  name?: string;
  phone?: string;
  optIn?: boolean;
}

interface Participant {
  phone: string;
  name?: string;
  avatar?: string;
}

// Starts a direct chat or creates a WhatsApp group from one of the connected WhatsApp numbers.
export function NewChatSheet({
  open,
  person,
  sessions,
  currentUserId,
  preferredNumber,
  initialMode = "chat",
  onClose,
  onStarted,
}: {
  open: boolean;
  person?: NewChatPerson;
  sessions: WhatsAppSession[];
  currentUserId?: number | string | null;
  /** The number the Inbox is looking at, if any */
  preferredNumber?: string;
  initialMode?: "chat" | "group";
  onClose: () => void;
  onStarted: (result: StartedChat) => void;
}) {
  const usable = sessions.filter((s) => s.status === "CONNECTED");
  const fixed = Boolean(person?.contactId);

  // Mode: "chat" | "group"
  const [mode, setMode] = useState<"chat" | "group">(initialMode);

  // Common state
  const [from, setFrom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Direct chat state
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [looked, setLooked] = useState<NumberLookup | null>(null);

  // Group state
  const [groupTitle, setGroupTitle] = useState("");
  const [searchContact, setSearchContact] = useState("");
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Participant[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode(person?.contactId ? "chat" : initialMode);
    setPhone(person?.phone ?? "");
    setName("");
    setLooked(null);
    setError("");
    setGroupTitle("");
    setSearchContact("");
    setSelectedParticipants([]);
    setFrom((cur) =>
      usable.some((s) => s.sessionKey === cur)
        ? cur
        : usable.find((s) => s.sessionKey === preferredNumber)?.sessionKey ??
          usable[0]?.sessionKey ??
          "",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, person?.contactId, person?.phone, initialMode]);

  // Load contacts when group mode is active
  useEffect(() => {
    if (!open || mode !== "group") return;
    let cancelled = false;
    setContactsLoading(true);
    getContacts({ limit: 100 })
      .then((res: any) => {
        if (!cancelled && res?.contacts) {
          setAvailableContacts(res.contacts);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setContactsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, mode]);

  // Looks the number up as it is typed (direct chat mode)
  useEffect(() => {
    if (!open || fixed || mode !== "chat") return;
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
  }, [phone, open, fixed, mode]);

  const known = fixed
    ? { name: person?.name, optIn: person?.optIn }
    : looked?.contact
      ? { name: looked.contact.name, optIn: looked.contact.optIn }
      : null;
  const showWarning = mode === "chat" && (fixed || looked?.valid) && !known?.optIn;

  const canStartChat =
    mode === "chat" && Boolean(from) && !busy && (fixed || looked?.valid === true);
  const canStartGroup =
    mode === "group" &&
    Boolean(from) &&
    !busy &&
    groupTitle.trim().length > 0 &&
    selectedParticipants.length > 0;

  // Filter contacts by search query in group mode
  const filteredContacts = useMemo(() => {
    const q = searchContact.trim().toLowerCase();
    if (!q) return availableContacts;
    return availableContacts.filter((c) => {
      const cName = String(c.name || "").toLowerCase();
      const cPhone = String(c.phone || "").toLowerCase();
      return cName.includes(q) || cPhone.includes(q);
    });
  }, [availableContacts, searchContact]);

  // Check if typed text could be a manual phone number
  const typedPhoneDigits = searchContact.replace(/\D/g, "");
  const canAddTypedNumber =
    typedPhoneDigits.length >= 7 &&
    !selectedParticipants.some(
      (p) => p.phone.replace(/\D/g, "") === typedPhoneDigits,
    );

  const toggleParticipant = (contact: { phone: string; name?: string; avatar?: string }) => {
    const cleaned = contact.phone.replace(/\D/g, "");
    const exists = selectedParticipants.some(
      (p) => p.phone.replace(/\D/g, "") === cleaned,
    );
    if (exists) {
      setSelectedParticipants((prev) =>
        prev.filter((p) => p.phone.replace(/\D/g, "") !== cleaned),
      );
    } else {
      setSelectedParticipants((prev) => [
        ...prev,
        {
          phone: contact.phone,
          name: contact.name || contact.phone,
          avatar: contact.avatar,
        },
      ]);
    }
  };

  const addManualParticipant = () => {
    if (!canAddTypedNumber) return;
    const digits = typedPhoneDigits;
    const formatted = searchContact.startsWith("+") ? `+${digits}` : digits;
    setSelectedParticipants((prev) => [
      ...prev,
      { phone: formatted, name: formatted },
    ]);
    setSearchContact("");
  };

  const removeParticipant = (phoneToRemove: string) => {
    setSelectedParticipants((prev) =>
      prev.filter((p) => p.phone !== phoneToRemove),
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "chat") {
      if (!canStartChat) return;
      setBusy(true);
      try {
        const result = await startChat(
          fixed
            ? { contactId: person!.contactId, sessionName: from }
            : {
                phone,
                sessionName: from,
                ...(name.trim() && !looked?.contact ? { name: name.trim() } : {}),
              },
        );
        onStarted(result);
      } catch (err: any) {
        setError(err.message || "Failed to start chat.");
      } finally {
        setBusy(false);
      }
    } else {
      if (!canStartGroup) return;
      setBusy(true);
      try {
        const result = await createGroup({
          sessionName: from,
          title: groupTitle.trim(),
          participants: selectedParticipants.map((p) => p.phone),
        });
        onStarted({
          conversation: result.conversation,
          contactCreated: false,
          optedIn: null,
        });
      } catch (err: any) {
        setError(err.message || "Failed to create group.");
      } finally {
        setBusy(false);
      }
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={mode === "chat" ? "New chat" : "New group"}
      subtitle={
        mode === "chat"
          ? fixed
            ? `Start a chat with ${person?.name ?? "this contact"}.`
            : "Message someone you have not chatted with yet."
          : "Create a WhatsApp group and start chatting with participants."
      }
      footer={
        <>
          <button type="button" className={btn("ghost")} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            form="new-chat-form"
            disabled={mode === "chat" ? !canStartChat : !canStartGroup}
            className={`${btn("primary")} flex items-center justify-center gap-2`}
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "chat"
              ? "Start chat"
              : busy
                ? "Creating group..."
                : "Create group"}
          </button>
        </>
      }
    >
      {/* Mode Switcher Tabs (hidden when starting chat with a fixed contact) */}
      {!fixed && (
        <div className="flex bg-surface-2 p-1 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMode("chat");
              setError("");
            }}
            className={`flex-1 py-2 text-[13.5px] font-medium rounded-xl transition flex items-center justify-center gap-2 ${
              mode === "chat"
                ? "bg-surface text-fg shadow-card"
                : "text-fg-2 hover:text-fg"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Direct chat
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("group");
              setError("");
            }}
            className={`flex-1 py-2 text-[13.5px] font-medium rounded-xl transition flex items-center justify-center gap-2 ${
              mode === "group"
                ? "bg-surface text-fg shadow-card"
                : "text-fg-2 hover:text-fg"
            }`}
          >
            <Users className="w-4 h-4" />
            New group
          </button>
        </div>
      )}

      <form id="new-chat-form" className="space-y-4" onSubmit={submit}>
        {usable.length === 0 ? (
          <Notice tone="error">
            None of your WhatsApp numbers is connected right now. Connect one under Numbers, then start the chat.
          </Notice>
        ) : (
          <Field
            label="Send from"
            hint={usable.length > 1 ? "The WhatsApp number the action goes out on." : undefined}
          >
            <select
              aria-label="Send from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={selectCls}
            >
              {usable.map((s) => (
                <option key={s.sessionKey} value={s.sessionKey}>
                  {[numberName(s, currentUserId), phoneText(s.phone)]
                    .filter(Boolean)
                    .filter((x, i, a) => a.indexOf(x) === i)
                    .join(" · ")}
                </option>
              ))}
            </select>
          </Field>
        )}

        {mode === "chat" ? (
          <>
            <Field
              label="WhatsApp number"
              hint={fixed ? undefined : "With the country code, for example +971 50 123 4567"}
            >
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

            {!fixed && looked && !looked.valid && (
              <p role="alert" className="text-[13.5px] text-danger -mt-2">
                {looked.message}
              </p>
            )}

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
                <input
                  aria-label="Name"
                  value={name}
                  maxLength={255}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                />
              </Field>
            )}

            {showWarning && (
              <div
                className="rounded-2xl bg-warn/10 text-warn px-4 py-3 text-[13.5px]"
                role="note"
                data-testid="consent-warning"
              >
                This person has not agreed to hear from you here yet, so broadcasts skip them. Only message people who expect to hear from you.
              </div>
            )}
          </>
        ) : (
          <>
            {/* Group Title Field */}
            <Field
              label="Group subject"
              hint={`${groupTitle.length}/100 characters`}
            >
              <input
                aria-label="Group subject"
                type="text"
                required
                maxLength={100}
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                className={inputCls}
                placeholder="e.g. VIP Investors, Project Launch"
              />
            </Field>

            {/* Selected Participants Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-medium text-fg">Participants</span>
                <span className="text-fg-3">
                  {selectedParticipants.length}{" "}
                  {selectedParticipants.length === 1 ? "selected" : "selected"}
                </span>
              </div>

              {selectedParticipants.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl bg-surface-2 border border-border/60 max-h-28 overflow-y-auto">
                  {selectedParticipants.map((p) => (
                    <span
                      key={p.phone}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-xl bg-surface text-fg text-[12.5px] font-medium shadow-sm border border-border/60 animate-fade"
                    >
                      <span className="truncate max-w-[140px]">{p.name || p.phone}</span>
                      <button
                        type="button"
                        onClick={() => removeParticipant(p.phone)}
                        className="h-4 w-4 grid place-items-center rounded-full hover:bg-surface-2 text-fg-3 hover:text-danger transition"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-fg-3">
                  Select contacts below or enter phone numbers with country code.
                </p>
              )}
            </div>

            {/* Participant Search and Manual Number Entry */}
            <div className="space-y-2 pt-1">
              <div className="relative">
                <Search className="w-4 h-4 text-fg-3 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchContact}
                  onChange={(e) => setSearchContact(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (canAddTypedNumber) addManualParticipant();
                    }
                  }}
                  placeholder="Search contacts or enter phone (+971...)"
                  className={`${inputCls} pl-10 pr-20`}
                />
                {canAddTypedNumber && (
                  <button
                    type="button"
                    onClick={addManualParticipant}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[12px] font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                )}
              </div>

              {/* Contacts Selection List */}
              <div className="border border-border/60 rounded-2xl overflow-hidden bg-surface">
                <div className="max-h-48 overflow-y-auto divide-y divide-border/40">
                  {contactsLoading ? (
                    <div className="p-4 flex items-center justify-center gap-2 text-[13px] text-fg-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading contacts...
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="p-4 text-center text-[13px] text-fg-3">
                      {searchContact
                        ? "No contacts match. Press Add to add this number directly."
                        : "No saved contacts yet. You can type phone numbers above."}
                    </div>
                  ) : (
                    filteredContacts.map((c) => {
                      const cDigits = String(c.phone || "").replace(/\D/g, "");
                      const isSelected = selectedParticipants.some(
                        (p) => p.phone.replace(/\D/g, "") === cDigits,
                      );
                      return (
                        <button
                          key={c.id || c.phone}
                          type="button"
                          onClick={() => toggleParticipant(c)}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-surface-2 ${
                            isSelected ? "bg-surface-2" : ""
                          }`}
                        >
                          <Avatar
                            src={c.avatar}
                            name={c.name || c.phone}
                            className="w-8 h-8 rounded-full text-[12px] shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-[13.5px] font-medium text-fg truncate">
                              {c.name || c.phone}
                            </div>
                            <div className="text-[12px] text-fg-3 truncate num">
                              {phoneText(c.phone)}
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                              isSelected
                                ? "bg-primary border-primary text-white"
                                : "border-border/80 bg-surface"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {error && <Notice tone="error">{error}</Notice>}
      </form>
    </Sheet>
  );
}
