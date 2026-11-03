import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

// A short message at the bottom of the screen that says what just happened, and when it can be undone, offers Undo. One at a time:
// a newer one replaces an older one. Without a provider (a test, a screen on its own) showing one does nothing.
export interface ToastInput {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "default" | "error";
  /** how long it stays, in ms */
  ms?: number;
}
interface Toast extends ToastInput {
  id: number;
}
const ToastContext = createContext<{ show: (t: ToastInput) => void }>({ show: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const next = useRef(1);
  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setToast(null);
  }, []);
  const show = useCallback((t: ToastInput) => {
    window.clearTimeout(timer.current);
    const id = next.current++;
    setToast({ ...t, id });
    timer.current = window.setTimeout(() => setToast((cur) => (cur?.id === id ? null : cur)), t.ms ?? (t.onAction ? 5500 : 3200));
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed inset-x-0 z-[75] flex justify-center px-4 pointer-events-none" style={{ bottom: "calc(var(--tabbar-h, 0px) + 12px)" }} aria-live="polite">
        {toast && (
          <div key={toast.id} role="status" className={`pointer-events-auto max-w-md w-full sm:w-auto flex items-center gap-4 rounded-2xl pl-4 pr-2 min-h-12 pop animate-rise ${toast.tone === "error" ? "bg-danger text-white" : "bg-fg text-app"}`}>
            <span className="text-[14.5px] py-3 flex-1">{toast.text}</span>
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  hide();
                }}
                className="h-10 px-3 rounded-xl text-[14.5px] font-semibold text-gold hover:bg-white/10"
              >
                {toast.actionLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
