import { Fragment } from "react";

// *bold* in WhatsApp's own way
const withBold = (line: string) =>
  line.split(/(\*[^*]+\*)/g).map((part, i) => (/^\*[^*]+\*$/.test(part) ? <strong key={i}>{part.slice(1, -1)}</strong> : <Fragment key={i}>{part}</Fragment>));

/** The message as the person receiving the code will see it, in a WhatsApp-style bubble. */
export function OtpPreview({ text, brand, locale }: { text: string; brand: string; locale: string }) {
  return (
    <figure aria-label="How the message looks in WhatsApp" className="rounded-3xl bg-surface-2 p-4 m-0">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="h-9 w-9 rounded-full bg-brand-solid text-white grid place-items-center text-[14px] font-semibold" aria-hidden>
          {(brand || "S").trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-fg truncate">{brand || "Your company"}</div>
          <div className="text-[12px] text-fg-3">WhatsApp</div>
        </div>
      </div>
      <div dir={locale === "ar" ? "rtl" : "ltr"} className="max-w-[19rem] rounded-2xl rounded-tl-md bg-surface px-3.5 py-2.5 text-[14.5px] leading-relaxed text-fg shadow-card">
        {text ? text.split("\n").map((line, i) => <p key={i} className={i ? "mt-1" : ""}>{withBold(line)}</p>) : <p className="text-fg-3">…</p>}
        <div className="mt-1 text-end text-[11px] text-fg-3">just now</div>
      </div>
    </figure>
  );
}
