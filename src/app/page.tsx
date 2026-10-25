import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { GameCard } from "@/components/game-card";
import { LeadersBoard } from "@/components/leaders-board";
import { NewsList } from "@/components/news-list";
import { SectionHeading } from "@/components/section-heading";
import { StandingsTable } from "@/components/standings-table";
import {
  getNews,
  getPlayerLeaders,
  getScoreboard,
  getStandings,
} from "@/lib/espn";
import { formatDateLong, seasonLabel, todayIso } from "@/lib/format";

export const revalidate = 60;

export default async function HomePage() {
  const [scoreboard, standings, points, rebounds, assists, steals, blocks, threePointers, news] =
    await Promise.all([
      getScoreboard(),
      getStandings(),
      getPlayerLeaders("offensive.avgPoints", 5),
      getPlayerLeaders("general.avgRebounds", 5),
      getPlayerLeaders("offensive.avgAssists", 5),
      getPlayerLeaders("defensive.avgSteals", 5),
      getPlayerLeaders("defensive.avgBlocks", 5),
      getPlayerLeaders("offensive.avgThreePointFieldGoalsMade", 5),
      getNews(4),
    ]);

  const games = scoreboard.events ?? [];
  const conferences = standings.children ?? [];
  const season = seasonLabel(
    standings.season?.year ?? scoreboard.season?.year,
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900/70 to-zinc-950 p-6 shadow-2xl shadow-black/40 sm:p-10">
        <div className="absolute -right-16 -top-24 size-72 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-red-600/10 blur-3xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            Temporada {season} · dades actualitzades
          </span>

          <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            Tota la temporada de l&apos;NBA,{" "}
            <span className="text-orange-400">en un sol lloc.</span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Partits, classificacions i estadístiques de jugadors i equips.
            Consulta el dia a dia de la competició amb dades públiques d&apos;ESPN.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/partits"
              className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-orange-400"
            >
              Partits d&apos;avui
            </Link>
            <Link
              href="/classificacio"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-white/30 hover:bg-white/10"
            >
              Classificació
            </Link>
            <Link
              href="/jugadors"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-white/30 hover:bg-white/10"
            >
              Líders estadístics
            </Link>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wider text-zinc-500">
                Partits avui
              </dt>
              <dd className="mt-0.5 text-xl font-semibold text-white">
                {games.length}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wider text-zinc-500">
                Equips
              </dt>
              <dd className="mt-0.5 text-xl font-semibold text-white">30</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wider text-zinc-500">
                Conferències
              </dt>
              <dd className="mt-0.5 text-xl font-semibold text-white">
                {conferences.length || 2}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wider text-zinc-500">
                Data
              </dt>
              <dd className="mt-0.5 truncate text-sm font-medium text-zinc-200">
                {formatDateLong(todayIso())}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mt-12">
        <SectionHeading
          title="Partits d'avui"
          description={formatDateLong(todayIso())}
          href="/partits"
          linkLabel="Calendari"
        />
        {games.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.slice(0, 6).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Avui no hi ha partits programats"
            description="Consulta el calendari per veure els pròxims enfrontaments."
          />
        )}
      </section>

      <section className="mt-12">
        <SectionHeading
          title="Classificació"
          description="Posicions i rècord de cada conferència"
          href="/classificacio"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {conferences.map((conference) => (
            <div
              key={conference.name}
              className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4"
            >
              <h3 className="mb-1 px-1 text-sm font-semibold text-white">
                {conference.name.replace(" Conference", "")}
              </h3>
              <StandingsTable
                entries={conference.standings?.entries ?? []}
                limit={8}
                compact
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionHeading
          title="Líders estadístics"
          description="Els millors de la temporada en cada faceta"
          href="/jugadors"
          linkLabel="Tots els líders"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <LeadersBoard
            title="Punts"
            subtitle="PTS"
            response={points}
            statKey="avgPoints"
          />
          <LeadersBoard
            title="Rebots"
            subtitle="REB"
            response={rebounds}
            statKey="avgRebounds"
          />
          <LeadersBoard
            title="Assistències"
            subtitle="AST"
            response={assists}
            statKey="avgAssists"
          />
          <LeadersBoard
            title="Robatoris"
            subtitle="ROB"
            response={steals}
            statKey="avgSteals"
          />
          <LeadersBoard
            title="Taps"
            subtitle="TAP"
            response={blocks}
            statKey="avgBlocks"
          />
          <LeadersBoard
            title="Triples"
            subtitle="3PM"
            response={threePointers}
            statKey="avgThreePointFieldGoalsMade"
          />
        </div>
      </section>

      <section className="mt-12">
        <SectionHeading
          title="Últimes notícies"
          description="Actualitat de l'NBA"
          href="/noticies"
        />
        <NewsList articles={news.articles ?? []} limit={4} />
      </section>
    </div>
  );
}
