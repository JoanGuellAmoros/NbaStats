import Link from "next/link";
import type { Competitor, Game } from "@/lib/espn";
import {
  cn,
  formatTime,
  gameStatusLabel,
  gameStatusTone,
} from "@/lib/format";
import { TeamLogo } from "./team-logo";

function TeamRow({
  competitor,
  showScore,
}: {
  competitor: Competitor;
  showScore: boolean;
}) {
  const record = competitor.records?.[0]?.summary;

  return (
    <Link
      href={`/equips/${competitor.team.id}`}
      className="flex items-center gap-3 rounded-lg px-1 py-1.5 transition-colors hover:bg-white/5"
    >
      <TeamLogo team={competitor.team} size={28} />
      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-sm",
            competitor.winner ? "font-semibold text-white" : "text-zinc-300",
          )}
        >
          {competitor.team.displayName}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        {record && (
          <span className="text-[11px] tabular-nums text-zinc-500">
            {record}
          </span>
        )}
        {showScore && (
          <span
            className={cn(
              "w-9 text-right text-lg font-semibold tabular-nums",
              competitor.winner ? "text-white" : "text-zinc-400",
            )}
          >
            {competitor.score ?? "—"}
          </span>
        )}
      </div>
    </Link>
  );
}

export function GameCard({ game }: { game: Game }) {
  const competition = game.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const away = competitors.find((team) => team.homeAway === "away");
  const home = competitors.find((team) => team.homeAway === "home");
  const status = competition?.status;
  const isPre = status?.type.state === "pre";
  const ordered = [away, home].filter(
    (team): team is Competitor => Boolean(team),
  );

  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 transition-colors hover:border-white/20">
      <div className="mb-3 flex items-center justify-between gap-3 text-xs">
        <span className={cn("font-semibold", gameStatusTone(status))}>
          {gameStatusLabel(status)}
        </span>
        <span className="truncate text-zinc-500">
          {isPre ? formatTime(game.date) : (competition?.venue?.fullName ?? "")}
        </span>
      </div>
      <div className="space-y-1">
        {ordered.map((competitor) => (
          <TeamRow
            key={competitor.id}
            competitor={competitor}
            showScore={!isPre}
          />
        ))}
      </div>
    </article>
  );
}
