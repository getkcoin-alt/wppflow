import { useEffect, useState } from "react";
import { Check, Loader2, MailCheck, X } from "lucide-react";
import { resendVerification, verifyEmail } from "../../services/api";

// Confirming an email address. The account works straight away; this is a reminder, never a wall.

/** Opens when someone follows the link in the email: confirms the address, then goes on to the app. */
export function VerifyEmailPage({ token, onContinue }: { token: string; onContinue: () => void }) {
  const [state, setState] = useState<"working" | "ok" | "bad">("working");
  const [email, setEmail] = useState("");
  useEffect(() => {
    let live = true;
    verifyEmail(token)
      .then((r: any) => {
        if (!live) return;
        if (r?.status === "error") setState("bad");
        else {
          setEmail(r?.email || "");
          setState("ok");
        }
      })
      .catch(() => live && setState("bad"));
    return () => {
      live = false;
    };
  }, [token]);
  return (
    <main className="min-h-dvh grid place-items-center bg-app p-6">
      <div className="w-full max-w-[400px] text-center rounded-[32px] bg-surface ring-1 ring-line shadow-card p-8" style={{ animation: "rise .4s var(--ease-out) both" }}>
        <img src={state === "ok" ? "/brand/riwo-wave.webp" : "/brand/riwo.webp"} alt="" width={120} height={120} className="mx-auto h-28 w-28 rounded-[28px] object-cover" style={{ animation: "riwo-float 5s ease-in-out infinite" }} />
        {state === "working" && (
          <p className="mt-4 text-fg-2 inline-flex items-center gap-2" role="status">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Confirming your email…
          </p>
        )}
        {state === "ok" && (
          <>
            <h1 className="mt-4 text-[20px] font-semibold">Email confirmed</h1>
            <p className="mt-1 text-[14px] text-fg-2">{email ? `${email} is confirmed.` : "Thank you."} You are all set.</p>
          </>
        )}
        {state === "bad" && (
          <>
            <h1 className="mt-4 text-[20px] font-semibold">This link no longer works</h1>
            <p className="mt-1 text-[14px] text-fg-2">It may have been used already or it expired. Sign in and ask for a new one.</p>
          </>
        )}
        {state !== "working" && (
          <button type="button" onClick={onContinue} className="mt-6 h-11 px-6 rounded-full bg-brand-solid text-white text-[14.5px] font-semibold">
            Continue
          </button>
        )}
      </div>
    </main>
  );
}

/** A slim reminder at the top of the app until the address is confirmed. */
export function VerifyEmailBanner({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "limited" | "failed">("idle");
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  const resend = async () => {
    setState("sending");
    try {
      const r: any = await resendVerification();
      setState(r?.status === "error" ? "limited" : "sent");
    } catch {
      setState("failed");
    }
  };
  return (
    <div role="status" className="shrink-0 flex flex-wrap items-center gap-x-3 gap-y-1 bg-gold/15 text-[13px] px-4 py-2">
      <MailCheck className="w-4 h-4 text-gold shrink-0" aria-hidden />
      <span className="flex-1 min-w-[200px]">
        {state === "sent" ? (
          <>
            <Check className="inline w-3.5 h-3.5 mr-1" aria-hidden />A new link is on its way to {email}.
          </>
        ) : state === "limited" ? (
          "You have asked for a few links already. Please check your inbox and spam folder, or try again in an hour."
        ) : state === "failed" ? (
          "That did not send. Please try again."
        ) : (
          <>Please confirm your email ({email}). We sent you a link.</>
        )}
      </span>
      {state !== "sent" && (
        <button type="button" onClick={() => void resend()} disabled={state === "sending"} className="font-semibold text-brand underline-offset-2 hover:underline disabled:opacity-50">
          Send it again
        </button>
      )}
      <button type="button" onClick={() => setHidden(true)} aria-label="Hide this reminder" className="h-6 w-6 grid place-items-center rounded-full text-fg-3 hover:text-fg">
        <X className="w-3.5 h-3.5" aria-hidden />
      </button>
    </div>
  );
}
