import { PageHeader } from "@/components/page-header";
import { StandingsTable } from "@/components/standings-table";
import { getStandings } from "@/lib/espn";
import { seasonLabel } from "@/lib/format";

export const revalidate = 300;

export default async function ClassificacioPage() {
  const standings = await getStandings();
  const conferences = standings.children ?? [];
  const season = seasonLabel(standings.season?.year);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <PageHeader
        eyebrow={`Temporada ${season}`}
        title="Classificació"
        description="Rècord, diferència de punts i ratxa de tots els equips, ordenats per conferència."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {conferences.map((conference) => (
          <section
            key={conference.name}
            className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 sm:p-5"
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-base font-semibold text-white">
                {conference.name}
              </h2>
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                {conference.standings?.entries?.length ?? 0} equips
              </span>
            </header>
            <StandingsTable entries={conference.standings?.entries ?? []} />
          </section>
        ))}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-zinc-500">
        V = victòries · D = derrotes · % = percentatge de victòries · GB =
        partits de desavantatge respecte al líder · PPP = punts per partit ·
        OPP = punts encaixats per partit · DIF = diferència de punts · Ratxa =
        ratxa actual.
      </p>
    </div>
  );
}
