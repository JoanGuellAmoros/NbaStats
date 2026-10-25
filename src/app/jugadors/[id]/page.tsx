import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamLogo } from "@/components/team-logo";
import { getPlayer } from "@/lib/espn";
import {
  initials,
  positionLabel,
  seasonLabel,
  statLabel,
} from "@/lib/format";

export const revalidate = 3600;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function JugadorPage({ params }: Props) {
  const { id } = await params;
  const data = await getPlayer(id).catch(() => null);
  const athlete = data?.athlete;

  if (!athlete) notFound();

  const team = athlete.team;
  const headshot = athlete.headshot?.href;
  const statistics = athlete.statsSummary?.statistics ?? [];
  const college =
    typeof athlete.college === "string"
      ? athlete.college
      : athlete.college?.name;
  const draft =
    typeof athlete.displayDraft === "string"
      ? athlete.displayDraft
      : athlete.displayDraft?.displayText;
  const season = data?.season?.year
    ? seasonLabel(data.season.year)
    : undefined;

  const bio = [
    { label: "Alçada", value: athlete.displayHeight },
    { label: "Pes", value: athlete.displayWeight },
    { label: "Edat", value: athlete.age ? `${athlete.age} anys` : undefined },
    { label: "Naixement", value: athlete.displayBirthPlace },
    { label: "Universitat", value: college },
    { label: "Experiència", value: athlete.displayExperience },
    { label: "Draft", value: draft },
  ].filter((item) => item.value);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <Link
        href="/jugadors"
        className="mb-5 inline-flex text-xs text-zinc-500 transition-colors hover:text-orange-400"
      >
        ← Tots els jugadors
      </Link>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 text-center">
          {headshot ? (
            <img
              src={headshot}
              alt={athlete.displayName}
              width={160}
              height={160}
              className="mx-auto size-40 rounded-2xl bg-white/5 object-cover"
              loading="lazy"
            />
          ) : (
            <div className="mx-auto grid size-40 place-items-center rounded-2xl bg-white/5 text-3xl font-semibold text-zinc-400">
              {initials(athlete.displayName)}
            </div>
          )}

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
            {athlete.displayName}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {athlete.jersey ? `#${athlete.jersey} · ` : ""}
            {positionLabel(athlete.position?.abbreviation)}
          </p>

          {team && (
            <Link
              href={`/equips/${team.id}`}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/10"
            >
              <TeamLogo team={team} size={18} />
              {team.displayName}
            </Link>
          )}

          {bio.length > 0 && (
            <dl className="mt-6 space-y-2 border-t border-white/10 pt-5 text-left">
              {bio.map((item) => (
                <div
                  key={item.label}
                  className="flex items-baseline justify-between gap-3 text-xs"
                >
                  <dt className="text-zinc-500">{item.label}</dt>
                  <dd className="text-right text-zinc-300">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </aside>

        <section className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6">
          <header className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
              Temporada {season}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Estadístiques
            </h2>
            {athlete.statsSummary?.displayName && (
              <p className="mt-1 text-xs text-zinc-500">
                {athlete.statsSummary.displayName}
              </p>
            )}
          </header>

          {statistics.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {statistics.map((stat) => (
                <div
                  key={stat.name}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                    {statLabel(stat.name, stat.displayName)}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
                    {stat.displayValue}
                  </p>
                  {stat.rank && (
                    <p className="mt-1 text-[11px] text-zinc-500">
                      #{stat.rank} de la lliga
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">
              No hi ha estadístiques disponibles per a aquest jugador.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
