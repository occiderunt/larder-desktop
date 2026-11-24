import type { ExpiryState } from "../types";
import { cx, expiryLabel, expiryState } from "../lib/utils";
import type { FoodItem } from "../types";

export function statusTone(state: ExpiryState) {
  return {
    box:
      state === "expired"
        ? "bg-danger-soft text-danger"
        : state === "soon"
          ? "bg-warn-soft text-warn"
          : state === "fresh"
            ? "bg-brand-soft text-brand"
            : "bg-surface-2 text-muted",
    dot:
      state === "expired"
        ? "bg-danger"
        : state === "soon"
          ? "bg-warn"
          : state === "fresh"
            ? "bg-brand"
            : "bg-muted",
    bar:
      state === "expired"
        ? "bg-danger"
        : state === "soon"
          ? "bg-warn"
          : "bg-brand",
  };
}

export function ExpiryPill({
  item,
  warningDays,
  showIcon = true,
  className,
}: {
  item: FoodItem;
  warningDays: number;
  showIcon?: boolean;
  className?: string;
}) {
  const state = expiryState(item, warningDays);
  const tone = statusTone(state);
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
        tone.box,
        className,
      )}
    >
      {showIcon && <span className={cx("size-1.5 rounded-full", tone.dot)} />}
      {expiryLabel(item, warningDays)}
    </span>
  );
}
