import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useCachedGame, useEntry } from "@/hooks/useCache";
import { KEY } from "@/lib/cache";
import type {
  Game,
  GameBoxTeam,
  GameDetail,
  GameSide,
  GameTeamStats,
} from "@/lib/types";
import { cn, formatDateLong, formatTime, timeAgo } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { TeamLogo } from "@/components/TeamLogo";
import { Badge, Spinner } from "@/components/ui";
import { DownloadIcon, RefreshIcon } from "@/components/icons";

const TEAM_STAT_ROWS: { key: string; label: string }[] = [
  { key: "fieldGoalsMade-fieldGoalsAttempted", label: "Tirs de camp" },
  { key: "fieldGoalPct", label: "% tirs de camp" },
  {
    key: "threePointFieldGoalsMade-threePointFieldGoalsAttempted",
    label: "Triples",
  },
  { key: "threePointFieldGoalPct", label: "% triples" },
  { key: "freeThrowsMade-freeThrowsAttempted", label: "Tirs lliures" },
  { key: "freeThrowPct", label: "% tirs lliures" },
  { key: "totalRebounds", label: "Rebots" },
  { key: "assists", label: "Assistències" },
  { key: "steals", label: "Robatoris" },
  { key: "blocks", label: "Taps" },
  { key: "turnovers", label: "Pèrdues" },
  {
    key: "turnoverPoints",
    label: "Punts concedits per pèrdues",
  },
  { key: "pointsInPaint", label: "Punts a la pintura" },
  { key: "fastBreakPoints", label: "Punts al contraatac" },
  { key: "fouls", label: "Faltes" },
  { key: "largestLead", label: "Avantatge màxim" },
];

const REASONS: Record<string, string> = {
  "coach's decision": "decisió tècnica",
  injury: "lesió",
  "personal reasons": "motius personals",
  "not with team": "no és amb l'equip",
  "league suspension": "suspensió de la lliga",
  "team suspension": "suspensió de l'equip",
  "resting": "descans",
};

function periodLabel(index: number): string {
  return index < 4 ? `${index + 1}Q` : index === 4 ? "OT" : `${index - 3}OT`;
}

function dnpReason(raw?: string): string {
  if (!raw) return "";
  return REASONS[raw.toLowerCase()] ?? raw.toLowerCase();
}

function TeamBlock({
  side,
  align,
}: {
  side: GameSide;
  align: "left" | "right";
}) {
  return (
    <Link
      to={`/equips/${side.team.id}`}
      className={cn(
        "flex min-w-0 flex-col items-center gap-2 rounded-xl px-1 py-2 text-center transition-colors hover:bg-white/[0.04]",
        align === "left"
          ? "sm:items-start sm:text-left"
          : "sm:items-end sm:text-right",
      )}
    >
      <TeamLogo team={side.team} size={56} />
      <div className="min-w-0">
        <p
          className={cn(
            "truncate text-sm font-semibold sm:text-base",
            side.winner ? "text-white" : "text-zinc-200",
          )}
        >
          <span className="sm:hidden">{side.team.shortName}</span>
          <span className="hidden sm:inline">{side.team.name}</span>
        </p>
        {side.record && (
          <p className="mt-0.5 text-[11px] tabular-nums text-zinc-500">
            {side.record}
          </p>
        )}
      </div>
    </Link>
  );
}

function ScoreHero({ game }: { game: Game }) {
  const isPre = game.state === "pre";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900/70 to-zinc-950 p-5 shadow-2xl shadow-black/40 sm:p-8">
      <div className="absolute -right-20 -top-28 size-64 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-8">
        <TeamBlock side={game.away} align="left" />

        <div className="flex min-w-14 flex-col items-center text-center">
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wider",
              game.state === "in"
                ? "text-orange-400"
                : game.state === "post"
                  ? "text-zinc-400"
                  : "text-emerald-400",
            )}
          >
            {game.statusLabel}
          </span>
          {isPre ? (
            <span className="mt-1 text-2xl font-semibold text-white">vs</span>
          ) : (
            <span className="mt-1 flex items-baseline gap-1.5 text-3xl font-semibold tabular-nums text-white sm:text-4xl">
              <span
                className={game.away.winner ? "text-white" : "text-zinc-300"}
              >
                {game.away.score ?? "—"}
              </span>
              <span className="text-lg text-zinc-600">–</span>
              <span
                className={game.home.winner ? "text-white" : "text-zinc-300"}
              >
                {game.home.score ?? "—"}
              </span>
            </span>
          )}
          {(isPre || game.state === "in") && (
            <span className="mt-1 text-[11px] text-zinc-500">
              {isPre ? formatTime(game.date) : (game.clock ?? "")}
            </span>
          )}
        </div>

        <TeamBlock side={game.home} align="right" />
      </div>
    </section>
  );
}

