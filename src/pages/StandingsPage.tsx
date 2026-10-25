import { useEntry } from "@/hooks/useCache";
import { KEY } from "@/lib/cache";
import type { StandingsSnapshot } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { DataMissing } from "@/components/DataMissing";
import { PageHeader } from "@/components/PageHeader";
import { StandingsTable } from "@/components/StandingsTable";
import { Badge } from "@/components/ui";

export default function StandingsPage() {
  const { data, loading, fetchedAt } = useEntry<StandingsSnapshot>(
    KEY.standings,
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="skeleton mb-8 h-24" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="skeleton h-96" />
          <div className="skeleton h-96" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <PageHeader
          eyebrow="Classificació"
          title="Classificació"
          description="Rècord, diferència de punts i ratxa de tots els equips, ordenats per conferència."
        />
        <DataMissing />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <PageHeader
        eyebrow={`Temporada ${data.season}`}
        title="Classificació"
        description="Rècord, diferència de punts i ratxa de tots els equips, ordenats per conferència."
        action={
          fetchedAt ? (
            <Badge tone="neutral">Desada {timeAgo(fetchedAt)}</Badge>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {(
          [
            ["Conferència Est", data.east],
            ["Conferència Oest", data.west],
          ] as const
        ).map(([label, rows]) => (
          <section key={label} className="card min-w-0 p-4 sm:p-5">
            <header className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-base font-semibold text-white">{label}</h2>
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                {rows.length} equips
              </span>
            </header>
            <StandingsTable rows={rows} />
          </section>
        ))}
      </div>

      <p className="mt-2 px-1 text-[11px] text-zinc-600 sm:hidden">
        Desplaça les taules horitzontalment per veure GB, PPP, OPP, DIF i
        ratxa.
      </p>

      <p className="mt-6 max-w-4xl text-xs leading-relaxed text-zinc-500">
        V = victòries · D = derrotes · V% = percentatge de victòries · GB =
        partits de desavantatge respecte al líder · PPP = punts per partit ·
        OPP = punts encaixats per partit · DIF = diferència de punts · Ratxa =
        ratxa actual.
      </p>
    </div>
  );
}
