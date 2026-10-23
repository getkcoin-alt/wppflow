"use client";
import { useEffect } from "react";

/** Sets <html lang> on pages written in another language (the root layout renders "en"). */
export function HtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    const html = document.documentElement;
    const before = html.lang;
    html.lang = lang;
    return () => {
      html.lang = before;
    };
  }, [lang]);
  return null;
}
