import Link from "next/link";
import type { LeadersResponse } from "@/lib/espn";
import { leaderStatValue } from "@/lib/espn";
import { decimal, initials } from "@/lib/format";

export function LeadersBoard({
  title,
  subtitle,
  response,
  statKey,
  format = (value) => decimal(value),
}: {
  title: string;
  subtitle: string;
  response: LeadersResponse;
  statKey: string;
  format?: (value?: number) => string;
}) {
  const athletes = (response.athletes ?? [])
    .map((entry) => ({
      entry,
      value: leaderStatValue(response, entry, statKey),
    }))
    .filter((item) => item.value !== undefined)
    .slice(0, 5);

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
      <header className="mb-2 flex items-baseline justify-between gap-2 px-1">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-[11px] uppercase tracking-wider text-zinc-500">
          {subtitle}
        </span>
      </header>

      <div className="space-y-0.5">
        {athletes.map(({ entry, value }, index) => {
          const athlete = entry.athlete;
          const headshot = athlete.headshot?.href;

          return (
            <Link
              key={athlete.id}
              href={`/jugadors/${athlete.id}`}
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/5"
            >
              <span className="w-3 text-center text-xs tabular-nums text-zinc-500">
                {index + 1}
              </span>
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
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-200">
                  {athlete.displayName}
                </p>
                <p className="truncate text-[11px] text-zinc-500">
                  {athlete.teamShortName ?? athlete.teamName ?? "—"}
                </p>
              </div>
              <span className="text-base font-semibold tabular-nums text-white">
                {format(value)}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
