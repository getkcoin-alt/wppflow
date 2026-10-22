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

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Scriwo — WhatsApp CRM & Shared Team Inbox for UAE and India", template: "%s | Scriwo" },
  description: SITE.description,
  applicationName: "Scriwo",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "Scriwo", locale: "en_AE", alternateLocale: ["en_IN"], url: SITE.url },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  category: "business software",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#08090a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
      </body>
    </html>
  );
}
