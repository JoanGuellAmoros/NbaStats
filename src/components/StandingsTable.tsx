import { Link } from "react-router-dom";
import type { Standing } from "@/lib/types";
import { caNumber, cn, streakLabel, winPct } from "@/lib/format";
import { TeamLogo } from "./TeamLogo";

export function StandingsTable({
  rows,
  limit,
  compact = false,
}: {
  rows: Standing[];
  limit?: number;
  compact?: boolean;
}) {
  const visible =
    typeof limit === "number" ? rows.slice(0, limit) : rows;

  return (
    <div className="min-w-0 overflow-x-auto">
      <table
        className={cn(
          "w-full text-sm",
          compact ? "min-w-[320px]" : "min-w-[560px]",
        )}
      >
        <thead>
          <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="py-2 pr-2 text-center font-medium">#</th>
            <th className="py-2 pr-2 font-medium">Equip</th>
            <th className="px-2 py-2 text-center font-medium">V</th>
            <th className="px-2 py-2 text-center font-medium">D</th>
            <th className="px-2 py-2 text-center font-medium">V%</th>
            {!compact && (
              <>
                <th className="px-2 py-2 text-center font-medium">GB</th>
                <th className="px-2 py-2 text-center font-medium">PPP</th>
                <th className="px-2 py-2 text-center font-medium">OPP</th>
                <th className="px-2 py-2 text-center font-medium">DIF</th>
                <th className="px-2 py-2 text-center font-medium">Ratxa</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {visible.map((row, index) => {
            const { team, record } = row;
            const positive = record.diff?.startsWith("+");

            return (
              <tr
                key={team.id}
                className="group transition-colors hover:bg-white/[0.03]"
              >
                <td className="py-2.5 pr-2 text-center tabular-nums text-zinc-500">
                  {record.seed ?? index + 1}
                </td>
                <td className="py-2.5 pr-2">
                  <Link
                    to={`/equips/${team.id}`}
                    className="flex items-center gap-2.5"
                  >
                    <TeamLogo team={team} size={24} />
                    <span className="font-medium text-zinc-200 group-hover:text-white">
                      {team.shortName}
                    </span>
                  </Link>
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-zinc-300">
                  {record.wins}
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-zinc-400">
                  {record.losses}
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-zinc-200">
                  {winPct(record.pct)}
                </td>
                {!compact && (
                  <>
                    <td className="px-2 py-2.5 text-center tabular-nums text-zinc-400">
                      {caNumber(record.gb)}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-zinc-300">
                      {caNumber(record.ppg)}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-zinc-400">
                      {caNumber(record.oppg)}
                    </td>
                    <td
                      className={cn(
                        "px-2 py-2.5 text-center tabular-nums",
                        positive ? "text-emerald-400" : "text-red-400",
                      )}
                    >
                      {caNumber(record.diff)}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-xs tabular-nums text-zinc-300">
                        {streakLabel(record.streak)}
                      </span>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
