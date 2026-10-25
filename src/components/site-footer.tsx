import { BasketballIcon } from "./icons";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <BasketballIcon className="size-4 text-orange-400" />
          <span>
            NbaStats · dades públiques d&apos;ESPN · no affilat a l&apos;NBA.
          </span>
        </div>
        <span>Temporada {new Date().getFullYear()}–{String(new Date().getFullYear() + 1).slice(2)}</span>
      </div>
    </footer>
  );
}
