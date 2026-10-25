import { Link, useSearchParams } from "react-router-dom";
import { categoryByKey, LEADER_CATEGORIES } from "@/lib/sync";
import { cn, decimal, integer, percent } from "@/lib/format";
import { useAggregatedPlayers } from "@/hooks/useAggregatedPlayers";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { TeamLogo } from "@/components/TeamLogo";
import { Badge } from "@/components/ui";
import { DownloadIcon } from "@/components/icons";

const COLUMNS: {
  key: string;
  label: string;
  format: (value?: number) => string;
}[] = [
  { key: "gamesPlayed", label: "PJ", format: (value) => integer(value) },
  { key: "avgMinutes", label: "MIN", format: (value) => decimal(value) },
  { key: "avgPoints", label: "PTS", format: (value) => decimal(value) },
  { key: "avgRebounds", label: "REB", format: (value) => decimal(value) },
  { key: "avgAssists", label: "AST", format: (value) => decimal(value) },
  { key: "avgSteals", label: "ROB", format: (value) => decimal(value) },
  { key: "avgBlocks", label: "TAP", format: (value) => decimal(value) },
  {
    key: "avgThreePointFieldGoalsMade",
    label: "3PM",
    format: (value) => decimal(value),
  },
  { key: "fieldGoalPct", label: "TC%", format: (value) => percent(value) },
  {
    key: "threePointFieldGoalPct",
    label: "3P%",
    format: (value) => percent(value),
  },
];

export default function PlayersPage() {
  const [params] = useSearchParams();
  const category = categoryByKey(params.get("ordre"));
  const { players, games, loading } = useAggregatedPlayers();

  const ranked = [...players].sort(
    (a, b) =>
      (b.stats[category.stat] ?? -1) - (a.stats[category.stat] ?? -1) ||
      a.name.localeCompare(b.name),
  );

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

      <div className="mb-5 flex flex-wrap gap-2">
        {LEADER_CATEGORIES.map((item) => (
          <Link
            key={item.key}
            to={`/jugadors?ordre=${item.key}`}
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
            <table className="w-full text-sm sm:min-w-[1040px]">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-3 py-3 text-center font-medium">#</th>
                  <th className="px-2 py-3 font-medium">Jugador</th>
                  <th className="hidden px-2 py-3 font-medium sm:table-cell">
                    Equip
                  </th>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "px-2 py-3 text-center font-medium",
                        column.key !== category.stat && "hidden sm:table-cell",
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
                    <td className="px-3 py-2.5 text-center tabular-nums text-zinc-500">
                      {index + 1}
                    </td>
                    <td className="px-2 py-2.5">
                      <Link
                        to={`/jugadors/${player.id}`}
                        className="group flex items-center gap-3"
                      >
                        <TeamLogo team={player.team} size={30} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-zinc-200 group-hover:text-white">
                            {player.name}
                          </span>
                          <span className="block text-[11px] text-zinc-500 sm:hidden">
                            {player.team.abbreviation}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="hidden px-2 py-2.5 text-zinc-400 sm:table-cell">
                      {player.team.abbreviation}
                    </td>
                    {COLUMNS.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "px-2 py-2.5 text-center tabular-nums",
                          column.key === category.stat
                            ? "font-semibold text-orange-400"
                            : "hidden text-zinc-300 sm:table-cell",
                        )}
                      >
                        {column.format(player.stats[column.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-2 hidden text-[11px] text-zinc-600 sm:block lg:hidden">
            Desplaça la taula horitzontalment per veure la resta
            d&apos;estadístiques.
          </p>

          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            PJ = partits jugats · MIN = minuts · PTS = punts · REB = rebots ·
            AST = assistències · ROB = robatoris · TAP = taps · 3PM = triples
            anotats · TC% = tirs de camp · 3P% = triples. Les mitjanes i els
            percentatges es calculen sumant els boxscores desats.
          </p>
        </>
      )}
    </div>
  );
}
