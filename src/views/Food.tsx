import { useMemo, useState } from "react";
import { Check, Grid2X2, List, Pencil, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import type { FoodItem, Location } from "../types";
import {
  CATEGORIES,
  categoryInfo,
  cx,
  daysUntil,
  expiryState,
  formatQuantity,
} from "../lib/utils";
import { CategoryGlyph } from "../components/Glyphs";
import { ExpiryPill } from "../components/ExpiryPill";
import { ItemCard } from "../components/ItemCard";

interface FoodProps {
  items: FoodItem[];
  locations: Location[];
  warningDays: number;
  search: string;
  onSearchChange: (value: string) => void;
  onAddItem: () => void;
  onEditItem: (item: FoodItem) => void;
  onConsume: (item: FoodItem) => void;
}

type Sort = "expiry" | "name" | "recent" | "quantity";

export function Food({
  items,
  locations,
  warningDays,
  search,
  onSearchChange,
  onAddItem,
  onEditItem,
  onConsume,
}: FoodProps) {
  const [locationId, setLocationId] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<Sort>("expiry");
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = items.filter((item) => {
      if (locationId !== "all" && item.locationId !== locationId) return false;
      if (category !== "all" && item.category !== category) return false;
      if (!term) return true;
      const location = locations.find((entry) => entry.id === item.locationId);
      return `${item.name} ${item.category} ${item.notes ?? ""} ${location?.name ?? ""}`
        .toLowerCase()
        .includes(term);
    });

    return result.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "recent") return b.createdAt.localeCompare(a.createdAt);
      if (sort === "quantity") return b.quantity - a.quantity;
      const aDays = daysUntil(a.expiryDate) ?? 99999;
      const bDays = daysUntil(b.expiryDate) ?? 99999;
      return aDays - bDays;
    });
  }, [items, locations, locationId, category, search, sort]);

  const hasFilters = locationId !== "all" || category !== "all" || search.trim() !== "";
  const clearFilters = () => {
    setLocationId("all");
    setCategory("all");
    onSearchChange("");
  };

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 sm:px-6 md:pt-7 lg:px-9">
      <div className="card mb-5 rounded-2xl p-4">
        <div className="relative mb-4 md:hidden">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search your food…"
            aria-label="Search food"
            className="field h-10 pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-muted">
            <SlidersHorizontal size={15} /> Location
          </div>
          <div className="flex flex-1 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLocationId("all")}
              className={cx(
                "rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all",
                locationId === "all"
                  ? "border-brand bg-brand text-white shadow-sm"
                  : "border-line text-muted hover:border-brand/40 hover:text-brand",
              )}
            >
              All places
            </button>
            {locations.map((location) => (
              <button
                key={location.id}
                type="button"
                onClick={() => setLocationId(location.id)}
                className={cx(
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all",
                  locationId === location.id
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line text-muted hover:border-brand/40 hover:text-brand",
                )}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: location.color }} />
                {location.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <div className="flex items-center gap-2 text-[12px] text-muted">
            <span className="font-semibold">{filtered.length}</span> items
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="btn-ghost text-[12px]">
                <X size={13} /> Clear filters
              </button>
            )}
            <select
              aria-label="Filter by category"
              className="h-9 max-w-full rounded-xl border border-line bg-surface-2 px-3 text-[12px] font-medium text-ink outline-none focus:border-brand"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((entry) => (
                <option key={entry.name}>{entry.name}</option>
              ))}
            </select>
            <select
              aria-label="Sort food"
              className="h-9 max-w-full rounded-xl border border-line bg-surface-2 px-3 text-[12px] font-medium text-ink outline-none focus:border-brand"
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
            >
              <option value="expiry">Use first (expiry)</option>
              <option value="name">Name A–Z</option>
              <option value="recent">Recently added</option>
              <option value="quantity">Largest amount</option>
            </select>
            <div className="flex items-center rounded-xl border border-line bg-surface-2 p-1">
              <button
                type="button"
                aria-label="Grid view"
                onClick={() => setLayout("grid")}
                className={cx(
                  "flex size-7 items-center justify-center rounded-lg transition-colors",
                  layout === "grid" ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-ink",
                )}
              >
                <Grid2X2 size={14} />
              </button>
              <button
                type="button"
                aria-label="List view"
                onClick={() => setLayout("list")}
                className={cx(
                  "flex size-7 items-center justify-center rounded-lg transition-colors",
                  layout === "list" ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-ink",
                )}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center rounded-2xl px-6 py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Plus size={28} />
          </div>
          <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-ink">
            Your kitchen is ready
          </h3>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
            Add your first food item and we'll keep track of where it is and when to use it.
          </p>
          <button type="button" onClick={onAddItem} className="btn-primary mt-6">
            <Plus size={16} /> Add your first item
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center rounded-2xl px-6 py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-surface-2 text-muted">
            <Search size={26} />
          </div>
          <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-ink">Nothing found</h3>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
            Try a different search or loosen the filters to find what you're looking for.
          </p>
          <button type="button" onClick={clearFilters} className="btn-ghost mt-5">
            Clear filters
          </button>
        </div>
      ) : layout === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              location={locations.find((location) => location.id === item.locationId)}
              warningDays={warningDays}
              onEdit={onEditItem}
              onConsume={onConsume}
            />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
          <div className="grid grid-cols-[1fr_130px_130px_130px_70px] gap-3 border-b border-line bg-surface-2/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <span>Item</span>
            <span>Location</span>
            <span>Amount</span>
            <span>Best before</span>
            <span />
          </div>
          {filtered.map((item) => {
            const category = categoryInfo(item.category);
            const location = locations.find((entry) => entry.id === item.locationId);
            const state = expiryState(item, warningDays);
            return (
              <div
                key={item.id}
                className={cx(
                  "grid grid-cols-[1fr_130px_130px_130px_70px] items-center gap-3 border-b border-line/70 px-5 py-3 text-[13px] transition-colors last:border-b-0 hover:bg-surface-2/50",
                  state === "expired" && "bg-danger-soft/20",
                )}
              >
                <button type="button" onClick={() => onEditItem(item)} className="flex min-w-0 items-center gap-3 text-left">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${category.color} 13%, transparent)`,
                      color: category.color,
                    }}
                  >
                    <CategoryGlyph category={item.category} size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{item.name}</span>
                    <span className="block truncate text-[11px] text-muted">{item.category}</span>
                  </span>
                </button>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 truncate text-[12px] text-muted">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: location?.color }} />
                    <span className="truncate">{location?.name ?? "Unknown"}</span>
                  </span>
                </span>
                <span className="text-[12px] font-medium text-ink">
                  {formatQuantity(item.quantity)} {item.unit}
                </span>
                <ExpiryPill item={item} warningDays={warningDays} className="w-fit" />
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEditItem(item)}
                    aria-label={`Edit ${item.name}`}
                    className="flex size-7 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-brand"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onConsume(item)}
                    aria-label={`Mark ${item.name} as used`}
                    className="flex size-7 items-center justify-center rounded-lg text-muted hover:bg-brand-soft hover:text-brand"
                  >
                    <Check size={15} />
                  </button>
                </div>
              </div>
            );
          })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
