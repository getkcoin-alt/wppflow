import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getOtpWebhookDeliveries, removeOtpWebhook, setOtpWebhook, testOtpWebhook, type OtpOverview } from "../../../services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Field, Notice, Pill } from "../../ui/Page";
import { btn, inputCls } from "../../ui/styles";
import { CodeBlock } from "./CodeBlock";

const problem = (e: any): string => `${e?.message || "Something went wrong."}${e?.data?.fix ? ` ${e.data.fix}` : ""}`;

/** Optional: one address of the company's that is told when a code is sent, delivered, checked or fails. */
export function NotifyCard({ webhook, tenant, onChanged }: { webhook: OtpOverview["webhook"]; tenant: string | null; onChanged: () => void }) {
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const deliveries = useQuery({ queryKey: ["otp-hook", tenant], queryFn: getOtpWebhookDeliveries, enabled: Boolean(webhook), refetchInterval: 8000 });
  const run = async (what: string, fn: () => Promise<void>) => {
    setBusy(what);
    setError("");
    setNote("");
    try {
      await fn();
    } catch (e) {
      setError(problem(e));
    } finally {
      setBusy("");
    }
  };
  return (
    <details className="rounded-2xl bg-surface-2/60 px-4 py-3" open={Boolean(webhook)}>
      <summary className="cursor-pointer select-none text-[14.5px] font-semibold text-fg">Get notified (optional)</summary>
      <div className="mt-3 space-y-3">
        <p className="text-[14px] text-fg-2">Scriwo calls this address when a code is sent, delivered, checked or fails (otp.sent, otp.delivered, otp.verified, otp.failed, otp.expired). Each call is signed. It is the way to hear about a widget check when you have no server.</p>
        {webhook ? (
          <div className="flex flex-wrap items-center gap-3">
            <Pill tone="ok" dot>On</Pill>
            <span className="font-mono text-[13px] text-fg break-all flex-1 min-w-0">{webhook.url}</span>
            <button type="button" disabled={Boolean(busy)} className={btn("secondary", "sm")} onClick={() => void run("test", async () => { await testOtpWebhook(); setNote("A test event was sent. It shows below in a moment."); void qc.invalidateQueries({ queryKey: ["otp-hook", tenant] }); })}>
              {busy === "test" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null} Send a test event
            </button>
            <button type="button" disabled={Boolean(busy)} className={`${btn("ghost", "sm")} !text-danger`} onClick={() => void run("remove", async () => { await removeOtpWebhook(); setSecret(""); onChanged(); })}>
              Remove
            </button>
          </div>
        ) : null}
        <form
          className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            void run("save", async () => {
              const r = await setOtpWebhook(url.trim());
              setSecret(r.secret);
              setUrl("");
              onChanged();
            });
          }}
        >
          <Field label={webhook ? "Change the address" : "Address (https)"}>
            <input type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/otp-events" aria-label="Webhook address" className={inputCls} />
          </Field>
          <button type="submit" disabled={!url.trim() || Boolean(busy)} className={btn("secondary")}>
            {busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null} Save address
          </button>
        </form>
        {secret && (
          <div className="space-y-2" role="status">
            <p className="text-[14px] font-medium text-fg">Copy the signing secret now. It is shown only once.</p>
            <CodeBlock code={secret} label="Signing secret" />
            <p className="text-[13px] text-fg-3">Check each call with the X-Scriwo-Signature header: an HMAC-SHA256 of the timestamp, a dot and the raw body, made with this secret.</p>
          </div>
        )}
        {note && <Notice tone="success">{note}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
        {webhook && !!deliveries.data?.length && (
          <ul className="divide-y divide-line rounded-2xl bg-surface px-4" aria-label="Recent calls to your address">
            {deliveries.data.slice(0, 6).map((d) => (
              <li key={d.id} className="py-2 text-[13px] text-fg-2 flex flex-wrap gap-x-3">
                <span className="text-fg font-medium">{d.event}</span>
                <span>{d.status}</span>
                <span>{d.response_status ? `HTTP ${d.response_status}` : d.error || "waiting"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
