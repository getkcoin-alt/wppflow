import { useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Circle } from "lucide-react";
import { getBaseBackendUrl, getOtp, getOtpPreview, getStoredTenantId, saveOtpSettings, type OtpOverview, type OtpSettingsPatch } from "../../../services/api";
import { useIsPhone } from "../../../hooks/useMedia";
import { Notice } from "../../ui/Page";
import { ActivityCard } from "./ActivityCard";
import { ConnectCard } from "./ConnectCard";
import { NotifyCard } from "./NotifyCard";
import { NumberCard } from "./NumberCard";
import { OtpPreview } from "./OtpPreview";
import { StepCard } from "./StepCard";
import { AgentPromptCard, QuickCopyPrompt } from "./AgentPromptCard";
import { buildAgentPrompt, whatIsMissing } from "./agentPrompt";
import { TestCard } from "./TestCard";
import { brandProblem } from "./brand";
import { predictSettings } from "./predict";
import { FineTune, UseCaseTiles } from "./UseCase";

const problem = (e: any): string => `${e?.message || "Something went wrong."}${e?.data?.fix ? ` ${e.data.fix}` : ""}`;

function Milestone({ done, children }: { done: boolean; children: string }) {
  return (
    <li className={`inline-flex items-center gap-1.5 rounded-full px-3 h-8 ${done ? "bg-ok/10 text-ok" : "bg-surface-2 text-fg-3"}`}>
      {done ? <Check className="w-3.5 h-3.5" aria-hidden /> : <Circle className="w-3 h-3" aria-hidden />}
      <span className="text-[13px] font-medium">{children}</span>
      <span className="sr-only">{done ? ", done" : ", not done yet"}</span>
    </li>
  );
}

