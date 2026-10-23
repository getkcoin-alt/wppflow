import type { ReactNode } from "react";
import { Check, Lock, MessageCircle, Users } from "lucide-react";
import { ScriwoMark, Wordmark } from "../brand/Logo";

const POINTS = [
  { icon: MessageCircle, text: "One calm inbox for every WhatsApp number" },
  { icon: Lock, text: "Private team notes your customers never see" },
  { icon: Users, text: "Everyone sees exactly what they should" },
];

// Decorative preview of the product; hidden from assistive tech.
function Preview() {
  return (
    <div aria-hidden className="relative w-full max-w-[420px] select-none">
      <div className="absolute -inset-10 bg-[radial-gradient(closest-side,rgba(214,185,123,0.16),transparent)] animate-drift" />
      <div className="relative rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#7B6BC9] to-[#4a3f86] grid place-items-center text-white/90 text-sm font-semibold">
            AM
          </div>
          <div>
            <div className="text-[14px] font-medium text-white">
              Aarav Mehta
            </div>
            <div className="text-[12px] text-white/50">typing…</div>
          </div>
        </div>
        <div className="pt-4 space-y-2.5 text-[13.5px]">
          <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-white/10 px-3.5 py-2.5 text-white/90">
            Can you confirm my order is on the way?
          </div>
          <div className="max-w-[78%] ml-auto rounded-2xl rounded-br-md bg-[#0F6B55] px-3.5 py-2.5 text-white">
            Yes. It left our warehouse this morning.
          </div>
          <div className="rounded-2xl border border-dashed border-[#D6B97B]/50 bg-[#D6B97B]/10 px-3.5 py-2.5 text-[#E9D6A8]">
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] opacity-80">
              <Lock className="w-3 h-3" /> Private note
            </span>
            <div className="mt-1">Repeat buyer. Offer free gift wrapping.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-app text-fg lg:grid lg:grid-cols-[1.08fr_1fr]">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#08090a] text-white p-14">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(60%_50%_at_20%_0%,rgba(15,107,85,0.35),transparent),radial-gradient(50%_40%_at_90%_100%,rgba(214,185,123,0.14),transparent)]" />
        <div className="relative flex items-center gap-4">
          <ScriwoMark size={44} />
          <Wordmark className="text-[26px] !text-white" />
        </div>
        <div className="relative">
          <h1 className="font-serif text-[64px] leading-[1.02] tracking-[-0.02em] font-normal">
            Every conversation,
            <br />
            <span className="italic text-gold-gradient">
              thoughtfully handled.
            </span>
          </h1>
          <p className="mt-6 text-[18px] leading-relaxed text-white/60 max-w-md">
            One quiet, beautiful place for your whole team to talk with
            customers on WhatsApp.
          </p>
          <ul className="mt-10 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3.5 text-[15.5px] text-white/80"
              >
                <span className="h-9 w-9 rounded-full bg-white/[0.07] ring-1 ring-white/10 grid place-items-center text-[#D6B97B]">
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex items-end justify-between gap-8">
          <p className="text-[13px] text-white/35">
            © {new Date().getFullYear()} Scriwo
          </p>
          <Preview />
        </div>
      </aside>

      <main className="flex min-h-dvh lg:min-h-0 items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-[420px] animate-rise">
          <div className="lg:hidden mb-10 flex flex-col items-center text-center">
            <ScriwoMark size={56} />
            <Wordmark className="mt-4 text-[26px]" />
            <p className="mt-4 font-serif text-[30px] leading-tight">
              Every conversation,{" "}
              <span className="italic text-gold">thoughtfully handled.</span>
            </p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export function AuthNote({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 text-[14px] leading-snug ${
        tone === "error" ? "bg-danger/10 text-danger" : "bg-ok/10 text-ok"
      }`}
    >
      {tone === "success" && <Check className="w-4 h-4 mt-0.5 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}
