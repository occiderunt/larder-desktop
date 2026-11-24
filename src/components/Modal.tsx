import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cx } from "../lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: "sm" | "md" | "lg";
}

export function Modal({ open, onClose, title, subtitle, children, footer, width = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#08150e]/55 backdrop-blur-[6px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          "animate-pop-in relative flex max-h-[88vh] w-full max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[24px] border border-line bg-surface shadow-2xl",
          width === "sm" && "max-w-[400px]",
          width === "md" && "max-w-[540px]",
          width === "lg" && "max-w-[720px]",
        )}
      >
        <div className="flex items-start justify-between gap-6 border-b border-line px-7 py-6">
          <div>
            <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-2/60 px-7 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
