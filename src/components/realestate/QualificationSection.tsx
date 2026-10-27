import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarPlus,
  Check,
  Copy,
  Loader2,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Field, Notice, Pill } from "../ui/Page";
import { btn, inputCls, selectCls, textareaCls } from "../ui/styles";
import { formatMoney } from "../../utils/pipeline";
import {
  reDraft,
  reLeadViewings,
  reMatches,
  reNextActions,
  reProfile,
  reProposal,
  reSaveProfile,
  type LeadType,
  type ProfileInput,
  type ReMatch,
  type ReProfile,
  type ReProposal,
  type Timeline,
} from "../../services/realEstate";
import {
  LEAD_TYPE_LABEL,
  LEFT_OUT_LABEL,
  STATUS_LABEL,
  TIMELINE_LABEL,
  VIEWING_STATUS_LABEL,
  bedroomsText,
  errorOf,
  reKey,
  splitList,
  useReMeta,
} from "./common";
import { VerificationPill } from "./VerificationPill";

const SUPPLY = ["landlord", "seller"];
const fieldName: Record<string, string> = {
  leadType: "Lead type",
  budgetMin: "Budget from",
  budgetMax: "Budget up to",
  currency: "Currency",
  communities: "Areas",
  propertyTypes: "Property types",
  bedroomsMin: "Bedrooms from",
  bedroomsMax: "Bedrooms up to",
  timeline: "Timeline",
};
const show = (k: string, v: unknown) =>
  Array.isArray(v)
    ? v.join(", ")
    : k === "timeline"
      ? TIMELINE_LABEL[String(v)] || String(v)
      : k === "leadType"
        ? LEAD_TYPE_LABEL[String(v)] || String(v)
        : String(v);

interface FormState {
  leadType: string;
  budgetMin: string;
  budgetMax: string;
  currency: string;
  communities: string;
  propertyTypes: string[];
  bedroomsMin: string;
  bedroomsMax: string;
  timeline: string;
  sourceDetail: string;
  qualificationStatus: string;
  disqualifiedReason: string;
  nextAction: string;
  notes: string;
}
const fromProfile = (p: ReProfile | null, currency: string): FormState => ({
  leadType: p?.leadType || "",
  budgetMin: p?.budgetMin == null ? "" : String(p.budgetMin),
  budgetMax: p?.budgetMax == null ? "" : String(p.budgetMax),
  currency: p?.currency || currency,
  communities: (p?.communities || []).join(", "),
  propertyTypes: p?.propertyTypes || [],
  bedroomsMin: p?.bedroomsMin == null ? "" : String(p.bedroomsMin),
  bedroomsMax: p?.bedroomsMax == null ? "" : String(p.bedroomsMax),
  timeline: p?.timeline || "",
  sourceDetail: p?.sourceDetail || "",
  qualificationStatus: p?.qualificationStatus || "new",
  disqualifiedReason: p?.disqualifiedReason || "",
  nextAction: p?.nextAction || "",
  notes: p?.notes || "",
});
const num = (v: string) => (v.trim() === "" ? null : Number(v));
const toInput = (f: FormState): ProfileInput => ({
  leadType: (f.leadType || null) as LeadType | null,
  budgetMin: num(f.budgetMin),
  budgetMax: num(f.budgetMax),
  currency: f.budgetMin.trim() || f.budgetMax.trim() ? f.currency : null,
  communities: splitList(f.communities),
  propertyTypes: f.propertyTypes,
  bedroomsMin: num(f.bedroomsMin),
  bedroomsMax: num(f.bedroomsMax),
  timeline: (f.timeline || null) as Timeline | null,
  sourceDetail: f.sourceDetail,
  qualificationStatus:
    f.qualificationStatus as ProfileInput["qualificationStatus"],
  disqualifiedReason:
    f.qualificationStatus === "disqualified" ? f.disqualifiedReason : "",
  nextAction: f.nextAction,
  notes: f.notes,
});

