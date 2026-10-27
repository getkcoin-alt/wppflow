import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Globe2, Loader2, Plus, X } from "lucide-react";
import {
  fetchAutomationContext,
  type AutomationContext,
  type RuleDraft,
} from "../../services/api";
import { Field, Notice } from "../ui/Page";
import { Sheet } from "../ui/Sheet";
import { btn, inputCls, selectCls, textareaCls } from "../ui/styles";

const WELCOME =
  "Hi {{first_name}}, welcome to {{company}}! 👋 Thanks for getting in touch.\n\nBefore we begin: how did you find us? AI, our website, social media or word of mouth?\n\nOur team will be in touch with you soon. Until then, you can ask me anything about {{company}}.";
const NO_RIWO: Record<string, string> = {
  plan: "Riwo is part of the Growth plan and above. Until your plan includes it, this rule can send the welcome message only.",
  disabled:
    "An administrator has turned Riwo off for your company. Until it is back on, this rule can send the welcome message only.",
  not_configured:
    "Riwo isn't switched on for this server yet. Until it is, this rule can send the welcome message only.",
};
const FIELDS: [string, string][] = [
  ["{{first_name}}", "First name"],
  ["{{name}}", "Full name"],
  ["{{company}}", "Company"],
];

/**
 * The easy way to greet people who write from another country. Four questions: which country is yours, what to say, what
 * Riwo may talk about, and whether Riwo should answer at all. Everything else (who counts as new, how many replies, what
 * Riwo says when it cannot help) has a sensible answer already filled in.
 */
