import Link from "next/link";
import type { StandingEntry } from "@/lib/espn";
import { statOf } from "@/lib/espn";
import { cn, winPercent } from "@/lib/format";
import { TeamLogo } from "./team-logo";

export function StandingsTable({
  entries,
  limit,
  compact = false,
}: {
  entries: StandingEntry[];
  limit?: number;
  compact?: boolean;
}) {
  const rows = typeof limit === "number" ? entries.slice(0, limit) : entries;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[380px] text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="py-2 pr-2 font-medium">#</th>
            <th className="py-2 pr-2 font-medium">Equip</th>
            <th className="px-2 py-2 text-center font-medium">V</th>
            <th className="px-2 py-2 text-center font-medium">D</th>
            <th className="px-2 py-2 text-center font-medium">%</th>
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
          {rows.map((entry, index) => {
            const seed = statOf(entry, "playoffSeed")?.displayValue;
            const wins = statOf(entry, "wins")?.displayValue ?? "0";
            const losses = statOf(entry, "losses")?.displayValue ?? "0";
            const pct = winPercent(statOf(entry, "winPercent")?.value);
            const differential = statOf(entry, "differential");

            return (
              <tr
                key={entry.team.id}
                className="group transition-colors hover:bg-white/[0.03]"
              >
                <td className="py-2.5 pr-2 tabular-nums text-zinc-500">
                  {seed ?? index + 1}
                </td>
                <td className="py-2.5 pr-2">
                  <Link
                    href={`/equips/${entry.team.id}`}
                    className="flex items-center gap-2.5"
                  >
                    <TeamLogo team={entry.team} size={24} />
                    <span className="font-medium text-zinc-200 group-hover:text-white">
                      {entry.team.shortDisplayName ??
                        entry.team.name ??
                        entry.team.displayName}
                    </span>
                  </Link>
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-zinc-300">
                  {wins}
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-zinc-400">
                  {losses}
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-zinc-200">
                  {pct}
                </td>
                {!compact && (
                  <>
                    <td className="px-2 py-2.5 text-center tabular-nums text-zinc-400">
                      {statOf(entry, "gamesBehind")?.displayValue ?? "—"}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-zinc-300">
                      {statOf(entry, "avgPointsFor")?.displayValue ?? "—"}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-zinc-400">
                      {statOf(entry, "avgPointsAgainst")?.displayValue ?? "—"}
                    </td>
                    <td
                      className={cn(
                        "px-2 py-2.5 text-center tabular-nums",
                        (differential?.value ?? 0) >= 0
                          ? "text-emerald-400"
                          : "text-red-400",
                      )}
                    >
                      {differential?.displayValue ?? "—"}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-xs tabular-nums text-zinc-300">
                        {statOf(entry, "streak")?.displayValue ?? "—"}
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
