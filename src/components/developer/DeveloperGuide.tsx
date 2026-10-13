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
import type { DevSubTab } from "../layout/Sidebar";
export function DeveloperGuide({
  activeDevTab,
  onSelectDevTab,
}: {
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
    enabled: activeDevTab === "keys",
  });
  const hooks = useQuery({
    queryKey: ["webhooks", tenant],
    queryFn: () => apiGet("/api/workspace/webhooks"),
    enabled: activeDevTab === "webhooks",
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
  return (
    <section className="space-y-5">
      <h1 className="text-xl font-bold">Developer Tools</h1>
      <nav className="flex gap-4">
        {(["docs", "keys", "webhooks", "sdks"] as DevSubTab[]).map((t) => (
          <button
            key={t}
            className={activeDevTab === t ? "text-emerald-400" : ""}
            onClick={() => {
              setSecret("");
              onSelectDevTab(t);
            }}
          >
            {t === "docs" ? "API tester" : t}
          </button>
        ))}
      </nav>
      {error && (
        <p role="alert" className="text-rose-300">
          {error}
        </p>
      )}
      {secret && (
        <div className="bg-[#202c33] p-4 rounded break-all">
          <p>
            Copy this secret now. It is shown once and is not stored in your
            browser.
          </p>
          <code>{secret}</code>
          <button
            className="block text-emerald-400 mt-2"
            onClick={() => void navigator.clipboard.writeText(secret)}
          >
            Copy
          </button>
        </div>
      )}
      {activeDevTab === "docs" && (
        <div className="bg-[#111b21] rounded-xl p-5 space-y-4">
          <p className="text-sm text-slate-400">
            Requests below execute against your workspace. POST requests can
            change data. No sample response is substituted.
          </p>
          <form
            className="space-y-3"
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
            <select
              aria-label="HTTP method"
              name="method"
              className="bg-[#202c33] p-2"
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
              className="bg-[#202c33] p-2 rounded w-full"
            />
            <textarea
              aria-label="Request JSON"
              name="body"
              defaultValue="{}"
              className="bg-[#202c33] p-2 rounded w-full h-28 font-mono"
            />
            <button disabled={busy} className="bg-emerald-600 p-2 rounded">
              Execute request
            </button>
          </form>
          {duration !== null && <p>Actual request duration: {duration} ms</p>}
          <pre className="overflow-auto whitespace-pre-wrap text-xs">
            {output || "Execute a request to see its response."}
          </pre>
        </div>
      )}
      {activeDevTab === "keys" && (
        <div className="space-y-4">
          <form
            className="flex gap-3"
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
              className="bg-[#202c33] p-2 rounded"
            />
            <select
              name="scope"
              aria-label="Scope"
              className="bg-[#202c33] p-2"
            >
              <option value="inbox">Inbox</option>
              <option value="contacts">Contacts</option>
              <option value="sessions">Sessions (read)</option>
            </select>
            <button disabled={busy} className="bg-emerald-600 p-2 rounded">
              Create key
            </button>
          </form>
          {keys.error && <p role="alert">{keys.error.message}</p>}
          {keys.data?.keys.map((k: any) => (
            <article
              key={k.id}
              className="bg-[#111b21] p-4 rounded-xl flex justify-between"
            >
              <span>
                {k.name} · {k.prefix}… · {k.scopes.join(", ")} ·{" "}
                {k.revoked_at ? "Revoked" : "Active"}
              </span>
              <button
                disabled={busy || Boolean(k.revoked_at)}
                className="text-rose-300"
                onClick={() =>
                  void run(async () => {
                    await apiDelete(`/api/workspace/keys/${k.id}`);
                    await qc.invalidateQueries({ queryKey: ["keys", tenant] });
                  })
                }
              >
                Revoke
              </button>
            </article>
          ))}
        </div>
      )}
      {activeDevTab === "webhooks" && (
        <div className="space-y-4">
          <form
            className="flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void run(async () => {
                const result = await apiPost("/api/workspace/webhooks", {
                  url: f.get("url"),
                });
                setSecret(result.secret);
                await qc.invalidateQueries({ queryKey: ["webhooks", tenant] });
              });
            }}
          >
            <input
              required
              type="url"
              name="url"
              aria-label="Webhook URL"
              placeholder="https://your-service.example/webhook"
              className="bg-[#202c33] p-2 w-full rounded"
            />
            <button disabled={busy} className="bg-emerald-600 p-2 rounded">
              Save endpoint
            </button>
          </form>
          <p className="text-sm text-slate-400">
            Verify X-WppFlow-Signature as HMAC-SHA256 of timestamp + '.' + raw
            body. Use the delivery ID to deduplicate retries.
          </p>
          <button
            disabled={busy}
            className="text-emerald-400"
            onClick={() =>
              void run(async () => {
                await apiPost("/api/workspace/webhooks/test", {});
                await qc.invalidateQueries({ queryKey: ["webhooks", tenant] });
              })
            }
          >
            Queue clearly labelled synthetic test
          </button>
          {hooks.error && <p role="alert">{hooks.error.message}</p>}
          {hooks.data?.endpoints.map((h: any) => (
            <div key={h.id} className="bg-[#111b21] p-3 rounded">
              {h.url} · {h.enabled ? "Enabled" : "Disabled"}{" "}
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
                className="text-rose-300 ml-3"
              >
                Disable
              </button>
            </div>
          ))}
          {hooks.data?.deliveries.map((d: any) => (
            <div key={d.id} className="border-b border-[#2a3942] p-2 text-sm">
              {d.event} · {d.status} · attempts: {d.attempts} ·{" "}
              {d.response_status || d.error || "Awaiting delivery"}
            </div>
          ))}
        </div>
      )}
      {activeDevTab === "sdks" && (
        <div className="bg-[#111b21] p-5 rounded-xl space-y-4">
          <h2 className="font-bold">Authenticated API examples</h2>
          <p className="text-slate-400 text-sm">
            Use a scoped key created in API Credentials. These are documentation
            examples, not executed requests.
          </p>
          <pre className="overflow-auto text-xs">{`curl '${resolveEndpoint("/api/contacts")}' \\\n  -H 'Authorization: Bearer YOUR_CONTACTS_API_KEY'\n\nconst response = await fetch('${resolveEndpoint("/api/contacts")}', {\n  headers: {Authorization: 'Bearer YOUR_CONTACTS_API_KEY'}\n});\nconst contacts = await response.json();`}</pre>
        </div>
      )}
    </section>
  );
}
