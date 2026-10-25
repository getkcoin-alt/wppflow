import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, LogOut, Plus } from "lucide-react";
import { ScriwoMark, Wordmark } from "../brand/Logo";
import { Sheet } from "../ui/Sheet";
import { EmptyState, Field, Notice, Pill } from "../ui/Page";
import { btn, inputCls, selectCls } from "../ui/styles";
import { ThemeSwitch } from "../layout/ProfileMenu";
import { useTheme } from "../../hooks/useTheme";
import {
  listCompanies,
  listPlans,
  createCompany,
  updateCompany,
  resendOwnerCredentials,
  type PlanChoice,
} from "../../services/api";

interface Company {
  id: string;
  name: string;
  /** The plan's name, or the original "Workspace" for companies from before plans */
  plan: string;
  planId: PlanChoice["id"] | null;
  status: "active" | "suspended";
  sessionsLimit: number;
  staffCount: number;
  sessionsCount: number;
  connectedSessions: number;
  /** The AI assistant as part of the subscription: what the company may use and has used */
  ai?: {
    included: boolean;
    enabled: boolean;
    dailyLimit: number;
    customLimit: boolean;
    usedToday: number;
    requestsThisMonth: number;
    tokensThisMonth: number;
  };
  createdAt: string;
  owner: { name: string; email: string; activated: boolean } | null;
}

// What a plan gives, in one sentence, so the choice is clear before it is made.
const featureName = (label: string) => {
  const bare = label.replace(/^The /, "");
  return bare.charAt(0).toUpperCase() + bare.slice(1);
};
function describePlan(plan: PlanChoice): string {
  const numbers = plan.numbers === null ? "A custom number of WhatsApp numbers" : `${plan.numbers === 1 ? "One WhatsApp number" : `Up to ${plan.numbers} WhatsApp numbers`}`;
  const people = plan.seats === 1 ? ", for one person" : "";
  const extras = plan.features.filter((f) => f.included).map((f) => featureName(f.label));
  return `${numbers}${people}. ${extras.length ? `Adds ${extras.join(", ")}.` : "No broadcasts, automations, audit log, API or AI assistant."}`;
}

