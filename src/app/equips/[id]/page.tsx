import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamLogo } from "@/components/team-logo";
import type {
  Game,
  RosterResponse,
  ScheduleResponse,
  StandingEntry,
} from "@/lib/espn";
import {
  getStandings,
  getTeam,
  getTeamRoster,
  getTeamSchedule,
  statOf,
  statText,
} from "@/lib/espn";
import {
  cn,
  formatDateShort,
  formatTime,
  initials,
  positionLabel,
  seasonLabel,
  splitSchedule,
  winPercent,
} from "@/lib/format";

export const revalidate = 300;

type Props = {
  params: Promise<{ id: string }>;
};

function ResultRow({ game, teamId }: { game: Game; teamId: string }) {
  const competition = game.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const self = competitors.find((item) => item.team.id === teamId);
  const opponent = competitors.find((item) => item.team.id !== teamId);
  const isHome = self?.homeAway === "home";

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
      <span className="w-11 shrink-0 text-[11px] text-zinc-500">
        {formatDateShort(game.date)}
      </span>
      <span className="w-4 shrink-0 text-[11px] text-zinc-500">
        {isHome ? "vs" : "@"}
      </span>
      <TeamLogo team={opponent?.team} size={22} />
      <span className="min-w-0 flex-1 truncate text-xs text-zinc-300">
        {opponent?.team.shortDisplayName ?? opponent?.team.displayName ?? "—"}
      </span>
      <span
        className={cn(
          "rounded px-1.5 py-0.5 text-[10px] font-bold",
          self?.winner
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-red-500/15 text-red-400",
        )}
      >
        {self?.winner ? "V" : "D"}
      </span>
      <span className="shrink-0 text-xs font-semibold tabular-nums text-zinc-200">
        {self?.score ?? "—"}–{opponent?.score ?? "—"}
      </span>
    </div>
  );
}

function UpcomingRow({ game, teamId }: { game: Game; teamId: string }) {
  const competition = game.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const self = competitors.find((item) => item.team.id === teamId);
  const opponent = competitors.find((item) => item.team.id !== teamId);
  const isHome = self?.homeAway === "home";

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
      <span className="w-11 shrink-0 text-[11px] text-zinc-500">
        {formatDateShort(game.date)}
      </span>
      <span className="w-4 shrink-0 text-[11px] text-zinc-500">
        {isHome ? "vs" : "@"}
      </span>
      <TeamLogo team={opponent?.team} size={22} />
      <span className="min-w-0 flex-1 truncate text-xs text-zinc-300">
        {opponent?.team.shortDisplayName ?? opponent?.team.displayName ?? "—"}
      </span>
      <span className="shrink-0 text-xs tabular-nums text-zinc-400">
        {formatTime(game.date)}
      </span>
    </div>
  );
}

