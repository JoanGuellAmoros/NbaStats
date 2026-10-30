import { Link } from "react-router-dom";
import type {
  RankedRecordEntry,
  RecordCategory,
  RecordMetric,
  TeamRecordCategory,
} from "@/lib/records";
import { decimal, formatDateShort, integer } from "@/lib/format";
import { useRecords } from "@/hooks/useRecords";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { TeamLogo } from "@/components/TeamLogo";
import { Badge } from "@/components/ui";
import { BasketballIcon } from "@/components/icons";

type AnyCategory = RecordCategory | TeamRecordCategory;

function valueLabel(metric: RecordMetric, value: number): string {
  if (metric.format === "minutes") return decimal(value, 1);
  if (metric.format === "signed") {
    if (value === 0) return "0";
    return `${value > 0 ? "+" : "−"}${integer(Math.abs(value))}`;
  }
  return integer(value);
}

function scoreLine(entry: RankedRecordEntry): string {
  return `${entry.team.abbreviation} ${entry.teamScore}–${entry.opponentScore} ${entry.opponent.abbreviation}`;
}

function rankLabel(entry: RankedRecordEntry): string {
  return entry.tied ? `${entry.rank}=` : String(entry.rank);
}

function RecordCard({
  category,
  entry,
  featured = false,
}: {
  category: AnyCategory;
  entry: RankedRecordEntry;
  featured?: boolean;
}) {
  const value = valueLabel(category, entry.value);
  const label = `${entry.name}, ${value} ${category.short}, ${scoreLine(entry)}, ${formatDateShort(entry.date)}${entry.tied ? " (empatat)" : ""}`;

  if (featured) {
    return (
      <Link
        to={`/partits/${entry.gameId}`}
        data-record-rank={entry.rank}
        data-record-value={entry.value}
        data-record-tied={entry.tied ? "true" : "false"}
        data-featured="true"
        aria-label={label}
        className="group relative overflow-hidden rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/15 via-zinc-900/80 to-zinc-950 p-5 transition-colors hover:border-orange-300/50 sm:col-span-2 lg:col-span-4"
      >
        <span className="pointer-events-none absolute -right-12 -top-16 size-44 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <TeamLogo team={entry.team} size={56} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="orange">
                  {entry.tied ? "Rècord compartit" : "Rècord"}
                </Badge>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Top {rankLabel(entry)} · {category.short}
                </span>
              </div>
              <p className="mt-1.5 truncate text-xl font-semibold text-white sm:text-2xl">
                {entry.name}
              </p>
              <p className="mt-1 truncate text-xs text-zinc-400">
                {entry.team.abbreviation}{" "}
                <span
                  className={
                    entry.won ? "text-emerald-400" : "text-red-400"
                  }
                >
                  {entry.teamScore}–{entry.opponentScore}
                </span>{" "}
                {entry.opponent.abbreviation} ·{" "}
                {formatDateShort(entry.date)}
              </p>
            </div>
          </div>
          <div className="flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0">
            <span className="text-4xl font-semibold tabular-nums text-orange-300 sm:text-5xl">
              {value}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              {category.label}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/partits/${entry.gameId}`}
      data-record-rank={entry.rank}
      data-record-value={entry.value}
      data-record-tied={entry.tied ? "true" : "false"}
      aria-label={label}
      title={entry.tied ? "Empatat amb el mateix registre" : undefined}
      className="card group flex h-full flex-col justify-between gap-3 p-4 transition-colors hover:border-orange-400/30 hover:bg-zinc-900/70"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={
            entry.tied
              ? "grid h-6 min-w-6 place-items-center rounded-md bg-orange-400/15 px-1.5 text-[11px] font-semibold text-orange-300"
              : "grid size-6 place-items-center rounded-md bg-white/5 text-[11px] font-semibold text-zinc-400"
          }
        >
          {rankLabel(entry)}
        </span>
        <span className="text-xl font-semibold tabular-nums text-zinc-100">
          {value}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <TeamLogo team={entry.team} size={26} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-100 group-hover:text-white">
            {entry.name}
          </p>
          <p className="truncate text-[11px] text-zinc-500">
            {entry.team.abbreviation}{" "}
            <span className={entry.won ? "text-emerald-400" : "text-red-400"}>
              {entry.teamScore}–{entry.opponentScore}
            </span>{" "}
            {entry.opponent.abbreviation} · {formatDateShort(entry.date)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function CategorySection({
  category,
  scope,
}: {
  category: AnyCategory;
  scope: "player" | "team";
}) {
  const leaders = category.entries.filter((entry) => entry.rank === 1).length;

  return (
    <section
      data-record-category={category.key}
      data-record-scope={scope}
      className="scroll-mt-24"
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">{category.label}</h3>
          <Badge tone="neutral">Top 5</Badge>
          {leaders > 1 ? <Badge tone="orange">Empat</Badge> : null}
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          {category.short}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {category.entries.map((entry) => (
          <RecordCard
            key={`${entry.gameId}:${entry.id}`}
            category={category}
            entry={entry}
            featured={entry.rank === 1 && leaders <= 2}
          />
        ))}
      </div>
    </section>
  );
}

export default function RecordsPage() {
  const { categories, teamCategories, games, players, teams, loading } =
    useRecords();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <PageHeader
        eyebrow="Fites individuals i d'equip"
        title="Rècords"
        description={
          games > 0
            ? `Top 5 de cada estadística entre els ${games} ${
                games === 1 ? "partit descarregat" : "partits descarregats"
              }, amb el millor registre destacat i tots els empatats inclosos. Es calcula localment a partir dels boxscores: aquesta pantalla no fa cap descàrrega.`
            : "Els rècords es calculen amb els boxscores dels partits que descarreguis. Aquesta pantalla no fa cap descàrrega."
        }
        action={
          games > 0 ? (
            <Badge tone="neutral">
              {games} {games === 1 ? "partit" : "partits"} · {players}{" "}
              {players === 1 ? "jugador" : "jugadors"}
              {teams > 0
                ? ` · ${teams} ${teams === 1 ? "equip" : "equips"}`
                : ""}
            </Badge>
          ) : undefined
        }
      />

      {loading ? (
        <div className="skeleton h-[32rem]" />
      ) : games === 0 ? (
        <EmptyState
          title="Encara no hi ha cap boxscore descarregat"
          description="Per calcular els rècords calen els detalls dels partits. Descarrega'ls des de la pantalla de Partits: aquí no es fa cap petició a ESPN."
          icon={<BasketballIcon className="size-6" />}
          action={
            <Link to="/partits" className="btn-secondary">
              Ves a Partits
            </Link>
          }
        />
      ) : categories.length === 0 && teamCategories.length === 0 ? (
        <EmptyState
          title="Els partits descarregats no tenen boxscore"
          description="ESPN encara no ha publicat les estadístiques dels jugadors d'aquests partits. Torna-ho a provar més endavant."
          icon={<BasketballIcon className="size-6" />}
        />
      ) : (
        <div className="space-y-12">
          {categories.length > 0 ? (
            <div className="space-y-10">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Rècords individuals
              </h2>
              {categories.map((category) => (
                <CategorySection
                  key={category.key}
                  category={category}
                  scope="player"
                />
              ))}
            </div>
          ) : null}

          {teamCategories.length > 0 ? (
            <div className="space-y-10">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Rècords d&apos;equip
              </h2>
              {teamCategories.map((category) => (
                <CategorySection
                  key={category.key}
                  category={category}
                  scope="team"
                />
              ))}
            </div>
          ) : null}

          <p className="text-xs leading-relaxed text-zinc-500">
            Els rècords només tenen en compte els partits finals amb boxscore
            desat i jugadors amb minuts. Si dos o més jugadors o equips
            comparteixen el mateix registre, es mostren tots amb el rang
            marcat amb «=». El desempat es resol pel partit més recent. Fes
            clic a qualsevol targeta per obrir el detall del partit.
          </p>
        </div>
      )}
    </div>
  );
}
