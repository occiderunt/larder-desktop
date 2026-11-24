import type { ExpiryState, FoodItem } from "../types";

export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function offsetISO(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function parseISO(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function daysUntil(value: string | null): number | null {
  if (!value) return null;
  const target = parseISO(value);
  const today = parseISO(todayISO());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function expiryState(item: FoodItem, warningDays: number): ExpiryState {
  const days = daysUntil(item.expiryDate);
  if (days === null) return "unknown";
  if (days < 0) return "expired";
  if (days <= warningDays) return "soon";
  return "fresh";
}

export function formatQuantity(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1).replace(/\.0$/, "");
}

export function formatDate(value: string | null, style: "short" | "long" = "short"): string {
  if (!value) return "No date";
  const date = parseISO(value);
  return date.toLocaleDateString("en-US", {
    month: style === "short" ? "short" : "long",
    day: "numeric",
    ...(style === "long" ? { year: "numeric" } : {}),
  });
}

export function expiryLabel(item: FoodItem, warningDays: number): string {
  const days = daysUntil(item.expiryDate);
  if (days === null) return "No expiry";
  if (days < 0) return days === -1 ? "Expired yesterday" : `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Use today";
  if (days === 1) return "Use tomorrow";
  if (days <= warningDays) return `${days} days left`;
  return formatDate(item.expiryDate);
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function longDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export const CATEGORIES = [
  { name: "Produce", icon: "apple", color: "#39996A" },
  { name: "Meat & Seafood", icon: "beef", color: "#C26161" },
  { name: "Dairy & Eggs", icon: "milk", color: "#C6953C" },
  { name: "Bakery", icon: "croissant", color: "#C67D43" },
  { name: "Pantry", icon: "package", color: "#8A72C4" },
  { name: "Frozen", icon: "snowflake", color: "#4C8FC7" },
  { name: "Beverages", icon: "coffee", color: "#3F9CA3" },
  { name: "Snacks", icon: "cookie", color: "#C08A4B" },
  { name: "Condiments", icon: "flask", color: "#7A9A56" },
  { name: "Other", icon: "box", color: "#7C8A85" },
] as const;

export const UNITS = [
  "pcs",
  "g",
  "kg",
  "ml",
  "L",
  "cups",
  "packs",
  "bag",
  "bottle",
  "jar",
  "loaf",
  "can",
  "bunch",
  "box",
] as const;

export const LOCATION_ICONS = [
  "fridge",
  "freezer",
  "pantry",
  "counter",
  "spice",
  "cabinet",
  "basket",
  "box",
  "wine",
  "oven",
  "shelf",
  "leaf",
] as const;

export const LOCATION_COLORS = [
  "#4A9D8E",
  "#6E9BD6",
  "#C9A15B",
  "#C28072",
  "#9B7FC4",
  "#5E9C6E",
  "#C0879E",
  "#6F8DA8",
  "#B0894E",
  "#7C8A85",
];

export function categoryInfo(name: string) {
  return CATEGORIES.find((category) => category.name === name) ?? CATEGORIES[CATEGORIES.length - 1];
}
