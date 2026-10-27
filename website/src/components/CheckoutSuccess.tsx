"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Loader2, TriangleAlert } from "lucide-react";
import { describeStatus, getStatus, type PurchaseStatus } from "@/lib/checkout";
import { SITE, whatsappHref } from "@/lib/site";

const EVERY_MS = 2500;
const GIVE_UP_AFTER = 60; // about two and a half minutes

// Where the buyer lands after paying. The server decides whether the payment is confirmed and the workspace made; this
// page asks, with the token it was given, until there is an answer.
export function CheckoutSuccess() {
  const [status, setStatus] = useState<PurchaseStatus | null>(null);
  const [slow, setSlow] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const order = q.get("order"),
      token = q.get("token");
    if (!order || !token) {
      setMissing(true);
      return;
    }
    let stopped = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const look = async () => {
      try {
        const s = await getStatus(order, token);
        if (stopped) return;
        setStatus(s);
        if (s.status !== "processing") return;
      } catch {
        // a dropped connection: try again
      }
      if (stopped) return;
      if (++tries >= GIVE_UP_AFTER) return setSlow(true);
      timer = setTimeout(look, EVERY_MS);
    };
    void look();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);

  if (missing)
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <TriangleAlert className="mx-auto h-10 w-10 text-gold" aria-hidden="true" />
        <h1 className="mt-4 text-2xl">We could not find this order</h1>
        <p className="mt-3 text-fg-2">Open this page from the link at the end of your payment. If you paid and did not get an email, message us on WhatsApp and we will sort it out.</p>
        <a href={whatsappHref("Hi Scriwo, I paid online but could not find my order.")} target="_blank" rel="noopener" className="btn-ghost mt-6">WhatsApp {SITE.whatsappDisplay}</a>
      </div>
    );

  const view = status ? describeStatus(slow && status.status === "processing" ? { ...status, status: "review" } : status) : describeStatus({ status: "processing", company: "", email: "", plan: "", reason: null });
  const Icon = view.tone === "done" ? CheckCircle2 : view.tone === "problem" ? TriangleAlert : Loader2;
  return (
    <div className="card mx-auto max-w-xl p-8 text-center" role="status" aria-live="polite" data-testid="checkout-status" data-state={status?.status || "processing"}>
      <Icon className={`mx-auto h-12 w-12 ${view.tone === "done" ? "text-ok" : view.tone === "problem" ? "text-gold" : "animate-spin text-brand"}`} aria-hidden="true" />
      <h1 className="mt-4 text-2xl">{view.title}</h1>
      <p className="mt-3 text-fg-2">{view.body}</p>
      {view.tone === "done" && (
        <>
          <a href={SITE.appUrl} className="btn-primary mt-6">Open Scriwo</a>
          <p className="mt-4 text-sm text-fg-3"><Clock className="mr-1 inline h-4 w-4" aria-hidden="true" />No email yet? Check your spam folder. The link works for 72 hours; after that, choose &ldquo;Forgot password?&rdquo; on the sign-in page and enter the same address to get a new link.</p>
        </>
      )}
      {(view.tone === "problem" || slow) && (
        <a href={whatsappHref("Hi Scriwo, I paid online and need help with my workspace.")} target="_blank" rel="noopener" className="btn-ghost mt-6">WhatsApp {SITE.whatsappDisplay}</a>
      )}
      {status?.status === "failed" && <a href="/checkout" className="btn-primary mt-6">Try again</a>}
    </div>
  );
}
