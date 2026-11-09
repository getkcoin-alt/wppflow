import { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Loader2, Send } from "lucide-react";
import { otpTestCheck, otpTestSend, otpTestStatus, type OtpChecked, type OtpRequest, type OtpSent } from "../../../services/api";
import { Field, Notice } from "../../ui/Page";
import { btn, inputCls } from "../../ui/styles";

const WHY: Record<string, (c: OtpChecked) => string> = {
  wrong_code: (c) => `That is not the code.${c.attemptsLeft !== undefined ? ` ${c.attemptsLeft} ${c.attemptsLeft === 1 ? "try" : "tries"} left.` : ""}`,
  expired: () => "That code has expired. Send a new one.",
  too_many_attempts: () => "Too many wrong tries, so this code is locked. Send a new one.",
  already_used: () => "That code was already used.",
  superseded: () => "A newer code was sent. Use that one.",
};
const problem = (e: any): string => `${e?.message || "Something went wrong."}${e?.data?.fix ? ` ${e.data.fix}` : ""}`;
const KEY = "scriwo-otp-test-phone";
const remembered = () => {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
};

/** Send a real code from the company's number to a phone, type it back, and see it work. */
export function TestCard({ numberReady, codeLength, onVerified }: { numberReady: boolean; codeLength: number; onVerified: () => void }) {
  const [phone, setPhone] = useState(remembered);
  const [sent, setSent] = useState<OtpSent | null>(null);
  const [status, setStatus] = useState<OtpRequest | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"" | "send" | "check">("");
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState<OtpChecked | null>(null);
  const [wait, setWait] = useState(0);
  const polls = useRef(0);

  // delivery ticks: asked again every two seconds for a minute
  useEffect(() => {
    if (!sent || answer?.valid) return;
    polls.current = 0;
    const t = setInterval(async () => {
      polls.current += 1;
      if (polls.current > 30) return clearInterval(t);
      try {
        const s = await otpTestStatus(sent.id);
        setStatus(s);
        if (s.deliveredAt) clearInterval(t);
      } catch {
        /* the ticks are a courtesy */
      }
    }, 2000);
    return () => clearInterval(t);
  }, [sent, answer?.valid]);
  // the wait before another code can be asked for
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const send = async () => {
    setBusy("send");
    setError("");
    setAnswer(null);
    setCode("");
    try {
      const r = await otpTestSend(phone.trim());
      try {
        localStorage.setItem(KEY, phone.trim());
      } catch {
        /* optional */
      }
      setSent(r);
      setStatus(null);
      setWait(r.resendAfter ?? 30);
    } catch (e) {
      setError(problem(e));
    } finally {
      setBusy("");
    }
  };
  const check = async () => {
    if (!sent) return;
    setBusy("check");
    setError("");
    try {
      const r = await otpTestCheck(sent.id, code.trim());
      setAnswer(r);
      if (r.valid) onVerified();
    } catch (e) {
      setError(problem(e));
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-4">
      {!numberReady && <Notice tone="warn">Link a WhatsApp number first (step 2). The test code is sent from it.</Notice>}
      <form
        className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (numberReady && phone.trim() && !busy && wait <= 0) void send();
        }}
      >
        <Field label="Your own WhatsApp number" hint="It receives the test code. Not the number the codes are sent from.">
          <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971 50 123 4567" className={inputCls} />
        </Field>
        <button type="submit" disabled={!numberReady || !phone.trim() || Boolean(busy) || wait > 0} className={btn("primary")}>
          {busy === "send" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Send className="w-4 h-4" aria-hidden />}
          {sent ? (wait > 0 ? `Send again in ${wait}s` : "Send again") : "Send a test code"}
        </button>
      </form>

      {sent && (
        <div role="status" aria-live="polite" className="rounded-2xl bg-surface-2 px-4 py-3 text-[14px] text-fg-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5 text-fg">
            {status?.deliveredAt ? <CheckCheck className="w-4 h-4 text-ok" aria-hidden /> : <Check className="w-4 h-4 text-ok" aria-hidden />}
            {status?.deliveredAt ? "Delivered" : "Sent"} to {sent.to}
          </span>
          {sent.note && <span className="text-warn">{sent.note}</span>}
        </div>
      )}

      {sent && !answer?.valid && (
        <form
          className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim() && !busy) void check();
          }}
        >
          <Field label="Type the code you received on WhatsApp">
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, codeLength + 2))} inputMode="numeric" autoComplete="one-time-code" placeholder={"0".repeat(codeLength)} aria-label="Code you received" className={`${inputCls} tracking-[0.35em] text-center font-mono text-[18px]`} />
          </Field>
          <button type="submit" disabled={!code.trim() || Boolean(busy)} className={btn("secondary")}>
            {busy === "check" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null} Check the code
          </button>
        </form>
      )}
      {answer && !answer.valid && <Notice tone="warn">{(WHY[answer.reason || ""] || (() => "That did not work."))(answer)}</Notice>}
      {answer?.valid && (
        <Notice tone="success">
          It works. The code was checked{answer.secondsToVerify != null ? ` ${answer.secondsToVerify} seconds after it was sent` : ""}. Your setup is proven; now connect your site.
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
