import { Link } from "react-router-dom";
import { BasketballIcon } from "./icons";

function currentSeasonLabel(): string {
  const now = new Date();
  const startYear =
    now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}–${String(startYear + 1).slice(2)}`;
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-2">
          <BasketballIcon className="mt-0.5 size-4 shrink-0 text-orange-400" />
          <span>
            NbaStats · dades públiques d&apos;ESPN · no afiliat a l&apos;NBA.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span>Temporada {currentSeasonLabel()}</span>
          <Link
            to="/dades"
            className="transition-colors hover:text-orange-400"
          >
            Dades i emmagatzematge
          </Link>
        </div>
      </div>
    </footer>
  );
}
