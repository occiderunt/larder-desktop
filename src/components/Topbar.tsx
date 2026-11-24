import { forwardRef } from "react";
import { Moon, Plus, Search, Sun } from "lucide-react";
import type { Theme, View } from "../types";

interface TopbarProps {
  view: View;
  title: string;
  subtitle: string;
  search: string;
  onSearchChange: (value: string) => void;
  onAddItem: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export const Topbar = forwardRef<HTMLInputElement, TopbarProps>(function Topbar(
  { view, title, subtitle, search, onSearchChange, onAddItem, theme, onToggleTheme },
  searchRef,
) {
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <header className="sticky top-0 z-20 flex h-[84px] shrink-0 items-center justify-between gap-6 border-b border-line bg-canvas/85 px-9 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0">
          <h1 className="truncate text-[22px] font-semibold tracking-[-0.035em] text-ink">
            {title}
          </h1>
          <p className="mt-0.5 truncate text-[12.5px] text-muted">{subtitle}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={view === "food" ? "Search your food…" : "Search everything…"}
            aria-label="Search food"
            className="h-10 w-[250px] rounded-xl border border-line bg-surface pl-10 pr-14 text-[13px] text-ink outline-none transition-all placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
            ⌘K
          </kbd>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle dark mode"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-muted transition-all hover:border-brand/40 hover:text-brand"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button
          type="button"
          onClick={onAddItem}
          aria-label="Add food"
          className="btn-primary h-10 px-4"
        >
          <Plus size={17} strokeWidth={2.3} /> <span>Add food</span>
        </button>
      </div>
    </header>
  );
});