/** Developers → Free OTP: pick what the code is for, link a number, try it, paste the code. All on one page. */
export function OtpStudio({ canManage, onConnectNumber }: { canManage: boolean; onConnectNumber?: () => void }) {
  const tenant = getStoredTenantId();
  const qc = useQueryClient();
  const phone = useIsPhone();
  const [error, setError] = useState("");
  const [brand, setBrand] = useState<string | null>(null); // what is being typed; null means what is saved
  const [widgetKey, setWidgetKey] = useState(""); // a widget key made on this visit: public by design, so the agent prompt may carry it
  const overview = useQuery({
    queryKey: ["otp", tenant],
    queryFn: getOtp,
    enabled: canManage,
    // while there is no number, look again now and then: the pairing screen is a different place
    refetchInterval: (q) => (q.state.data && !q.state.data.ready.number ? 5000 : false),
  });
  const data = overview.data;
  const settings = data?.settings;
  const refresh = () => qc.invalidateQueries({ queryKey: ["otp", tenant] });

  // A change shows at once, and the preview for it is fetched at the same time as the change is saved, instead of after it. The server's
  // answer then replaces what was shown (it is the same unless the guess was wrong); a refusal puts the old values back and says why.
  // Only the latest change's answer is used, so a slow earlier one cannot undo a later choice.
  const latest = useRef(0);
  const save = async (patch: OtpSettingsPatch) => {
    setError("");
    const mine = ++latest.current;
    const key = ["otp", tenant];
    // the request is on its way before anything else happens
    const answer = saveOtpSettings(patch).then(
      (next) => ({ next }),
      (e: unknown) => ({ e }),
    );
    // a refresh that is already on its way could otherwise land after this and put the old values back
    await qc.cancelQueries({ queryKey: key });
    const before = qc.getQueryData<OtpOverview>(key);
    if (before) qc.setQueryData<OtpOverview>(key, { ...before, settings: predictSettings(before.settings, patch, before.templates) });
    const done = await answer;
    if ("next" in done) {
      if (mine === latest.current) qc.setQueryData<OtpOverview>(key, (old) => (old ? { ...old, settings: done.next } : old));
      return;
    }
    setError(problem(done.e));
    if (mine === latest.current) {
      if (before) qc.setQueryData<OtpOverview>(key, (old) => (old ? { ...old, settings: before.settings } : before));
      void qc.invalidateQueries({ queryKey: key });
    }
  };
  // the name is saved a moment after the typing stops; a name that cannot be used is explained and never sent
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  const typed = (brand ?? settings?.brand ?? "").trim();
  const brandError = brandProblem(typed);
  useEffect(() => {
    if (brand === null || !settings || brandError || typed === settings.brand) return;
    const t = setTimeout(() => void saveRef.current({ brand: typed }), 700);
    return () => clearTimeout(t);
  }, [brand, brandError, typed, settings]);

  const previewBrand = brandError ? settings?.brand : typed;
  const preview = useQuery({
    queryKey: ["otp-preview", tenant, settings?.template, settings?.locale, settings?.codeLength, settings?.ttlSeconds, previewBrand],
    queryFn: () => getOtpPreview({ template: settings!.template, locale: settings!.locale, brand: previewBrand, codeLength: settings!.codeLength, ttlSeconds: settings!.ttlSeconds }),
    enabled: Boolean(settings),
    placeholderData: keepPreviousData,
    retry: false,
  });

  if (!canManage)
    return <Notice tone="info">Free OTP is set up by your company's owner or an administrator. Ask them to open Developers, Free OTP: it takes about two minutes.</Notice>;
  if (overview.error && !data) return <Notice tone="error">{problem(overview.error)}</Notice>;
  if (!data || !settings) return <div className="card p-6 text-[14.5px] text-fg-3" role="status">Loading…</div>;

  const { ready } = data;
  const doneCount = [ready.number, ready.tested, ready.key].filter(Boolean).length;
  const next = !ready.number ? 2 : !ready.tested ? 3 : !ready.key ? 4 : 0;
  // the address the code is sent to: the API's own (a hosted app forwards /api, so that is the app's address), and the app's, for the script
  const appBase = typeof window === "undefined" ? "" : window.location.origin;
  const base = (getBaseBackendUrl() || appBase).replace(/\/$/, "");
  const prompt = buildAgentPrompt({ overview: data, base, appBase, publicKey: widgetKey });
  const previewBox = (
    <div className="space-y-2">
      <h2 className="eyebrow">What people receive</h2>
      <OtpPreview text={preview.data ?? ""} brand={brandError ? settings.brandResolved : typed || settings.brandResolved} locale={settings.locale} />
      {preview.error && <p className="text-[13px] text-danger" role="alert">{preview.error.message}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      {!data.available && <Notice tone="warn">Free OTP is switched off on the platform for the moment. Your setup is safe; codes will work again when it is back.</Notice>}
      {settings.suspended && <Notice tone="error">OTP has been suspended for your company. Write to the Scriwo team to have it switched back on.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {!settings.enabled && (
        <Notice tone="warn">
          Codes are paused: nothing is sent until you switch them on.{" "}
          <button type="button" onClick={() => void save({ enabled: true })} className="underline font-medium">
            Switch on
          </button>
        </Notice>
      )}
      <div className="card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-fg">{doneCount === 3 ? "Ready for real codes" : `${doneCount} of 3 steps done`}</p>
          <ol className="mt-2 flex flex-wrap gap-2" aria-label="Setup progress">
            <Milestone done={ready.number}>Number linked</Milestone>
            <Milestone done={ready.tested}>Test passed</Milestone>
            <Milestone done={ready.key}>Key created</Milestone>
          </ol>
        </div>
        <QuickCopyPrompt prompt={prompt} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] items-start">
        <div className="space-y-5 min-w-0">
          <StepCard n={1} id="otp-step-usecase" title="What is the code for?">
            <UseCaseTiles templates={data.templates} value={settings.template} onPick={(key) => void save({ template: key })} />
            {phone && <div className="mt-4">{previewBox}</div>}
            <FineTune settings={settings} locales={data.locales} brand={brand ?? settings.brand} onBrand={setBrand} brandError={brandError} onChange={(patch) => void save(patch)} />
          </StepCard>
          <StepCard n={2} id="otp-step-number" title="Where do the codes come from?" done={ready.number} next={next === 2}>
            <NumberCard numbers={data.numbers} selected={settings.sessionName} onPick={(sessionName) => void save({ sessionName })} onConnect={onConnectNumber} />
          </StepCard>
          <StepCard n={3} id="otp-step-test" title="Try it yourself" done={ready.tested} next={next === 3}>
            <TestCard numberReady={ready.number} codeLength={settings.codeLength} onVerified={() => void refresh()} />
          </StepCard>
          <StepCard n={4} id="otp-step-connect" title="Connect your site" done={ready.key} next={next === 4}>
            <div className="space-y-5">
              <ConnectCard keys={data.keys} base={base} appBase={appBase} onChanged={() => void refresh()} onKey={(kind, key) => kind === "public" && setWidgetKey(key)} />
              <NotifyCard webhook={data.webhook} tenant={tenant} onChanged={() => void refresh()} />
            </div>
          </StepCard>
          <StepCard n={5} id="otp-step-agent" title="Or let your coding agent do it">
            <AgentPromptCard prompt={prompt} missing={whatIsMissing(ready)} />
          </StepCard>
        </div>
        {!phone && <aside className="lg:sticky lg:top-6 space-y-5">{previewBox}<p className="text-[13px] text-fg-3 leading-relaxed">Free for every plan: {data.usage.today.limit} codes a day and {data.usage.month.limit.toLocaleString()} a month, sent from your own WhatsApp number. One phone number can be sent {data.limits.perPhoneWindow} codes every {data.limits.perPhoneWindowMinutes} minutes.</p></aside>}
      </div>

      <section aria-labelledby="otp-activity" className="card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="otp-activity" className="text-[17px] font-semibold text-fg">Activity</h2>
          <button
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            aria-label="Send codes"
            onClick={() => void save({ enabled: !settings.enabled })}
            className="press inline-flex items-center gap-3 h-11 pl-2 pr-4 rounded-full bg-surface-2 text-[14px] font-medium text-fg"
          >
            <span className={`relative h-7 w-12 rounded-full transition ${settings.enabled ? "bg-brand-solid" : "bg-surface-3"}`} aria-hidden>
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-card transition-all ${settings.enabled ? "left-[22px]" : "left-0.5"}`} />
            </span>
            {settings.enabled ? "Codes are on" : "Codes are paused"}
          </button>
        </div>
        <ActivityCard usage={data.usage} stats={data.stats} tenant={tenant} />
      </section>
    </div>
  );
}
