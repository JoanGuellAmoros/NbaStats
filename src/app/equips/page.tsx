import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { TeamLogo } from "@/components/team-logo";
import { getStandings, statOf } from "@/lib/espn";
import { seasonLabel, winPercent } from "@/lib/format";

export const revalidate = 300;

export default async function EquipsPage() {
  const standings = await getStandings();
  const conferences = standings.children ?? [];
  const season = seasonLabel(standings.season?.year);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <PageHeader
        eyebrow={`Temporada ${season}`}
        title="Equips"
        description="Els 30 equips de l'NBA amb el seu rècord i la seva posició a la conferència."
      />

      <div className="space-y-10">
        {conferences.map((conference) => (
          <section key={conference.name}>
            <h2 className="mb-4 text-lg font-semibold text-white">
              {conference.name}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(conference.standings?.entries ?? []).map((entry) => {
                const team = entry.team;
                const wins = statOf(entry, "wins")?.displayValue ?? "0";
                const losses = statOf(entry, "losses")?.displayValue ?? "0";
                const seed = statOf(entry, "playoffSeed")?.displayValue;
                const pct = winPercent(statOf(entry, "winPercent")?.value);
                const color = team.color ? `#${team.color}` : "#f97316";

                return (
                  <Link
                    key={team.id}
                    href={`/equips/${team.id}`}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-4 transition-colors hover:border-white/25 hover:bg-zinc-900"
                  >
                    <div
                      className="absolute -right-8 -top-10 size-28 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-35"
                      style={{ backgroundColor: color }}
                    />
                    <div className="relative flex items-center gap-3">
                      <TeamLogo team={team} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-100">
                          {team.displayName}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {wins}V – {losses}D · {pct}
                        </p>
                      </div>
                      {seed && (
                        <span className="rounded-lg bg-white/5 px-2 py-1 text-[11px] font-semibold text-zinc-300">
                          #{seed}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
