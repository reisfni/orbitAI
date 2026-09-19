import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

interface Settings {
  anthropicApiKey?: string;
}

const SETTINGS_DIR = path.join(process.cwd(), ".orbitai");
const SETTINGS_PATH = path.join(SETTINGS_DIR, "settings.json");

export function getSettings(): Settings {
  if (!existsSync(SETTINGS_PATH)) return {};
  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, "utf-8"));
  } catch {
    return {};
  }
}

export function saveSettings(partial: Settings): Settings {
  const current = getSettings();
  const next = { ...current, ...partial };
  mkdirSync(SETTINGS_DIR, { recursive: true });
  writeFileSync(SETTINGS_PATH, JSON.stringify(next, null, 2));
  return next;
}
