import { TriangleAlert } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  destructive = false,
  busy = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="sm"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={
              destructive
                ? "rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                : "btn-primary"
            }
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
            destructive ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand"
          }`}
        >
          <TriangleAlert size={19} />
        </div>
        <p className="pt-1 text-sm leading-relaxed text-muted">{message}</p>
      </div>
    </Modal>
  );
}
