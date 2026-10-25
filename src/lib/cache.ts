import {
  clear,
  createStore,
  del,
  entries,
  get,
  keys,
  set,
  setMany,
} from "idb-keyval";
import type {
  CacheEntry,
  CacheSummary,
  Game,
  Settings,
  StorageInfo,
} from "./types";

export const cacheStore = createStore("nbastats", "cache");

export const CACHE_EVENT = "nbastats:cache-updated";

export const KEY = {
  standings: "snapshot:standings",
  scoreboard: (date: string) => `snapshot:scoreboard:${date}`,
  leaders: (category: string) => `snapshot:leaders:${category}`,
  team: (id: string) => `snapshot:team:${id}`,
  player: (id: string) => `snapshot:player:${id}`,
  game: (id: string) => `snapshot:game:${id}`,
  lastSync: "meta:lastSync",
  settings: "meta:settings",
} as const;

export const DEFAULT_SETTINGS: Settings = {
  days: 7,
  includeTeamDetails: false,
};

export function emitCacheChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CACHE_EVENT));
  }
}

export async function readEntry<T>(
  key: string,
): Promise<CacheEntry<T> | undefined> {
  return get<CacheEntry<T>>(key, cacheStore);
}

export async function writeEntry<T>(
  key: string,
  data: T,
): Promise<CacheEntry<T>> {
  const entry: CacheEntry<T> = { data, fetchedAt: Date.now() };
  await set(key, entry, cacheStore);
  emitCacheChange();
  return entry;
}

export async function removeEntry(key: string): Promise<void> {
  await del(key, cacheStore);
  emitCacheChange();
}

export async function getLastSync(): Promise<number | null> {
  const value = await get<number>(KEY.lastSync, cacheStore);
  return typeof value === "number" ? value : null;
}

export async function setLastSync(timestamp: number): Promise<void> {
  await set(KEY.lastSync, timestamp, cacheStore);
  emitCacheChange();
}

export async function getSettings(): Promise<Settings> {
  const value = await get<Settings>(KEY.settings, cacheStore);
  if (!value || typeof value !== "object") return DEFAULT_SETTINGS;

  return {
    days:
      typeof value.days === "number" && value.days >= 0 ? value.days : 7,
    includeTeamDetails: Boolean(value.includeTeamDetails),
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await set(KEY.settings, settings, cacheStore);
  emitCacheChange();
}

export async function clearCache(): Promise<void> {
  await clear(cacheStore);
  emitCacheChange();
}

export async function listKeys(): Promise<string[]> {
  const allKeys = await keys<string>(cacheStore);
  return allKeys.map(String);
}

export async function countEntries(): Promise<number> {
  const allKeys = await listKeys();
  return allKeys.filter((key) => key.startsWith("snapshot:")).length;
}

export async function cacheSummary(): Promise<CacheSummary> {
  const allKeys = await listKeys();
  const summary: CacheSummary = {
    total: 0,
    standings: 0,
    days: 0,
    leaders: 0,
    teams: 0,
    players: 0,
    games: 0,
  };

  for (const key of allKeys) {
    if (key === KEY.standings) summary.standings += 1;
    else if (key.startsWith("snapshot:scoreboard:")) summary.days += 1;
    else if (key.startsWith("snapshot:leaders:")) summary.leaders += 1;
    else if (key.startsWith("snapshot:team:")) summary.teams += 1;
    else if (key.startsWith("snapshot:player:")) summary.players += 1;
    else if (key.startsWith("snapshot:game:")) summary.games += 1;
    if (key.startsWith("snapshot:")) summary.total += 1;
  }

  return summary;
}

type CachedGameSource = {
  games?: Game[];
  schedule?: Game[];
};

export async function findCachedGame(gameId: string): Promise<Game | undefined> {
  const allKeys = await listKeys();
  const sources = allKeys.filter(
    (key) =>
      key.startsWith("snapshot:scoreboard:") ||
      key.startsWith("snapshot:team:"),
  );

  for (const key of sources) {
    const entry = await readEntry<CachedGameSource>(key);
    if (!entry) continue;

    const games = entry.data.games ?? entry.data.schedule ?? [];
    const match = games.find((game) => game.id === gameId);
    if (match) return match;
  }

  return undefined;
}

export async function getStorageInfo(): Promise<StorageInfo> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return { usage: 0, quota: 0, persisted: false };
  }

  let persisted = false;
  try {
    persisted = navigator.storage.persisted
      ? await navigator.storage.persisted()
      : false;
  } catch {
    persisted = false;
  }

  const estimate = await navigator.storage.estimate();
  return {
    usage: estimate.usage ?? 0,
    quota: estimate.quota ?? 0,
    persisted,
  };
}

export async function requestPersistence(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) {
    return false;
  }
  return navigator.storage.persist();
}

export type BackupFile = {
  app: "nbastats";
  version: 1;
  exportedAt: number;
  entries: [string, unknown][];
};

export async function exportCache(): Promise<BackupFile> {
  const allEntries = await entries<string, unknown>(cacheStore);
  return {
    app: "nbastats",
    version: 1,
    exportedAt: Date.now(),
    entries: allEntries,
  };
}

export async function importCache(raw: unknown): Promise<number> {
  if (!raw || typeof raw !== "object") {
    throw new Error("El fitxer no és un backup vàlid");
  }

  const backup = raw as Partial<BackupFile>;
  if (!Array.isArray(backup.entries)) {
    throw new Error("El fitxer no conté dades");
  }

  const valid = backup.entries.filter(
    (item): item is [string, unknown] =>
      Array.isArray(item) &&
      item.length === 2 &&
      typeof item[0] === "string" &&
      (item[0].startsWith("snapshot:") || item[0].startsWith("meta:")),
  );

  if (valid.length === 0) {
    throw new Error("No hi ha cap dada per importar");
  }

  await setMany(valid, cacheStore);
  emitCacheChange();
  return valid.length;
}
