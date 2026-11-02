import { useState } from "react";
import { Download, ShieldCheck, Loader2 } from "lucide-react";
import { downloadAllMessages, downloadCompanyData, verifyAutomatedRecord } from "../../services/api";
import { Notice } from "../ui/Page";
import { btn } from "../ui/styles";

/**
 * Your data is yours: everything can be taken away, and the record of what Riwo and the rules said to customers can be checked
 * for tampering. For owners and administrators.
 */
export function DataPortabilityCard() {
  const [busy, setBusy] = useState<"" | "data" | "messages" | "check">("");
  const [error, setError] = useState("");
  const [checked, setChecked] = useState<{ ok: boolean; checked: number } | null>(null);

  const run = async (what: "data" | "messages" | "check", job: () => Promise<unknown>) => {
    setBusy(what);
    setError("");
    try {
      await job();
    } catch (e: any) {
      setError(e.message || "That didn't work. Please try again.");
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="card p-6" aria-labelledby="data-card">
      <h3 id="data-card" className="text-[17px] font-semibold">
        Your data, and what Riwo said
      </h3>
      <p className="text-[14px] text-fg-2 mt-1 max-w-2xl">
        Take everything with you at any time: contacts, who each chat is assigned to, your team, the sales pipeline with its history, saved replies and the record of what Riwo and your rules sent. Messages come as a spreadsheet. Pictures and files are listed by name.
      </p>
      {error && (
        <div className="mt-3">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-4">
        <button type="button" className={btn("secondary")} disabled={!!busy} onClick={() => void run("data", downloadCompanyData)}>
          {busy === "data" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Download className="w-4 h-4" aria-hidden />}
          Download my data
        </button>
        <button type="button" className={btn("secondary")} disabled={!!busy} onClick={() => void run("messages", downloadAllMessages)}>
          {busy === "messages" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Download className="w-4 h-4" aria-hidden />}
          Download all messages (CSV)
        </button>
        <button
          type="button"
          className={btn("ghost")}
          disabled={!!busy}
          onClick={() => void run("check", async () => setChecked(await verifyAutomatedRecord()))}
        >
          {busy === "check" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <ShieldCheck className="w-4 h-4" aria-hidden />}
          Check the record
        </button>
      </div>
      {checked && (
        <p role="status" className={`mt-3 text-[13.5px] ${checked.ok ? "text-ok" : "text-danger"}`}>
          {checked.ok
            ? `The record is intact: ${checked.checked} automatic ${checked.checked === 1 ? "message" : "messages"} checked, none changed or missing.`
            : "The record does not match: something was changed or removed. Contact support."}
        </p>
      )}
    </section>
  );
}
