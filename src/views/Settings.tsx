import { useRef, useState } from "react";
import {
  Database,
  Download,
  Leaf,
  Monitor,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import type { Backup, Settings as AppSettings, Theme } from "../types";
import { cx } from "../lib/utils";
import { ConfirmDialog } from "../components/ConfirmDialog";

interface SettingsProps {
  settings: AppSettings;
  itemCount: number;
  locationCount: number;
  isTauri: boolean;
  onSettingsChange: (input: Partial<AppSettings>) => Promise<void>;
  onExport: () => Promise<void>;
  onImport: (backup: Backup) => Promise<void>;
  onClearItems: () => Promise<void>;
  onRestoreSamples: () => Promise<void>;
  notify: (message: string, kind?: "success" | "error") => void;
}

const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export function Settings({
  settings,
  itemCount,
  locationCount,
  isTauri,
  onSettingsChange,
  onExport,
  onImport,
  onClearItems,
  onRestoreSamples,
  notify,
}: SettingsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"clear" | "restore" | null>(null);

  const setTheme = async (theme: Theme) => {
    setBusy("theme");
    try {
      await onSettingsChange({ theme });
    } finally {
      setBusy(null);
    }
  };

  const setWarningDays = async (days: number) => {
    setBusy("days");
    try {
      await onSettingsChange({ expiryWarningDays: Math.min(60, Math.max(1, days)) });
    } finally {
      setBusy(null);
    }
  };

  const exportBackup = async () => {
    setBusy("export");
    try {
      await onExport();
    } finally {
      setBusy(null);
    }
  };

  const importBackup = async (file: File) => {
    setBusy("import");
    try {
      const text = await file.text();
      const backup = JSON.parse(text) as Backup;
      await onImport(backup);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Could not read that backup file.",
        "error",
      );
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const runConfirmed = async () => {
    const action = confirm;
    setConfirm(null);
    if (!action) return;
    setBusy(action);
    try {
      if (action === "clear") await onClearItems();
      else await onRestoreSamples();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-[900px] space-y-4 px-4 pb-10 pt-5 sm:px-6 md:space-y-5 md:pt-7 lg:px-9">
      <section className="card rounded-2xl p-6">
        <div className="mb-5">
          <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">Appearance</h3>
          <p className="mt-1 text-[12px] text-muted">Choose how Larder looks on this device.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              disabled={busy === "theme"}
              onClick={() => void setTheme(id)}
              className={cx(
                "flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all",
                settings.theme === id
                  ? "border-brand bg-brand-soft/60 text-brand shadow-sm"
                  : "border-line bg-surface-2/40 text-muted hover:border-brand/40 hover:text-ink",
              )}
            >
              <Icon size={20} strokeWidth={1.9} />
              <span className="text-[12.5px] font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card rounded-2xl p-6">
        <div className="mb-5">
          <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">Inventory preferences</h3>
          <p className="mt-1 text-[12px] text-muted">How soon should we flag food that's running out of time?</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface-2/50 p-5">
          <div className="min-w-[260px] flex-1">
            <p className="text-[13px] font-semibold text-ink">Expiry reminder window</p>
            <p className="mt-1 text-[11.5px] text-muted">
              Food within this many days is highlighted as "use soon".
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy === "days" || settings.expiryWarningDays <= 1}
              onClick={() => void setWarningDays(settings.expiryWarningDays - 1)}
              className="flex size-9 items-center justify-center rounded-xl border border-line bg-surface text-[18px] font-medium text-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
            >
              −
            </button>
            <div className="flex h-9 w-16 items-center justify-center rounded-xl border border-line bg-surface text-[15px] font-semibold text-ink">
              {settings.expiryWarningDays}
            </div>
            <button
              type="button"
              disabled={busy === "days" || settings.expiryWarningDays >= 60}
              onClick={() => void setWarningDays(settings.expiryWarningDays + 1)}
              className="flex size-9 items-center justify-center rounded-xl border border-line bg-surface text-[18px] font-medium text-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
            >
              +
            </button>
            <span className="ml-1 text-[12px] text-muted">days</span>
          </div>
        </div>
      </section>

      <section className="card rounded-2xl p-6">
        <div className="mb-5">
          <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">Your data</h3>
          <p className="mt-1 text-[12px] text-muted">
            Everything is stored locally on this device. Back it up whenever you like.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface-2/40 p-5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Download size={17} />
            </div>
            <p className="mt-4 text-[13px] font-semibold text-ink">Export a backup</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
              Save all items, locations and preferences as a JSON file.
            </p>
            <button
              type="button"
              disabled={busy === "export"}
              onClick={() => void exportBackup()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-[12px] font-semibold text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
            >
              <Download size={14} /> {busy === "export" ? "Saving…" : "Export JSON"}
            </button>
          </div>

          <div className="rounded-2xl border border-line bg-surface-2/40 p-5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#eef0fb] text-[#6d72bb]">
              <Upload size={17} />
            </div>
            <p className="mt-4 text-[13px] font-semibold text-ink">Import a backup</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
              Restore a previous backup. This replaces your current inventory.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importBackup(file);
              }}
            />
            <button
              type="button"
              disabled={busy === "import"}
              onClick={() => fileRef.current?.click()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-[12px] font-semibold text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
            >
              <Upload size={14} /> {busy === "import" ? "Restoring…" : "Choose file"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-danger/20 bg-danger-soft/30 p-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-danger-soft text-danger">
            <Trash2 size={17} />
          </div>
          <div className="min-w-[220px] flex-1">
            <p className="text-[13px] font-semibold text-ink">Start with a clean kitchen</p>
            <p className="mt-1 text-[11.5px] text-muted">
              Currently tracking {itemCount} items in {locationCount} places.
            </p>
          </div>
          <button
            type="button"
            disabled={busy === "clear"}
            onClick={() => setConfirm("clear")}
            className="rounded-xl border border-danger/30 bg-surface px-3 py-2 text-[12px] font-semibold text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-50"
          >
            Clear all food
          </button>
          <button
            type="button"
            disabled={busy === "restore"}
            onClick={() => setConfirm("restore")}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-[12px] font-semibold text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
          >
            <RotateCcw size={14} /> Restore samples
          </button>
        </div>
        {!isTauri && (
          <p className="mt-3 text-[11px] text-muted">
            Preview mode: backups are downloaded to your browser and stored locally.
          </p>
        )}
      </section>

      <section className="card flex items-center gap-4 rounded-2xl p-6">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#79d3a4] to-[#2f8a63] text-[#0c2619]">
          <Leaf size={22} />
        </div>
        <div className="flex-1">
          <p className="text-[13.5px] font-semibold text-ink">Larder v0.1.0</p>
          <p className="mt-1 text-[11.5px] text-muted">
            A calmer way to know what's in your kitchen. Built with Tauri.
          </p>
        </div>
        <Database size={17} className="text-muted/60" />
      </section>

      <ConfirmDialog
        open={confirm === "clear"}
        onClose={() => setConfirm(null)}
        onConfirm={() => void runConfirmed()}
        title="Clear all food?"
        message="Every food item will be removed. Your locations and preferences stay exactly as they are."
        confirmLabel="Clear food"
        destructive
        busy={busy === "clear"}
      />
      <ConfirmDialog
        open={confirm === "restore"}
        onClose={() => setConfirm(null)}
        onConfirm={() => void runConfirmed()}
        title="Restore sample food?"
        message="This replaces your current food items with the original sample set, so you can explore Larder again."
        confirmLabel="Restore samples"
        busy={busy === "restore"}
      />
    </div>
  );
}
