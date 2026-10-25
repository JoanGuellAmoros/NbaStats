import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import {
  getPlayerLeaders,
  leaderStatValue,
  type LeadersResponse,
} from "@/lib/espn";
import { cn, decimal, initials, percent } from "@/lib/format";

export const revalidate = 300;

const ORDERS = [
  {
    key: "punts",
    label: "Punts",
    sort: "offensive.avgPoints",
    stat: "avgPoints",
  },
  {
    key: "rebots",
    label: "Rebots",
    sort: "general.avgRebounds",
    stat: "avgRebounds",
  },
  {
    key: "assistencies",
    label: "Assistències",
    sort: "offensive.avgAssists",
    stat: "avgAssists",
  },
  {
    key: "robatoris",
    label: "Robatoris",
    sort: "defensive.avgSteals",
    stat: "avgSteals",
  },
  {
    key: "taps",
    label: "Taps",
    sort: "defensive.avgBlocks",
    stat: "avgBlocks",
  },
  {
    key: "triples",
    label: "Triples",
    sort: "offensive.avgThreePointFieldGoalsMade",
    stat: "avgThreePointFieldGoalsMade",
  },
] as const;

const COLUMNS: {
  key: string;
  label: string;
  format: (value?: number) => string;
}[] = [
  {
    key: "gamesPlayed",
    label: "PJ",
    format: (value) => (value === undefined ? "—" : String(value)),
  },
  { key: "avgMinutes", label: "MIN", format: (value) => decimal(value) },
  { key: "avgPoints", label: "PTS", format: (value) => decimal(value) },
  { key: "avgRebounds", label: "REB", format: (value) => decimal(value) },
  { key: "avgAssists", label: "AST", format: (value) => decimal(value) },
  { key: "avgSteals", label: "ROB", format: (value) => decimal(value) },
  { key: "avgBlocks", label: "TAP", format: (value) => decimal(value) },
  { key: "fieldGoalPct", label: "TC%", format: (value) => percent(value) },
  {
    key: "threePointFieldGoalPct",
    label: "3P%",
    format: (value) => percent(value),
  },
];

function PlayerRow({
  response,
  index,
  highlight,
}: {
  response: LeadersResponse;
  index: number;
  highlight: string;
}) {
  const entry = response.athletes?.[index];
  if (!entry) return null;

  const athlete = entry.athlete;
  const headshot = athlete.headshot?.href;

  return (
    <tr className="transition-colors hover:bg-white/[0.03]">
      <td className="px-3 py-2.5 text-center tabular-nums text-zinc-500">
        {index + 1}
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
              width={32}
              height={32}
              className="size-8 rounded-full bg-white/10 object-cover"
              loading="lazy"
            />
          ) : (
            <span className="grid size-8 place-items-center rounded-full bg-white/10 text-[10px] font-semibold text-zinc-300">
              {initials(athlete.displayName)}
            </span>
          )}
          <span className="font-medium text-zinc-200 group-hover:text-white">
            {athlete.displayName}
          </span>
        </Link>
      </td>
      <td className="px-2 py-2.5 text-zinc-400">
        {athlete.teamShortName ?? athlete.teamName ?? "—"}
      </td>
      {COLUMNS.map((column) => (
        <td
          key={column.key}
          className={cn(
            "px-2 py-2.5 text-center tabular-nums",
            column.key === highlight
              ? "font-semibold text-orange-400"
              : "text-zinc-300",
          )}
        >
          {column.format(leaderStatValue(response, entry, column.key))}
        </td>
      ))}
    </tr>
  );
}

type Props = {
  searchParams: Promise<{ ordre?: string | string[] }>;
};

export default async function JugadorsPage({ searchParams }: Props) {
  const params = await searchParams;
  const requested = Array.isArray(params.ordre)
    ? params.ordre[0]
    : params.ordre;
  const active = ORDERS.find((order) => order.key === requested) ?? ORDERS[0];
  const leaders = await getPlayerLeaders(active.sort, 50);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <PageHeader
        eyebrow="Estadístiques individuals"
        title="Jugadors"
        description="Els 50 millors jugadors de la temporada en la categoria seleccionada. Només s'inclouen jugadors que compleixen els mínims de qualificació."
      />

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        {ORDERS.map((order) => (
          <Link
            key={order.key}
            href={{ pathname: "/jugadors", query: { ordre: order.key } }}
            className={cn(
              "whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
              order.key === active.key
                ? "bg-orange-500 text-black"
                : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
            )}
          >
            {order.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/40">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-3 py-3 text-center font-medium">#</th>
              <th className="px-2 py-3 font-medium">Jugador</th>
              <th className="px-2 py-3 font-medium">Equip</th>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  className="px-2 py-3 text-center font-medium"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {(leaders.athletes ?? []).map((_, index) => (
              <PlayerRow
                key={leaders.athletes?.[index]?.athlete.id ?? index}
                response={leaders}
                index={index}
                highlight={active.stat}
              />
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        PJ = partits jugats · MIN = minuts · PTS = punts · REB = rebots · AST =
        assistències · ROB = robatoris · TAP = taps · TC% = tirs de camp · 3P% =
        triples.
      </p>
    </div>
  );
}
