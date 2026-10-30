import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  fetchAudience,
  fetchAutomationTemplates,
  fetchCampaignTemplates,
  addAutomation,
  toggleAutomationApi,
  getStoredTenantId,
  recordPermission,
  type Audience,
} from "../../services/api";
import type { WhatsAppSession } from "../../types";
import { Field, Notice, Pill } from "../ui/Page";
import { Sheet } from "../ui/Sheet";
import { btn, inputCls, selectCls, textareaCls } from "../ui/styles";
import {
  estimate,
  findBlanks,
  hasSpintax,
  localInput,
  previewParts,
  SPEEDS,
} from "../../utils/broadcast";

const ALL = "All Contacts";
const STEPS = ["Message", "Audience", "Review"];
const FIELDS: [string, string][] = [
  ["{{first_name}}", "First name"],
  ["{{name}}", "Full name"],
  ["{{company}}", "Company"],
];
const today = () => new Date().toLocaleDateString(undefined, { day: "numeric", month: "short" });

export interface BroadcastRequest {
  name: string;
  templateText: string;
  sessionName: string;
  targetSegment: string;
  antiBanDelaySeconds: number;
  launch: "draft" | "now" | "schedule";
  scheduledFor: string;
  batchSize?: number;
  cooldownSeconds?: number;
  spintaxEnabled?: boolean;
  typingSimulation?: boolean;
}

