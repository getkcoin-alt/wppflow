"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { LANGS, OTP_BASE, proofSnippet, serverSnippet, widgetSnippet, type Lang } from "@/lib/otpSnippets";

function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#14171a] text-[#e8e6e1]">
      <button
        type="button"
        aria-label={`Copy ${label}`}
        onClick={() => {
          navigator.clipboard?.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
      >
        {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto p-5 pr-24 text-[13px] leading-relaxed"><code>{code}</code></pre>
    </div>
  );
}

/** The server code in every language, plus the widget and its proof check. */
export function OtpServerCode() {
  const [lang, setLang] = useState<Lang>("node");
  return (
    <div>
      <div role="tablist" aria-label="Language" className="mb-4 flex flex-wrap gap-2">
        {LANGS.map((l) => (
          <button
            key={l.key}
            role="tab"
            type="button"
            aria-selected={lang === l.key}
            onClick={() => setLang(l.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${lang === l.key ? "bg-ink text-white dark:bg-gold dark:text-[#14171a]" : "bg-surface hairline text-fg-2 hover:text-fg"}`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <CodeBlock code={serverSnippet(lang, { base: OTP_BASE })} label={`${lang} code`} />
    </div>
  );
}

export function OtpWidgetCode() {
  return <CodeBlock code={widgetSnippet({ base: OTP_BASE })} label="widget code" />;
}

export function OtpProofCode() {
  return <CodeBlock code={proofSnippet({ base: OTP_BASE })} label="proof check" />;
}
