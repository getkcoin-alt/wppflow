import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { btn } from "../../ui/styles";

/** Code to copy: a box with a Copy button that says it worked. */
export function CodeBlock({ code, label, wrap = false }: { code: string; label: string; /** a single long line (a command, an address, a key) wraps instead of scrolling sideways */ wrap?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* the text is selectable: it can still be copied by hand */
    }
  };
  return (
    <div className="relative">
      <pre aria-label={label} tabIndex={0} className={`overflow-auto max-h-[22rem] rounded-2xl bg-surface-2 p-4 pt-14 sm:pt-4 sm:pr-28 font-mono text-[12.5px] leading-relaxed text-fg-2 ${wrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"}`}>
        <code>{code}</code>
      </pre>
      <button type="button" onClick={() => void copy()} className={`absolute top-2 right-2 ${btn("secondary", "sm")}`}>
        {copied ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