// Real-estate qualification, matching listings, next steps and viewings for one lead. It sits inside the lead sheet, and
// only for a company that has the Real Estate solution.
export function QualificationSection({
  leadId,
  conversationId,
  currency,
  aiAvailable,
  onBook,
}: {
  leadId: string;
  conversationId: string | null;
  currency: string;
  aiAvailable: boolean;
  onBook: (propertyId?: string) => void;
}) {
  const qc = useQueryClient();
  const meta = useReMeta();
  const profile = useQuery({
    queryKey: reKey("profile", leadId),
    queryFn: () => reProfile(leadId),
  });
  if (profile.isPending)
    return (
      <Loader2
        className="w-5 h-5 animate-spin text-fg-3"
        aria-label="Loading qualification"
      />
    );
  if (profile.error)
    return <Notice tone="error">{errorOf(profile.error)}</Notice>;
  // everything the solution shows about this company is looked at again after a save
  const refresh = () => qc.invalidateQueries({ queryKey: reKey() });
  return (
    <div className="space-y-6" data-testid="real-estate-section">
      <QualificationForm
        key={`${leadId}:${profile.data.profile?.qualifiedAt || ""}:${JSON.stringify(profile.data.profile?.communities || [])}:${profile.data.profile?.budgetMax}`}
        leadId={leadId}
        profile={profile.data.profile}
        missing={profile.data.missing}
        currency={currency}
        meta={meta.data}
        aiAvailable={aiAvailable && !!conversationId}
        onSaved={refresh}
      />
      <NextSteps leadId={leadId} />
      <Matches
        leadId={leadId}
        aiAvailable={aiAvailable && !!conversationId}
        onBook={onBook}
      />
      <LeadViewings leadId={leadId} onBook={() => onBook()} />
    </div>
  );
}

