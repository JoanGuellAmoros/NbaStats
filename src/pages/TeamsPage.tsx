import { Link } from "react-router-dom";
import { useEntry } from "@/hooks/useCache";
import { KEY } from "@/lib/cache";
import type { Standing, StandingsSnapshot } from "@/lib/types";
import { streakLabel, timeAgo, winPct } from "@/lib/format";
import { DataMissing } from "@/components/DataMissing";
import { PageHeader } from "@/components/PageHeader";
import { TeamLogo } from "@/components/TeamLogo";
import { Badge } from "@/components/ui";

function TeamCard({ row }: { row: Standing }) {
  const { team, record } = row;
  const color = team.color ?? "#f97316";

  return (
    <Link
      to={`/equips/${team.id}`}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-4 transition-colors hover:border-white/25 hover:bg-zinc-900"
    >
      <div
        className="absolute -right-8 -top-10 size-28 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-35"
        style={{ backgroundColor: color }}
      />
      <div className="relative flex items-center gap-3">
        <TeamLogo team={team} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-zinc-100">{team.name}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {record.wins}V – {record.losses}D · {winPct(record.pct)}
            {record.streak ? ` · ${streakLabel(record.streak)}` : ""}
          </p>
        </div>
        {record.seed !== undefined && (
          <span className="rounded-lg bg-white/5 px-2 py-1 text-[11px] font-semibold text-zinc-300">
            #{record.seed}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function TeamsPage() {
  const { data, loading, fetchedAt } = useEntry<StandingsSnapshot>(
    KEY.standings,
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="skeleton mb-8 h-24" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="skeleton h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <PageHeader
          eyebrow="Equips"
          title="Equips"
          description="Els 30 equips de l'NBA amb el seu rècord i la seva posició a la conferència."
        />
        <DataMissing />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <PageHeader
        eyebrow={`Temporada ${data.season}`}
        title="Equips"
        description="Els 30 equips de l'NBA amb el seu rècord i la seva posició a la conferència."
        action={
          fetchedAt ? (
            <Badge tone="neutral">Desades {timeAgo(fetchedAt)}</Badge>
          ) : undefined
        }
      />

      <div className="space-y-10">
        {(
          [
            ["Conferència Est", data.east],
            ["Conferència Oest", data.west],
          ] as const
        ).map(([label, rows]) => (
          <section key={label}>
            <h2 className="mb-4 text-lg font-semibold text-white">{label}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rows.map((row) => (
                <TeamCard key={row.team.id} row={row} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
