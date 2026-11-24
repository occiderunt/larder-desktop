import { invoke } from "@tauri-apps/api/core";
import type {
  Backup,
  Bootstrap,
  FoodItem,
  ItemInput,
  Location,
  LocationInput,
  Settings,
  SettingsInput,
} from "../types";
import { offsetISO, todayISO, uid } from "./utils";

export const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const STORAGE_KEY = "larder-preview-v1";

function sampleStore(): Bootstrap {
  const stamp = new Date().toISOString();
  const locations: Location[] = [
    ["loc-fridge", "Fridge", "fridge", "#4A9D8E", "Fresh and chilled"],
    ["loc-freezer", "Freezer", "freezer", "#6E9BD6", "Long-term storage"],
    ["loc-pantry", "Pantry", "pantry", "#C9A15B", "Dry goods and staples"],
    ["loc-counter", "Counter", "counter", "#C28072", "Within reach"],
    ["loc-spice", "Spice Rack", "spice", "#9B7FC4", "Flavour corner"],
  ].map(([id, name, icon, color, description], index) => ({
    id,
    name,
    icon,
    color,
    description,
    sortOrder: index,
    createdAt: stamp,
  }));

  const rows: [string, string, number, string, string, number, number, string][] = [
    ["Milk", "Dairy & Eggs", 1, "L", "loc-fridge", 3, -2, "Whole milk"],
    ["Free-range Eggs", "Dairy & Eggs", 12, "pcs", "loc-fridge", 14, -3, ""],
    ["Baby Spinach", "Produce", 1, "bag", "loc-fridge", 2, -1, "Wash before use"],
    ["Cheddar Cheese", "Dairy & Eggs", 250, "g", "loc-fridge", 9, -5, ""],
    ["Greek Yogurt", "Dairy & Eggs", 4, "cups", "loc-fridge", 6, -4, ""],
    ["Bananas", "Produce", 6, "pcs", "loc-counter", 5, -2, ""],
    ["Avocados", "Produce", 3, "pcs", "loc-counter", 4, -1, "Two are ripe"],
    ["Sourdough Bread", "Bakery", 1, "loaf", "loc-counter", 1, -1, ""],
    ["Chicken Breast", "Meat & Seafood", 800, "g", "loc-freezer", 21, -10, ""],
    ["Ground Beef", "Meat & Seafood", 500, "g", "loc-freezer", 0, -20, "Use today"],
    ["Frozen Berries", "Frozen", 1, "bag", "loc-freezer", 120, -30, ""],
    ["Jasmine Rice", "Pantry", 2, "kg", "loc-pantry", 365, -40, ""],
    ["Olive Oil", "Condiments", 1, "bottle", "loc-pantry", 240, -25, "Extra virgin"],
    ["Coffee Beans", "Beverages", 500, "g", "loc-pantry", 150, -12, "Medium roast"],
    ["Paprika", "Condiments", 1, "jar", "loc-spice", 300, -60, ""],
  ];

  const items: FoodItem[] = rows.map(
    ([name, category, quantity, unit, locationId, expiry, purchased, notes], index) => ({
      id: `sample-${index}`,
      name,
      category,
      quantity,
      unit,
      locationId,
      purchaseDate: offsetISO(purchased),
      expiryDate: offsetISO(expiry),
      notes: notes || null,
      createdAt: new Date(Date.now() - index * 60_000).toISOString(),
      updatedAt: stamp,
    }),
  );

  return {
    locations,
    items,
    settings: { theme: "system", expiryWarningDays: 5, sampleData: true },
  };
}

function readStore(): Bootstrap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Bootstrap;
      if (Array.isArray(parsed.locations) && Array.isArray(parsed.items)) return parsed;
    }
  } catch {
    // Ignore malformed preview data and start fresh.
  }
  const fresh = sampleStore();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