function QualificationForm({
  leadId,
  profile,
  missing,
  currency,
  meta,
  aiAvailable,
  onSaved,
}: {
  leadId: string;
  profile: ReProfile | null;
  missing: string[];
  currency: string;
  meta?: ReturnType<typeof useReMeta>["data"];
  aiAvailable: boolean;
  onSaved: () => Promise<unknown>;
}) {
  const [f, setF] = useState<FormState>(() => fromProfile(profile, currency));
  const [assisted, setAssisted] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    setSaved(false);
  };
  const save = useMutation({
    mutationFn: () =>
      reSaveProfile(leadId, {
        ...toInput(f),
        ...(assisted ? { assisted: true } : {}),
      }),
    onSuccess: async () => {
      setError("");
      setSaved(true);
      setAssisted(false);
      await onSaved();
    },
    onError: (e) => setError(errorOf(e)),
  });
  const types = meta?.propertyTypes || [
    "apartment",
    "villa",
    "townhouse",
    "penthouse",
    "duplex",
    "studio",
    "office",
    "shop",
    "warehouse",
    "land",
  ];
  const supply = SUPPLY.includes(f.leadType);

  return (
    <section aria-label="Qualification" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-fg-2">Qualification</p>
        <Pill
          tone={
            f.qualificationStatus === "qualified"
              ? "ok"
              : f.qualificationStatus === "disqualified"
                ? "danger"
                : "neutral"
          }
        >
          {STATUS_LABEL[profile?.qualificationStatus || "new"]}
        </Pill>
      </div>
      {aiAvailable && (
        <Proposal
          leadId={leadId}
          onApply={(patch) => {
            setF((x) => ({ ...x, ...patch }));
            setAssisted(true);
            setSaved(false);
          }}
        />
      )}
      <Field label="Lead type">
        <select
          aria-label="Lead type"
          value={f.leadType}
          onChange={(e) => set("leadType", e.target.value)}
          className={selectCls}
        >
          <option value="">Not decided yet</option>
          {(
            meta?.leadTypes || [
              "buyer",
              "tenant",
              "landlord",
              "seller",
              "investor",
            ]
          ).map((t) => (
            <option key={t} value={t}>
              {LEAD_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </Field>
      {supply ? (
        <p className="text-[13px] text-fg-3">
          A {f.leadType} is offering a property, so there is nothing to match.
          Record the details in the notes.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Budget from">
              <input
                aria-label="Budget from"
                type="number"
                min={0}
                inputMode="decimal"
                value={f.budgetMin}
                onChange={(e) => set("budgetMin", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Budget up to">
              <input
                aria-label="Budget up to"
                type="number"
                min={0}
                inputMode="decimal"
                value={f.budgetMax}
                onChange={(e) => set("budgetMax", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Currency">
              <select
                aria-label="Currency"
                value={f.currency}
                onChange={(e) => set("currency", e.target.value)}
                className={selectCls}
              >
                {(meta?.currencies || ["AED", "USD", "EUR", "GBP", "INR"]).map(
                  (c) => (
                    <option key={c}>{c}</option>
                  ),
                )}
              </select>
            </Field>
          </div>
          <Field
            label="Areas"
            hint="Separate with commas. Written the way the listings are written."
          >
            <input
              aria-label="Areas"
              value={f.communities}
              onChange={(e) => set("communities", e.target.value)}
              className={inputCls}
              dir="auto"
              placeholder="Dubai Marina, JVC"
            />
          </Field>
          <div>
            <p className="text-[13px] font-medium text-fg-2 mb-1.5 ml-1">
              Property types
            </p>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Property types"
            >
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={f.propertyTypes.includes(t)}
                  onClick={() =>
                    set(
                      "propertyTypes",
                      f.propertyTypes.includes(t)
                        ? f.propertyTypes.filter((x) => x !== t)
                        : [...f.propertyTypes, t],
                    )
                  }
                  className={`rounded-full px-3 h-8 text-[13px] ring-1 capitalize transition ${f.propertyTypes.includes(t) ? "bg-brand-solid text-white ring-transparent" : "bg-surface-2 ring-line text-fg-2 hover:ring-gold/60"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bedrooms from" hint="0 means a studio.">
              <input
                aria-label="Bedrooms from"
                type="number"
                min={0}
                max={20}
                value={f.bedroomsMin}
                onChange={(e) => set("bedroomsMin", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Bedrooms up to">
              <input
                aria-label="Bedrooms up to"
                type="number"
                min={0}
                max={20}
                value={f.bedroomsMax}
                onChange={(e) => set("bedroomsMax", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Timeline">
            <select
              aria-label="Timeline"
              value={f.timeline}
              onChange={(e) => set("timeline", e.target.value)}
              className={selectCls}
            >
              <option value="">Not asked yet</option>
              {(
                meta?.timelines || (Object.keys(TIMELINE_LABEL) as Timeline[])
              ).map((t) => (
                <option key={t} value={t}>
                  {TIMELINE_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}
      <Field
        label="Where did they come from?"
        hint="For example Property Finder, Instagram, a referral."
      >
        <input
          aria-label="Where did they come from?"
          value={f.sourceDetail}
          maxLength={60}
          onChange={(e) => set("sourceDetail", e.target.value)}
          className={inputCls}
          dir="auto"
        />
      </Field>
      <Field label="Status">
        <select
          aria-label="Status"
          value={f.qualificationStatus}
          onChange={(e) => set("qualificationStatus", e.target.value)}
          className={selectCls}
        >
          {(
            meta?.qualificationStatuses || [
              "new",
              "in_progress",
              "qualified",
              "disqualified",
            ]
          ).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </Field>
      {f.qualificationStatus === "disqualified" && (
        <Field label="Why is this not a fit?">
          <input
            aria-label="Why is this not a fit?"
            value={f.disqualifiedReason}
            maxLength={255}
            onChange={(e) => set("disqualifiedReason", e.target.value)}
            className={inputCls}
            dir="auto"
          />
        </Field>
      )}
      <Field label="Next action">
        <input
          aria-label="Next action"
          value={f.nextAction}
          maxLength={255}
          onChange={(e) => set("nextAction", e.target.value)}
          className={inputCls}
          dir="auto"
          placeholder="Send two listings by evening"
        />
      </Field>
      <Field label="Notes">
        <textarea
          aria-label="Notes"
          value={f.notes}
          maxLength={2000}
          onChange={(e) => set("notes", e.target.value)}
          className={textareaCls}
          dir="auto"
        />
      </Field>
      {!supply &&
        f.qualificationStatus !== "qualified" &&
        missing.length > 0 && (
          <p className="text-[13px] text-fg-3">
            To mark this lead qualified, still needed: {missing.join(", ")}.
          </p>
        )}
      {error && <Notice tone="error">{error}</Notice>}
      {saved && <Notice tone="success">Saved.</Notice>}
      <button
        type="button"
        disabled={save.isPending}
        onClick={() => save.mutate()}
        className={btn("primary")}
      >
        {save.isPending && (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        )}
        Save qualification
      </button>
    </section>
  );
}

// Riwo reads the chat and proposes. Applying a proposal only fills in the form: a person still reviews it and saves.
function Proposal({
  leadId,
  onApply,
}: {
  leadId: string;
  onApply: (patch: Partial<FormState>) => void;
}) {
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const ask = useMutation({
    mutationFn: () => reProposal(leadId),
    onSuccess: (r) =>
      setPicked(
        Object.fromEntries(Object.keys(r.proposal).map((k) => [k, true])),
      ),
  });
  const r: ReProposal | undefined = ask.data;
  const apply = () => {
    if (!r) return;
    const p = r.proposal as Record<string, unknown>;
    const patch: Partial<FormState> = {};
    for (const k of Object.keys(p).filter((k) => picked[k])) {
      const v = p[k];
      if (k === "communities") patch.communities = (v as string[]).join(", ");
      else if (k === "propertyTypes") patch.propertyTypes = v as string[];
      else (patch as Record<string, string>)[k] = String(v);
    }
    onApply(patch);
    ask.reset();
  };
  return (
    <div className="rounded-2xl ring-1 ring-line p-3 space-y-3 bg-surface-2/40">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13.5px] font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" aria-hidden /> Riwo can read
          the chat for these details
        </p>
        <button
          type="button"
          className={btn("secondary", "sm")}
          disabled={ask.isPending}
          onClick={() => ask.mutate()}
        >
          {ask.isPending && (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          )}
          Read the chat
        </button>
      </div>
      {ask.error && <Notice tone="error">{errorOf(ask.error)}</Notice>}
      {r && (
        <div className="space-y-3" aria-label="Riwo's proposal">
          <p className="text-[12.5px] text-fg-3">
            {r.note} Each detail comes with the customer's own words.
          </p>
          {Object.keys(r.proposal).length === 0 && (
            <p className="text-[13.5px] text-fg-2">
              Riwo found nothing it could back up with the customer's own words.
            </p>
          )}
          <ul className="space-y-2">
            {Object.entries(r.proposal).map(([k, v]) => (
              <li key={k} className="text-[13.5px]">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={!!picked[k]}
                    onChange={(e) =>
                      setPicked((x) => ({ ...x, [k]: e.target.checked }))
                    }
                    className="mt-1"
                    aria-label={`Use ${fieldName[k] || k}`}
                  />
                  <span>
                    <span className="font-medium">{fieldName[k] || k}:</span>{" "}
                    {show(k, v)}
                    {r.evidence[k] && (
                      <span
                        className="block text-fg-3 text-[12.5px]"
                        dir="auto"
                      >
                        “{r.evidence[k]}”
                      </span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {r.rejected.length > 0 && (
            <p className="text-[12.5px] text-fg-3">
              Left out:{" "}
              {r.rejected
                .map(
                  (x) =>
                    `${fieldName[x.field] || x.field} (${x.reason.toLowerCase()})`,
                )
                .join("; ")}
            </p>
          )}
          {r.conflict && (
            <Notice tone="error">
              The proposal contradicts itself: {r.conflict}
            </Notice>
          )}
          {r.uncertain.length > 0 && (
            <p className="text-[12.5px] text-fg-3">
              Riwo is unsure: {r.uncertain.join("; ")}
            </p>
          )}
          {r.missing.length > 0 && (
            <p className="text-[12.5px] text-fg-3">
              Still missing: {r.missing.join(", ")}.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              className={btn("primary", "sm")}
              disabled={!Object.values(picked).some(Boolean)}
              onClick={apply}
            >
              Fill in the form
            </button>
            <button
              type="button"
              className={btn("ghost", "sm")}
              onClick={() => ask.reset()}
            >
              Dismiss
            </button>
          </div>
          <p className="text-[12.5px] text-fg-3">
            Nothing is saved until you press “Save qualification”.
          </p>
        </div>
      )}
    </div>
  );
}

function NextSteps({ leadId }: { leadId: string }) {
  const q = useQuery({
    queryKey: reKey("next", leadId),
    queryFn: () => reNextActions(leadId),
  });
  if (!q.data?.actions.length) return null;
  return (
    <section aria-label="Next steps" className="space-y-2">
      <p className="text-[13px] font-medium text-fg-2">Next steps</p>
      <ul className="space-y-2">
        {q.data.actions.map((a) => (
          <li
            key={a.code}
            className="rounded-2xl bg-surface-2 px-3.5 py-2.5 text-[13.5px]"
          >
            <p className="font-medium">{a.text}</p>
            <p className="text-fg-3 text-[12.5px]">{a.why}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Matches({
  leadId,
  aiAvailable,
  onBook,
}: {
  leadId: string;
  aiAvailable: boolean;
  onBook: (propertyId?: string) => void;
}) {
  const q = useQuery({
    queryKey: reKey("matches", leadId),
    queryFn: () => reMatches(leadId),
  });
  const [draft, setDraft] = useState<{ text: string; note: string } | null>(
    null,
  );
  const [copied, setCopied] = useState("");
  const [fallback, setFallback] = useState("");
  const drafting = useMutation({
    mutationFn: () => reDraft(leadId, "friendly"),
    onSuccess: (r) => {
      setDraft({ text: r.text, note: r.note });
      setFallback("");
    },
    onError: (e) => {
      setDraft(null);
      setFallback(
        (e as Error & { data?: { fallback?: string } }).data?.fallback || "",
      );
    },
  });
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* the text is on screen to select by hand */
    }
  };
  if (q.isPending)
    return (
      <Loader2
        className="w-5 h-5 animate-spin text-fg-3"
        aria-label="Loading matches"
      />
    );
  if (q.error) return <Notice tone="error">{errorOf(q.error)}</Notice>;
  const d = q.data;
  const hasFresh = d.matches.some((m) => m.verification === "fresh");
  return (
    <section aria-label="Matching listings" className="space-y-3">
      <p className="text-[13px] font-medium text-fg-2">Matching listings</p>
      {!d.eligible ? (
        <p className="text-[13.5px] text-fg-2">{d.reason}</p>
      ) : d.matches.length === 0 ? (
        <p className="text-[13.5px] text-fg-2">
          None of your {d.candidates} available listing
          {d.candidates === 1 ? "" : "s"} meets everything they asked for.
          {Object.keys(d.leftOut).length > 0 &&
            ` Left out: ${Object.entries(d.leftOut)
              .map(([k, n]) => `${n} ${LEFT_OUT_LABEL[k] || k}`)
              .join(", ")}.`}
        </p>
      ) : (
        <>
          <p className="text-[12.5px] text-fg-3">
            {d.total} listing{d.total === 1 ? "" : "s"} meet every requirement
            they stated ({d.requirements.join(", ")}). Only your own, available
            listings are shown.
          </p>
          <ul className="space-y-3">
            {d.matches.map((m) => (
              <MatchCard
                key={m.property.id}
                m={m}
                copied={copied === m.property.id}
                onCopy={() => void copy(m.property.id, m.shareText)}
                onBook={() => onBook(m.property.id)}
              />
            ))}
          </ul>
          {aiAvailable && (
            <div className="space-y-2">
              <button
                type="button"
                className={btn("secondary", "sm")}
                disabled={drafting.isPending || !hasFresh}
                onClick={() => drafting.mutate()}
                title={
                  hasFresh
                    ? undefined
                    : "Confirm a listing's availability first"
                }
              >
                {drafting.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                )}
                <Sparkles className="w-4 h-4" aria-hidden /> Draft a reply with
                these listings
              </button>
              {drafting.error && (
                <Notice tone="error">{errorOf(drafting.error)}</Notice>
              )}
              {fallback && (
                <div>
                  <p className="text-[12.5px] text-fg-3 mb-1">
                    The listings, ready to share by hand:
                  </p>
                  <pre className="whitespace-pre-wrap text-[13px] rounded-2xl bg-surface-2 p-3">
                    {fallback}
                  </pre>
                </div>
              )}
              {draft && (
                <div className="space-y-2">
                  <textarea
                    aria-label="Draft reply"
                    value={draft.text}
                    onChange={(e) =>
                      setDraft({ ...draft, text: e.target.value })
                    }
                    className={textareaCls}
                    dir="auto"
                  />
                  <p className="text-[12.5px] text-fg-3">
                    {draft.note} Listing details were filled in from your
                    records.
                  </p>
                  <button
                    type="button"
                    className={btn("secondary", "sm")}
                    onClick={() => void copy("draft", draft.text)}
                  >
                    <Copy className="w-4 h-4" aria-hidden />{" "}
                    {copied === "draft" ? "Copied" : "Copy the draft"}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function MatchCard({
  m,
  copied,
  onCopy,
  onBook,
}: {
  m: ReMatch;
  copied: boolean;
  onCopy: () => void;
  onBook: () => void;
}) {
  const p = m.property;
  return (
    <li
      className="rounded-2xl ring-1 ring-line p-3.5 space-y-2"
      data-testid={`match-${p.reference}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-[14.5px]">{p.reference}</p>
          <p className="text-[13px] text-fg-2 truncate" dir="auto">
            {[bedroomsText(p.bedrooms), p.propertyType, p.community]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold num">
            {p.price === null ? "" : formatMoney(p.price, p.currency)}
            {p.purpose === "rent" && p.rentPeriod ? (
              <span className="text-fg-3 font-normal text-[12px]">
                {" "}
                / {p.rentPeriod}
              </span>
            ) : null}
          </p>
          <VerificationPill p={p} />
        </div>
      </div>
      <ul className="space-y-1 text-[13px]">
        {m.reasons.map((r) => (
          <li key={r} className="flex items-start gap-2 text-fg-2">
            <Check
              className="w-3.5 h-3.5 mt-0.5 text-ok shrink-0"
              aria-hidden
            />
            <span>{r}</span>
          </li>
        ))}
        {m.warnings.map((w) => (
          <li key={w} className="flex items-start gap-2 text-warn">
            <TriangleAlert
              className="w-3.5 h-3.5 mt-0.5 shrink-0"
              aria-hidden
            />
            <span>{w}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          className={btn("secondary", "sm")}
          onClick={onBook}
        >
          <CalendarPlus className="w-4 h-4" aria-hidden /> Book a viewing
        </button>
        <button type="button" className={btn("ghost", "sm")} onClick={onCopy}>
          <Copy className="w-4 h-4" aria-hidden />{" "}
          {copied ? "Copied" : "Copy details"}
        </button>
      </div>
    </li>
  );
}

function LeadViewings({
  leadId,
  onBook,
}: {
  leadId: string;
  onBook: () => void;
}) {
  const q = useQuery({
    queryKey: reKey("lead-viewings", leadId),
    queryFn: () => reLeadViewings(leadId),
  });
  const list = q.data?.viewings || [];
  return (
    <section aria-label="Viewings" className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-fg-2">Viewings</p>
        <button type="button" className={btn("ghost", "sm")} onClick={onBook}>
          <CalendarPlus className="w-4 h-4" aria-hidden /> Book
        </button>
      </div>
      {q.error && <Notice tone="error">{errorOf(q.error)}</Notice>}
      {!q.error && list.length === 0 && (
        <p className="text-[13.5px] text-fg-3">No viewing booked yet.</p>
      )}
      <ul className="space-y-1.5">
        {list.map((v) => (
          <li
            key={v.id}
            className="flex items-center justify-between gap-3 text-[13.5px]"
          >
            <span>
              {v.propertyReference} · {v.local.text}
            </span>
            <Pill
              tone={
                v.status === "confirmed" || v.status === "completed"
                  ? "ok"
                  : v.status === "cancelled" || v.status === "no_show"
                    ? "danger"
                    : "neutral"
              }
            >
              {VIEWING_STATUS_LABEL[v.status]}
            </Pill>
          </li>
        ))}
      </ul>
    </section>
  );
}
