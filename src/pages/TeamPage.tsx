import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useDownloadedGameIds, useEntry } from "@/hooks/useCache";
import { KEY } from "@/lib/cache";
import type { StandingsSnapshot, TeamDetail } from "@/lib/types";
import {
  experienceLabel,
  heightLabel,
  positionShort,
  splitSchedule,
  standingLabel,
  streakLabel,
  timeAgo,
  winPct,
} from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { TeamLogo } from "@/components/TeamLogo";
import { Badge, Spinner } from "@/components/ui";
import { DownloadIcon, RefreshIcon } from "@/components/icons";

export default function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const teamId = id ?? "";
  const { downloadTeam, openPanel, online } = useData();

  const detailState = useEntry<TeamDetail>(
    teamId ? KEY.team(teamId) : null,
  );
  const standingsState = useEntry<StandingsSnapshot>(KEY.standings);
  const downloadedGameIds = useDownloadedGameIds();
  const [busy, setBusy] = useState(false);

  const detail = detailState.data;
  const standingRow = standingsState.data
    ? [...standingsState.data.east, ...standingsState.data.west].find(
        (row) => row.team.id === teamId,
      )
    : undefined;

  const team = detail?.team ?? standingRow?.team;

  const handleDownload = async () => {
    setBusy(true);
    await downloadTeam(teamId);
    setBusy(false);
  };

  if (!teamId) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Equip no trobat"
          description="L'adreça no inclou cap identificador d'equip."
          action={
            <Link to="/equips" className="btn-secondary">
              Torna als equips
            </Link>
          }
        />
      </div>
    );
  }

  if (detailState.loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="skeleton mb-8 h-28" />
        <div className="skeleton mb-6 h-40" />
        <div className="skeleton h-96" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <PageHeader
          eyebrow="Equip"
          title={team?.name ?? "Fitxa de l'equip"}
          description="La plantilla i el calendari complet encara no són a la memòria de l'app."
        />
        <EmptyState
          title="Aquesta fitxa no s'ha descarregat"
          description={
            online
              ? "Descarrega la plantilla i el calendari d'aquest equip. És una acció manual: no es farà cap petició fins que prems el botó."
              : "Ara mateix estàs offline. Quan recuperis la connexió, podràs descarregar aquesta fitxa."
          }
          icon={<DownloadIcon className="size-6" />}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={handleDownload}
                disabled={busy || !online}
              >
                {busy ? (
                  <Spinner className="size-4" />
                ) : (
                  <DownloadIcon className="size-4" />
                )}
                Descarrega la fitxa
              </button>
              <button type="button" className="btn-secondary" onClick={openPanel}>
                <RefreshIcon className="size-4" />
                Actualitza-ho tot
              </button>
            </div>
          }
        />
        {standingRow && (
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <TeamLogo team={team} size={56} />
            <div>
              <p className="font-semibold text-white">{team?.name}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {standingRow.record.wins}V – {standingRow.record.losses}D ·{" "}
                {winPct(standingRow.record.pct)}
                {standingRow.record.seed
                  ? ` · #${standingRow.record.seed}`
                  : ""}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  const { played, next } = splitSchedule(detail.schedule, 5, 5);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="relative grid size-20 shrink-0 place-items-center rounded-2xl border border-white/10"
            style={{
              backgroundColor: detail.team.color
                ? `${detail.team.color}22`
                : undefined,
            }}
          >
            <TeamLogo team={detail.team} size={64} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
              {detail.season ? `Temporada ${detail.season}` : "Equip"}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {detail.team.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              {detail.record && (
                <span className="rounded-md bg-white/5 px-2 py-1 text-zinc-300">
                  {detail.record}
                </span>
              )}
              {detail.standing && <span>{standingLabel(detail.standing)}</span>}
              {detailState.fetchedAt && (
                <span>· desada {timeAgo(detailState.fetchedAt)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleDownload}
            disabled={busy || !online}
          >
            {busy ? (
              <Spinner className="size-4" />
            ) : (
              <RefreshIcon className="size-4" />
            )}
            Refresca la fitxa
          </button>
          <Link to="/equips" className="btn-ghost">
            Tots els equips
          </Link>
        </div>
      </div>

      {standingRow && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card-soft px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">
              Rècord
            </p>
            <p className="mt-0.5 text-xl font-semibold text-white">
              {standingRow.record.wins}–{standingRow.record.losses}
            </p>
          </div>
          <div className="card-soft px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">
              % victòries
            </p>
            <p className="mt-0.5 text-xl font-semibold text-white">
              {winPct(standingRow.record.pct)}
            </p>
          </div>
          <div className="card-soft px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">
              Posició
            </p>
            <p className="mt-0.5 text-xl font-semibold text-white">
              {standingRow.record.seed ? `#${standingRow.record.seed}` : "—"}
            </p>
          </div>
          <div className="card-soft px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">
              Ratxa
            </p>
            <p className="mt-0.5 text-xl font-semibold text-white">
              {streakLabel(standingRow.record.streak)}
            </p>
          </div>
        </div>
      )}

      <section className="card overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <h2 className="text-base font-semibold text-white">Plantilla</h2>
          <Badge tone="neutral">{detail.roster.length} jugadors</Badge>
        </header>

        {detail.roster.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Sense plantilla"
              description="La resposta d'ESPN no ha inclòs cap jugador."
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3 text-center font-medium">#</th>
                    <th className="px-2 py-3 font-medium">Jugador</th>
                    <th className="px-2 py-3 text-center font-medium">Pos.</th>
                    <th className="px-2 py-3 text-center font-medium">Edat</th>
                    <th className="px-2 py-3 text-center font-medium">Alçada</th>
                    <th className="px-2 py-3 text-center font-medium">Exp.</th>
                    <th className="px-4 py-3 font-medium">Universitat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {detail.roster.map((player) => (
                    <tr
                      key={player.id}
                      className="transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-2.5 text-center tabular-nums text-zinc-500">
                        {player.jersey ?? "—"}
                      </td>
                      <td className="px-2 py-2.5">
                        <Link
                          to={`/jugadors/${player.id}`}
                          className="flex items-center gap-3"
                        >
                          <PlayerAvatar name={player.name} size={30} />
                          <span className="font-medium text-zinc-200 hover:text-white">
                            {player.name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-2 py-2.5 text-center text-zinc-400">
                        {positionShort(player.position)}
                      </td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-zinc-400">
                        {player.age ?? "—"}
                      </td>
                      <td className="px-2 py-2.5 text-center text-zinc-400">
                        {heightLabel(player.height)}
                      </td>
                      <td className="px-2 py-2.5 text-center text-zinc-400">
                        {experienceLabel(player.experience)}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400">
                        {player.college ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-4 pb-3 pt-2 text-[11px] text-zinc-600 sm:hidden">
              Desplaça la taula horitzontalment per veure edat, alçada,
              experiència i universitat.
            </p>
          </>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-white">Calendari</h2>

        {detail.schedule.length === 0 ? (
          <EmptyState
            title="Sense partits al calendari"
            description="La resposta d'ESPN no ha inclòs cap partit per a aquest equip."
          />
        ) : (
          <div className="space-y-8">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Últims partits
              </h3>
              {played.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  Encara no s&apos;ha jugat cap partit.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {played.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      hasDetail={downloadedGameIds.has(game.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Pròxims partits
              </h3>
              {next.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  No hi ha més partits programats.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {next.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      hasDetail={downloadedGameIds.has(game.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
