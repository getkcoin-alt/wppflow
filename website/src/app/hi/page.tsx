import type { Metadata } from "next";
import { LocalizedLanding } from "@/components/LocalizedLanding";
import { HI, LANGUAGE_ALTERNATES } from "@/content/locales";

export const metadata: Metadata = {
  title: { absolute: HI.title },
  description: HI.description,
  alternates: { canonical: HI.path, languages: LANGUAGE_ALTERNATES },
  openGraph: { locale: "hi_IN", title: HI.title, description: HI.description, url: HI.path },
};

export default function Page() {
  return <LocalizedLanding t={HI} />;
}
