import { useEffect, useState } from "react";
import { useData } from "@/context/DataContext";
import { cn, formatDateTime } from "@/lib/format";
import {
  AlertIcon,
  CheckIcon,
  ClockIcon,
  RefreshIcon,
  WifiOffIcon,
  XIcon,
} from "./icons";
import { Spinner } from "./ui";

const DAY_OPTIONS = [0, 3, 7, 14, 30];

export function SyncControls({ showMeta = true }: { showMeta?: boolean }) {
  const {
    online,
    settings,
    updateSettings,
    startSync,
    cancelSync,
    syncStatus,
    progress,
    syncErrors,
    lastSyncAt,
  } = useData();

  const [days, setDays] = useState(settings.days);
  const [includeTeamDetails, setIncludeTeamDetails] = useState(
    settings.includeTeamDetails,
  );

  useEffect(() => {
    setDays(settings.days);
    setIncludeTeamDetails(settings.includeTeamDetails);
  }, [settings]);

  const running = syncStatus === "running";
  const percent =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.done / progress.total) * 100))
      : 0;

  const handleStart = async () => {
    const profile = { days, includeTeamDetails };
    await updateSettings(profile);
    await startSync(profile);
  };

  return (
    <div className="space-y-5">
      {showMeta && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            {lastSyncAt
              ? `Última actualització: ${formatDateTime(lastSyncAt)}`
              : "Mai s'han descarregat dades"}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5",
              online ? "text-emerald-400" : "text-red-400",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                online ? "bg-emerald-400" : "bg-red-400",
              )}
            />
            {online ? "En línia" : "Offline"}
          </span>
        </div>
      )}

      {!online && (
        <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs leading-relaxed text-red-300">
          <WifiOffIcon className="mt-0.5 size-4 shrink-0" />
          <p>
            No hi ha connexió. Les dades que ja tens desades es poden
            consultar, però no se'n poden descarregar de noves.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-zinc-300">
            Marcadors al voltant d&apos;avui
          </span>
          <select
            className="field mt-1.5"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            disabled={running}
          >
            {DAY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 0 ? "Només avui" : `±${option} dies`}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[11px] text-zinc-600">
            {2 * days + 1} dies de calendari en total.
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-orange-500"
            checked={includeTeamDetails}
            onChange={(event) => setIncludeTeamDetails(event.target.checked)}
            disabled={running}
          />
          <span>
            <span className="block text-xs font-medium text-zinc-200">
              Detalls dels 30 equips
            </span>
            <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-500">
              Plantilles i calendaris complets. Afegeix unes 60 peticions i pot
              trigar una estona.
            </span>
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {running ? (
          <>
            <button type="button" className="btn-secondary" onClick={cancelSync}>
              <XIcon className="size-4" />
              Cancel·la
            </button>
            <span className="inline-flex items-center gap-2 text-xs text-zinc-400">
              <Spinner className="size-3.5 text-orange-400" />
              Descarregant…
            </span>
          </>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={handleStart}
            disabled={!online}
          >
            <RefreshIcon className="size-4" />
            Actualitza ara
          </button>
        )}
      </div>

      {running && (
        <div className="card-soft p-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="truncate text-zinc-300">
              {progress?.label ?? "Preparant…"}
            </span>
            <span className="shrink-0 tabular-nums text-zinc-500">
              {progress?.done ?? 0}/{progress?.total ?? 0}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "h-full rounded-full bg-orange-500 transition-[width] duration-300",
                progress?.total ? "" : "animate-pulse",
              )}
              style={{ width: `${Math.max(percent, 4)}%` }}
            />
          </div>
        </div>
      )}

      {!running && syncStatus === "done" && syncErrors.length === 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-300">
          <CheckIcon className="size-4 shrink-0" />
          Totes les dades seleccionades s&apos;han actualitzat correctament.
        </div>
      )}

      {!running && syncStatus === "cancelled" && (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-300">
          <XIcon className="size-4 shrink-0" />
          Sincronització cancel·lada. Les dades anteriors s&apos;han conservat.
        </div>
      )}

      {syncErrors.length > 0 && (
        <details className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-200">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-red-300">
            <AlertIcon className="size-4 shrink-0" />
            {syncErrors.length}{" "}
            {syncErrors.length === 1 ? "error" : "errors"} durant la
            sincronització
          </summary>
          <ul className="mt-2 space-y-1.5 pl-6">
            {syncErrors.map((error) => (
              <li key={`${error.label}-${error.message}`}>
                <span className="font-medium">{error.label}:</span>{" "}
                <span className="text-red-300/80">{error.message}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-[11px] leading-relaxed text-zinc-600">
        Aquesta app no fa cap petició automàtica. Els recursos de la interfície
        (i les imatges que ja has vist) els cacheja el navegador perquè
        l&apos;app funcioni offline.
      </p>
    </div>
  );
}