function StatsGrid({ entry }: { entry?: StandingEntry }) {
  const metrics = entry
    ? [
        { label: "Punts per partit", value: statText(entry, "avgPointsFor") },
        {
          label: "Punts encaixats",
          value: statText(entry, "avgPointsAgainst"),
        },
        { label: "Diferència", value: statText(entry, "differential") },
        {
          label: "Rècord",
          value: `${statText(entry, "wins")}–${statText(entry, "losses")}`,
        },
        {
          label: "Percentatge",
          value: winPercent(statOf(entry, "winPercent")?.value),
        },
        { label: "Ratxa", value: statText(entry, "streak") },
      ]
    : [];

  if (metrics.length === 0) return null;

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
        >
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">
            {metric.label}
          </p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">
            {metric.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export default async function EquipPage({ params }: Props) {
  const { id } = await params;

  const [team, standings, roster, schedule] = await Promise.all([
    getTeam(id).catch(() => null),
    getStandings(),
    getTeamRoster(id).catch(() => ({}) as RosterResponse),
    getTeamSchedule(id).catch(() => ({}) as ScheduleResponse),
  ]);

  if (!team) notFound();

  const conference = standings.children?.find((item) =>
    item.standings?.entries?.some((entry) => entry.team.id === id),
  );
  const entry = conference?.standings?.entries?.find(
    (item) => item.team.id === id,
  );
  const season = seasonLabel(standings.season?.year);
  const athletes = roster.athletes ?? [];
  const events = schedule.events ?? [];
  const { played, next: upcoming } = splitSchedule(events);
  const color = team.color ? `#${team.color}` : "#f97316";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <Link
        href="/equips"
        className="mb-5 inline-flex text-xs text-zinc-500 transition-colors hover:text-orange-400"
      >
        ← Tots els equips
      </Link>

      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
        {conference?.name ?? "NBA"} · Temporada {season}
      </p>

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 sm:p-8">
        <div
          className="absolute -right-16 -top-20 size-72 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: color }}
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <TeamLogo team={team} size={104} className="drop-shadow-2xl" />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
              {team.abbreviation}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {team.displayName}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {team.standingSummary ??
                (entry
                  ? `${statText(entry, "wins")}–${statText(entry, "losses")} · ${winPercent(statOf(entry, "winPercent")?.value)}`
                  : "Temporada en curs")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {statOf(entry ?? { team, stats: [] }, "playoffSeed") && (
                <span className="rounded-lg bg-white/10 px-2.5 py-1 font-semibold text-zinc-200">
                  #{statText(entry!, "playoffSeed")} {conference?.name}
                </span>
              )}
              <span className="rounded-lg bg-white/5 px-2.5 py-1 text-zinc-400">
                {athletes.length} jugadors
              </span>
            </div>
          </div>
        </div>
      </section>

      <StatsGrid entry={entry} />

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold text-white">Plantilla</h2>
          <span className="text-xs text-zinc-500">
            {athletes.length} jugadors
          </span>
        </div>

        {athletes.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/40">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-2 py-3 font-medium">Jugador</th>
                  <th className="px-2 py-3 font-medium">Posició</th>
                  <th className="px-2 py-3 text-center font-medium">Edat</th>
                  <th className="px-2 py-3 text-center font-medium">Alçada</th>
                  <th className="px-2 py-3 text-center font-medium">Pes</th>
                  <th className="px-4 py-3 text-center font-medium">Exp.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {athletes.map((athlete) => {
                  const headshot = athlete.headshot?.href;
                  return (
                    <tr
                      key={athlete.id}
                      className="transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-2.5 tabular-nums text-zinc-500">
                        {athlete.jersey ?? "—"}
                      </td>
                      <td className="px-2 py-2.5">
                        <Link
                          href={`/jugadors/${athlete.id}`}
                          className="group flex items-center gap-3"
                        >
                          {headshot ? (
                            <img
                              src={headshot}
                              alt={athlete.displayName}
                              width={30}
                              height={30}
                              className="size-[30px] rounded-full bg-white/10 object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="grid size-[30px] place-items-center rounded-full bg-white/10 text-[10px] font-semibold text-zinc-300">
                              {initials(athlete.displayName)}
                            </span>
                          )}
                          <span className="font-medium text-zinc-200 group-hover:text-white">
                            {athlete.displayName}
                          </span>
                        </Link>
                      </td>
                      <td className="px-2 py-2.5 text-zinc-400">
                        {positionLabel(athlete.position?.abbreviation)}
                      </td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-zinc-400">
                        {athlete.age ?? "—"}
                      </td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-zinc-400">
                        {athlete.displayHeight ?? "—"}
                      </td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-zinc-400">
                        {athlete.displayWeight ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center tabular-nums text-zinc-400">
                        {athlete.experience?.years
                          ? `${athlete.experience.years}`
                          : "Rookie"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 text-sm text-zinc-400">
            No hi ha informació de la plantilla disponible.
          </p>
        )}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-white">
            Últims resultats
          </h2>
          <div className="space-y-2">
            {played.length > 0 ? (
              played.map((game) => (
                <ResultRow key={game.id} game={game} teamId={team.id} />
              ))
            ) : (
              <p className="rounded-xl border border-white/10 bg-zinc-900/40 p-4 text-xs text-zinc-500">
                Encara no hi ha partits jugats.
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-white">
            Pròxims partits
          </h2>
          <div className="space-y-2">
            {upcoming.length > 0 ? (
              upcoming.map((game) => (
                <UpcomingRow key={game.id} game={game} teamId={team.id} />
              ))
            ) : (
              <p className="rounded-xl border border-white/10 bg-zinc-900/40 p-4 text-xs text-zinc-500">
                No hi ha més partits programats.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
