import { Link, useSearchParams } from "react-router-dom";
import { LEADER_CATEGORIES } from "@/lib/sync";
import { cn, decimal, integer, percent } from "@/lib/format";
import { useAggregatedPlayers } from "@/hooks/useAggregatedPlayers";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { TeamLogo } from "@/components/TeamLogo";
import { Badge } from "@/components/ui";
import { DownloadIcon } from "@/components/icons";

type Mode = "avg" | "total";

type PlayerCategory = {
  key: string;
  label: string;
  stat: string;
};

const LOCAL_CATEGORIES: PlayerCategory[] = [
  {
    key: "tirs-2",
    label: "Tirs de 2",
    stat: "avgTwoPointFieldGoalsMade",
  },
  {
    key: "tirs-lliures",
    label: "Tirs lliures",
    stat: "avgFreeThrowsMade",
  },
  {
    key: "rebots-ofensius",
    label: "Rebots ofensius",
    stat: "avgOffensiveRebounds",
  },
  {
    key: "rebots-defensius",
    label: "Rebots defensius",
    stat: "avgDefensiveRebounds",
  },
  {
    key: "valoracio",
    label: "Valoració",
    stat: "avgValuation",
  },
];

const PLAYER_CATEGORIES: PlayerCategory[] = [
  ...LEADER_CATEGORIES.map(({ key, label, stat }) => ({ key, label, stat })),
  ...LOCAL_CATEGORIES,
];

function playerCategory(key?: string | null): PlayerCategory {
  return (
    PLAYER_CATEGORIES.find((item) => item.key === key) ?? PLAYER_CATEGORIES[0]
  );
}

type Column = {
  key: string;
  totalKey?: string;
  label: string;
  format: (value: number | undefined, mode: Mode) => string;
};

const count = (value: number | undefined, mode: Mode) =>
  mode === "total" ? integer(value) : decimal(value);

const COLUMNS: Column[] = [
  { key: "gamesPlayed", label: "PJ", format: (value) => integer(value) },
  {
    key: "avgMinutes",
    totalKey: "totalMinutes",
    label: "MIN",
    format: count,
  },
  {
    key: "avgPoints",
    totalKey: "totalPoints",
    label: "PTS",
    format: count,
  },
  {
    key: "avgRebounds",
    totalKey: "totalRebounds",
    label: "REB",
    format: count,
  },
  {
    key: "avgAssists",
    totalKey: "totalAssists",
    label: "AST",
    format: count,
  },
  {
    key: "avgValuation",
    totalKey: "totalValuation",
    label: "VAL",
    format: count,
  },
  {
    key: "avgTwoPointFieldGoalsMade",
    totalKey: "totalTwoPointFieldGoalsMade",
    label: "2PM",
    format: count,
  },
  {
    key: "avgThreePointFieldGoalsMade",
    totalKey: "totalThreePointFieldGoalsMade",
    label: "3PM",
    format: count,
  },
  {
    key: "avgFreeThrowsMade",
    totalKey: "totalFreeThrowsMade",
    label: "TLM",
    format: count,
  },
  {
    key: "avgOffensiveRebounds",
    totalKey: "totalOffensiveRebounds",
    label: "RO",
    format: count,
  },
  {
    key: "avgDefensiveRebounds",
    totalKey: "totalDefensiveRebounds",
    label: "RD",
    format: count,
  },
  {
    key: "avgSteals",
    totalKey: "totalSteals",
    label: "ROB",
    format: count,
  },
  {
    key: "avgBlocks",
    totalKey: "totalBlocks",
    label: "TAP",
    format: count,
  },
  {
    key: "fieldGoalPct",
    label: "TC%",
    format: (value) => percent(value),
  },
  {
    key: "threePointFieldGoalPct",
    label: "3P%",
    format: (value) => percent(value),
  },
];

const MODES: { key: Mode; label: string }[] = [
  { key: "avg", label: "Mitjanes" },
  { key: "total", label: "Totals" },
];