export function AbroadRecipe({
  open,
  initial,
  editing,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: RuleDraft;
  editing: boolean;
  onClose: () => void;
  /** `turnOn` is true when the person chose "Save and turn on" for a new rule */
  onSave: (rule: RuleDraft, turnOn: boolean) => Promise<void>;
}) {
  const context = useQuery({
    queryKey: ["automation-context"],
    queryFn: fetchAutomationContext,
    staleTime: 60_000,
    enabled: open,
  });
  if (!open) return null;
  if (!context.data)
    return (
      <Sheet
        open
        onClose={onClose}
        title="Welcome people from other countries"
        subtitle="Loading…"
      >
        {context.error ? (
          <Notice tone="error">{(context.error as Error).message}</Notice>
        ) : (
          <p className="text-[14px] text-fg-3">One moment…</p>
        )}
      </Sheet>
    );
  return (
    <Body
      key={`${initial.templateId || "own"}:${initial.name}`}
      ctx={context.data}
      initial={initial}
      editing={editing}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function Body({
  ctx,
  initial,
  editing,
  onClose,
  onSave,
}: {
  ctx: AutomationContext;
  initial: RuleDraft;
  editing: boolean;
  onClose: () => void;
  onSave: (rule: RuleDraft, turnOn: boolean) => Promise<void>;
}) {
  const c = initial.config;
  const wasRiwo = initial.actionType === "ai_chat";
  // a rule that already lets Riwo chat keeps showing it, whatever the plan now says; a new one is offered only if Riwo can answer
  const canUseRiwo = ctx.riwo.available || (editing && wasRiwo);
  const [name, setName] = useState(
    initial.name || "Welcome people from other countries",
  );
  const [homeCodes, setHomeCodes] = useState<string[]>(
    c.homeCodes?.length ? c.homeCodes : ctx.homeCodes,
  );
  const [welcome, setWelcome] = useState(
    (wasRiwo ? c.reply : initial.actionSummary) || WELCOME,
  );
  const [useRiwo, setUseRiwo] = useState(wasRiwo && canUseRiwo);
  const [knowledge, setKnowledge] = useState(c.knowledge || "");
  const [maxReplies, setMaxReplies] = useState(
    c.maxReplies ?? ctx.chat.defaultReplies,
  );
  const [handoff, setHandoff] = useState(c.handoff || ctx.chat.handoff);
  const [options, setOptions] = useState<string[]>(
    c.sourceOptions ?? ctx.chat.sources,
  );
  const [newOption, setNewOption] = useState("");
  const [onlyNew, setOnlyNew] = useState(c.onlyNew !== false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"" | "paused" | "live">("");

  const nameOf = (code: string) =>
    ctx.countries.find((x) => x.code === code)?.name || `+${code}`;
  const choices = ctx.countries.filter((x) => !homeCodes.includes(x.code));
  const addOption = () => {
    const value = newOption.trim();
    if (!value) return;
    if (!options.some((o) => o.toLowerCase() === value.toLowerCase()))
      setOptions([...options, value]);
    setNewOption("");
  };

  const save = async (turnOn: boolean) => {
    if (!name.trim()) return setError("Give the rule a name.");
    if (!homeCodes.length)
      return setError(
        "Choose your own country, so we know which numbers are from abroad.",
      );
    if (!welcome.trim()) return setError("Write the welcome message.");
    if (useRiwo && knowledge.trim().length < 20)
      return setError(
        "Write a few sentences about your business for Riwo to answer from.",
      );
    setBusy(turnOn ? "live" : "paused");
    setError("");
    const rule: RuleDraft = {
      name: name.trim(),
      triggerType: "foreign_number",
      triggerCondition: "",
      actionType: useRiwo ? "ai_chat" : "reply_text",
      actionSummary: useRiwo ? "" : welcome.trim(),
      templateId: initial.templateId || null,
      config: {
        homeCodes,
        onlyNew,
        ...(useRiwo
          ? {
              reply: welcome.trim(),
              knowledge: knowledge.trim(),
              maxReplies,
              handoff: handoff.trim() || undefined,
              sourceOptions: options,
            }
          : {}),
      },
    };
    try {
      await onSave(rule, turnOn);
    } catch (e: any) {
      setError(e.message || "Couldn't save the rule.");
    } finally {
      setBusy("");
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Welcome people from other countries"
      subtitle={
        editing
          ? "Changes apply to new messages straight away."
          : "It starts paused, unless you choose to turn it on."
      }
      footer={
        <>
          <button type="button" className={btn("ghost")} onClick={onClose}>
            Cancel
          </button>
          {editing ? (
            <button
              type="button"
              disabled={!!busy}
              className={btn("primary")}
              onClick={() => void save(false)}
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              Save changes
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={!!busy}
                className={btn("secondary")}
                onClick={() => void save(false)}
              >
                {busy === "paused" && (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                )}
                Save paused
              </button>
              <button
                type="button"
                disabled={!!busy}
                className={btn("primary")}
                onClick={() => void save(true)}
              >
                {busy === "live" && (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                )}
                Save and turn on
              </button>
            </>
          )}
        </>
      }
    >
      <ol
        className="rounded-2xl bg-surface-2 ring-1 ring-line px-4 py-3 mb-5 text-[14px] leading-relaxed space-y-1 list-decimal list-inside"
        aria-label="What this does"
      >
        <li>
          {onlyNew
            ? "Someone from another country writes to you for the first time."
            : "Someone from another country writes to you."}
        </li>
        <li>
          Scriwo sends your welcome message
          {useRiwo ? ", with the question about where they found you" : ""}.
        </li>
        {useRiwo ? (
          <li>
            Riwo answers their short questions, only from what you write below,
            until a teammate replies. Then it stops.
          </li>
        ) : (
          <li>Your team takes it from there.</li>
        )}
      </ol>
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <div className="space-y-5">
        <Field label="Rule name">
          <input
            aria-label="Rule name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </Field>

        <fieldset className="rounded-2xl ring-1 ring-line p-4 space-y-3">
          <legend className="px-1 text-[13px] font-medium text-fg-2 flex items-center gap-1.5">
            <Globe2 className="w-4 h-4" aria-hidden /> Your own country
          </legend>
          <p className="text-[13px] text-fg-2">
            Numbers from these countries are left alone. Everyone else counts as
            being from abroad.
            {ctx.homeFrom && homeCodes.join() === ctx.homeCodes.join()
              ? ` We chose this from ${ctx.homeFrom}.`
              : ""}
          </p>
          <ul className="flex flex-wrap gap-2" aria-label="Your countries">
            {homeCodes.map((code) => (
              <li
                key={code}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 ring-1 ring-line pl-3 pr-1.5 h-9 text-[13.5px]"
              >
                {nameOf(code)} (+{code})
                <button
                  type="button"
                  aria-label={`Remove ${nameOf(code)}`}
                  onClick={() =>
                    setHomeCodes(homeCodes.filter((x) => x !== code))
                  }
                  className="h-6 w-6 grid place-items-center rounded-full hover:bg-surface-3"
                >
                  <X className="w-3.5 h-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <select
            aria-label="Add a country"
            value=""
            onChange={(e) =>
              e.target.value &&
              homeCodes.length < 8 &&
              setHomeCodes([...homeCodes, e.target.value])
            }
            className={selectCls}
          >
            <option value="">
              {homeCodes.length
                ? "Add another country…"
                : "Choose your country…"}
            </option>
            {choices.map((x) => (
              <option key={x.code} value={x.code}>
                {x.name} (+{x.code})
              </option>
            ))}
          </select>
          <label className="flex items-start gap-2.5 text-[13.5px] text-fg-2">
            <input
              type="checkbox"
              className="mt-1"
              checked={onlyNew}
              onChange={(e) => setOnlyNew(e.target.checked)}
            />
            <span>
              Only when they write for the first time. Someone you have been
              chatting with for a while is not welcomed as a stranger.
            </span>
          </label>
        </fieldset>

        <div>
          <Field
            label="Your welcome message"
            hint="This is sent word for word. Ask where they found you, and say a person will be in touch."
          >
            <textarea
              aria-label="Your welcome message"
              rows={8}
              value={welcome}
              onChange={(e) => setWelcome(e.target.value)}
              className={textareaCls}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-[12.5px] text-fg-3">Add the customer's:</span>
            {FIELDS.map(([token, label]) => (
              <button
                key={token}
                type="button"
                onClick={() => setWelcome(welcome + token)}
                className="rounded-full px-3 h-8 text-[12.5px] bg-surface-2 ring-1 ring-line hover:ring-gold/60"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl ring-1 ring-line p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold">
                Let Riwo chat until your team replies
              </p>
              <p className="text-[13px] text-fg-2 mt-0.5">
                Riwo answers short questions for you, in the customer's
                language, in a sentence or two.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={useRiwo}
              aria-label="Let Riwo chat"
              disabled={!canUseRiwo}
              onClick={() => setUseRiwo(!useRiwo)}
              className={`shrink-0 h-8 w-14 rounded-full p-1 transition disabled:opacity-50 ${useRiwo ? "bg-brand-solid" : "bg-surface-3"}`}
            >
              <span
                className={`block h-6 w-6 rounded-full bg-white shadow transition ${useRiwo ? "translate-x-6" : ""}`}
              />
            </button>
          </div>
          {!canUseRiwo && ctx.riwo.reason && (
            <p
              role="status"
              className="rounded-2xl bg-surface-2 ring-1 ring-line px-4 py-3 text-[13.5px] text-fg-2"
            >
              {NO_RIWO[ctx.riwo.reason]}
            </p>
          )}
          {useRiwo && (
            <>
              <Field
                label="What can Riwo tell them about your business?"
                hint="Riwo uses only this. It never makes up prices, offers or links, and passes anything else to your team."
              >
                <textarea
                  aria-label="About your business"
                  rows={6}
                  value={knowledge}
                  maxLength={3000}
                  placeholder="We are … in … We help people … Our services are … We are open … Our website is …"
                  onChange={(e) => setKnowledge(e.target.value)}
                  className={textareaCls}
                />
              </Field>
              <div>
                <p className="text-[13px] font-medium text-fg-2 mb-1.5 ml-1">
                  Where people say they found you
                </p>
                <ul
                  className="flex flex-wrap gap-2"
                  aria-label="Answers we recognise"
                >
                  {options.map((o) => (
                    <li
                      key={o}
                      className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 ring-1 ring-line pl-3 pr-1.5 h-9 text-[13.5px]"
                    >
                      {o}
                      <button
                        type="button"
                        aria-label={`Remove ${o}`}
                        onClick={() =>
                          setOptions(options.filter((x) => x !== o))
                        }
                        className="h-6 w-6 grid place-items-center rounded-full hover:bg-surface-3"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 mt-2">
                  <input
                    aria-label="Add an answer"
                    value={newOption}
                    maxLength={30}
                    placeholder="For example Newspaper"
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    className={btn("secondary")}
                    onClick={addOption}
                    disabled={options.length >= 6}
                  >
                    <Plus className="w-4 h-4" aria-hidden /> Add
                  </button>
                </div>
                <p className="text-[12.5px] text-fg-3 mt-1.5 ml-1">
                  When someone says it, it is saved on their contact as a tag,
                  for example “Found us: Website”.
                </p>
              </div>
              <Field
                label="Riwo answers at most"
                hint={`Then your hand-over message is sent and Riwo stops. Up to ${ctx.chat.maxReplies}. Each answer uses one of your daily Riwo requests.`}
              >
                <input
                  aria-label="Riwo answers at most"
                  type="number"
                  min={1}
                  max={ctx.chat.maxReplies}
                  value={maxReplies}
                  onChange={(e) => setMaxReplies(Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field
                label="When Riwo can't help, it says"
                hint="Sent word for word, once, and your team is told."
              >
                <textarea
                  aria-label="When Riwo can't help"
                  rows={2}
                  value={handoff}
                  onChange={(e) => setHandoff(e.target.value)}
                  className={textareaCls}
                />
              </Field>
            </>
          )}
        </div>
      </div>
    </Sheet>
  );
}
