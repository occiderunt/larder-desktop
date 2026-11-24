import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Check, CircleAlert, Info, X } from "lucide-react";
import { cx, uid } from "../lib/utils";

type ToastKind = "success" | "error" | "info";
interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
  action?: ToastAction;
}

interface ToastApi {
  notify: (message: string, kind?: ToastKind, action?: ToastAction) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const icons = {
  success: Check,
  error: CircleAlert,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, kind: ToastKind = "info", action?: ToastAction) => {
      const id = uid("toast");
      setToasts((current) => [...current.slice(-3), { id, message, kind, action }]);
      window.setTimeout(() => dismiss(id), action ? 6000 : 3600);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      notify,
      success: (message: string) => notify(message, "success"),
      error: (message: string) => notify(message, "error"),
    }),
    [notify],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-[340px] flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = icons[toast.kind];
          return (
            <div
              key={toast.id}
              className={cx(
                "animate-slide-in pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-xl",
                toast.kind === "success" && "border-brand/25 bg-surface/95 text-ink",
                toast.kind === "error" && "border-danger/30 bg-surface/95 text-ink",
                toast.kind === "info" && "border-line bg-surface/95 text-ink",
              )}
            >
              <span
                className={cx(
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  toast.kind === "success" && "bg-brand-soft text-brand",
                  toast.kind === "error" && "bg-danger-soft text-danger",
                  toast.kind === "info" && "bg-surface-2 text-muted",
                )}
              >
                <Icon size={15} strokeWidth={2.4} />
              </span>
              <span className="flex-1 leading-snug">{toast.message}</span>
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    dismiss(toast.id);
                  }}
                  className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold text-brand transition-colors hover:bg-brand-soft"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="text-muted transition-colors hover:text-ink"
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
