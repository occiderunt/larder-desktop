# Larder

A polished, local-first food inventory for a house. Built with **Tauri 2**, **React + TypeScript**, **Tailwind CSS 4**, and **SQLite** (via Rust). All data stays on your device.

## Highlights

- **Beautiful desktop UI** — a calm green design system with light, dark, and system themes.
- **Custom storage locations** — rename any location, pick an icon and colour, add your own, drag to reorder, and delete safely (food is moved elsewhere, never lost).
- **Effortless food tracking** — quick add, inline editing, amount/unit, purchase and best-before dates, notes, and one-click "mark as used" with undo.
- **Expiry awareness** — a dashboard of what needs attention, grouped expiring view, and a configurable reminder window.
- **Search and filters** — filter by location and category, sort by expiry/name/recency/amount, and switch between grid and list views.
- **Backup and restore** — export a JSON backup or import one from Settings.
- **Keyboard friendly** — `⌘/Ctrl + K` focuses search, `⌘/Ctrl + N` opens the add-food dialog.
- **Preview mode** — `npm run dev` runs the same UI in a browser using local storage, so you can explore without building the native app.

## Project layout

```text
src/                  React frontend
  components/         Reusable UI (modals, cards, sidebar, toasts)
  views/              Overview, Food, Locations, Expiring, Settings
  lib/data.ts         Typed Tauri command wrappers + browser preview store
  lib/backup.ts       JSON export helper
src-tauri/            Rust backend
  src/db.rs           SQLite schema, migrations, first-run sample data
  src/commands.rs     Tauri commands for all data operations
  capabilities/       Desktop permissions
  icons/              App icons (generated from icon-source.png)
```

## Development

Prerequisites: Node.js 20+, Rust, and the [Tauri desktop prerequisites](https://v2.tauri.app/start/prerequisites/).

```bash
npm install
npm run tauri:dev      # native app with hot reload
npm run dev            # browser preview only (http://localhost:1420)
npm run build          # typecheck + production frontend build
npm run tauri:build    # native installers
```

Data is stored in the OS app-data directory in `larder.sqlite`. The first launch creates five sample locations and a small set of sample food items; clear them from the dashboard banner or Settings when you're ready.

To regenerate app icons after editing `icon-source.png`:

```bash
npx tauri icon icon-source.png
```
