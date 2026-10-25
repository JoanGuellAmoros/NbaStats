import { Link } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { cn, timeAgo } from "@/lib/format";
import { BasketballIcon, RefreshIcon, WifiOffIcon } from "./icons";
import { SiteNav } from "./SiteNav";
import { Spinner } from "./ui";

export function SiteHeader() {
  const {
    lastSyncAt,
    openPanel,
    syncStatus,
    progress,
    online,
    entryCount,
  } = useData();

  const running = syncStatus === "running";
  const hasData = entryCount > 0;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08090d]/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link to="/" className="order-1 flex items-center gap-3 lg:order-none">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25">
            <BasketballIcon className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Nba<span className="text-orange-400">Stats</span>
          </span>
        </Link>

        <div className="relative order-3 w-full lg:order-2 lg:ml-auto lg:w-auto">
          <SiteNav />
        </div>

        <div className="order-2 ml-auto flex items-center gap-2 lg:order-3">
          {!online && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-[11px] font-medium text-red-300">
              <WifiOffIcon className="size-3.5" />
              <span className="hidden sm:inline">Offline</span>
            </span>
          )}

          <button
            type="button"
            onClick={openPanel}
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/10"
            title="Actualitza les dades manualment"
          >
            <span className="relative grid size-4 place-items-center">
              {running ? (
                <Spinner className="size-3.5 text-orange-400" />
              ) : (
                <RefreshIcon
                  className={cn(
                    "size-4",
                    hasData ? "text-emerald-400" : "text-zinc-400",
                  )}
                />
              )}
              {!running && (
                <span
                  className={cn(
                    "absolute -right-1 -top-1 size-1.5 rounded-full",
                    !online
                      ? "bg-red-400"
                      : hasData
                        ? "bg-emerald-400"
                        : "bg-zinc-500",
                  )}
                />
              )}
            </span>
            <span className="hidden sm:inline">
              {running
                ? `${progress?.done ?? 0}/${progress?.total ?? 0}`
                : lastSyncAt
                  ? timeAgo(lastSyncAt)
                  : "Actualitza"}
            </span>
            <span className="sm:hidden">{running ? "…" : "Actualitza"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
