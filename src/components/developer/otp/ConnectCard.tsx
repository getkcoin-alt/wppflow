import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createOtpKey, revokeOtpKey, type OtpKey } from "../../../services/api";
import { Field, Notice, Pill, Segmented } from "../../ui/Page";
import { btn, inputCls } from "../../ui/styles";
import { CodeBlock } from "./CodeBlock";
import { LANGS, proofSnippet, serverSnippet, widgetSnippet, type Lang } from "./snippets";

const problem = (e: any): string => `${e?.message || "Something went wrong."}${e?.data?.fix ? ` ${e.data.fix}` : ""}`;
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "never");

function KeyRow({ k, onRevoke, busy }: { k: OtpKey; onRevoke: () => void; busy: boolean }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-surface-2 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-medium text-fg truncate">{k.name}</div>
        <div className="text-[12.5px] text-fg-3 font-mono truncate">
          {k.prefix}… · used {when(k.lastUsedAt)}
          {k.allowedOrigins.length ? ` · ${k.allowedOrigins.join(", ")}` : ""}
        </div>
      </div>
      <Pill tone={k.mode === "live" ? "ok" : "info"}>{k.mode === "live" ? "Live" : "Test"}</Pill>
      <button type="button" disabled={busy} onClick={onRevoke} aria-label={`Revoke ${k.name}`} className={`${btn("ghost", "sm")} !text-danger`}>
        Revoke
      </button>
    </li>
  );
}

/** Get the key, and the code to paste: on a server, or in a web page with the drop-in widget. */
export function ConnectCard({ keys, base, appBase, onChanged }: { keys: OtpKey[]; base: string; appBase: string; onChanged: () => void }) {
  const [tab, setTab] = useState<"server" | "widget">("server");
  const [lang, setLang] = useState<Lang>("node");
  const [name, setName] = useState("My website");
  const [sites, setSites] = useState("");
  const [secret, setSecret] = useState("");
  const [pub, setPub] = useState("");
  const [fresh, setFresh] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const make = async (kind: "secret" | "public", mode: "live" | "test") => {
    setBusy(true);
    setError("");
    try {
      const created = await createOtpKey({ name: name.trim() || "My website", kind, mode, ...(kind === "public" ? { origins: sites.split(/[\s,]+/).filter(Boolean) } : {}) });
      setFresh(created.key);
      if (kind === "secret") setSecret(created.key);
      else setPub(created.key);
      onChanged();
    } catch (e) {
      setError(problem(e));
    } finally {
      setBusy(false);
    }
  };
  const revoke = async (k: OtpKey) => {
    setBusy(true);
    setError("");
    try {
      await revokeOtpKey(k.id);
      if (fresh.startsWith(k.prefix)) setFresh("");
      onChanged();
    } catch (e) {
      setError(problem(e));
    } finally {
      setBusy(false);
    }
  };
  const mine = keys.filter((k) => !k.revokedAt && k.kind === (tab === "server" ? "secret" : "public"));

  return (
    <div className="space-y-5">
      <Segmented label="How you connect" items={[{ key: "server", label: "Your server" }, { key: "widget", label: "Web widget" }]} value={tab} onChange={(t) => { setTab(t); setFresh(""); setError(""); }} />
      {tab === "server" ? (
        <p className="text-[14.5px] text-fg-2">Your server calls Scriwo twice: once to send the code, once to check what the person typed. You write no code logic of your own.</p>
      ) : (
        <p className="text-[14.5px] text-fg-2">Add one script to a web page and the visitor gets a ready-made box to verify their phone. Nothing to build; your server only confirms the result.</p>
      )}

      <form
        className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          void make(tab === "server" ? "secret" : "public", "live");
        }}
      >
        <div className="grid gap-3">
          <Field label="Key name">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className={inputCls} />
          </Field>
          {tab === "widget" && (
            <Field label="Websites where the widget will run" hint="The full address of each, separated by spaces. A key only works on these.">
              <input value={sites} onChange={(e) => setSites(e.target.value)} placeholder="https://shop.example.com" aria-label="Websites where the widget will run" className={inputCls} />
            </Field>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={busy || (tab === "widget" && !sites.trim())} className={btn("primary")}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null} {tab === "server" ? "Create my key" : "Create widget key"}
          </button>
          <button type="button" disabled={busy} onClick={() => void make(tab === "server" ? "secret" : "public", "test")} className={btn("secondary")}>
            Create a test key
          </button>
        </div>
      </form>
      {error && <Notice tone="error">{error}</Notice>}
      {fresh && (
        <div className="space-y-2" role="status">
          <p className="text-[14px] font-medium text-fg">Copy this key now. It is shown only once.</p>
          <CodeBlock code={fresh} label="Your new key" />
          {fresh.includes("_test_") && <p className="text-[13px] text-fg-3">A test key sends nothing and always uses the code 123456, so you can build without a phone.</p>}
        </div>
      )}

      {mine.length > 0 && (
        <ul className="space-y-2" aria-label={tab === "server" ? "Your secret keys" : "Your widget keys"}>
          {mine.map((k) => (
            <KeyRow key={k.id} k={k} busy={busy} onRevoke={() => void revoke(k)} />
          ))}
        </ul>
      )}

      {tab === "server" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-[15px] font-semibold text-fg">Paste this</h3>
            <Segmented label="Language" items={LANGS} value={lang} onChange={setLang} />
          </div>
          <CodeBlock code={serverSnippet(lang, { base, key: secret })} label={`Code for ${lang}`} />
          {!secret && <p className="text-[13px] text-fg-3">Create a key above and it is filled in for you. Keep a secret key on your server only, never in a web page or an app.</p>}
          <details className="text-[14px] text-fg-2">
            <summary className="cursor-pointer font-medium text-fg">What can go wrong, and what it means</summary>
            <ul className="mt-2 space-y-1 list-disc pl-5 text-[13.5px]">
              <li><code>not_on_whatsapp</code>: this person has no WhatsApp. Offer another way to sign in.</li>
              <li><code>resend_too_soon</code> and <code>too_many_requests</code>: wait the number of seconds in <code>retryAfter</code>.</li>
              <li><code>quota_exceeded</code>: the free allowance is used up until <code>resets</code>.</li>
              <li><code>wrong_code</code>, <code>expired</code>, <code>too_many_attempts</code>: a check that failed. Send a new code.</li>
              <li>Every error has a <code>message</code> and a <code>fix</code> in plain words.</li>
            </ul>
          </details>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-[15px] font-semibold text-fg">Paste this in your page</h3>
            <CodeBlock code={widgetSnippet({ base: appBase, api: base, key: pub })} label="Widget code" />
            {!pub && <p className="text-[13px] text-fg-3">Create a widget key above and it is filled in for you. A widget key is safe in a web page, and only works on the websites you listed.</p>}
          </div>
          <div className="space-y-3">
            <h3 className="text-[15px] font-semibold text-fg">Check it on your server</h3>
            <p className="text-[14px] text-fg-2">The widget gives your page a proof. Send it to your server with the form, and ask Scriwo if it is real. A proof works once, for ten minutes, so a page cannot claim a verification it did not do. No server? Use the webhook below instead.</p>
            <CodeBlock code={proofSnippet({ base, key: secret })} label="Proof check" />
          </div>
        </div>
      )}
    </div>
  );
}