export default function PlayersPage() {
  const [params] = useSearchParams();
  const category = playerCategory(params.get("ordre"));
  const mode: Mode = params.get("mode") === "total" ? "total" : "avg";
  const { players, games, loading } = useAggregatedPlayers();

  const sortKey =
    mode === "total" ? category.stat.replace(/^avg/, "total") : category.stat;

  const ranked = [...players].sort(
    (a, b) =>
      (b.stats[sortKey] ?? -1) - (a.stats[sortKey] ?? -1) ||
      a.name.localeCompare(b.name),
  );

  const modeHref = (next: Mode) =>
    `/jugadors?ordre=${category.key}${next === "total" ? "&mode=total" : ""}`;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <PageHeader
        eyebrow="Estadístiques individuals"
        title="Jugadors"
        description={
          games > 0
            ? `Tots els jugadors amb minuts, calculats amb els boxscores de ${games} ${
                games === 1 ? "partit descarregat" : "partits descarregats"
              }. Aquesta pantalla no fa cap descàrrega.`
            : "Les estadístiques es calculen amb els boxscores dels partits que hagis descarregat. Aquesta pantalla no fa cap descàrrega."
        }
        action={
          games > 0 ? (
            <Badge tone="neutral">
              {games} {games === 1 ? "partit" : "partits"}
            </Badge>
          ) : undefined
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {PLAYER_CATEGORIES.map((item) => (
            <Link
              key={item.key}
              to={`/jugadors?ordre=${item.key}${
                mode === "total" ? "&mode=total" : ""
              }`}
              className={cn(
                "whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                item.key === category.key
                  ? "bg-orange-500 text-black"
                  : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div
          className="inline-flex rounded-xl border border-white/10 bg-white/5 p-0.5 text-xs font-semibold"
          role="group"
          aria-label="Mostra mitjanes o totals"
        >
          {MODES.map((item) => (
            <Link
              key={item.key}
              to={modeHref(item.key)}
              data-mode={item.key}
              aria-current={mode === item.key ? "page" : undefined}
              className={cn(
                "rounded-[10px] px-3 py-2 transition-colors",
                mode === item.key
                  ? "bg-orange-500 text-black"
                  : "text-zinc-300 hover:bg-white/10",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-[32rem]" />
      ) : games === 0 ? (
        <EmptyState
          title="Encara no hi ha cap boxscore descarregat"
          description="Per calcular aquestes estadístiques calen els detalls dels partits. Descarrega'ls des de la pantalla de Partits: aquí no es fa cap petició a ESPN."
          icon={<DownloadIcon className="size-6" />}
          action={
            <Link to="/partits" className="btn-secondary">
              Ves a Partits
            </Link>
          }
        />
      ) : ranked.length === 0 ? (
        <EmptyState
          title="Els partits descarregats no tenen boxscore"
          description="ESPN encara no ha publicat les estadístiques dels jugadors d'aquests partits. Torna-ho a provar més endavant."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/40">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-wider text-zinc-500">
                  <th className="px-2 py-3 text-center font-medium">#</th>
                  <th className="px-2 py-3 font-medium">Jugador</th>
                  <th className="hidden px-2 py-3 font-medium xl:table-cell">
                    Equip
                  </th>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "whitespace-nowrap px-1.5 py-3 text-center font-medium",
                        column.key !== category.stat && "hidden lg:table-cell",
                      )}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ranked.map((player, index) => (
                  <tr
                    key={player.id}
                    className="transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-2 py-2.5 text-center tabular-nums text-zinc-500">
                      {index + 1}
                    </td>
                    <td className="px-2 py-2.5">
                      <Link
                        to={`/jugadors/${player.id}`}
                        className="group flex items-center gap-2"
                      >
                        <TeamLogo team={player.team} size={28} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-zinc-200 group-hover:text-white">
                            {player.name}
                          </span>
                          <span className="block text-[11px] text-zinc-500 xl:hidden">
                            {player.team.abbreviation}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="hidden px-2 py-2.5 text-zinc-400 xl:table-cell">
                      {player.team.abbreviation}
                    </td>
                    {COLUMNS.map((column) => {
                      const statKey =
                        mode === "total"
                          ? (column.totalKey ?? column.key)
                          : column.key;
                      return (
                        <td
                          key={column.key}
                          className={cn(
                            "whitespace-nowrap px-1.5 py-2.5 text-center tabular-nums",
                            column.key === category.stat
                              ? "font-semibold text-orange-400"
                              : "hidden text-zinc-300 lg:table-cell",
                          )}
                        >
                          {column.format(player.stats[statKey], mode)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-[11px] text-zinc-600 lg:hidden">
            A pantalles petites es mostra només la columna de la categoria
            seleccionada; fes servir els filtres per canviar-la.
          </p>

          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            PJ = partits jugats · MIN = minuts · PTS = punts · REB = rebots ·
            AST = assistències · VAL = valoració del box score · 2PM = tirs de
            2 anotats · 3PM = triples anotats · TLM = tirs lliures anotats · RO
            = rebots ofensius · RD = rebots defensius · ROB = robatoris · TAP
            = taps · TC% = tirs de camp · 3P% = triples. Canvia entre mitjanes
            per partit i totals acumulats; els percentatges sempre es calculen
            amb els totals.
          </p>
        </>
      )}
    </div>
  );
}
