import { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useEntry } from "@/hooks/useCache";
import { KEY } from "@/lib/cache";
import type {
  GameDay,
  LeaderSnapshot,
  StandingsSnapshot,
} from "@/lib/types";
import {
  formatDateLong,
  formatDateMedium,
  timeAgo,
  todayIso,
} from "@/lib/format";
import { DataMissing } from "@/components/DataMissing";
import { EmptyState } from "@/components/EmptyState";
import { GameCard } from "@/components/GameCard";
import { LeadersBoard } from "@/components/LeadersBoard";
import { SectionHeading } from "@/components/SectionHeading";
import { StandingsTable } from "@/components/StandingsTable";
import { Badge, Spinner } from "@/components/ui";
import { DownloadIcon, RefreshIcon } from "@/components/icons";

function HomeSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="skeleton h-64 rounded-3xl" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
      </div>
      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        <div className="skeleton h-80" />
        <div className="skeleton h-80" />
      </div>
    </div>
  );
}

function LeaderFallback({ title }: { title: string }) {
  return (
    <section className="card p-4">
      <h3 className="mb-2 px-1 text-sm font-semibold text-white">{title}</h3>
      <p className="px-1 py-6 text-center text-xs text-zinc-500">
        Sense dades en memòria.
      </p>
    </section>
  );
}

