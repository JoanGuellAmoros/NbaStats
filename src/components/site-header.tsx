import Link from "next/link";
import { BasketballIcon } from "./icons";
import { SiteNav } from "./site-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08090d]/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25">
            <BasketballIcon className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Nba<span className="text-orange-400">Stats</span>
          </span>
        </Link>

        <SiteNav />

        <div className="ml-auto hidden items-center gap-2 text-xs text-zinc-400 xl:flex">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
          Dades actualitzades
        </div>
      </div>
    </header>
  );
}
