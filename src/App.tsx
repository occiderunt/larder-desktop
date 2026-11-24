import { useCallback, useEffect, useRef, useState } from "react";
import { Leaf } from "lucide-react";
import type {
  Backup,
  Bootstrap,
  FoodItem,
  ItemInput,
  Location,
  LocationInput,
  Settings as AppSettings,
  View,
} from "./types";
import { api, isTauri } from "./lib/data";
import { exportBackup } from "./lib/backup";
import { longDate } from "./lib/utils";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { ItemModal } from "./components/ItemModal";
import { LocationModal } from "./components/LocationModal";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { useToast } from "./components/Toast";
import { Dashboard } from "./views/Dashboard";
import { Food } from "./views/Food";
import { Locations } from "./views/Locations";
import { Expiring } from "./views/Expiring";
import { Settings } from "./views/Settings";

const initialData: Bootstrap = {
  locations: [],
  items: [],
  settings: { theme: "system", expiryWarningDays: 5, sampleData: false },
};

const viewMeta: Record<View, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: `${longDate()} · Your kitchen at a glance` },
  food: { title: "All food", subtitle: "Everything you have, in one place" },
  locations: { title: "Locations", subtitle: "Make your storage spaces your own" },
  expiring: { title: "Expiring soon", subtitle: "A little planning goes a long way" },
  settings: { title: "Settings", subtitle: "Make Larder feel like yours" },
};

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export default function App() {
  const toast = useToast();
  const [data, setData] = useState<Bootstrap>(initialData);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("overview");
  const [search, setSearch] = useState("");
  const [itemModal, setItemModal] = useState<{
    open: boolean;
    item: FoodItem | null;
    locationId?: string;
  }>({ open: false, item: null });
  const [locationModal, setLocationModal] = useState<{
    open: boolean;
    location: Location | null;
  }>({ open: false, location: null });
  const [pendingLocationDelete, setPendingLocationDelete] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const next = await api.bootstrap();
    setData(next);
    return next;
  }, []);



  useEffect(() => {
    load()
      .catch((error) => toast.error(messageOf(error)))
      .finally(() => setReady(true));
  }, [load, toast]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark =
        data.settings.theme === "dark" ||
        (data.settings.theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [data.settings.theme]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "k") {
        event.preventDefault();
        setView("food");
        window.requestAnimationFrame(() => searchRef.current?.focus());
      } else if (key === "n") {
        event.preventDefault();
        setItemModal({ open: true, item: null });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const openAddItem = () => {
    setItemModal({ open: true, item: null });
  };
  const openEditItem = (item: FoodItem) => setItemModal({ open: true, item });
  const closeItemModal = () => setItemModal({ open: false, item: null });
  const openAddLocation = () => setLocationModal({ open: true, location: null });
  const openEditLocation = (location: Location) => setLocationModal({ open: true, location });
  const closeLocationModal = () => setLocationModal({ open: false, location: null });

  const onSearchChange = (value: string) => {
    setSearch(value);
    if (value && view !== "food") setView("food");
  };

  const saveItem = async (input: ItemInput) => {
    const editing = itemModal.item;
    try {
      if (editing) await api.updateItem(editing.id, input);
      else await api.createItem(input);
      await load();
      toast.success(editing ? `${input.name} updated` : `${input.name} added to your kitchen`);
    } catch (error) {
      toast.error(messageOf(error));
      throw error;
    }
  };

  const consume = async (item: FoodItem) => {
    try {
      await api.deleteItem(item.id);
      await load();
      toast.notify(`${item.name} marked as used`, "success", {
        label: "Undo",
        onClick: () => {
          void api
            .createItem({
              name: item.name,
              category: item.category,
              quantity: item.quantity,
              unit: item.unit,
              locationId: item.locationId,
              purchaseDate: item.purchaseDate,
              expiryDate: item.expiryDate,
              notes: item.notes,
            })
            .then(load)
            .then(() => toast.success(`${item.name} restored`))
            .catch((error) => toast.error(messageOf(error)));
        },
      });
    } catch (error) {
      toast.error(messageOf(error));
    }
  };

  const saveLocation = async (input: LocationInput) => {
    const editing = locationModal.location;
    try {
      if (editing) await api.updateLocation(editing.id, input);
      else await api.createLocation(input);
      await load();
      toast.success(editing ? `${input.name} updated` : `${input.name} is ready for food`);
    } catch (error) {
      toast.error(messageOf(error));
      throw error;
    }
  };

  const deleteLocation = async () => {
    if (!pendingLocationDelete) return;
    setDeletingLocation(true);
    try {
      await api.deleteLocation(pendingLocationDelete.id);
      await load();
      toast.notify(
        `${pendingLocationDelete.name} removed. Its food moved to another place.`,
        "info",
      );
      setPendingLocationDelete(null);
    } catch (error) {
      toast.error(messageOf(error));
    } finally {
      setDeletingLocation(false);
    }
  };

  const reorderLocations = async (ids: string[]) => {
    try {
      await api.reorderLocations(ids);
      setData((current) => ({
        ...current,
        locations: ids
          .map((id, index) => {
            const location = current.locations.find((entry) => entry.id === id);
            return location ? { ...location, sortOrder: index } : null;
          })
          .filter((location): location is Location => Boolean(location)),
      }));
    } catch (error) {
      toast.error(messageOf(error));
    }
  };

  const changeSettings = async (patch: Partial<AppSettings>) => {
    try {
      const next = await api.updateSettings(patch);
      setData((current) => ({ ...current, settings: next }));
    } catch (error) {
      toast.error(messageOf(error));
      throw error;
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportBackup();
      if (result === "cancelled") toast.notify("Backup cancelled", "info");
      else if (result === "saved") toast.success("Backup saved to your chosen folder");
      else toast.success("Backup downloaded");
    } catch (error) {
      toast.error(messageOf(error));
    }
  };

  const handleImport = async (backup: Backup) => {
    const next = await api.importData(backup);
    setData(next);
    toast.success("Backup restored successfully");
  };

  const clearSample = async () => {
    try {
      await api.clearItems();
      await load();
      toast.success("Sample food cleared — the kitchen is yours");
    } catch (error) {
      toast.error(messageOf(error));
    }
  };

  const clearAllFood = async () => {
    try {
      await api.clearItems();
      await load();
      toast.success("All food cleared");
    } catch (error) {
      toast.error(messageOf(error));
    }
  };

  const restoreSamples = async () => {
    try {
      const next = await api.restoreSamples();
      setData(next);
      toast.success("Sample food restored");
    } catch (error) {
      toast.error(messageOf(error));
    }
  };

  const toggleTheme = () => {
    void changeSettings({ theme: data.settings.theme === "dark" ? "light" : "dark" });
  };

  if (!ready) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#102a20] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-14 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-[#79d3a4] to-[#2f8a63] text-[#0c2619]">
            <Leaf size={28} />
          </div>
          <p className="text-[13px] font-medium tracking-wide text-emerald-100/80">
            Preparing your kitchen…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-canvas text-ink">
      <Sidebar
        view={view}
        onNavigate={setView}
        items={data.items}
        locationCount={data.locations.length}
        warningDays={data.settings.expiryWarningDays}
        onAddItem={openAddItem}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <Topbar
          ref={searchRef}
          view={view}
          title={viewMeta[view].title}
          subtitle={viewMeta[view].subtitle}
          search={search}
          onSearchChange={onSearchChange}
          onAddItem={openAddItem}
          theme={data.settings.theme}
          onToggleTheme={toggleTheme}
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {view === "overview" && (
            <Dashboard
              items={data.items}
              locations={data.locations}
              settings={data.settings}
              onNavigate={setView}
              onAddItem={openAddItem}
              onAddLocation={openAddLocation}
              onEditItem={openEditItem}
              onConsume={consume}
              onClearSample={clearSample}
            />
          )}
          {view === "food" && (
            <Food
              items={data.items}
              locations={data.locations}
              warningDays={data.settings.expiryWarningDays}
              search={search}
              onSearchChange={setSearch}
              onAddItem={openAddItem}
              onEditItem={openEditItem}
              onConsume={consume}
            />
          )}
          {view === "locations" && (
            <Locations
              locations={data.locations}
              items={data.items}
              warningDays={data.settings.expiryWarningDays}
              onAdd={openAddLocation}
              onEdit={openEditLocation}
              onDelete={setPendingLocationDelete}
              onReorder={reorderLocations}
            />
          )}
          {view === "expiring" && (
            <Expiring
              items={data.items}
              locations={data.locations}
              warningDays={data.settings.expiryWarningDays}
              onAddItem={openAddItem}
              onEditItem={openEditItem}
              onConsume={consume}
            />
          )}
          {view === "settings" && (
            <Settings
              settings={data.settings}
              itemCount={data.items.length}
              locationCount={data.locations.length}
              isTauri={isTauri}
              onSettingsChange={changeSettings}
              onExport={handleExport}
              onImport={handleImport}
              onClearItems={clearAllFood}
              onRestoreSamples={restoreSamples}
              notify={toast.notify}
            />
          )}
        </div>
      </main>

      <ItemModal
        open={itemModal.open}
        onClose={closeItemModal}
        item={itemModal.item}
        locations={data.locations}
        defaultLocationId={itemModal.locationId}
        onSave={saveItem}
        onDelete={itemModal.item ? consume : undefined}
      />
      <LocationModal
        open={locationModal.open}
        onClose={closeLocationModal}
        location={locationModal.location}
        onSave={saveLocation}
        onDelete={locationModal.location ? setPendingLocationDelete : undefined}
      />
      <ConfirmDialog
        open={pendingLocationDelete !== null}
        onClose={() => setPendingLocationDelete(null)}
        onConfirm={() => void deleteLocation()}
        title={`Delete ${pendingLocationDelete?.name ?? "location"}?`}
        message="Food stored here will be moved to another location so nothing gets lost."
        confirmLabel="Delete location"
        destructive
        busy={deletingLocation}
      />
    </div>
  );
}
