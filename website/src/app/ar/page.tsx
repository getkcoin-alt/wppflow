import type { Metadata } from "next";
import { LocalizedLanding } from "@/components/LocalizedLanding";
import { AR, LANGUAGE_ALTERNATES } from "@/content/locales";

export const metadata: Metadata = {
  title: { absolute: AR.title },
  description: AR.description,
  alternates: { canonical: AR.path, languages: LANGUAGE_ALTERNATES },
  openGraph: { locale: "ar_AE", title: AR.title, description: AR.description, url: AR.path },
};

export default function Page() {
  return <LocalizedLanding t={AR} />;
}
