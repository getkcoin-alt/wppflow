"use client";
import Script from "next/script";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { readConsent, saveConsent, track, type EventName } from "@/lib/analytics";

// Microsoft Clarity project for www.scriwo.com. NEXT_PUBLIC_CLARITY_ID overrides it; set it to "off" to disable.
const CLARITY_SETTING = process.env.NEXT_PUBLIC_CLARITY_ID || "z1r8fr6pdq";
const CLARITY_ID = CLARITY_SETTING === "off" ? "" : CLARITY_SETTING.replace(/[^a-z0-9]/gi, "");

// Google Analytics 4 property for www.scriwo.com. NEXT_PUBLIC_GA_ID overrides it; "off" disables it.
const GA_SETTING = process.env.NEXT_PUBLIC_GA_ID || "G-JDN3EJSHC2";
const GA_ID = GA_SETTING === "off" ? "" : GA_SETTING.replace(/[^A-Z0-9-]/gi, "");

// Consent Mode: analytics cookies stay off until the visitor accepts; ads storage is never used.
// A returning visitor's earlier choice is applied before the tag loads.
const gaBootstrap = (id: string) => `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
var c=null;try{c=localStorage.getItem("scriwo_cookie_consent")}catch(e){}
gtag('consent','default',{analytics_storage:c==='granted'?'granted':'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
gtag('js',new Date());gtag('config','${id}');`;

function ConsentBanner() {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(readConsent() === null), []);
  if (!open) return null;
  const choose = (c: "granted" | "denied") => {
    saveConsent(c);
    setOpen(false);
  };
  return (
    <div role="dialog" aria-label="Cookie choice" className="glass fixed inset-x-3 bottom-20 z-50 mx-auto max-w-xl rounded-2xl border border-line p-4 shadow-pop sm:bottom-5">
      <p className="text-sm text-fg-2">
        We use Google Analytics cookies to understand how people use this site. No advertising cookies.{" "}
        <Link href="/privacy" className="underline">Privacy notice</Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => choose("granted")} className="btn-primary !py-2 text-sm">Accept</button>
        <button type="button" onClick={() => choose("denied")} className="btn-ghost !py-2 text-sm">Decline</button>
      </div>
    </div>
  );
}

// One listener for every link marked with data-track="…", so server-rendered pages need no
// client code of their own to report a conversion click.
function ClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-track]") as HTMLElement | null;
      if (!el) return;
      const data: Record<string, string> = { path: window.location.pathname };
      for (const [k, v] of Object.entries(el.dataset))
        if (k.startsWith("track") && k !== "track" && v) data[k.slice(5).toLowerCase()] = v;
      track(el.dataset.track as EventName, data);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}

export function SiteAnalytics() {
  return (
    <>
      <VercelAnalytics />
      <SpeedInsights />
      <ClickTracker />
      {GA_ID && (
        <>
          <Script id="ga-consent" strategy="afterInteractive">{gaBootstrap(GA_ID)}</Script>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <ConsentBanner />
        </>
      )}
      {/* Microsoft Clarity heatmaps and recordings.
          Turn cookies off in the Clarity project settings so no consent banner is needed. */}
      {CLARITY_ID && (
        <Script id="clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
        </Script>
      )}
    </>
  );
}
