"use client";
import Script from "next/script";
import { useEffect } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { track, type EventName } from "@/lib/analytics";

// Microsoft Clarity project for www.scriwo.com. NEXT_PUBLIC_CLARITY_ID overrides it; set it to "off" to disable.
const CLARITY_SETTING = process.env.NEXT_PUBLIC_CLARITY_ID || "z1r8fr6pdq";
const CLARITY_ID = CLARITY_SETTING === "off" ? "" : CLARITY_SETTING.replace(/[^a-z0-9]/gi, "");

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
