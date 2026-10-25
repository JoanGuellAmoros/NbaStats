import { Link } from "react-router-dom";
import type { Game, GameSide } from "@/lib/types";
import { cn, formatTime } from "@/lib/format";
import { ArrowRightIcon } from "./icons";
import { TeamLogo } from "./TeamLogo";

function Side({ side, showScore }: { side: GameSide; showScore: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-1 py-1.5">
      <TeamLogo team={side.team} size={28} />
      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-sm",
            side.winner ? "font-semibold text-white" : "text-zinc-300",
          )}
        >
          {side.team.name}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        {side.record && (
          <span className="text-[11px] tabular-nums text-zinc-500">
            {side.record}
          </span>
        )}
        {showScore && (
          <span
            className={cn(
              "w-9 text-right text-lg font-semibold tabular-nums",
              side.winner ? "text-white" : "text-zinc-400",
            )}
          >
            {side.score ?? "—"}
          </span>
        )}
      </div>
    </div>
  );
}

export function GameCard({ game }: { game: Game }) {
  const isPre = game.state === "pre";

  return (
    <Link
      to={`/partits/${game.id}`}
      className="group block rounded-2xl"
      aria-label={`Detalls de ${game.name}`}
    >
      <article className="card h-full p-4 transition-colors group-hover:border-orange-400/30 group-hover:bg-zinc-900/70">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs">
          <span
            className={cn(
              "font-semibold",
              game.state === "in"
                ? "text-orange-400"
                : game.state === "post"
                  ? "text-zinc-400"
                  : "text-emerald-400",
            )}
          >
            {game.statusLabel}
          </span>
          <span className="truncate text-zinc-500">
            {isPre
              ? formatTime(game.date)
              : (game.venue ?? game.statusDetail ?? "")}
          </span>
        </div>

        <div className="space-y-1">
          <Side side={game.away} showScore={!isPre} />
          <Side side={game.home} showScore={!isPre} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/5 px-1 pt-2">
          <p className="min-w-0 truncate text-[10px] text-zinc-600">
            {game.broadcast ?? ""}
          </p>
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-zinc-500 transition-colors group-hover:text-orange-400">
            Detalls
            <ArrowRightIcon className="size-3.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}