// The plan and number limit fields, shared by "Add a company" and "Change plan": picking a plan fills in the
// number limit that plan includes, which can still be changed.
function PlanFields({
  plans,
  planId,
  limit,
  onPlan,
  onLimit,
  aiLimit,
  onAiLimit,
}: {
  plans: PlanChoice[] | undefined;
  planId: string;
  limit: string;
  onPlan: (id: string) => void;
  onLimit: (value: string) => void;
  aiLimit: string;
  onAiLimit: (value: string) => void;
}) {
  const chosen = plans?.find((p) => p.id === planId);
  return (
    <>
      <Field label="Plan" hint={chosen ? describePlan(chosen) : "Choose what this company has bought."}>
        <select
          aria-label="Plan"
          name="plan"
          required
          value={planId}
          onChange={(e) => onPlan(e.target.value)}
          className={selectCls}
        >
          <option value="" disabled>
            Choose a plan…
          </option>
          {plans?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="WhatsApp number limit"
        hint={
          chosen?.numbers === null
            ? "Enterprise has no standard limit: enter the number you agreed."
            : chosen
              ? `${chosen.name} includes ${chosen.numbers}. Change it only for a special agreement.`
              : "How many numbers this company may connect."
        }
      >
        <input
          aria-label="WhatsApp session limit"
          name="sessionsLimit"
          type="number"
          min={1}
          max={500}
          value={limit}
          onChange={(e) => onLimit(e.target.value)}
          required
          className={inputCls}
        />
      </Field>
      {chosen?.aiDaily != null && (
        <Field
          label="Riwo requests a day"
          hint={`How many times the whole company may ask Riwo each day. Leave blank for the default of ${chosen.aiDaily}; type a number only for a special agreement.`}
        >
          <input
            aria-label="Riwo requests a day"
            name="aiDailyLimit"
            type="number"
            min={1}
            max={100000}
            placeholder={`Default: ${chosen.aiDaily}`}
            value={aiLimit}
            onChange={(e) => onAiLimit(e.target.value)}
            className={inputCls}
          />
        </Field>
      )}
    </>
  );
}

export function PlatformAdmin({
  adminName,
  onLogout,
}: {
  adminName: string;
  onLogout: () => void;
}) {
  const qc = useQueryClient();
  const theme = useTheme();
  const [adding, setAdding] = useState(false);
  const { data, error, isPending } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: listCompanies,
  });
  const plans = useQuery<PlanChoice[]>({ queryKey: ["plans"], queryFn: listPlans });
  const [newPlan, setNewPlan] = useState(""),
    [newLimit, setNewLimit] = useState(""),
    [newAi, setNewAi] = useState("");
  const pickNew = (id: string) => {
    setNewPlan(id);
    setNewLimit(String(plans.data?.find((p) => p.id === id)?.numbers ?? ""));
  };
  // Changing the plan of an existing company
  const [moving, setMoving] = useState<Company | null>(null);
  const [movePlan, setMovePlan] = useState(""),
    [moveLimit, setMoveLimit] = useState(""),
    [moveAi, setMoveAi] = useState("");
  const startMove = (c: Company) => {
    setMoving(c);
    setMovePlan(c.planId || "");
    setMoveLimit(String(c.sessionsLimit));
    setMoveAi(c.ai?.customLimit ? String(c.ai.dailyLimit) : "");
  };
  const pickMove = (id: string) => {
    setMovePlan(id);
    const included = plans.data?.find((p) => p.id === id)?.numbers;
    setMoveLimit(String(included ?? (id === moving?.planId ? moving.sessionsLimit : "")));
  };
  const [notice, setNotice] = useState(""),
    [failure, setFailure] = useState(""),
    [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<any>, success?: (r: any) => string) => {
    setBusy(true);
    setFailure("");
    setNotice("");
    try {
      const r = await fn();
      setNotice(success ? success(r) : r?.message || "");
      await qc.invalidateQueries({ queryKey: ["companies"] });
      return r;
    } catch (e: any) {
      setFailure(e.message);
    } finally {
      setBusy(false);
    }
  };
  const totals = {
    companies: data?.length || 0,
    active: data?.filter((c) => c.status === "active").length || 0,
    live: data?.reduce((n, c) => n + c.connectedSessions, 0) || 0,
    people: data?.reduce((n, c) => n + c.staffCount, 0) || 0,
  };
  return (
    <div className="min-h-dvh bg-app text-fg">
      <header className="glass sticky top-0 z-30 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ScriwoMark size={34} />
            <Wordmark className="text-[19px]" />
            <Pill tone="gold">Platform</Pill>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block w-56">
              <ThemeSwitch value={theme.choice} onChange={theme.setChoice} />
            </div>
            <span className="hidden md:inline text-[14px] text-fg-2">
              {adminName}
            </span>
            <button onClick={onLogout} className={btn("ghost", "sm")}>
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-8 pt-8 sm:pt-12 pb-16 animate-rise">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="eyebrow mb-2">Platform</div>
            <h1 className="text-[32px] sm:text-[40px] leading-[1.1] font-semibold">
              Companies
            </h1>
            <p className="text-[16px] text-fg-2 mt-1.5">
              Create a company and its owner receives an email to set their
              password.
            </p>
          </div>
          <button className={btn("primary")} onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4" /> Add company
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            ["Companies", totals.companies],
            ["Active", totals.active],
            ["Numbers live", totals.live],
            ["People", totals.people],
          ].map(([k, v]) => (
            <div key={k as string} className="card p-5">
              <p className="text-[13px] text-fg-2">{k}</p>
              <p className="mt-1.5 text-[34px] leading-none font-semibold num">
                {v}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-3 mb-5">
          {(failure || error) && (
            <Notice tone="error">{failure || (error as Error).message}</Notice>
          )}
          {notice && <Notice tone="success">{notice}</Notice>}
        </div>

        <Sheet
          open={adding}
          onClose={() => setAdding(false)}
          title="Add a company"
          subtitle="We email the owner a secure link to choose their password."
          footer={
            <>
              <button
                type="button"
                className={btn("ghost")}
                onClick={() => setAdding(false)}
              >
                Cancel
              </button>
              <button
                form="company-form"
                disabled={busy}
                className={btn("primary")}
              >
                Add company &amp; email setup link
              </button>
            </>
          }
        >
          <form
            id="company-form"
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget,
                f = new FormData(form);
              void run(() =>
                createCompany({
                  companyName: String(f.get("companyName")),
                  ownerName: String(f.get("ownerName")),
                  ownerEmail: String(f.get("ownerEmail")),
                  plan: newPlan,
                  sessionsLimit: Number(newLimit),
                  ...(newAi.trim() ? { aiDailyLimit: Number(newAi) } : {}),
                }),
              ).then((r) => {
                if (r) {
                  form.reset();
                  setNewPlan("");
                  setNewLimit("");
                  setNewAi("");
                  setAdding(false);
                }
              });
            }}
          >
            <Field label="Company name">
              <input
                aria-label="Company name"
                name="companyName"
                required
                placeholder="Acme Retail"
                className={inputCls}
              />
            </Field>
            <Field label="Owner name">
              <input
                aria-label="Owner name"
                name="ownerName"
                required
                placeholder="Jane Doe"
                className={inputCls}
              />
            </Field>
            <Field label="Owner email">
              <input
                aria-label="Owner email"
                name="ownerEmail"
                type="email"
                required
                placeholder="jane@acme.com"
                className={inputCls}
              />
            </Field>
            <PlanFields plans={plans.data} planId={newPlan} limit={newLimit} onPlan={pickNew} onLimit={setNewLimit} aiLimit={newAi} onAiLimit={setNewAi} />
            {plans.error && <Notice tone="error">{(plans.error as Error).message}</Notice>}
          </form>
        </Sheet>

        <Sheet
          open={!!moving}
          onClose={() => setMoving(null)}
          title={`Change plan for ${moving?.name ?? ""}`}
          subtitle="What the company can use changes straight away. Nothing it already has is removed."
          footer={
            <>
              <button type="button" className={btn("ghost")} onClick={() => setMoving(null)}>
                Cancel
              </button>
              <button form="plan-form" disabled={busy} className={btn("primary")}>
                Save plan
              </button>
            </>
          }
        >
          <form
            id="plan-form"
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!moving) return;
              const company = moving;
              void run(
                () =>
                  updateCompany(company.id, {
                    plan: movePlan,
                    sessionsLimit: Number(moveLimit),
                    // blank goes back to the default; a plan without Riwo has no allowance to change
                    ...(plans.data?.find((p) => p.id === movePlan)?.aiDaily != null
                      ? { aiDailyLimit: moveAi.trim() ? Number(moveAi) : null }
                      : {}),
                  }),
                (r) => [`${company.name} is now on the ${r.company.plan} plan.`, ...(r.warnings || [])].join(" "),
              ).then((r) => r && setMoving(null));
            }}
          >
            <p className="text-[14px] text-fg-2">
              Now on <span className="font-medium text-fg">{moving?.plan}</span> with {moving?.sessionsLimit} WhatsApp numbers.
            </p>
            <PlanFields plans={plans.data} planId={movePlan} limit={moveLimit} onPlan={pickMove} onLimit={setMoveLimit} aiLimit={moveAi} onAiLimit={setMoveAi} />
          </form>
        </Sheet>

        {isPending && (
          <div className="space-y-3" aria-busy>
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-24 !rounded-3xl" />
            ))}
            <span className="sr-only">Loading companies…</span>
          </div>
        )}
        {data?.length === 0 && (
          <EmptyState
            icon={<Building2 className="w-6 h-6" />}
            title="No companies yet"
            body="Add the first one to get started."
            action={
              <button
                className={btn("primary")}
                onClick={() => setAdding(true)}
              >
                <Plus className="w-4 h-4" /> Add company
              </button>
            }
          />
        )}
        <ul className="space-y-3">
          {data?.map((c) => (
            <li key={c.id} className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[19px] font-semibold truncate">
                      {c.name}
                    </h2>
                    <Pill tone={c.status === "active" ? "ok" : "warn"} dot>
                      {c.status}
                    </Pill>
                    <Pill tone="gold">{c.plan}</Pill>
                  </div>
                  <p className="text-[14px] text-fg-2 mt-1">
                    {c.owner
                      ? `${c.owner.name} · ${c.owner.email}`
                      : "No owner"}
                    {c.owner && !c.owner.activated ? (
                      <span className="ml-2 inline-block align-middle">
                        <Pill tone="warn">Awaiting password setup</Pill>
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    disabled={busy}
                    className={btn("ghost", "sm")}
                    onClick={() =>
                      void run(
                        () =>
                          updateCompany(c.id, {
                            status:
                              c.status === "active" ? "suspended" : "active",
                          }),
                        () =>
                          `${c.name} is now ${c.status === "active" ? "suspended" : "active"}.`,
                      )
                    }
                  >
                    {c.status === "active" ? "Suspend" : "Reactivate"}
                  </button>
                  <button
                    disabled={busy}
                    className={btn("ghost", "sm")}
                    onClick={() => {
                      const v = window.prompt(
                        "WhatsApp session limit",
                        String(c.sessionsLimit),
                      );
                      if (v)
                        void run(
                          () =>
                            updateCompany(c.id, { sessionsLimit: Number(v) }),
                          () => "Session limit updated.",
                        );
                    }}
                  >
                    Set limit
                  </button>
                  <button
                    disabled={busy}
                    className={btn("ghost", "sm")}
                    onClick={() => startMove(c)}
                  >
                    Change plan
                  </button>
                  {c.owner && (
                    <button
                      disabled={busy}
                      className={btn("secondary", "sm")}
                      onClick={() =>
                        void run(() => resendOwnerCredentials(c.id))
                      }
                    >
                      Resend setup link
                    </button>
                  )}
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <dt className="text-[12.5px] text-fg-3">People</dt>
                  <dd className="text-[24px] font-semibold num">
                    {c.staffCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12.5px] text-fg-3">Numbers live</dt>
                  <dd className="text-[24px] font-semibold num">
                    {c.connectedSessions}
                    <span className="text-fg-3 text-[16px]">
                      {" "}
                      / {c.sessionsCount}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12.5px] text-fg-3">Limit</dt>
                  <dd className="text-[24px] font-semibold num">
                    {c.sessionsLimit}
                  </dd>
                </div>
                <div data-testid={`ai-${c.id}`}>
                  <dt className="text-[12.5px] text-fg-3">Riwo today</dt>
                  {c.ai?.included ? (
                    <dd className="num">
                      <span className="text-[24px] font-semibold">{c.ai.usedToday.toLocaleString()}</span>
                      <span className="text-fg-3 text-[16px]"> / {c.ai.dailyLimit.toLocaleString()}</span>
                      <span className="block text-[12.5px] text-fg-3">
                        {c.ai.requestsThisMonth.toLocaleString()} this month
                        {c.ai.customLimit ? " · agreed limit" : ""}
                        {!c.ai.enabled ? " · switched off" : ""}
                      </span>
                    </dd>
                  ) : (
                    <dd className="text-[15px] text-fg-3 pt-2">Not in this plan</dd>
                  )}
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
