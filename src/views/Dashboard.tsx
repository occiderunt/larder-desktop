import {
  ArrowUpRight,
  Boxes,
  Check,
  ChevronRight,
  Clock,
  Leaf,
  MapPin,
  Plus,
  Shapes,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { FoodItem, Location, Settings, View } from "../types";
import {
  categoryInfo,
  cx,
  expiryState,
  formatQuantity,
  greeting,
  longDate,
} from "../lib/utils";
import { CategoryGlyph, LocationGlyph } from "../components/Glyphs";
import { ExpiryPill } from "../components/ExpiryPill";
import { ItemCard } from "../components/ItemCard";

interface DashboardProps {
  items: FoodItem[];
  locations: Location[];
  settings: Settings;
  onNavigate: (view: View) => void;
  onAddItem: () => void;
  onAddLocation: () => void;
  onEditItem: (item: FoodItem) => void;
  onConsume: (item: FoodItem) => void;
  onClearSample: () => void;
}

export function Dashboard({
  items,
  locations,
  settings,
  onNavigate,
  onAddItem,
  onAddLocation,
  onEditItem,
  onConsume,
  onClearSample,
}: DashboardProps) {
  const warning = settings.expiryWarningDays;
  const attention = items
    .filter((item) => expiryState(item, warning) === "expired" || expiryState(item, warning) === "soon")
    .sort((a, b) => (a.expiryDate ?? "9999").localeCompare(b.expiryDate ?? "9999"));
  const freshCount = items.filter((item) => expiryState(item, warning) === "fresh").length;
  const categories = new Set(items.map((item) => item.category)).size;
  const recent = [...items]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  const stats = [
    {
      label: "Total items",
      value: items.length,
      note: `${freshCount} in good shape`,
      icon: Boxes,
      tone: "bg-brand-soft text-brand",
    },
    {
      label: "Needs attention",
      value: attention.length,
      note: attention.length ? "Use these first" : "Nothing urgent",
      icon: Clock,
      tone: "bg-warn-soft text-warn",
    },
    {
      label: "Storage places",
      value: locations.length,
      note: "Customisable",
      icon: MapPin,
      tone: "bg-[#eef0fb] text-[#6d72bb]",
    },
    {
      label: "Categories",
      value: categories,
      note: "Across your kitchen",
      icon: Shapes,
      tone: "bg-[#f5ecf7] text-[#a06bb0]",
    },
  ];

  return (
    <div className="mx-auto max-w-[1320px] space-y-5 px-4 pb-10 pt-5 sm:px-6 md:space-y-6 md:pt-7 lg:px-9">
      {settings.sampleData && (
        <div className="animate-fade-up flex flex-wrap items-center gap-3 rounded-2xl border border-warn/25 bg-warn-soft px-4 py-3 text-[12.5px] text-warn">
          <Sparkles size={16} />
          <span className="flex-1 font-medium">
            These are sample items to show you around. Clear them whenever you're ready.
          </span>
          <button
            type="button"
            onClick={onClearSample}
            className="rounded-lg bg-surface/70 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-surface"
          >
            Clear sample data
          </button>
        </div>
      )}

      <section className="hero-grid animate-fade-up relative overflow-hidden rounded-[22px] px-5 py-6 text-white shadow-xl shadow-emerald-950/10 md:rounded-[26px] md:px-8 md:py-7">
        <div className="pointer-events-none absolute -right-14 -top-24 size-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-16 size-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-24 top-8 size-40 rounded-full bg-emerald-300/10 blur-2xl" />
        <Leaf
          size={160}
          strokeWidth={0.6}
          className="animate-float pointer-events-none absolute -bottom-16 right-16 rotate-[-24deg] text-white/10"
        />

        <div className="relative flex flex-wrap items-end justify-between gap-6 md:gap-8">
          <div className="max-w-[520px]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-emerald-100 backdrop-blur">
              <span className="size-1.5 rounded-full bg-[#9fe6bd]" /> {longDate()}
            </div>
            <h2 className="text-[23px] font-semibold leading-tight tracking-[-0.04em] md:text-[29px]">
              {greeting()}. <span className="text-emerald-200/90">Here's your kitchen.</span>
            </h2>
            <p className="mt-2 max-w-[440px] text-[13px] leading-relaxed text-emerald-100/75">
              A clear view of what you have, where it lives, and what to use next.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onAddItem}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-[#16432f] shadow-lg transition-transform hover:-translate-y-0.5"
              >
                <Plus size={16} strokeWidth={2.5} /> Add food
              </button>
              <button
                type="button"
                onClick={() => onNavigate("expiring")}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-[13px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
              >
                <Clock size={16} /> Review expiring
              </button>
            </div>
          </div>

          <div className="flex w-full gap-3 md:w-auto">
            <div className="flex-1 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md md:w-[130px] md:flex-none">
              <p className="text-[11px] font-medium text-emerald-100/70">Tracked</p>
              <p className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.04em]">
                {items.length}
              </p>
              <p className="mt-2 text-[10px] text-emerald-100/60">food items</p>
            </div>
            <div className="flex-1 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md md:w-[150px] md:flex-none">
              <p className="text-[11px] font-medium text-emerald-100/70">Use soon</p>
              <p className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.04em]">
                {attention.length}
              </p>
              <p className="mt-2 text-[10px] text-emerald-100/60">need a look</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="card animate-fade-up rounded-2xl p-5"
            style={{ animationDelay: `${index * 55}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className={cx("flex size-10 items-center justify-center rounded-xl", stat.tone)}>
                <stat.icon size={19} strokeWidth={1.9} />
              </div>
              <ArrowUpRight size={15} className="text-muted/50" />
            </div>
            <p className="mt-4 text-[11.5px] font-medium text-muted">{stat.label}</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-[27px] font-semibold leading-none tracking-[-0.04em] text-ink">
                {stat.value}
              </span>
              <span className="pb-0.5 text-[11px] text-muted">{stat.note}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="card min-w-0 rounded-2xl p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em] text-ink">
                <TriangleAlert size={17} className="text-warn" /> Needs attention
              </h3>
              <p className="mt-1 text-[12px] text-muted">Sorted by best-before date</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("expiring")}
              className="btn-ghost text-[12px]"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>

          {attention.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface-2/40 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                <Check size={22} />
              </div>
              <p className="mt-3 text-sm font-semibold text-ink">All good in the kitchen</p>
              <p className="mt-1 text-xs text-muted">Nothing is close to expiring right now.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attention.slice(0, 5).map((item) => {
                const category = categoryInfo(item.category);
                const location = locations.find((entry) => entry.id === item.locationId);
                return (
                  <div
                    key={item.id}
                    className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-line hover:bg-surface-2/60"
                  >
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${category.color} 13%, transparent)`,
                        color: category.color,
                      }}
                    >
                      <CategoryGlyph category={item.category} size={18} />
                    </div>
                    <button
                      type="button"
                      onClick={() => onEditItem(item)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-[13px] font-semibold text-ink">{item.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted">
                        {location?.name ?? "Unknown"} · {formatQuantity(item.quantity)} {item.unit}
                      </p>
                    </button>
                    <ExpiryPill item={item} warningDays={warning} />
                    <button
                      type="button"
                      onClick={() => onConsume(item)}
                      title="Mark as used"
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-soft hover:text-brand"
                    >
                      <Check size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card min-w-0 rounded-2xl p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em] text-ink">
                <MapPin size={17} className="text-brand" /> Storage overview
              </h3>
              <p className="mt-1 text-[12px] text-muted">Where everything lives</p>
            </div>
            <button type="button" onClick={onAddLocation} className="btn-ghost text-[12px]">
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="space-y-3">
            {locations.slice(0, 6).map((location) => {
              const count = items.filter((item) => item.locationId === location.id).length;
              const share = items.length ? Math.round((count / items.length) * 100) : 0;
              return (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => onNavigate("locations")}
                  className="group flex w-full items-center gap-3 text-left"
                >
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: location.color }}
                  >
                    <LocationGlyph name={location.icon} size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[12.5px] font-semibold text-ink">{location.name}</p>
                      <p className="text-[11px] font-semibold text-muted">{count}</p>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(share, count ? 5 : 0)}%`, backgroundColor: location.color }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">Recently added</h3>
              <p className="mt-1 text-[12px] text-muted">The latest things you put away</p>
            </div>
            <button type="button" onClick={() => onNavigate("food")} className="btn-ghost text-[12px]">
              See all food <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-4">
            {recent.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                location={locations.find((location) => location.id === item.locationId)}
                warningDays={warning}
                onEdit={onEditItem}
                onConsume={onConsume}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
