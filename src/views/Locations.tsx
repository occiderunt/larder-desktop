import { useState } from "react";
import { Boxes, ChevronDown, ChevronUp, Clock, GripVertical, Pencil, Plus } from "lucide-react";
import type { FoodItem, Location } from "../types";
import { categoryInfo, cx, expiryState } from "../lib/utils";
import { LocationGlyph } from "../components/Glyphs";

interface LocationsProps {
  locations: Location[];
  items: FoodItem[];
  warningDays: number;
  onAdd: () => void;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
  onReorder: (ids: string[]) => void;
}

export function Locations({
  locations,
  items,
  warningDays,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}: LocationsProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const move = (id: string, direction: -1 | 1) => {
    const ids = locations.map((location) => location.id);
    const from = ids.indexOf(id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    onReorder(ids);
  };

  const drop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setOverId(null);
      return;
    }
    const ids = locations.map((location) => location.id);
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(targetId);
    ids.splice(from, 1);
    ids.splice(to, 0, draggedId);
    onReorder(ids);
    setDraggedId(null);
    setOverId(null);
  };

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 sm:px-6 md:pt-7 lg:px-9">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-ink">
            Your storage places
          </h2>
          <p className="mt-1 text-[12.5px] text-muted">
            Drag to reorder. Edit a place to change its name, icon or colour.
          </p>
        </div>
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[11.5px] font-semibold text-muted">
          {locations.length} {locations.length === 1 ? "location" : "locations"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-3">
        {locations.map((location) => {
          const locationItems = items.filter((item) => item.locationId === location.id);
          const expiring = locationItems.filter(
            (item) => expiryState(item, warningDays) === "soon" || expiryState(item, warningDays) === "expired",
          ).length;
          const topCategories = Array.from(new Set(locationItems.map((item) => item.category))).slice(0, 4);
          return (
            <div
              key={location.id}
              draggable
              onDragStart={(event) => {
                setDraggedId(location.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => {
                setDraggedId(null);
                setOverId(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setOverId(location.id);
              }}
              onDragLeave={() => setOverId((current) => (current === location.id ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                drop(location.id);
              }}
              className={cx(
                "card group relative overflow-hidden rounded-2xl transition-all",
                draggedId === location.id && "opacity-40",
                overId === location.id && draggedId !== location.id && "ring-2 ring-brand",
              )}
            >
              <div className="h-1.5 w-full" style={{ backgroundColor: location.color }} />
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                    style={{ backgroundColor: location.color }}
                  >
                    <LocationGlyph name={location.icon} size={23} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-semibold tracking-[-0.02em] text-ink">
                      {location.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 min-h-[32px] text-[11.5px] leading-relaxed text-muted">
                      {location.description || "No description yet"}
                    </p>
                  </div>
                  <GripVertical
                    size={17}
                    className="mt-1 shrink-0 cursor-grab text-muted/50 active:cursor-grabbing"
                  />
                </div>

                <div className="mt-5 flex items-center gap-4 border-t border-line pt-4">
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                    <Boxes size={15} className="text-muted" /> {locationItems.length}{" "}
                    <span className="font-normal text-muted">items</span>
                  </div>
                  {expiring > 0 && (
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-warn">
                      <Clock size={14} /> {expiring} soon
                    </div>
                  )}
                  <div className="ml-auto flex items-center gap-1 sm:hidden">
                    <button
                      type="button"
                      onClick={() => move(location.id, -1)}
                      aria-label={`Move ${location.name} up`}
                      className="flex size-8 items-center justify-center rounded-lg border border-line text-muted"
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(location.id, 1)}
                      aria-label={`Move ${location.name} down`}
                      className="flex size-8 items-center justify-center rounded-lg border border-line text-muted"
                    >
                      <ChevronDown size={15} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEdit(location)}
                    className="flex size-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand sm:ml-auto"
                    aria-label={`Edit ${location.name}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(location)}
                    className="flex size-8 items-center justify-center rounded-lg border border-line text-muted transition-all hover:border-danger hover:bg-danger-soft hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`Delete ${location.name}`}
                  >
                    <span className="text-[17px] leading-none">×</span>
                  </button>
                </div>

                {topCategories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {topCategories.map((name) => {
                      const info = categoryInfo(name);
                      return (
                        <span
                          key={name}
                          className="rounded-full px-2 py-1 text-[10px] font-semibold"
                          style={{
                            color: info.color,
                            backgroundColor: `color-mix(in srgb, ${info.color} 12%, transparent)`,
                          }}
                        >
                          {name}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={onAdd}
          className="group flex min-h-[210px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-surface-2/30 text-muted transition-all hover:border-brand/50 hover:bg-brand-soft/30 hover:text-brand"
        >
          <div className="flex size-12 items-center justify-center rounded-2xl bg-surface text-muted transition-colors group-hover:text-brand">
            <Plus size={22} />
          </div>
          <span className="text-[13px] font-semibold">Add a location</span>
          <span className="max-w-[190px] text-center text-[11px] leading-relaxed">
            A cupboard, drawer, or anywhere else food lives
          </span>
        </button>
      </div>
    </div>
  );
}