function writeStore(store: Bootstrap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function clean<T extends string | null>(value: T | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

const preview = {
  async bootstrap(): Promise<Bootstrap> {
    return readStore();
  },
  async createLocation(input: LocationInput): Promise<Location> {
    const store = readStore();
    if (!input.name.trim()) throw new Error("Give this location a name first.");
    const location: Location = {
      id: uid("loc"),
      name: input.name.trim(),
      icon: input.icon,
      color: input.color,
      description: clean(input.description),
      sortOrder: store.locations.length,
      createdAt: new Date().toISOString(),
    };
    store.locations.push(location);
    writeStore(store);
    return location;
  },
  async updateLocation(id: string, input: LocationInput): Promise<Location> {
    const store = readStore();
    const index = store.locations.findIndex((location) => location.id === id);
    if (index < 0) throw new Error("Location not found.");
    const updated: Location = {
      ...store.locations[index],
      name: input.name.trim() || store.locations[index].name,
      icon: input.icon,
      color: input.color,
      description: clean(input.description),
    };
    store.locations[index] = updated;
    writeStore(store);
    return updated;
  },
  async deleteLocation(id: string): Promise<void> {
    const store = readStore();
    if (store.locations.length <= 1) throw new Error("Keep at least one storage location.");
    const fallback = store.locations.find((location) => location.id !== id)!;
    store.items = store.items.map((item) =>
      item.locationId === id ? { ...item, locationId: fallback.id } : item,
    );
    store.locations = store.locations.filter((location) => location.id !== id);
    writeStore(store);
  },
  async reorderLocations(ids: string[]): Promise<void> {
    const store = readStore();
    store.locations = ids
      .map((id, index) => {
        const location = store.locations.find((entry) => entry.id === id);
        return location ? { ...location, sortOrder: index } : null;
      })
      .filter((location): location is Location => Boolean(location));
    writeStore(store);
  },
  async createItem(input: ItemInput): Promise<FoodItem> {
    const store = readStore();
    if (!input.name.trim()) throw new Error("Give this food a name first.");
    const stamp = new Date().toISOString();
    const item: FoodItem = {
      id: uid("item"),
      name: input.name.trim(),
      category: input.category,
      quantity: Math.max(0, input.quantity),
      unit: input.unit,
      locationId: input.locationId,
      purchaseDate: clean(input.purchaseDate),
      expiryDate: clean(input.expiryDate),
      notes: clean(input.notes),
      createdAt: stamp,
      updatedAt: stamp,
    };
    store.items.unshift(item);
    writeStore(store);
    return item;
  },
  async updateItem(id: string, input: ItemInput): Promise<FoodItem> {
    const store = readStore();
    const index = store.items.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("Food not found.");
    const updated: FoodItem = {
      ...store.items[index],
      name: input.name.trim() || store.items[index].name,
      category: input.category,
      quantity: Math.max(0, input.quantity),
      unit: input.unit,
      locationId: input.locationId,
      purchaseDate: clean(input.purchaseDate),
      expiryDate: clean(input.expiryDate),
      notes: clean(input.notes),
      updatedAt: new Date().toISOString(),
    };
    store.items[index] = updated;
    writeStore(store);
    return updated;
  },
  async deleteItem(id: string): Promise<void> {
    const store = readStore();
    store.items = store.items.filter((item) => item.id !== id);
    writeStore(store);
  },
  async updateSettings(input: SettingsInput): Promise<Settings> {
    const store = readStore();
    store.settings = {
      theme: input.theme ?? store.settings.theme,
      expiryWarningDays: Math.min(60, Math.max(1, input.expiryWarningDays ?? store.settings.expiryWarningDays)),
      sampleData: input.sampleData ?? store.settings.sampleData,
    };
    writeStore(store);
    return store.settings;
  },
  async exportData(): Promise<Backup> {
    const store = readStore();
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      ...structuredClone(store),
    };
  },
  async importData(backup: Backup): Promise<Bootstrap> {
    if (!backup.locations?.length) throw new Error("This backup has no storage locations.");
    const store = {
      locations: backup.locations,
      items: (backup.items ?? []).map((item) => ({
        ...item,
        locationId: backup.locations.some((location) => location.id === item.locationId)
          ? item.locationId
          : backup.locations[0].id,
      })),
      settings: backup.settings ?? { theme: "system", expiryWarningDays: 5, sampleData: false },
    };
    writeStore(store);
    return store;
  },
  async clearItems(): Promise<void> {
    const store = readStore();
    store.items = [];
    store.settings.sampleData = false;
    writeStore(store);
  },
  async restoreSamples(): Promise<Bootstrap> {
    const samples = sampleStore();
    const store = readStore();
    const ids = new Set(store.locations.map((location) => location.id));
    samples.locations.forEach((location) => {
      if (!ids.has(location.id)) store.locations.push(location);
    });
    store.items = samples.items;
    store.settings.sampleData = true;
    writeStore(store);
    return store;
  },
};

export const api = isTauri
  ? {
      bootstrap: () => invoke<Bootstrap>("bootstrap"),
      createLocation: (input: LocationInput) => invoke<Location>("create_location", { input }),
      updateLocation: (id: string, input: LocationInput) =>
        invoke<Location>("update_location", { id, input }),
      deleteLocation: (id: string) => invoke<void>("delete_location", { id }),
      reorderLocations: (ids: string[]) => invoke<void>("reorder_locations", { ids }),
      createItem: (input: ItemInput) => invoke<FoodItem>("create_item", { input }),
      updateItem: (id: string, input: ItemInput) =>
        invoke<FoodItem>("update_item", { id, input }),
      deleteItem: (id: string) => invoke<void>("delete_item", { id }),
      updateSettings: (input: SettingsInput) => invoke<Settings>("update_settings", { input }),
      exportData: () => invoke<Backup>("export_data"),
      importData: (backup: Backup) => invoke<Bootstrap>("import_data", { backup }),
      clearItems: () => invoke<void>("clear_items"),
      restoreSamples: () => invoke<Bootstrap>("restore_samples"),
    }
  : preview;

export function today(): string {
  return todayISO();
}
