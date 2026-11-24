import { CalendarClock, Check, CircleCheck, Pencil, Plus, TriangleAlert } from "lucide-react";
import type { FoodItem, Location } from "../types";
import {
  categoryInfo,
  cx,
  daysUntil,
  expiryState,
  formatDate,
  formatQuantity,
} from "../lib/utils";
import { CategoryGlyph } from "../components/Glyphs";
import { ExpiryPill } from "../components/ExpiryPill";

interface ExpiringProps {
  items: FoodItem[];
  locations: Location[];
  warningDays: number;
  onAddItem: () => void;
  onEditItem: (item: FoodItem) => void;
  onConsume: (item: FoodItem) => void;
}

export function Expiring({
  items,
  locations,
  warningDays,
  onAddItem,
  onEditItem,
  onConsume,
}: ExpiringProps) {
  const groups: { title: string; caption: string; tone: "danger" | "warn" | "brand" | "muted"; items: FoodItem[] }[] = [
    {
      title: "Past their date",
      caption: "Best used up or discarded",
      tone: "danger",
      items: items.filter((item) => (daysUntil(item.expiryDate) ?? 1) < 0),
    },
    {
      title: "Use today",
      caption: "Perfect for tonight's meal",
      tone: "danger",
      items: items.filter((item) => daysUntil(item.expiryDate) === 0),
    },
    {
      title: "Next few days",
      caption: `Within ${warningDays} days`,
      tone: "warn",
      items: items.filter((item) => {
        const days = daysUntil(item.expiryDate);
        return days !== null && days >= 1 && days <= warningDays;
      }),
    },
    {
      title: "Coming up later",
      caption: "Plenty of time still",
      tone: "brand",
      items: items.filter((item) => (daysUntil(item.expiryDate) ?? 0) > warningDays),
    },
    {
      title: "No best-before date",
      caption: "Add a date to keep track",
      tone: "muted",
      items: items.filter((item) => !item.expiryDate),
    },
  ];

  const urgent = groups[0].items.length + groups[1].items.length + groups[2].items.length;
  const dated = items.filter((item) => item.expiryDate).length;

  return (
    <div className="mx-auto max-w-[1120px] px-4 pb-10 pt-5 sm:px-6 md:pt-7 lg:px-9">
      <div className="card mb-6 flex flex-wrap items-center gap-5 rounded-2xl p-5">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-warn-soft text-warn">
          <CalendarClock size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-ink">
            {urgent > 0 ? `${urgent} ${urgent === 1 ? "item needs" : "items need"} your attention` : "Nothing urgent right now"}
          </p>
          <p className="mt-1 text-[12px] text-muted">
            {dated} of {items.length} items have a best-before date. We sort them so the oldest comes first.
          </p>
        </div>
        <button type="button" onClick={onAddItem} className="btn-primary h-9">
          <Plus size={15} /> Add food
        </button>
      </div>

      <div className="space-y-7">
        {groups.map((group) => {
          if (group.items.length === 0) return null;
          const toneClass = {
            danger: { icon: "bg-danger-soft text-danger", dot: "bg-danger" },
            warn: { icon: "bg-warn-soft text-warn", dot: "bg-warn" },
            brand: { icon: "bg-brand-soft text-brand", dot: "bg-brand" },
            muted: { icon: "bg-surface-2 text-muted", dot: "bg-muted" },
          }[group.tone];
          return (
            <section key={group.title}>
              <div className="mb-3 flex items-center gap-3">
                <div className={cx("flex size-9 items-center justify-center rounded-xl", toneClass.icon)}>
                  {group.tone === "danger" ? (
                    <TriangleAlert size={17} />
                  ) : group.tone === "muted" ? (
                    <CircleCheck size={17} />
                  ) : (
                    <CalendarClock size={17} />
                  )}
                </div>
                <div>
                  <h3 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                    {group.title}
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-muted">
                      {group.items.length}
                    </span>
                  </h3>
                  <p className="text-[11.5px] text-muted">{group.caption}</p>
                </div>
              </div>
              <div className="card overflow-hidden rounded-2xl">
                {group.items
                  .sort((a, b) => (a.expiryDate ?? "9999").localeCompare(b.expiryDate ?? "9999"))
                  .map((item) => {
                    const info = categoryInfo(item.category);
                    const location = locations.find((entry) => entry.id === item.locationId);
                    const state = expiryState(item, warningDays);
                    return (
                      <div
                        key={item.id}
                        className={cx(
                          "flex flex-wrap items-center gap-3 border-b border-line/70 px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2/40 sm:flex-nowrap sm:gap-4 sm:px-5",
                          state === "expired" && "bg-danger-soft/20",
                          state === "soon" && "bg-warn-soft/20",
                        )}
                      >
                        <div className={cx("size-2 shrink-0 rounded-full", toneClass.dot)} />
                        <div
                          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${info.color} 13%, transparent)`,
                            color: info.color,
                          }}
                        >
                          <CategoryGlyph category={item.category} size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => onEditItem(item)}
                            className="block max-w-full truncate text-left text-[13.5px] font-semibold text-ink hover:text-brand"
                          >
                            {item.name}
                          </button>
                          <p className="mt-0.5 truncate text-[11px] text-muted">
                            {location?.name ?? "Unknown"} · {formatQuantity(item.quantity)} {item.unit}
                            {item.expiryDate ? ` · ${formatDate(item.expiryDate, "long")}` : ""}
                          </p>
                        </div>
                        <ExpiryPill item={item} warningDays={warningDays} />
                        <button
                          type="button"
                          onClick={() => onEditItem(item)}
                          aria-label={`Edit ${item.name}`}
                          className="hidden size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-brand sm:flex"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onConsume(item)}
                          aria-label={`Mark ${item.name} as used`}
                          className="flex size-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
                        >
                          <Check size={15} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </section>
          );
        })}

        {items.length === 0 && (
          <div className="card flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <CalendarClock size={24} />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-ink">No dates to track yet</p>
            <p className="mt-1 text-[12.5px] text-muted">Add food with a best-before date to see it here.</p>
            <button type="button" onClick={onAddItem} className="btn-primary mt-5">
              <Plus size={15} /> Add food
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
