import type { ReactNode } from "react";

// Every non-inbox screen sits in the same frame: generous margins, one title, calm spacing.
export function Page({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto w-full ${wide ? "max-w-7xl" : "max-w-6xl"} px-4 sm:px-8 pt-6 sm:pt-10 pb-12 animate-rise`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-[28px] sm:text-[36px] leading-[1.1] font-semibold text-fg">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[15px] sm:text-[16px] text-fg-2 mt-1.5 max-w-xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </header>
  );
}

export function Segmented<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex p-1 rounded-full bg-surface-2 max-w-full overflow-x-auto"
    >
      {items.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={`h-9 px-4 rounded-full text-[13.5px] font-medium whitespace-nowrap transition ${
            value === t.key
              ? "bg-surface text-fg shadow-card"
              : "text-fg-2 hover:text-fg"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card px-6 py-14 text-center">
      <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-surface-2 grid place-items-center text-gold">
        {icon}
      </div>
      <h2 className="text-[18px] font-semibold text-fg">{title}</h2>
      {body && (
        <p className="text-[14.5px] text-fg-2 mt-1.5 max-w-sm mx-auto">
          {body}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-fg-2 mb-1.5 ml-1">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[12.5px] text-fg-3 mt-1.5 ml-1">
          {hint}
        </span>
      )}
    </label>
  );
}

const PILL = {
  ok: "bg-ok/10 text-ok",
  warn: "bg-warn/10 text-warn",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  neutral: "bg-surface-2 text-fg-2",
  gold: "bg-gold/15 text-gold",
};
export function Pill({
  tone = "neutral",
  children,
  dot = false,
}: {
  tone?: keyof typeof PILL;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[12px] font-medium ${PILL[tone]}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Notice({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-2xl px-4 py-3 text-[14px] ${tone === "error" ? "bg-danger/10 text-danger" : "bg-ok/10 text-ok"}`}
    >
      {children}
    </div>
  );
}
