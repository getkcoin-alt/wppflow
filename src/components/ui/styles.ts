const BTN =
  "inline-flex items-center justify-center gap-2 font-medium rounded-full transition disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap";
const SIZE = { md: "h-11 px-5 text-[14.5px]", sm: "h-9 px-4 text-[13.5px]" };
const TONE = {
  primary: "bg-brand-solid text-white hover:bg-brand-hover shadow-card",
  secondary: "bg-surface-2 text-fg hover:bg-surface-3",
  ghost: "text-fg-2 hover:text-fg hover:bg-surface-2",
  danger: "bg-danger/10 text-danger hover:bg-danger/20",
};
export const btn = (
  tone: keyof typeof TONE = "primary",
  size: keyof typeof SIZE = "md",
) => `${BTN} ${SIZE[size]} ${TONE[tone]}`;

export const inputCls =
  "w-full h-12 rounded-2xl bg-surface-2 px-4 text-[15px] text-fg ring-1 ring-transparent focus:ring-gold/60 focus:bg-surface outline-none transition";

export const selectCls = `${inputCls} appearance-none pr-10 bg-[length:16px] bg-no-repeat bg-[right_1rem_center]`;
export const textareaCls =
  "w-full min-h-[120px] rounded-2xl bg-surface-2 px-4 py-3 text-[15px] text-fg ring-1 ring-transparent focus:ring-gold/60 focus:bg-surface outline-none transition resize-y";