// Writing a broadcast in three steps: what to say, who gets it, and a last look before it goes. The audience is
// counted live so nobody finds out after pressing Send that nobody was going to receive it.
export function BroadcastWizard({
  open,
  onClose,
  sessions,
  companyName,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  sessions: WhatsAppSession[];
  companyName: string;
  onCreate: (request: BroadcastRequest) => Promise<unknown>;
}) {
  const tenant = getStoredTenantId();
  const qc = useQueryClient();
  const connected = sessions.filter((s) => s.status === "CONNECTED");
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  const [chosenTemplate, setChosenTemplate] = useState("");
  const [session, setSession] = useState("");
  const [tag, setTag] = useState(ALL);
  const [name, setName] = useState("");
  const [seconds, setSeconds] = useState<number>(8);
  const [batchSize, setBatchSize] = useState<number>(25);
  const [cooldownMinutes, setCooldownMinutes] = useState<number>(5);
  const [spintaxEnabled, setSpintaxEnabled] = useState<boolean>(true);
  const [typingSimulation, setTypingSimulation] = useState<boolean>(true);
  const [spintaxSeed, setSpintaxSeed] = useState<number>(0);
  const [when, setWhen] = useState<"now" | "schedule" | "draft">("now");
  const [at, setAt] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);

  const templates = useQuery({
    queryKey: ["campaign-templates"],
    queryFn: fetchCampaignTemplates,
    enabled: open,
    staleTime: 60 * 60 * 1000,
  });
  const audience = useQuery({
    queryKey: ["audience", tenant, tag],
    queryFn: () => fetchAudience(tag),
    enabled: open && step >= 1,
  });
  const a: Audience | undefined = audience.data;

  const sender = session || connected[0]?.sessionKey || "";
  const senderInfo = sessions.find((s) => s.sessionKey === sender);
  const blanks = useMemo(() => findBlanks(text), [text]);
  const containsSpintax = useMemo(() => hasSpintax(text), [text]);
  const reset = () => {
    setStep(0);
    setText("");
    setChosenTemplate("");
    setSession("");
    setTag(ALL);
    setName("");
    setSeconds(8);
    setBatchSize(25);
    setCooldownMinutes(5);
    setSpintaxEnabled(true);
    setTypingSimulation(true);
    setSpintaxSeed(0);
    setWhen("now");
    setAt("");
    setAgreed(false);
    setError("");
  };
  const close = () => {
    onClose();
    reset();
  };

  const insert = (token: string) => {
    const el = box.current;
    const from = el?.selectionStart ?? text.length;
    const to = el?.selectionEnd ?? text.length;
    setText(text.slice(0, from) + token + text.slice(to));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(from + token.length, from + token.length);
    });
  };
  const choose = (id: string) => {
    const t = templates.data?.templates.find((x) => x.id === id);
    if (!t) return;
    setChosenTemplate(id);
    setText(t.text);
    if (!name) setName(`${t.name} · ${today()}`);
  };

  const sayNo = (message: string) => setError(message);
  const next = () => {
    setError("");
    if (step === 0) {
      if (!text.trim()) return sayNo("Write your message first, or pick one of the ready-made ones.");
      if (blanks.length) return sayNo(`Fill in ${blanks.join(", ")} before you continue.`);
    }
    if (step === 1) {
      if (!sender) return sayNo("Connect a WhatsApp number first. Broadcasts are sent from one of your numbers.");
      if (a && !a.willReceive) return sayNo("Nobody in this audience has agreed to receive messages yet. Record permission below, or choose another group.");
    }
    setStep(step + 1);
  };

  const record = async () => {
    setBusy(true);
    setError("");
    try {
      await recordPermission(tag);
      setAgreed(false);
      await qc.invalidateQueries({ queryKey: ["audience", tenant] });
      await qc.invalidateQueries({ queryKey: ["contacts", tenant] });
    } catch (e: any) {
      setError(e.message || "Couldn't record permission.");
    } finally {
      setBusy(false);
    }
  };
  // The STOP rule, from the ready-made one: how customers take themselves off the list.
  const addStopRule = async () => {
    setBusy(true);
    setError("");
    try {
      const { templates: rules } = await fetchAutomationTemplates();
      const stop = rules.find((r) => r.id === "stop");
      if (!stop) throw new Error("The STOP rule isn't available.");
      const made = await addAutomation({ name: stop.name, templateId: stop.id, ...stop.rule });
      await toggleAutomationApi(made.automation.id);
      await qc.invalidateQueries({ queryKey: ["audience", tenant] });
      await qc.invalidateQueries({ queryKey: ["automations", tenant] });
    } catch (e: any) {
      setError(e.message || "Couldn't add the rule.");
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    setError("");
    if (when === "schedule" && !(at && new Date(at).getTime() > Date.now())) return sayNo("Choose a start time in the future.");
    setBusy(true);
    try {
      await onCreate({
        name: name.trim() || `Broadcast · ${today()}`,
        templateText: text,
        sessionName: sender,
        targetSegment: tag,
        antiBanDelaySeconds: seconds,
        launch: when,
        scheduledFor: when === "schedule" ? new Date(at).toISOString() : "",
        batchSize,
        cooldownSeconds: cooldownMinutes * 60,
        spintaxEnabled,
        typingSimulation,
      });
      close();
    } catch (e: any) {
      setError(e.message || "Couldn't create the broadcast.");
    } finally {
      setBusy(false);
    }
  };

  const people = a?.willReceive ?? 0;
  const parts = useMemo(
    () => previewParts(text, companyName, spintaxEnabled),
    [text, companyName, spintaxEnabled, spintaxSeed],
  );
  const finalLabel =
    when === "now" ? `Send to ${people} ${people === 1 ? "person" : "people"}` : when === "schedule" ? `Schedule for ${people}` : "Save draft";

  return (
    <Sheet
      open={open}
      onClose={close}
      title="New broadcast"
      subtitle={`Step ${step + 1} of 3: ${STEPS[step].toLowerCase()}`}
      footer={
        <>
          {step === 0 ? (
            <button type="button" className={btn("ghost")} onClick={close}>
              Cancel
            </button>
          ) : (
            <button type="button" className={btn("ghost")} onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {step < 2 ? (
            <button type="button" className={btn("primary")} onClick={next}>
              Next
            </button>
          ) : (
            <button type="button" disabled={busy || (when !== "draft" && !people)} className={btn("primary")} onClick={() => void send()}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              {finalLabel}
            </button>
          )}
        </>
      }
    >
      <ol className="flex items-center gap-2 mb-5 text-[12.5px]" aria-label="Steps">
        {STEPS.map((label, i) => (
          <li key={label} className={`flex items-center gap-2 ${i === step ? "text-fg font-medium" : "text-fg-3"}`} aria-current={i === step ? "step" : undefined}>
            <span className={`h-6 w-6 grid place-items-center rounded-full text-[12px] ${i < step ? "bg-ok/15 text-ok" : i === step ? "bg-brand-solid text-white" : "bg-surface-2"}`}>
              {i < step ? <Check className="w-3.5 h-3.5" aria-hidden /> : i + 1}
            </span>
            {label}
            {i < STEPS.length - 1 && <span className="w-4 h-px bg-line" aria-hidden />}
          </li>
        ))}
      </ol>

      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <p className="text-[13px] font-medium text-fg-2 mb-2 ml-1">Start from a ready-made message</p>
            <div className="flex flex-wrap gap-2">
              {templates.data?.templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  title={t.description}
                  aria-pressed={chosenTemplate === t.id}
                  onClick={() => choose(t.id)}
                  className={`rounded-full px-3.5 h-9 text-[13.5px] ring-1 transition ${chosenTemplate === t.id ? "bg-brand-solid text-white ring-transparent" : "bg-surface-2 ring-line text-fg hover:ring-gold/60"}`}
                >
                  {t.name}
                </button>
              ))}
              {templates.isPending && <span className="text-[13px] text-fg-3">Loading ready-made messages…</span>}
            </div>
          </div>
          <Field label="Your message" hint="Write it here, or change the ready-made one. Staff see what is sent in the chat.">
            <textarea
              ref={box}
              aria-label="Your message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={4000}
              rows={6}
              placeholder="Hi {{first_name}}, …"
              className={textareaCls}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2 -mt-2">
            <span className="text-[12.5px] text-fg-3">Add fields:</span>
            {FIELDS.map(([token, label]) => (
              <button key={token} type="button" onClick={() => insert(token)} className="rounded-full px-3 h-8 text-[12.5px] bg-surface-2 ring-1 ring-line hover:ring-gold/60">
                {label}
              </button>
            ))}
            <span className="text-[12.5px] text-fg-3 ml-2">Anti-Ban Spintax:</span>
            <button
              type="button"
              onClick={() => insert("{Hi|Hello|Hey}")}
              title="Insert greeting variation"
              className="rounded-full px-3 h-8 text-[12.5px] bg-brand-solid/10 text-brand-solid ring-1 ring-brand-solid/25 hover:bg-brand-solid/15 flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3 h-3 text-brand-solid" />
              <span>{"{Hi|Hello|Hey}"}</span>
            </button>
            <button
              type="button"
              onClick={() => insert("{Hope you're having a great week|Hope this finds you well}")}
              title="Insert friendly opening variation"
              className="rounded-full px-3 h-8 text-[12.5px] bg-surface-2 ring-1 ring-line hover:ring-gold/60"
            >
              <span>Variation {"{A|B}"}</span>
            </button>
          </div>
          {text.trim() && (
            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <p className="text-[13px] font-medium text-fg-2">How a customer sees it</p>
                {containsSpintax && (
                  <button
                    type="button"
                    onClick={() => setSpintaxSeed((s) => s + 1)}
                    className="text-[12px] text-brand-solid hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Shuffle variation preview</span>
                  </button>
                )}
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-surface-2 ring-1 ring-line px-4 py-3 text-[14.5px] leading-relaxed whitespace-pre-wrap max-w-[92%]" data-testid="preview">
                {parts.map((p, i) =>
                  p.blank ? (
                    <mark key={i} className="rounded bg-warn/20 text-fg px-1">
                      {p.text}
                    </mark>
                  ) : (
                    <span key={i}>{p.text}</span>
                  ),
                )}
              </div>
              {containsSpintax && (
                <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ok font-medium ml-1">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Anti-Ban Spintax active: each recipient receives a dynamically varied message.
                </p>
              )}
              {blanks.length > 0 && (
                <p className="mt-2 flex items-start gap-2 text-[13px] text-warn ml-1">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                  Replace the highlighted parts with your own words before sending.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Field label="Send from" hint={connected.length ? undefined : "No number is connected right now. Connect one in Numbers, then come back."}>
            <select aria-label="Send from" value={sender} onChange={(e) => setSession(e.target.value)} className={selectCls}>
              {!sessions.length && <option value="">No numbers yet</option>}
              {sessions.map((s) => (
                <option key={s.id} value={s.sessionKey}>
                  {s.displayName} {s.status === "CONNECTED" ? "" : `(${s.status.toLowerCase()})`}
                </option>
              ))}
            </select>
          </Field>
          <div>
            <p className="text-[13px] font-medium text-fg-2 mb-2 ml-1">Who should get it?</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Audience">
              {[{ tag: ALL, label: "Everyone who agreed", willReceive: undefined as number | undefined }, ...(a?.tags || []).map((t) => ({ tag: t.tag, label: t.tag, willReceive: t.willReceive }))].map((t) => (
                <button
                  key={t.tag}
                  type="button"
                  aria-pressed={tag === t.tag}
                  onClick={() => setTag(t.tag)}
                  className={`rounded-full px-3.5 h-9 text-[13.5px] ring-1 transition ${tag === t.tag ? "bg-brand-solid text-white ring-transparent" : "bg-surface-2 ring-line text-fg hover:ring-gold/60"}`}
                >
                  {t.label}
                  {t.willReceive !== undefined && <span className="ml-1.5 opacity-70 num">{t.willReceive}</span>}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12.5px] text-fg-3 ml-1">Groups come from the tags on your contacts.</p>
          </div>

          {audience.isPending && <p className="text-[13.5px] text-fg-3">Counting…</p>}
          {audience.error && <Notice tone="error">{(audience.error as Error).message}</Notice>}
          {a && (
            <div className="rounded-2xl ring-1 ring-line bg-surface-2 p-4" data-testid="audience">
              <p className="text-[15px]">
                <span className="text-[28px] font-semibold num align-middle mr-2">{a.willReceive}</span>
                {a.willReceive === 1 ? "person will" : "people will"} receive this
              </p>
              {(a.notAsked > 0 || a.optedOut > 0) && (
                <ul className="mt-2 text-[13.5px] text-fg-2 space-y-1">
                  {a.notAsked > 0 && <li>{a.notAsked} haven't been asked yet, so they are left out.</li>}
                  {a.optedOut > 0 && <li>{a.optedOut} said STOP or are blocked, so they are left out.</li>}
                </ul>
              )}
              {a.notAsked > 0 && (
                <div className="mt-4 pt-4 border-t border-line">
                  <label className="flex items-start gap-3 text-[13.5px] cursor-pointer">
                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 accent-brand-solid" />
                    <span>I confirm these {a.notAsked} contacts agreed to receive messages from {companyName || "my business"}.</span>
                  </label>
                  <button type="button" disabled={!agreed || busy} onClick={() => void record()} className={`${btn("secondary", "sm")} mt-3`}>
                    {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
                    Record their permission
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Field label="Name" hint="Only your team sees this.">
            <input aria-label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder={`Broadcast · ${today()}`} className={inputCls} />
          </Field>
          <Field label="Cadence speed" hint={`${estimate(people, seconds, batchSize, cooldownMinutes * 60)} for ${people} ${people === 1 ? "person" : "people"}. Includes human jitter and batch pauses.`}>
            <select aria-label="Sending speed" value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} className={selectCls}>
              {SPEEDS.map((s) => (
                <option key={s.seconds} value={s.seconds}>
                  {s.label}: {s.note}
                </option>
              ))}
            </select>
          </Field>

          {/* Anti-Ban Safeguards Card */}
          <div className="rounded-2xl ring-1 ring-line/80 bg-surface-2 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-ok" />
                <span className="text-[13.5px] font-semibold text-fg">Anti-Ban Protection Engine</span>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-ok/15 text-ok">Active</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[12px] text-fg-3">Batch Size</label>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className={`${selectCls} text-[13px] py-1.5`}
                >
                  <option value={20}>20 contacts / batch</option>
                  <option value={25}>25 contacts / batch (Recommended)</option>
                  <option value={50}>50 contacts / batch</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-fg-3">Batch Cool-Down</label>
                <select
                  value={cooldownMinutes}
                  onChange={(e) => setCooldownMinutes(Number(e.target.value))}
                  className={`${selectCls} text-[13px] py-1.5`}
                >
                  <option value={3}>3 minutes</option>
                  <option value={5}>5 minutes (Recommended)</option>
                  <option value={10}>10 minutes</option>
                </select>
              </div>
            </div>

            <ul className="text-[12px] text-fg-3 space-y-1.5 pt-2 border-t border-line">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-ok shrink-0" />
                <span>Dynamic 2–7s human jitter added to cadence</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-ok shrink-0" />
                <span>Realistic typing presence simulated before send</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-ok shrink-0" />
                <span>Circuit breaker auto-pauses campaign on 3 consecutive failures</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-ok shrink-0" />
                <span>Auto-suppression on STOP/CANCEL protects against spam reports</span>
              </li>
            </ul>
          </div>

          <fieldset>
            <legend className="text-[13px] font-medium text-fg-2 mb-2 ml-1">When</legend>
            <div className="space-y-2">
              {(
                [
                  ["now", "Send now"],
                  ["schedule", "Schedule for later"],
                  ["draft", "Save as a draft for now"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex items-center gap-3 text-[14.5px] cursor-pointer">
                  <input
                    type="radio"
                    name="when"
                    checked={when === value}
                    onChange={() => {
                      setWhen(value);
                      if (value === "schedule" && !at) setAt(localInput(new Date(Date.now() + 60 * 60 * 1000)));
                    }}
                    className="h-4 w-4 accent-brand-solid"
                  />
                  {label}
                </label>
              ))}
            </div>
            {when === "schedule" && (
              <input aria-label="Start time" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className={`${inputCls} mt-3`} />
            )}
          </fieldset>

          <div className="rounded-2xl ring-1 ring-line p-4 space-y-2.5 text-[13.5px]" aria-label="Checklist">
            <Line ok={!!senderInfo && senderInfo.status === "CONNECTED"} yes={`Sending from ${senderInfo?.displayName}`} no="The number isn't connected. You can save a draft and send it once it is." />
            <Line ok={people > 0} yes={`${people} ${people === 1 ? "person has" : "people have"} agreed to receive it`} no="Nobody would receive this" />
            <Line ok={blanks.length === 0} yes="Nothing left to fill in" no="There are parts left to fill in" />
            {a && a.unsubscribeRule.enabled ? (
              <Line ok yes="Customers can reply STOP to unsubscribe" no="" />
            ) : (
              <div className="flex items-start gap-2 text-warn">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                <div>
                  <p>Customers can't reply STOP to leave your list yet. Add the rule so they can.</p>
                  <button type="button" disabled={busy} onClick={() => void addStopRule()} className={`${btn("secondary", "sm")} mt-2`}>
                    {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
                    Add the STOP rule
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="text-[12.5px] text-fg-3">
            Messages that are already sent can't be taken back. You can stop a broadcast at any time and it won't send any more.
          </p>
          <Pill tone="neutral">Only people who agreed receive broadcasts</Pill>
        </div>
      )}
    </Sheet>
  );
}

function Line({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <div className={`flex items-start gap-2 ${ok ? "text-fg" : "text-warn"}`}>
      {ok ? <Check className="w-4 h-4 mt-0.5 shrink-0 text-ok" aria-hidden /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />}
      <span>{ok ? yes : no}</span>
    </div>
  );
}
    </Sheet>
  );
}

function Line({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <div className={`flex items-start gap-2 ${ok ? "text-fg" : "text-warn"}`}>
      {ok ? <Check className="w-4 h-4 mt-0.5 shrink-0 text-ok" aria-hidden /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />}
      <span>{ok ? yes : no}</span>
    </div>
  );
}
