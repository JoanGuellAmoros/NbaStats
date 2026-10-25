import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CACHE_EVENT,
  DEFAULT_SETTINGS,
  clearCache,
  countEntries,
  exportCache,
  getLastSync,
  getSettings,
  getStorageInfo,
  importCache,
  requestPersistence as requestPersistentStorage,
  saveSettings as persistSettings,
} from "@/lib/cache";
import { errorMessage, todayIso } from "@/lib/format";
import {
  downloadDay as syncDay,
  downloadGame as syncGame,
  downloadPlayer as syncPlayer,
  downloadTeam as syncTeam,
  runSync,
} from "@/lib/sync";
import type {
  Settings,
  StorageInfo,
  SyncError,
  SyncProfile,
  SyncProgress,
  SyncStatus,
} from "@/lib/types";

export type ToastTone = "info" | "success" | "error";

export type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type DataContextValue = {
  online: boolean;
  lastSyncAt: number | null;
  settings: Settings;
  updateSettings: (settings: Settings) => Promise<void>;
  syncStatus: SyncStatus;
  progress: SyncProgress | null;
  syncErrors: SyncError[];
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  startSync: (profile?: SyncProfile) => Promise<void>;
  cancelSync: () => void;
  downloadDay: (date: string) => Promise<boolean>;
  downloadTeam: (teamId: string) => Promise<boolean>;
  downloadPlayer: (playerId: string) => Promise<boolean>;
  downloadGame: (gameId: string) => Promise<boolean>;
  downloadGames: (
    gameIds: string[],
    onProgress?: (done: number, total: number) => void,
  ) => Promise<void>;
  clearAll: () => Promise<void>;
  exportBackup: () => Promise<void>;
  importBackup: (file: File) => Promise<number>;
  storage: StorageInfo | null;
  refreshStorage: () => Promise<void>;
  entryCount: number;
  requestPersistence: () => Promise<void>;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  notify: (message: string, tone?: ToastTone) => void;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [syncErrors, setSyncErrors] = useState<SyncError[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [entryCount, setEntryCount] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const controllerRef = useRef<AbortController | null>(null);
  const toastIdRef = useRef(0);

  const notify = useCallback((message: string, tone: ToastTone = "info") => {
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    setToasts((previous) => [...previous.slice(-2), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const refreshMeta = useCallback(async () => {
    const [lastSync, count, storageInfo] = await Promise.all([
      getLastSync(),
      countEntries(),
      getStorageInfo(),
    ]);
    setLastSyncAt(lastSync);
    setEntryCount(count);
    setStorage(storageInfo);
  }, []);

  useEffect(() => {
    refreshMeta().catch(() => undefined);

    getSettings()
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_SETTINGS));
  }, [refreshMeta]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    let timer: number | undefined;

    const handleCacheChange = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        refreshMeta().catch(() => undefined);
      }, 350);
    };

    window.addEventListener(CACHE_EVENT, handleCacheChange);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(CACHE_EVENT, handleCacheChange);
    };
  }, [refreshMeta]);

  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  const cancelSync = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  const startSync = useCallback(
    async (profile?: SyncProfile) => {
      if (controllerRef.current) return;

      if (!online) {
        notify(
          "No hi ha connexió. Les dades que ja tens a la memòria segueixen disponibles.",
          "error",
        );
        return;
      }

      const activeProfile = profile ?? settings;
      setSettings(activeProfile);
      await persistSettings(activeProfile).catch(() => undefined);

      const controller = new AbortController();
      controllerRef.current = controller;
      setSyncStatus("running");
      setSyncErrors([]);
      setProgress({ total: 0, done: 0, label: "Preparant…" });

      try {
        const result = await runSync(
          activeProfile,
          { onProgress: setProgress },
          controller.signal,
        );

        setSyncErrors(result.errors);

        if (result.cancelled) {
          setSyncStatus("cancelled");
          notify(
            "Sincronització cancel·lada. S'han conservat les dades anteriors.",
            "info",
          );
        } else if (result.errors.length > 0) {
          setSyncStatus("error");
          notify(
            `Actualitzats ${result.ok} blocs. N'han fallat ${result.failed}.`,
            "error",
          );
        } else {
          setSyncStatus("done");
          notify("Dades actualitzades correctament.", "success");
        }
      } catch (error) {
        setSyncStatus("error");
        notify(errorMessage(error), "error");
      } finally {
        controllerRef.current = null;
        await refreshMeta().catch(() => undefined);
      }
    },
    [online, settings, notify, refreshMeta],
  );

  const downloadDay = useCallback(
    async (date: string) => {
      if (!online) {
        notify(
          "Sense connexió no es poden descarregar dades noves.",
          "error",
        );
        return false;
      }

      try {
        await syncDay(date);
        notify(`Partits del ${date} desats a la memòria.`, "success");
        return true;
      } catch (error) {
        notify(errorMessage(error), "error");
        return false;
      }
    },
    [online, notify],
  );

  const downloadTeam = useCallback(
    async (teamId: string) => {
      if (!online) {
        notify(
          "Sense connexió no es poden descarregar dades noves.",
          "error",
        );
        return false;
      }

      try {
        await syncTeam(teamId);
        notify("Fitxa de l'equip desada a la memòria.", "success");
        return true;
      } catch (error) {
        notify(errorMessage(error), "error");
        return false;
      }
    },
    [online, notify],
  );

  const downloadPlayer = useCallback(
    async (playerId: string) => {
      if (!online) {
        notify(
          "Sense connexió no es poden descarregar dades noves.",
          "error",
        );
        return false;
      }

      try {
        await syncPlayer(playerId);
        notify("Fitxa del jugador desada a la memòria.", "success");
        return true;
      } catch (error) {
        notify(errorMessage(error), "error");
        return false;
      }
    },
    [online, notify],
  );

  const downloadGame = useCallback(
    async (gameId: string) => {
      if (!online) {
        notify(
          "Sense connexió no es poden descarregar dades noves.",
          "error",
        );
        return false;
      }

      try {
        await syncGame(gameId);
        notify("Detalls del partit desats a la memòria.", "success");
        return true;
      } catch (error) {
        notify(errorMessage(error), "error");
        return false;
      }
    },
    [online, notify],
  );

  const downloadGames = useCallback(
    async (
      gameIds: string[],
      onProgress?: (done: number, total: number) => void,
    ) => {
      const unique = [...new Set(gameIds.filter(Boolean))];
      if (unique.length === 0) return;

      if (!online) {
        notify(
          "Sense connexió no es poden descarregar dades noves.",
          "error",
        );
        return;
      }

      let cursor = 0;
      let done = 0;
      let ok = 0;
      const errors: string[] = [];
      onProgress?.(0, unique.length);

      const workers = Array.from(
        { length: Math.min(4, unique.length) },
        async () => {
          while (true) {
            const index = cursor;
            cursor += 1;
            if (index >= unique.length) return;

            try {
              await syncGame(unique[index]);
              ok += 1;
            } catch (error) {
              errors.push(errorMessage(error));
            }

            done += 1;
            onProgress?.(done, unique.length);
          }
        },
      );

      await Promise.all(workers);

      if (errors.length > 0) {
        notify(
          `S'han desat ${ok} de ${unique.length} detalls. N'han fallat ${errors.length}.`,
          "error",
        );
      } else {
        notify(
          `${ok} detalls de partit desats a la memòria.`,
          "success",
        );
      }
    },
    [online, notify],
  );

  const updateSettings = useCallback(async (next: Settings) => {
    setSettings(next);
    await persistSettings(next);
  }, []);

  const clearAll = useCallback(async () => {
    await clearCache();
    await refreshMeta();
    setSyncStatus("idle");
    setProgress(null);
    setSyncErrors([]);
    notify("Totes les dades desades s'han esborrat.", "success");
  }, [notify, refreshMeta]);

  const exportBackup = useCallback(async () => {
    try {
      const backup = await exportCache();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nbastats-${todayIso()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notify("Backup exportat correctament.", "success");
    } catch (error) {
      notify(errorMessage(error), "error");
    }
  }, [notify]);

  const importBackup = useCallback(
    async (file: File) => {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
      const imported = await importCache(raw);
      await refreshMeta();
      notify(`${imported} blocs importats a la memòria.`, "success");
      return imported;
    },
    [notify, refreshMeta],
  );

  const refreshStorage = useCallback(async () => {
    setStorage(await getStorageInfo());
  }, []);

  const requestPersistence = useCallback(async () => {
    const persisted = await requestPersistentStorage().catch(() => false);
    await refreshStorage();
    notify(
      persisted
        ? "Emmagatzematge persistent activat."
        : "El navegador no ha concedit l'emmagatzematge persistent.",
      persisted ? "success" : "info",
    );
  }, [notify, refreshStorage]);

  const value = useMemo<DataContextValue>(
    () => ({
      online,
      lastSyncAt,
      settings,
      updateSettings,
      syncStatus,
      progress,
      syncErrors,
      panelOpen,
      openPanel,
      closePanel,
      startSync,
      cancelSync,
      downloadDay,
      downloadTeam,
      downloadPlayer,
      downloadGame,
      downloadGames,
      clearAll,
      exportBackup,
      importBackup,
      storage,
      refreshStorage,
      entryCount,
      requestPersistence,
      toasts,
      dismissToast,
      notify,
    }),
    [
      online,
      lastSyncAt,
      settings,
      updateSettings,
      syncStatus,
      progress,
      syncErrors,
      panelOpen,
      openPanel,
      closePanel,
      startSync,
      cancelSync,
      downloadDay,
      downloadTeam,
      downloadPlayer,
      downloadGame,
      downloadGames,
      clearAll,
      exportBackup,
      importBackup,
      storage,
      refreshStorage,
      entryCount,
      requestPersistence,
      toasts,
      dismissToast,
      notify,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData s'ha d'usar dins de DataProvider");
  }
  return context;
}
