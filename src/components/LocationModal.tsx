import { useEffect, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import type { Location, LocationInput } from "../types";
import { LOCATION_COLORS, LOCATION_ICONS, cx } from "../lib/utils";
import { LocationGlyph } from "./Glyphs";
import { Modal } from "./Modal";

interface LocationModalProps {
  open: boolean;
  onClose: () => void;
  location: Location | null;
  onSave: (input: LocationInput) => Promise<void> | void;
  onDelete?: (location: Location) => Promise<void> | void;
}

const empty: LocationInput = { name: "", icon: "fridge", color: LOCATION_COLORS[0], description: null };

export function LocationModal({
  open,
  onClose,
  location,
  onSave,
  onDelete,
}: LocationModalProps) {
  const [form, setForm] = useState<LocationInput>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      location
        ? {
            name: location.name,
            icon: location.icon,
            color: location.color,
            description: location.description,
          }
        : empty,
    );
    setSaving(false);
  }, [open, location]);

  const update = <K extends keyof LocationInput>(key: K, value: LocationInput[K]) => {
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
      title={location ? "Edit location" : "New storage location"}
      subtitle="Make your kitchen map your own."
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          {location && onDelete ? (
            <button
              type="button"
              onClick={() => {
                void onDelete(location);
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
              form="location-form"
              disabled={!form.name.trim() || saving}
              className="btn-primary"
            >
              <Check size={16} /> {location ? "Save changes" : "Create location"}
            </button>
          </div>
        </div>
      }
    >
      <form id="location-form" onSubmit={submit} className="space-y-6">
        <div>
          <label className="label" htmlFor="location-name">
            Name
          </label>
          <input
            id="location-name"
            autoFocus
            className="field text-[15px] font-medium"
            placeholder="e.g. Wine fridge, Hall cupboard"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
          />
        </div>

        <div>
          <span className="label">Icon</span>
          <div className="grid grid-cols-6 gap-2">
            {LOCATION_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                title={icon}
                onClick={() => update("icon", icon)}
                className={cx(
                  "flex aspect-square items-center justify-center rounded-xl border transition-all",
                  form.icon === icon
                    ? "border-brand bg-brand-soft text-brand shadow-sm"
                    : "border-line bg-surface-2 text-muted hover:border-brand/40 hover:text-ink",
                )}
              >
                <LocationGlyph name={icon} size={19} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label">Colour</span>
          <div className="flex flex-wrap items-center gap-2">
            {LOCATION_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                onClick={() => update("color", color)}
                style={{ backgroundColor: color }}
                className={cx(
                  "flex size-9 items-center justify-center rounded-full transition-transform hover:scale-110",
                  form.color.toLowerCase() === color.toLowerCase()
                    ? "ring-2 ring-ink ring-offset-2 ring-offset-surface"
                    : "",
                )}
              >
                {form.color.toLowerCase() === color.toLowerCase() && (
                  <Check size={15} className="text-white" strokeWidth={3} />
                )}
              </button>
            ))}
            <label className="relative flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-line bg-surface-2 text-muted">
              <span className="text-lg leading-none">+</span>
              <input
                type="color"
                aria-label="Custom colour"
                value={form.color}
                onChange={(event) => update("color", event.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="location-description">
            Description <span className="font-normal text-muted/70">(optional)</span>
          </label>
          <input
            id="location-description"
            className="field"
            placeholder="e.g. Top shelf, behind the cereals"
            value={form.description ?? ""}
            onChange={(event) => update("description", event.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/70 p-4">
          <div
            className="flex size-11 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: form.color }}
          >
            <LocationGlyph name={form.icon} size={21} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{form.name || "Preview"}</p>
            <p className="truncate text-xs text-muted">{form.description || "Storage location"}</p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
