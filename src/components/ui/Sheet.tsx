import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// Forms and details open in a centred dialog on desktop and slide up as a sheet on phones.
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open) return null;
  // Portalled to <body>: an ancestor with a transform or backdrop filter would otherwise
  // become the containing block of this fixed overlay and clip it.
  return createPortal(
    <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center sm:p-6">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full sm:max-w-lg max-h-[92dvh] flex flex-col bg-surface rounded-t-[32px] sm:rounded-[32px] pop animate-rise"
      >
        <div className="sm:hidden mx-auto mt-3 h-1.5 w-10 rounded-full bg-fg/15" />
        <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-5 sm:pt-8 pb-2">
          <div className="min-w-0">
            <h2 className="text-[22px] font-semibold text-fg">{title}</h2>
            {subtitle && (
              <p className="text-[14.5px] text-fg-2 mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-9 w-9 shrink-0 grid place-items-center rounded-full bg-surface-2 text-fg-2 hover:text-fg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 sm:px-8 py-4">{children}</div>
        {footer && (
          <div
            className="px-6 sm:px-8 pt-3 pb-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
