import {
  Boxes,
  Clock,
  LayoutDashboard,
  Leaf,
  MapPin,
  Plus,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { FoodItem, View } from "../types";
import { cx, expiryState } from "../lib/utils";

interface SidebarProps {
  view: View;
  onNavigate: (view: View) => void;
  items: FoodItem[];
  locationCount: number;
  warningDays: number;
  onAddItem: () => void;
}

const primary: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "food", label: "All food", icon: Boxes },
  { id: "locations", label: "Locations", icon: MapPin },
  { id: "expiring", label: "Expiring soon", icon: Clock },
];

export function Sidebar({
  view,
  onNavigate,
  items,
  locationCount,
  warningDays,
  onAddItem,
}: SidebarProps) {
  const attention = items.filter((item) => expiryState(item, warningDays) !== "fresh").length;
  const fresh = Math.max(0, items.length - attention);
  const freshPercent = items.length ? Math.round((fresh / items.length) * 100) : 100;

  return (
    <aside
      className={cx(
        "relative flex h-full w-[250px] shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-ink",
      )}
    >
      <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 size-72 rounded-full bg-teal-300/5 blur-3xl" />

      <div className="relative flex items-center gap-3 px-6 pb-8 pt-7">
        <div className="flex size-10 items-center justify-center rounded-[13px] bg-gradient-to-br from-[#79d3a4] to-[#2f8a63] text-[#0c2619] shadow-lg shadow-emerald-900/30">
          <Leaf size={22} strokeWidth={2.2} />
        </div>
        <div className="flex-1">
          <p className="text-[17px] font-semibold tracking-[-0.03em]">Larder</p>
          <p className="text-[11px] text-sidebar-muted">Home food inventory</p>
        </div>
      </div>

      <nav className="relative flex-1 px-3">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-muted/70">
          Pantry
        </p>
        <div className="space-y-1">
          {primary.map(({ id, label, icon: Icon }) => {
            const active = view === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className={cx(
                  "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all",
                  active
                    ? "bg-sidebar-soft text-white"
                    : "text-sidebar-muted hover:bg-[#173327] hover:text-sidebar-ink",
                )}
              >
                {active && (
                  <span className="absolute -left-3 h-6 w-[3px] rounded-r-full bg-[#79d3a4]" />
                )}
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                <span className="flex-1 text-left">{label}</span>
                {id === "expiring" && attention > 0 && (
                  <span
                    className={cx(
                      "flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      active ? "bg-[#344d41] text-white" : "bg-amber-400/15 text-amber-300",
                    )}
                  >
                    {attention}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="px-3 pb-2 pt-7 text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-muted/70">
          Preferences
        </p>
        <button
          type="button"
          onClick={() => onNavigate("settings")}
          className={cx(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all",
            view === "settings"
              ? "bg-sidebar-soft text-white"
              : "text-sidebar-muted hover:bg-[#173327] hover:text-sidebar-ink",
          )}
        >
          <Settings size={18} strokeWidth={view === "settings" ? 2.2 : 1.8} />
          Settings
        </button>
      </nav>

      <div className="relative px-4 pb-5">
        <button
          type="button"
          onClick={onAddItem}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#284136] bg-[#1f382d] py-2.5 text-[13px] font-semibold text-sidebar-ink transition-colors hover:bg-[#22362c]"
        >
          <Plus size={16} /> Quick add
        </button>
        <div className="rounded-2xl border border-[#213a2f] bg-[#1a3329] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
              Kitchen health
            </p>
            <span className="text-[11px] font-bold text-[#8fe0b4]">{freshPercent}%</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#3a4f45]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#3fa87a] to-[#8fe0b4] transition-all duration-500"
              style={{ width: `${freshPercent}%` }}
            />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-sidebar-muted">
            {items.length} items across {locationCount} {locationCount === 1 ? "place" : "places"}
          </p>
        </div>
        <p className="mt-4 px-1 text-[10px] text-sidebar-muted/50">Larder v0.1 · Made for home</p>
      </div>
    </aside>
  );
}
