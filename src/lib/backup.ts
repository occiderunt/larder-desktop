import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { api, isTauri } from "./data";
import { todayISO } from "./utils";

export async function exportBackup(): Promise<"cancelled" | "saved" | "downloaded"> {
  const backup = await api.exportData();
  const json = JSON.stringify(backup, null, 2);
  const filename = `larder-backup-${todayISO()}.json`;

  if (isTauri) {
    const path = await save({
      title: "Save Larder backup",
      defaultPath: filename,
      filters: [{ name: "JSON backup", extensions: ["json"] }],
    });
    if (!path) return "cancelled";
    await writeTextFile(path, json);
    return "saved";
  }

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}
