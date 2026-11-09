import { useEffect, useRef } from "react";
import { Bot, Check, Copy } from "lucide-react";
import { Notice } from "../../ui/Page";
import { btn } from "../../ui/styles";
import { SECRET_ENV } from "./agentPrompt";
import { useCopy, type CopyState } from "../../../hooks/useCopy";

/** The button, short enough for a 320 px screen. The sentence for a screen reader says what to do next. */
export function CopyPromptButton({ copy, state, label, primary = false }: { copy: () => void; state: CopyState; label: string; primary?: boolean }) {
  return (
    <>
      <button type="button" onClick={copy} className={btn(primary ? "primary" : "secondary", primary ? "md" : "sm")}>
        {state === "copied" ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
        {state === "copied" ? "Copied" : state === "blocked" ? "Could not copy" : label}
      </button>
      <span className="sr-only" role="status">
        {state === "copied" ? "Copied. Paste it into your coding agent." : state === "blocked" ? "Your browser blocked copying. Open Read the prompt in step 5, select the text and copy it by hand." : ""}
      </span>
    </>
  );
}

/** The same action at the top of the page, so the prompt is never more than a tap away. */
export function QuickCopyPrompt({ prompt }: { prompt: string }) {
  const { state, copy } = useCopy(prompt);
  return <CopyPromptButton copy={() => void copy()} state={state} label="Copy agent prompt" />;
}

/**
 * Step 5: a prompt for the person's coding agent (Claude Code, Cursor, Copilot ...) that carries every choice made above, so the agent
 * sets OTP up in their project. The secret key is deliberately not in it; the card says where it goes instead.
 */
export function AgentPromptCard({ prompt, missing }: { prompt: string; missing: string[] }) {
  const { state, copy } = useCopy(prompt);
  const details = useRef<HTMLDetailsElement>(null);
  // when copying is blocked the text is shown, ready to be selected
  useEffect(() => {
    if (state === "blocked" && details.current) details.current.open = true;
  }, [state]);
  const complete = missing.length === 0;
  return (
    <div className="space-y-4">
      <p className="text-[14.5px] text-fg-2">
        Using Claude Code, Cursor, Copilot or another coding agent? Copy this prompt, paste it into the agent while it is working in your project, and it adds the whole OTP step for you: the server code, the screens and the tests.
      </p>
      <ul className="flex flex-wrap gap-2 text-[13px] text-fg-2" aria-label="What the prompt contains">
        {["Your use case and message", "Digits, expiry and tries", "The exact API and every error", "Web widget and webhook", "Test keys for building", "Security rules and tests"].map((t) => (
          <li key={t} className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5">
            <Check className="w-3.5 h-3.5 text-ok" aria-hidden /> {t}
          </li>
        ))}
      </ul>
      {complete ? (
        <p className="text-[14px] text-ok font-medium">Your setup is complete, so the prompt is too.</p>
      ) : (
        <Notice tone="info">
          Still to do above: {missing.join(", ")}. You can copy the prompt now. It tells your agent to build with a test key until the rest is done, and what is left.
        </Notice>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <CopyPromptButton copy={() => void copy()} state={state} label="Copy prompt for my agent" primary />
        <span className="text-[13px] text-fg-3 inline-flex items-center gap-1.5">
          <Bot className="w-4 h-4" aria-hidden /> Works in any coding agent
        </span>
      </div>
      <p className="text-[13.5px] text-fg-3 leading-relaxed">
        Your secret key is not inside it, on purpose: a key pasted into a chat stays in its history. The prompt tells your agent to read it from <code className="font-mono text-[12.5px]">{SECRET_ENV}</code> in your server's environment. Put the key you copied in step 4 there.
      </p>
      <details ref={details} className="rounded-2xl bg-surface-2">
        <summary className="cursor-pointer select-none px-4 py-3 text-[14px] font-medium text-fg">Read the prompt</summary>
        <pre aria-label="Prompt for your coding agent" tabIndex={0} className="overflow-auto max-h-[28rem] px-4 pb-4 font-mono text-[12.5px] leading-relaxed text-fg-2 whitespace-pre-wrap break-words">
          {prompt}
        </pre>
      </details>
    </div>
  );
}
