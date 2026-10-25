import { Link } from "react-router-dom";
import type { LeaderSnapshot } from "@/lib/types";
import { decimal } from "@/lib/format";
import { PlayerAvatar } from "./PlayerAvatar";

export function LeadersBoard({
  snapshot,
  stat,
  title,
  subtitle,
  limit = 5,
  format = (value?: number) => decimal(value),
}: {
  snapshot: LeaderSnapshot;
  stat: string;
  title: string;
  subtitle: string;
  limit?: number;
  format?: (value?: number) => string;
}) {
  const players = snapshot.players.slice(0, limit);

  return (
    <section className="card p-4">
      <header className="mb-2 flex items-baseline justify-between gap-2 px-1">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-[11px] uppercase tracking-wider text-zinc-500">
          {subtitle}
        </span>
      </header>

      <div className="space-y-0.5">
        {players.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-zinc-500">
            Sense dades en memòria.
          </p>
        )}

        {players.map((player, index) => (
          <Link
            key={player.id}
            to={`/jugadors/${player.id}`}
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/5"
          >
            <span className="w-3 text-center text-xs tabular-nums text-zinc-500">
              {index + 1}
            </span>
            <PlayerAvatar name={player.name} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">
                {player.name}
              </p>
              <p className="truncate text-[11px] text-zinc-500">
                {player.teamAbbreviation ?? player.teamName ?? "—"}
              </p>
            </div>
            <span className="text-base font-semibold tabular-nums text-white">
              {format(player.stats[stat])}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