export default function HomePage() {
  const {
    lastSyncAt,
    openPanel,
    online,
    syncStatus,
    progress,
    downloadDay,
  } = useData();

  const today = todayIso();
  const standingsState = useEntry<StandingsSnapshot>(KEY.standings);
  const todayState = useEntry<GameDay>(KEY.scoreboard(today));
  const pointsState = useEntry<LeaderSnapshot>(KEY.leaders("punts"));
  const reboundsState = useEntry<LeaderSnapshot>(KEY.leaders("rebots"));
  const assistsState = useEntry<LeaderSnapshot>(KEY.leaders("assistencies"));

  const [busyToday, setBusyToday] = useState(false);

  const standings = standingsState.data;
  const todayGames = todayState.data;
  const running = syncStatus === "running";

  if (standingsState.loading && !lastSyncAt) {
    return <HomeSkeleton />;
  }

  const handleDownloadToday = async () => {
    setBusyToday(true);
    await downloadDay(today);
    setBusyToday(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900/70 to-zinc-950 p-6 shadow-2xl shadow-black/40 sm:p-10">
        <div className="absolute -right-16 -top-24 size-72 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-red-600/10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
              <span
                className={
                  lastSyncAt
                    ? "size-1.5 rounded-full bg-emerald-400"
                    : "size-1.5 rounded-full bg-zinc-500"
                }
              />
              {lastSyncAt
                ? `Dades de ${timeAgo(lastSyncAt)}`
                : "Encara no hi ha dades"}
            </span>
            <Badge tone={online ? "green" : "red"}>
              {online ? "En línia" : "Offline"}
            </Badge>
            {running && (
              <Badge tone="orange">
                <Spinner className="size-3" />
                {progress?.done ?? 0}/{progress?.total ?? 0}
              </Badge>
            )}
          </div>

          <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            Tota la temporada de l&apos;NBA,{" "}
            <span className="text-orange-400">disponible sense xarxa.</span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Partits, classificació i estadístiques de jugadors i equips. Les
            dades es guarden al navegador i només s&apos;actualitzen quan tu ho
            demanes.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/partits" className="btn-primary">
              Partits d&apos;avui
            </Link>
            <Link to="/classificacio" className="btn-secondary">
              Classificació
            </Link>
            <button
              type="button"
              className="btn-secondary"
              onClick={openPanel}
            >
              <RefreshIcon className="size-4" />
              Actualitza les dades
            </button>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wider text-zinc-500">
                Partits avui
              </dt>
              <dd className="mt-0.5 text-xl font-semibold text-white">
                {todayGames?.games.length ?? "—"}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wider text-zinc-500">
                Equips
              </dt>
              <dd className="mt-0.5 text-xl font-semibold text-white">
                {(standings?.east.length ?? 0) + (standings?.west.length ?? 0) ||
                  30}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wider text-zinc-500">
                Temporada
              </dt>
              <dd className="mt-0.5 truncate text-sm font-medium text-zinc-200">
                {standings?.season ?? "—"}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wider text-zinc-500">
                Data
              </dt>
              <dd className="mt-0.5 text-sm font-medium leading-snug text-zinc-200">
                <span className="sm:hidden">{formatDateMedium(today)}</span>
                <span className="hidden sm:inline">{formatDateLong(today)}</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {!standings && !standingsState.loading && (
        <section className="mt-10">
          <DataMissing
            title="Comença descarregant les dades"
            description="No hi ha cap dada a la memòria de l'app. La primera actualització necessita connexió; després podràs consultar-ho tot offline."
          />
        </section>
      )}

      <section className="mt-12">
        <SectionHeading
          title="Partits d'avui"
          description={formatDateLong(today)}
          to="/partits"
          linkLabel="Calendari"
        />

        {todayState.loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="skeleton h-32" />
            <div className="skeleton h-32" />
            <div className="skeleton h-32" />
          </div>
        ) : todayGames && todayGames.games.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {todayGames.games.slice(0, 6).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : todayGames ? (
          <EmptyState
            title="Avui no hi ha partits programats"
            description="Consulta el calendari per veure els pròxims enfrontaments."
            action={
              <Link to="/partits" className="btn-secondary">
                Obre el calendari
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="Els partits d'avui encara no són a la memòria"
            description="Pots descarregar només aquest dia o fer una actualització completa."
            action={
              <button
                type="button"
                className="btn-primary"
                onClick={handleDownloadToday}
                disabled={busyToday || !online}
              >
                {busyToday ? (
                  <Spinner className="size-4" />
                ) : (
                  <DownloadIcon className="size-4" />
                )}
                Descarrega avui
              </button>
            }
          />
        )}
      </section>

      {standings && (
        <section className="mt-12">
          <SectionHeading
            title="Classificació"
            description="Posicions i rècord de cada conferència"
            to="/classificacio"
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {(
              [
                ["Est", standings.east],
                ["Oest", standings.west],
              ] as const
            ).map(([label, rows]) => (
              <div key={label} className="card min-w-0 p-4">
                <h3 className="mb-1 px-1 text-sm font-semibold text-white">
                  {label}
                </h3>
                <StandingsTable rows={rows} limit={8} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <SectionHeading
          title="Líders estadístics"
          description="Els millors de la temporada en cada faceta"
          to="/jugadors"
          linkLabel="Tots els líders"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pointsState.data ? (
            <LeadersBoard
              title="Punts"
              subtitle="PTS"
              snapshot={pointsState.data}
              stat="avgPoints"
            />
          ) : (
            <LeaderFallback title="Punts" />
          )}
          {reboundsState.data ? (
            <LeadersBoard
              title="Rebots"
              subtitle="REB"
              snapshot={reboundsState.data}
              stat="avgRebounds"
            />
          ) : (
            <LeaderFallback title="Rebots" />
          )}
          {assistsState.data ? (
            <LeadersBoard
              title="Assistències"
              subtitle="AST"
              snapshot={assistsState.data}
              stat="avgAssists"
            />
          ) : (
            <LeaderFallback title="Assistències" />
          )}
        </div>
      </section>

      <section className="mt-12">
        <div className="card-soft p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-white">
                Com funciona aquesta app
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
                <li>
                  <span className="text-zinc-200">100% offline:</span> tot el
                  que veus s&apos;ha desat al navegador (IndexedDB).
                </li>
                <li>
                  <span className="text-zinc-200">Actualització manual:</span>{" "}
                  no es fa cap petició automàtica. Només quan prems
                  Actualitza.
                </li>
                <li>
                  <span className="text-zinc-200">Portable:</span> pots
                  exportar i importar les dades des de la pàgina Dades.
                </li>
              </ul>
            </div>
            <Link to="/dades" className="btn-secondary shrink-0">
              Gestiona les dades
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
