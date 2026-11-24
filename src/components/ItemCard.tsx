import { Check, Pencil } from "lucide-react";
import type { FoodItem, Location } from "../types";
import { categoryInfo, cx, daysUntil, expiryState, formatQuantity } from "../lib/utils";
import { CategoryGlyph } from "./Glyphs";
import { ExpiryPill, statusTone } from "./ExpiryPill";

interface ItemCardProps {
  item: FoodItem;
  location?: Location;
  warningDays: number;
  onEdit: (item: FoodItem) => void;
  onConsume: (item: FoodItem) => void;
}

export function ItemCard({ item, location, warningDays, onEdit, onConsume }: ItemCardProps) {
  const category = categoryInfo(item.category);
  const state = expiryState(item, warningDays);
  const tone = statusTone(state);
  const days = daysUntil(item.expiryDate);
  const progress = days === null ? 0 : Math.max(4, Math.min(100, (days / 30) * 100));

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onEdit(item);
        }
      }}
      className="card group relative cursor-pointer rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-[13px]"
          style={{
            backgroundColor: `color-mix(in srgb, ${category.color} 13%, transparent)`,
            color: category.color,
          }}
        >
          <CategoryGlyph category={item.category} size={21} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="truncate text-[14px] font-semibold tracking-[-0.01em] text-ink">
            {item.name}
          </h3>
          <p className="mt-1 truncate text-[11.5px] text-muted">
            {location?.name ?? "Unknown"} · {formatQuantity(item.quantity)} {item.unit}
          </p>
        </div>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted opacity-0 transition-all group-hover:opacity-100">
          <Pencil size={13} />
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <ExpiryPill item={item} warningDays={warningDays} />
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onConsume(item);
          }}
          title="Mark as used"
          className="flex size-7 items-center justify-center rounded-lg border border-line text-muted transition-all hover:border-brand hover:bg-brand-soft hover:text-brand sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
        >
          <Check size={14} strokeWidth={2.5} />
        </button>
      </div>
      {item.expiryDate && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className={cx("h-full rounded-full transition-all", tone.bar)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
