export type View = "overview" | "food" | "locations" | "expiring" | "settings";
export type Theme = "light" | "dark" | "system";

export interface Location {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  locationId: string;
  purchaseDate: string | null;
  expiryDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  theme: Theme;
  expiryWarningDays: number;
  sampleData: boolean;
}

export interface SettingsInput {
  theme?: Theme;
  expiryWarningDays?: number;
  sampleData?: boolean;
}

export interface Bootstrap {
  locations: Location[];
  items: FoodItem[];
  settings: Settings;
}

export interface LocationInput {
  name: string;
  icon: string;
  color: string;
  description: string | null;
}

export interface ItemInput {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  locationId: string;
  purchaseDate: string | null;
  expiryDate: string | null;
  notes: string | null;
}

export interface Backup {
  version: number;
  exportedAt: string;
  locations: Location[];
  items: FoodItem[];
  settings: Settings;
}

export type ExpiryState = "expired" | "soon" | "fresh" | "unknown";