function QuarterTable({ game }: { game: Game }) {
  const away = game.away.linescores ?? [];
  const home = game.home.linescores ?? [];
  const periods = Math.max(away.length, home.length);
  if (periods === 0) return null;

  const rows = [
    {
      label: game.away.team.abbreviation,
      lines: away,
      total: game.away.score,
      side: game.away,
    },
    {
      label: game.home.team.abbreviation,
      lines: home,
      total: game.home.score,
      side: game.home,
    },
  ];

  return (
    <section className="card min-w-0 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <h2 className="text-base font-semibold text-white">Punts per quart</h2>
        <Badge tone="neutral">
          {periods > 4
            ? `4Q + ${periods === 5 ? "OT" : `${periods - 4}OT`}`
            : `1Q–${periodLabel(periods - 1)}`}
        </Badge>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-2.5 text-left font-medium">Equip</th>
              {Array.from({ length: periods }, (_, index) => (
                <th
                  key={index}
                  className="px-3 py-2.5 text-center font-medium tabular-nums"
                >
                  {periodLabel(index)}
                </th>
              ))}
              <th className="px-4 py-2.5 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2">
                    <TeamLogo team={row.side.team} size={20} />
                    <span
                      className={cn(
                        "font-semibold",
                        row.side.winner ? "text-white" : "text-zinc-300",
                      )}
                    >
                      {row.label}
                    </span>
                  </span>
                </td>
                {Array.from({ length: periods }, (_, index) => (
                  <td
                    key={index}
                    className="px-3 py-2.5 text-center tabular-nums text-zinc-400"
                  >
                    {row.lines[index] ?? "—"}
                  </td>
                ))}
                <td
                  className={cn(
                    "px-4 py-2.5 text-right text-base font-semibold tabular-nums",
                    row.side.winner ? "text-white" : "text-zinc-300",
                  )}
                >
                  {row.total ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function valueFor(team: GameTeamStats, key: string): string | undefined {
  return team.stats.find((stat) => stat.name === key)?.value;
}

function TeamStatsComparison({
  away,
  home,
}: {
  away: GameTeamStats;
  home: GameTeamStats;
}) {
  const rows = TEAM_STAT_ROWS.map((row) => ({
    ...row,
    away: valueFor(away, row.key),
    home: valueFor(home, row.key),
  })).filter((row) => row.away !== undefined || row.home !== undefined);

  if (rows.length === 0) return null;

  return (
    <section className="card min-w-0 p-4 sm:p-5">
      <h2 className="mb-4 text-base font-semibold text-white">
        Estadístiques d&apos;equip
      </h2>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] items-center gap-2 border-b border-white/10 pb-2">
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs font-semibold text-zinc-300">
            {away.team.abbreviation}
          </span>
          <TeamLogo team={away.team} size={22} />
        </div>
        <span className="text-center text-[10px] uppercase tracking-wider text-zinc-600">
          Estadística
        </span>
        <div className="flex items-center gap-2">
          <TeamLogo team={home.team} size={22} />
          <span className="text-xs font-semibold text-zinc-300">
            {home.team.abbreviation}
          </span>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] items-center gap-2 py-2"
          >
            <span className="text-right text-sm font-semibold tabular-nums text-white">
              {row.away ?? "—"}
            </span>
            <span className="text-center text-[11px] leading-tight text-zinc-500">
              {row.label}
            </span>
            <span className="text-left text-sm font-semibold tabular-nums text-white">
              {row.home ?? "—"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function LeadersSection({ detail }: { detail: GameDetail }) {
  if (detail.leaders.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-white">
        Líders del partit
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {detail.leaders.map((group) => (
          <div key={group.team.id} className="card min-w-0 p-4 sm:p-5">
            <Link
              to={`/equips/${group.team.id}`}
              className="flex items-center gap-3 rounded-lg pb-3 transition-colors hover:text-orange-400"
            >
              <TeamLogo team={group.team} size={32} />
              <span className="font-semibold text-white">
                {group.team.name}
              </span>
            </Link>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {group.categories.map((category) => (
                <div
                  key={category.key}
                  className="min-w-0 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-400">
                    {category.label}
                  </p>
                  <div className="mt-2 space-y-2">
                    {category.players.map((player) => (
                      <Link
                        key={`${category.key}-${player.id}`}
                        to={player.id ? `/jugadors/${player.id}` : "#"}
                        className="flex items-center gap-2 rounded-lg transition-colors hover:bg-white/5"
                      >
                        <PlayerAvatar
                          name={player.name}
                          src={player.headshot}
                          size={26}
                        />
                        <span className="min-w-0 flex-1 truncate text-xs text-zinc-300">
                          {player.name}
                        </span>
                        <span className="text-sm font-semibold tabular-nums text-white">
                          {player.value}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BoxScoreTable({
  box,
  label,
}: {
  box: GameBoxTeam;
  label: string;
}) {
  const played = box.players.filter((player) => !player.didNotPlay);
  const bench = box.players.filter((player) => player.didNotPlay);

  return (
    <section className="card min-w-0 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <Link
          to={`/equips/${box.team.id}`}
          className="flex min-w-0 items-center gap-3 transition-colors hover:text-orange-400"
        >
          <TeamLogo team={box.team} size={28} />
          <span className="truncate text-base font-semibold text-white">
            {box.team.name}
          </span>
        </Link>
        <Badge tone="neutral">{label}</Badge>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-xs">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
              <th className="sticky left-0 z-10 bg-zinc-900 px-4 py-2.5 text-left font-medium">
                Jugador
              </th>
              {box.columns.map((column) => (
                <th
                  key={column.key}
                  className="px-2 py-2.5 text-right font-medium tabular-nums"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {played.map((player) => (
              <tr key={player.id} className="transition-colors hover:bg-white/[0.03]">
                <td className="sticky left-0 z-10 bg-zinc-900 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <PlayerAvatar
                      name={player.name}
                      src={player.headshot}
                      size={24}
                    />
                    <Link
                      to={player.id ? `/jugadors/${player.id}` : "#"}
                      className="max-w-44 truncate font-medium text-zinc-200 transition-colors hover:text-orange-400"
                    >
                      {player.name}
                    </Link>
                    {player.starter && (
                      <span
                        className="rounded bg-orange-400/15 px-1 text-[9px] font-semibold text-orange-300"
                        title="Titular"
                      >
                        T
                      </span>
                    )}
                  </div>
                </td>
                {box.columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-2 py-2.5 text-right tabular-nums text-zinc-400"
                  >
                    {player.stats[column.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {box.totals && (
            <tfoot>
              <tr className="border-t border-white/15 bg-white/[0.04] font-semibold">
                <td className="sticky left-0 z-10 bg-zinc-900 px-4 py-2.5 text-white">
                  Total
                </td>
                {box.columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-2 py-2.5 text-right tabular-nums text-white"
                  >
                    {box.totals?.[column.key] || "—"}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {bench.length > 0 && (
        <p className="border-t border-white/5 px-4 py-2.5 text-[11px] text-zinc-600">
          No han jugat:{" "}
          {bench
            .map(
              (player) =>
                `${player.name}${player.reason ? ` (${dnpReason(player.reason)})` : ""}`,
            )
            .join(" · ")}
        </p>
      )}
    </section>
  );
}

function GameInfoCard({ detail }: { detail: GameDetail }) {
  const rows = [
    ["Data", formatDateLong(detail.game.date)],
    ["Hora (Madrid)", formatTime(detail.game.date)],
    ["Pavelló", detail.venue ?? detail.game.venue],
    ["Ciutat", detail.venueCity],
    [
      "Assistència",
      detail.attendance !== undefined
        ? detail.attendance.toLocaleString("ca-ES")
        : undefined,
    ],
    ["Televisió", detail.game.broadcast],
    ["Àrbitres", detail.officials.map((official) => official.name).join(" · ")],
  ].filter(([, value]) => Boolean(value)) as [string, string][];

  if (rows.length === 0) return null;

  return (
    <section className="card p-4 sm:p-5">
      <h2 className="mb-3 text-base font-semibold text-white">
        Informació del partit
      </h2>
      <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-3 border-b border-white/5 py-2 last:border-0"
          >
            <dt className="shrink-0 text-xs text-zinc-500">{label}</dt>
            <dd className="text-right text-sm text-zinc-200">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="skeleton mb-6 h-20" />
      <div className="skeleton mb-6 h-48" />
      <div className="skeleton h-96" />
    </div>
  );
}

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const gameId = id ?? "";
  const { downloadGame, online, openPanel } = useData();

  const detailState = useEntry<GameDetail>(gameId ? KEY.game(gameId) : null);
  const cachedGameState = useCachedGame(gameId || null);
  const [busy, setBusy] = useState(false);

  const detail = detailState.data;
  const game = detail?.game ?? cachedGameState.game;

  const handleDownload = async () => {
    setBusy(true);
    await downloadGame(gameId);
    setBusy(false);
  };

  if (!gameId) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Partit no trobat"
          description="L'adreça no inclou cap identificador de partit."
          action={
            <Link to="/partits" className="btn-secondary">
              Torna al calendari
            </Link>
          }
        />
      </div>
    );
  }

  if (detailState.loading || (!detail && cachedGameState.loading)) {
    return <DetailSkeleton />;
  }

  const title = game
    ? `${game.away.team.name} – ${game.home.team.name}`
    : "Detalls del partit";

  const description = game
    ? [
        formatDateLong(game.date),
        detail?.venue && detail?.venueCity
          ? `${detail.venue} · ${detail.venueCity}`
          : (detail?.venue ?? game.venue),
      ]
        .filter(Boolean)
        .join(" · ")
    : "La informació completa d'aquest enfrontament.";

  const refreshButton = (
    <button
      type="button"
      className={detail ? "btn-secondary" : "btn-primary"}
      onClick={handleDownload}
      disabled={busy || !online}
    >
      {busy ? (
        <Spinner className="size-4" />
      ) : detail ? (
        <RefreshIcon className="size-4" />
      ) : (
        <DownloadIcon className="size-4" />
      )}
      {detail ? "Refresca el partit" : "Descarrega els detalls"}
    </button>
  );

  if (!detail) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
              Detalls del partit
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">{description}</p>
          </div>
          <Link to="/partits" className="btn-ghost">
            Calendari
          </Link>
        </div>

        {game && (
          <div className="mb-8">
            <ScoreHero game={game} />
          </div>
        )}

        <EmptyState
          title="Els detalls encara no són a la memòria"
          description={
            online
              ? "Descarrega el resum del partit per veure els parcials, les estadístiques d'equip, els líders i el box score. És una acció manual: no es fa cap petició fins que prems el botó."
              : "Ara mateix estàs offline. Quan recuperis la connexió, podràs descarregar els detalls d'aquest partit."
          }
          icon={<DownloadIcon className="size-6" />}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {refreshButton}
              <button
                type="button"
                className="btn-secondary"
                onClick={openPanel}
              >
                <RefreshIcon className="size-4" />
                Actualitza-ho tot
              </button>
            </div>
          }
        />
      </div>
    );
  }

  const awayStats = detail.teamStats.find((team) => team.homeAway === "away");
  const homeStats = detail.teamStats.find((team) => team.homeAway === "home");
  const boxscore = [...detail.boxscore].sort((a, b) =>
    a.homeAway === b.homeAway ? 0 : a.homeAway === "away" ? -1 : 1,
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
            {detail.season ? `Temporada ${detail.season}` : "Partit"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
            <span>{description}</span>
            {detailState.fetchedAt && (
              <span>· desat {timeAgo(detailState.fetchedAt)}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {refreshButton}
          <Link to="/partits" className="btn-ghost">
            Calendari
          </Link>
        </div>
      </div>

      {!online && (
        <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] text-amber-200/80">
          Estàs offline: aquesta versió del partit és la que es va desar a la
          memòria.
        </p>
      )}

      <div className="space-y-6">
        <ScoreHero game={detail.game} />

        <QuarterTable game={detail.game} />

        {awayStats && homeStats && (
          <TeamStatsComparison away={awayStats} home={homeStats} />
        )}

        <LeadersSection detail={detail} />

        {boxscore.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Box score</h2>
            <div className="space-y-4">
              {boxscore.map((box) => (
                <BoxScoreTable
                  key={box.team.id}
                  box={box}
                  label={box.homeAway === "home" ? "Local" : "Visitant"}
                />
              ))}
            </div>
            <p className="mt-2 px-1 text-[11px] text-zinc-600 sm:hidden">
              Desplaça cada taula horitzontalment per veure totes les
              estadístiques. T = titular.
            </p>
          </section>
        )}

        {detail.boxscore.length === 0 &&
          detail.teamStats.length === 0 &&
          detail.leaders.length === 0 && (
            <EmptyState
              title="ESPN encara no ofereix el resum"
              description="El partit potser no s'ha jugat o el resum encara no està publicat. Torna-ho a provar més endavant."
            />
          )}

        <GameInfoCard detail={detail} />

        <p className="text-[11px] leading-relaxed text-zinc-600">
          Les dades provenen del resum d&apos;ESPN i es guarden al navegador.
          Pots tornar a descarregar-les manualment quan vulguis.
        </p>
      </div>
    </div>
  );
}
