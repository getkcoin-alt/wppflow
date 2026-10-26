import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiGet,
  apiPost,
  apiDelete,
  apiRequest,
  getStoredTenantId,
  resolveEndpoint,
} from "../../services/api";
import type { DevSubTab } from "../layout/navigation";
import { Copy } from "lucide-react";
import { DEV_TABS } from "../layout/navigation";
import { Field, Notice, Page, PageHeader, Pill, Segmented } from "../ui/Page";
import { btn, inputCls, textareaCls } from "../ui/styles";
import { FeatureLocked } from "../ui/FeatureLocked";
export function DeveloperGuide({
  activeDevTab,
  onSelectDevTab,
  canManage = false,
  apiPlan,
  lapsed = false,
  onOpenPlan,
}: {
  canManage?: boolean;
  /** Set when the company's plan doesn't include the developer tools (Business and above): the plan's name. The whole module is shown locked. */
  apiPlan?: string;
  /** The plan includes them, but the payment is more than the grace period late */
  lapsed?: boolean;
  /** Takes an owner or administrator to the plan and billing screen */
  onOpenPlan?: () => void;
  activeDevTab: DevSubTab;
  onSelectDevTab: (tab: DevSubTab) => void;
}) {
  const tenant = getStoredTenantId(),
    qc = useQueryClient(),
    [error, setError] = useState(""),
    [secret, setSecret] = useState(""),
    [output, setOutput] = useState(""),
    [duration, setDuration] = useState<number | null>(null),
    [busy, setBusy] = useState(false);
  const keys = useQuery({
    queryKey: ["keys", tenant],
    queryFn: () => apiGet("/api/workspace/keys"),
    enabled: canManage && activeDevTab === "keys" && !apiPlan,
  });
  const hooks = useQuery({
    queryKey: ["webhooks", tenant],
    queryFn: () => apiGet("/api/workspace/webhooks"),
    enabled: canManage && activeDevTab === "webhooks" && !apiPlan,
    refetchInterval: 10000,
  });
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const tabs = DEV_TABS.filter((t) => !t.manager || canManage);
  const card = "card p-5 sm:p-7";
  if (apiPlan)
    return (
      <FeatureLocked
        feature="Developer access"
        plan={apiPlan}
        needs="Business"
        includes="It adds API keys, signed webhooks, the API tester and SDK samples for connecting your own systems."
        lapsed={lapsed}
        onOpenPlan={onOpenPlan}
      />
    );
  return (
    <Page>
      <PageHeader
        eyebrow="Developers"
        title="Build on Scriwo"
        subtitle="Try the API, copy ready-made examples, and connect your own systems."
        actions={
          <Segmented
            label="Developer sections"
            items={tabs.map((t) => ({ key: t.key, label: t.label }))}
            value={activeDevTab}
            onChange={(t) => {
              setSecret("");
              onSelectDevTab(t);
            }}
          />
        }
      />
      <section className="space-y-5">
        {error && <Notice tone="error">{error}</Notice>}
        {secret && (
          <div className="card p-5 sm:p-6 ring-1 ring-gold/40">
            <p className="text-[14.5px] text-fg">
              Copy this secret now. It is shown once and is not stored in your
              browser.
            </p>
            <code className="mt-3 block rounded-2xl bg-surface-2 px-4 py-3 font-mono text-[13px] text-gold break-all">
              {secret}
            </code>
            <button
              className={`${btn("secondary", "sm")} mt-3`}
              onClick={() => void navigator.clipboard.writeText(secret)}
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>
        )}

        {activeDevTab === "docs" && (
          <div className={`${card} space-y-5`}>
            <p className="text-[14.5px] text-fg-2">
              Requests below run against your workspace. POST requests can
              change data. No sample response is substituted.
            </p>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run(async () => {
                  const path = String(f.get("path"));
                  if (!path.startsWith("/api/") || path.includes("://"))
                    throw new Error("Use a local /api/ endpoint");
                  const method = String(f.get("method")),
                    body = String(f.get("body"));
                  const start = performance.now();
                  try {
                    const result = await apiRequest(path, {
                      method,
                      ...(method !== "GET"
                        ? { body: JSON.stringify(JSON.parse(body || "{}")) }
                        : {}),
                    });
                    setOutput(JSON.stringify(result, null, 2));
                  } catch (e: any) {
                    setOutput(e.message);
                    throw e;
                  } finally {
                    setDuration(Math.round(performance.now() - start));
                  }
                });
              }}
            >
              <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                <select
                  aria-label="HTTP method"
                  name="method"
                  className={inputCls}
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PATCH</option>
                  <option>DELETE</option>
                </select>
                <input
                  aria-label="Endpoint"
                  name="path"
                  defaultValue="/api/workspace/summary"
                  className={`${inputCls} font-mono text-[14px]`}
                />
              </div>
              <textarea
                aria-label="Request JSON"
                name="body"
                defaultValue="{}"
                className={`${textareaCls} font-mono text-[13.5px] h-28`}
              />
              <button disabled={busy} className={btn("primary")}>
                Execute request
              </button>
            </form>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="eyebrow">Response</span>
                {duration !== null && (
                  <Pill tone="neutral">
                    Actual request duration: {duration} ms
                  </Pill>
                )}
              </div>
              <pre className="overflow-auto whitespace-pre-wrap rounded-2xl bg-surface-2 p-4 font-mono text-[12.5px] text-fg-2 min-h-[80px]">
                {output || "Execute a request to see its response."}
              </pre>
            </div>
          </div>
        )}

        {activeDevTab === "keys" && (
          <div className="space-y-4">
            <form
              className={`${card} grid gap-3 md:grid-cols-[1fr_200px_auto]`}
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run(async () => {
                  const result = await apiPost("/api/workspace/keys", {
                    name: f.get("name"),
                    scopes: [f.get("scope")],
                  });
                  setSecret(result.key);
                  await qc.invalidateQueries({ queryKey: ["keys", tenant] });
                });
              }}
            >
              <input
                required
                name="name"
                aria-label="Key name"
                placeholder="Key name"
                className={inputCls}
              />
              <select name="scope" aria-label="Scope" className={inputCls}>
                <option value="inbox">Inbox</option>
                <option value="contacts">Contacts</option>
                <option value="sessions">Sessions (read)</option>
              </select>
              <button disabled={busy} className={`${btn("primary")} !h-12`}>
                Create key
              </button>
            </form>
            {keys.error && <Notice tone="error">{keys.error.message}</Notice>}
            <ul className="space-y-2">
              {keys.data?.keys.map((k: any) => (
                <li
                  key={k.id}
                  className="card p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium text-fg">
                      {k.name}
                    </div>
                    <div className="text-[13px] text-fg-2 font-mono truncate">
                      {k.prefix}… · {k.scopes.join(", ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Pill tone={k.revoked_at ? "neutral" : "ok"} dot>
                      {k.revoked_at ? "Revoked" : "Active"}
                    </Pill>
                    <button
                      disabled={busy || Boolean(k.revoked_at)}
                      className={`${btn("ghost", "sm")} !text-danger`}
                      onClick={() =>
                        void run(async () => {
                          await apiDelete(`/api/workspace/keys/${k.id}`);
                          await qc.invalidateQueries({
                            queryKey: ["keys", tenant],
                          });
                        })
                      }
                    >
                      Revoke
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeDevTab === "webhooks" && (
          <div className="space-y-4">
            <form
              className={`${card} space-y-3`}
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run(async () => {
                  const result = await apiPost("/api/workspace/webhooks", {
                    url: f.get("url"),
                  });
                  setSecret(result.secret);
                  await qc.invalidateQueries({
                    queryKey: ["webhooks", tenant],
                  });
                });
              }}
            >
              <Field label="Endpoint URL">
                <input
                  required
                  type="url"
                  name="url"
                  aria-label="Webhook URL"
                  placeholder="https://your-service.example/webhook"
                  className={inputCls}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <button disabled={busy} className={btn("primary")}>
                  Save endpoint
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className={btn("secondary")}
                  onClick={() =>
                    void run(async () => {
                      await apiPost("/api/workspace/webhooks/test", {});
                      await qc.invalidateQueries({
                        queryKey: ["webhooks", tenant],
                      });
                    })
                  }
                >
                  Queue clearly labelled synthetic test
                </button>
              </div>
              <p className="text-[13px] text-fg-3 leading-relaxed">
                Verify X-Scriwo-Signature as HMAC-SHA256 of timestamp + '.' +
                raw body. Use X-Scriwo-Id to deduplicate retries. The original
                X-WppFlow-* headers are still sent for existing integrations.
              </p>
            </form>
            {hooks.error && <Notice tone="error">{hooks.error.message}</Notice>}
            <ul className="space-y-2">
              {hooks.data?.endpoints.map((h: any) => (
                <li
                  key={h.id}
                  className="card p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3"
                >
                  <span className="font-mono text-[13.5px] text-fg break-all">
                    {h.url}
                  </span>
                  <div className="flex items-center gap-3">
                    <Pill tone={h.enabled ? "ok" : "neutral"} dot>
                      {h.enabled ? "Enabled" : "Disabled"}
                    </Pill>
                    <button
                      disabled={!h.enabled || busy}
                      onClick={() =>
                        void run(async () => {
                          await apiDelete(`/api/workspace/webhooks/${h.id}`);
                          await qc.invalidateQueries({
                            queryKey: ["webhooks", tenant],
                          });
                        })
                      }
                      className={`${btn("ghost", "sm")} !text-danger`}
                    >
                      Disable
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {!!hooks.data?.deliveries.length && (
              <div className="card !rounded-3xl divide-y divide-line overflow-hidden">
                {hooks.data.deliveries.map((d: any) => (
                  <div
                    key={d.id}
                    className="px-5 py-3 text-[13.5px] text-fg-2 flex flex-wrap gap-x-3"
                  >
                    <span className="text-fg font-medium">{d.event}</span>
                    <span>{d.status}</span>
                    <span>attempts: {d.attempts}</span>
                    <span>
                      {d.response_status || d.error || "Awaiting delivery"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeDevTab === "sdks" && (
          <div className={`${card} space-y-4`}>
            <h2 className="text-[20px] font-semibold">
              Authenticated API examples
            </h2>
            <p className="text-[14.5px] text-fg-2">
              Use a scoped key created in API keys. These are documentation
              examples, not executed requests.
            </p>
            <pre className="overflow-auto rounded-2xl bg-surface-2 p-4 font-mono text-[12.5px] text-fg-2">{`curl '${resolveEndpoint("/api/contacts")}' \\\n  -H 'Authorization: Bearer YOUR_CONTACTS_API_KEY'\n\nconst response = await fetch('${resolveEndpoint("/api/contacts")}', {\n  headers: {Authorization: 'Bearer YOUR_CONTACTS_API_KEY'}\n});\nconst contacts = await response.json();`}</pre>
          </div>
        )}
      </section>
    </Page>
  );
}
