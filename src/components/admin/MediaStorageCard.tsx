import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { apiGet, getStoredTenantId } from "../../services/api";
import { runMediaCheck, type MediaCheck } from "../../services/mediaCheck";
import { Pill } from "../ui/Page";
import { CodeBlock } from "../developer/otp/CodeBlock";
import { btn } from "../ui/styles";

function Row({ ok, note }: { ok: boolean; note: string }) {
  return (
    <li className="flex items-start gap-2.5 text-[14px]">
      {ok ? (
        <CheckCircle2 className="w-[18px] h-[18px] mt-0.5 text-ok shrink-0" />
      ) : (
        <XCircle className="w-[18px] h-[18px] mt-0.5 text-danger shrink-0" />
      )}
      <span className={ok ? "text-fg" : "text-danger"}>{note}</span>
    </li>
  );
}

// Photos, videos and files only work once storage is set up. This says whether it is, and proves it.
export function MediaStorageCard() {
  const capabilities = useQuery({
    queryKey: ["capabilities", getStoredTenantId()],
    queryFn: () => apiGet("/api/workspace/capabilities"),
  });
  const [busy, setBusy] = useState(false),
    [result, setResult] = useState<MediaCheck | null>(null),
    [error, setError] = useState("");
  const test = async () => {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await runMediaCheck());
    } catch (e: any) {
      setError(e.message || "The test could not run.");
    } finally {
      setBusy(false);
    }
  };
  const configured = capabilities.data?.media;
  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold">Media storage</h2>
          <p className="text-[14px] text-fg-2 mt-1">
            Where photos, videos, PDFs and voice notes are kept.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {capabilities.data && (
            <Pill tone={configured ? "ok" : "warn"} dot>
              {configured ? "Configured" : "Not set up"}
            </Pill>
          )}
          <button
            disabled={busy}
            onClick={() => void test()}
            className={btn("secondary", "sm")}
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Run test
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-[14px] text-danger">
          {error}
        </p>
      )}
      {result && (
        <ul className="mt-4 space-y-2" aria-label="Storage test results">
          <Row ok={result.server.ok} note={result.server.note} />
          {result.browser && (
            <Row ok={result.browser.ok} note={result.browser.note} />
          )}
        </ul>
      )}
      {result?.browser?.corsRule && (
        <div className="mt-4 space-y-3" role="group" aria-label="How to fix the storage rules">
          <p className="text-[14px] font-medium">How to fix it (about a minute)</p>
          <ol className="list-decimal pl-5 space-y-1 text-[14px] text-fg-2">
            <li>Open the bucket's settings at your storage provider. On Cloudflare R2: R2 object storage, your bucket, Settings, CORS Policy, Add CORS policy, the JSON tab.</li>
            <li>Paste this rule and save. It lists every address the app is opened from, so Scriwo and Scriwo Homes both work.</li>
            <li>Come back here and press Run test again.</li>
          </ol>
          <CodeBlock code={result.browser.corsRule} label="CORS rule for the storage bucket" />
        </div>
      )}
    </section>
  );
}
