import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { MobileCta, WhatsAppButton } from "@/components/WhatsAppButton";
import { themeScript } from "@/components/ThemeToggle";
import { organization, website } from "@/lib/jsonld";
import { SiteAnalytics } from "@/components/Analytics";
import { SITE } from "@/lib/site";
import { RevealOnScroll, revealScript } from "@/components/RevealOnScroll";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Scriwo — WhatsApp CRM & Shared Team Inbox for UAE and India", template: "%s | Scriwo" },
  description: SITE.description,
  applicationName: "Scriwo",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "Scriwo", locale: "en_AE", alternateLocale: ["en_IN"], url: SITE.url },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  category: "business software",
  // Search engine ownership codes, set in Vercel when each console asks for one (Bing and Google are verified already).
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION } : {}),
    ...(process.env.NEXT_PUBLIC_YANDEX_VERIFICATION ? { yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION } : {}),
    other: {
      ...(process.env.NEXT_PUBLIC_BING_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION } : {}),
      ...(process.env.NEXT_PUBLIC_NAVER_VERIFICATION ? { "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_VERIFICATION } : {}),
      ...(process.env.NEXT_PUBLIC_BAIDU_VERIFICATION ? { "baidu-site-verification": process.env.NEXT_PUBLIC_BAIDU_VERIFICATION } : {}),
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#08090a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: revealScript }} />
        <JsonLd data={[organization(), website()]} />
      </head>
      <body className="min-h-screen pb-20 sm:pb-0">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <WhatsAppButton />
        <MobileCta />
        <SiteAnalytics />
        <RevealOnScroll />
      </body>
    </html>
  );
}
