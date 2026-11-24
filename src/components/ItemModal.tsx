import { useEffect, useState } from "react";
import { CalendarDays, Check, Trash2 } from "lucide-react";
import type { FoodItem, ItemInput, Location } from "../types";
import { CATEGORIES, UNITS, cx, offsetISO } from "../lib/utils";
import { Modal } from "./Modal";

interface ItemModalProps {
  open: boolean;
  onClose: () => void;
  item: FoodItem | null;
  locations: Location[];
  defaultLocationId?: string;
  onSave: (input: ItemInput) => Promise<void> | void;
  onDelete?: (item: FoodItem) => Promise<void> | void;
}

const empty = (locationId: string): ItemInput => ({
  name: "",
  category: "Produce",
  quantity: 1,
  unit: "pcs",
  locationId,
  purchaseDate: offsetISO(0),
  expiryDate: "",
  notes: "",
});

export function ItemModal({
  open,
  onClose,
  item,
  locations,
  defaultLocationId,
  onSave,
  onDelete,
}: ItemModalProps) {
  const [form, setForm] = useState<ItemInput>(empty(defaultLocationId ?? locations[0]?.id ?? ""));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      item
        ? {
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            locationId: item.locationId,
            purchaseDate: item.purchaseDate ?? "",
            expiryDate: item.expiryDate ?? "",
            notes: item.notes ?? "",
          }
        : empty(defaultLocationId ?? locations[0]?.id ?? ""),
    );
    setSaving(false);
  }, [open, item, defaultLocationId, locations]);

  const update = <K extends keyof ItemInput>(key: K, value: ItemInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Edit food item" : "Add food item"}
      subtitle={item ? "Update the details below." : "A few details are all you need."}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          {item && onDelete ? (
            <button
              type="button"
              onClick={() => {
                void onDelete(item);
                onClose();
              }}
              className="btn-ghost text-danger hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 size={15} /> Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              form="item-form"
              disabled={!form.name.trim() || saving}
              className="btn-primary"
            >
              <Check size={16} /> {item ? "Save changes" : "Add item"}
            </button>
          </div>
        </div>
      }
    >
      <form id="item-form" onSubmit={submit} className="space-y-5">
        <div>
          <label className="label" htmlFor="item-name">
            Name
          </label>
          <input
            id="item-name"
            autoFocus
            className="field text-[15px] font-medium"
            placeholder="e.g. Cherry tomatoes"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="item-category">
              Category
            </label>
            <select
              id="item-category"
              className="field"
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
            >
              {CATEGORIES.map((category) => (
                <option key={category.name}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="item-location">
              Storage location
            </label>
            <select
              id="item-location"
              className="field"
              value={form.locationId}
              onChange={(event) => update("locationId", event.target.value)}
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Amount</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.1"
              className="field flex-1"
              value={form.quantity}
              onChange={(event) => update("quantity", Number(event.target.value))}
            />
            <select
              aria-label="Unit"
              className="field w-[132px]"
              value={form.unit}
              onChange={(event) => update("unit", event.target.value)}
            >
              {UNITS.map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="item-purchased">
              Purchased
            </label>
            <input
              id="item-purchased"
              type="date"
              className="field"
              value={form.purchaseDate ?? ""}
              onChange={(event) => update("purchaseDate", event.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="item-expiry">
              Best before
            </label>
            <input
              id="item-expiry"
              type="date"
              className="field"
              value={form.expiryDate ?? ""}
              onChange={(event) => update("expiryDate", event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Quick set:</span>
          {[
            ["Tomorrow", 1],
            ["In 1 week", 7],
            ["In 1 month", 30],
          ].map(([label, days]) => (
            <button
              key={label as string}
              type="button"
              onClick={() => update("expiryDate", offsetISO(days as number))}
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                form.expiryDate === offsetISO(days as number)
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line text-muted hover:border-brand/40 hover:text-brand",
              )}
            >
              {label}
            </button>
          ))}
          {form.expiryDate && (
            <button
              type="button"
              onClick={() => update("expiryDate", "")}
              className="text-xs font-semibold text-muted hover:text-danger"
            >
              Clear
            </button>
          )}
        </div>

        <div>
          <label className="label" htmlFor="item-notes">
            Notes <span className="font-normal text-muted/70">(optional)</span>
          </label>
          <textarea
            id="item-notes"
            className="field min-h-[78px] resize-none"
            placeholder="Opened yesterday, use in pasta…"
            value={form.notes ?? ""}
            onChange={(event) => update("notes", event.target.value)}
          />
        </div>

        <p className="flex items-center gap-2 text-xs text-muted">
          <CalendarDays size={14} /> We'll remind you when food is close to its best-before date.
        </p>
      </form>
    </Modal>
  );
}
