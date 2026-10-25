import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { GameCard } from "@/components/game-card";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { getScoreboard } from "@/lib/espn";
import {
  espnDate,
  formatDateLong,
  isValidIsoDate,
  shiftIsoDate,
  todayIso,
} from "@/lib/format";

export const revalidate = 60;

type Props = {
  searchParams: Promise<{ data?: string | string[] }>;
};

export default async function PartitsPage({ searchParams }: Props) {
  const params = await searchParams;
  const requested = Array.isArray(params.data) ? params.data[0] : params.data;
  const date = requested && isValidIsoDate(requested) ? requested : todayIso();

  const scoreboard = await getScoreboard(espnDate(date));
  const games = scoreboard.events ?? [];
  const previous = shiftIsoDate(date, -1);
  const next = shiftIsoDate(date, 1);
  const isToday = date === todayIso();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <PageHeader
        eyebrow="Calendari"
        title="Partits"
        description={formatDateLong(`${date}T12:00:00Z`)}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={{ pathname: "/partits", query: { data: previous } }}
              aria-label="Dia anterior"
              className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:bg-white/10"
            >
              <ChevronLeftIcon className="size-4" />
            </Link>
            <Link
              href="/partits"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/10"
            >
              Avui
            </Link>
            <Link
              href={{ pathname: "/partits", query: { data: next } }}
              aria-label="Dia següent"
              className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:bg-white/10"
            >
              <ChevronRightIcon className="size-4" />
            </Link>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-2 text-xs text-zinc-500">
        <span className="rounded-md bg-white/5 px-2 py-1 text-zinc-300">
          {games.length} {games.length === 1 ? "partit" : "partits"}
        </span>
        {isToday && <span>· jornada d&apos;avui</span>}
      </div>

      {games.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No hi ha partits aquest dia"
          description="Prova un altre dia amb les fletxes de navegació."
        />
      )}
    </div>
  );
}
