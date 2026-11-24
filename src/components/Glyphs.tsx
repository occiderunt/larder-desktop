import {
  Apple,
  Archive,
  Beef,
  Box,
  Coffee,
  CookingPot,
  Cookie,
  Croissant,
  FlaskConical,
  Flame,
  Layers3,
  Leaf,
  Milk,
  Package,
  Refrigerator,
  ShoppingBasket,
  Snowflake,
  Wine,
  type LucideIcon,
} from "lucide-react";
import { categoryInfo } from "../lib/utils";

const locationIcons: Record<string, LucideIcon> = {
  fridge: Refrigerator,
  freezer: Snowflake,
  pantry: Package,
  counter: CookingPot,
  spice: FlaskConical,
  cabinet: Archive,
  basket: ShoppingBasket,
  box: Box,
  wine: Wine,
  oven: Flame,
  shelf: Layers3,
  leaf: Leaf,
};

const categoryIcons: Record<string, LucideIcon> = {
  apple: Apple,
  beef: Beef,
  milk: Milk,
  croissant: Croissant,
  package: Package,
  snowflake: Snowflake,
  coffee: Coffee,
  cookie: Cookie,
  flask: FlaskConical,
  box: Box,
};

export function LocationGlyph({
  name,
  size = 20,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = locationIcons[name] ?? Box;
  return <Icon size={size} strokeWidth={1.8} className={className} />;
}

export function CategoryGlyph({
  category,
  size = 20,
  className,
}: {
  category: string;
  size?: number;
  className?: string;
}) {
  const info = categoryInfo(category);
  const Icon = categoryIcons[info.icon] ?? Box;
  return <Icon size={size} strokeWidth={1.8} className={className} />;
}
