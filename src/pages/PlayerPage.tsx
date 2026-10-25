import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useEntry } from "@/hooks/useCache";
import { KEY } from "@/lib/cache";
import type { PlayerDetail } from "@/lib/types";
import {
  birthDateLabel,
  caNumber,
  draftLabel,
  experienceLabel,
  handLabel,
  heightLabel,
  positionLabel,
  rankLabel,
  statusLabel,
  timeAgo,
  weightLabel,
} from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { TeamLogo } from "@/components/TeamLogo";
import { Badge, Spinner } from "@/components/ui";
import { DownloadIcon, RefreshIcon } from "@/components/icons";

function BioRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="text-right text-sm text-zinc-200">{value ?? "—"}</dd>
    </div>
  );
}

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const playerId = id ?? "";
  const { downloadPlayer, openPanel, online } = useData();

  const { data, loading, fetchedAt } = useEntry<PlayerDetail>(
    playerId ? KEY.player(playerId) : null,
  );
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    setBusy(true);
    await downloadPlayer(playerId);
    setBusy(false);
  };

  if (!playerId) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Jugador no trobat"
          description="L'adreça no inclou cap identificador de jugador."
          action={
            <Link to="/jugadors" className="btn-secondary">
              Torna als jugadors
            </Link>
          }
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="skeleton mb-8 h-32" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
        <PageHeader
          eyebrow="Jugador"
          title="Fitxa del jugador"
          description="La fitxa individual encara no és a la memòria de l'app."
        />
        <EmptyState
          title="Aquesta fitxa no s'ha descarregat"
          description={
            online
              ? "Descarrega la fitxa per veure'n la biografia i les estadístiques de la temporada. És una acció manual."
              : "Ara mateix estàs offline. Quan recuperis la connexió, podràs descarregar aquesta fitxa."
          }
          icon={<DownloadIcon className="size-6" />}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={handleDownload}
                disabled={busy || !online}
              >
                {busy ? (
                  <Spinner className="size-4" />
                ) : (
                  <DownloadIcon className="size-4" />
                )}
                Descarrega la fitxa
              </button>
              <button type="button" className="btn-secondary" onClick={openPanel}>
                <RefreshIcon className="size-4" />
                Actualitza-ho tot
              </button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <PlayerAvatar
            name={data.name}
            size={88}
            className="border border-white/10 bg-white/[0.04]"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
              {data.season ?? "Fitxa del jugador"}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {data.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              {data.jersey && (
                <span className="rounded-md bg-white/5 px-2 py-1 text-zinc-300">
                  #{data.jersey}
                </span>
              )}
              {data.position && <span>{positionLabel(data.position)}</span>}
              {data.team && (
                <Link
                  to={`/equips/${data.team.id}`}
                  className="inline-flex items-center gap-1.5 text-zinc-400 transition-colors hover:text-orange-400"
                >
                  <TeamLogo team={data.team} size={18} />
                  {data.team.name}
                </Link>
              )}
              {data.status && (
                <Badge tone="green">{statusLabel(data.status)}</Badge>
              )}
              {fetchedAt && <span>· desada {timeAgo(fetchedAt)}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleDownload}
            disabled={busy || !online}
          >
            {busy ? (
              <Spinner className="size-4" />
            ) : (
              <RefreshIcon className="size-4" />
            )}
            Refresca la fitxa
          </button>
          <Link to="/jugadors" className="btn-ghost">
            Tots els jugadors
          </Link>
        </div>
      </div>

      {data.stats.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.stats.map((stat) => (
            <div key={stat.name} className="card-soft px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                {stat.label}
              </p>
              <p className="mt-0.5 text-2xl font-semibold text-white">
                {caNumber(stat.value)}
              </p>
              {stat.rankLabel && (
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {rankLabel(stat.rankLabel)} de la lliga
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Biografia</h2>
          <dl>
            <BioRow label="Alçada" value={heightLabel(data.height)} />
            <BioRow label="Pes" value={weightLabel(data.weight)} />
            <BioRow label="Edat" value={data.age} />
            <BioRow label="Naixement" value={birthDateLabel(data.birthDate)} />
            <BioRow label="Lloc de naixement" value={data.birthPlace} />
            <BioRow label="Universitat" value={data.college} />
            <BioRow
              label="Experiència"
              value={experienceLabel(data.experience)}
            />
            <BioRow label="Draft" value={draftLabel(data.draft)} />
            <BioRow label="Mà dominant" value={handLabel(data.hand)} />
          </dl>
        </section>

        <section className="card p-5">
          <h2 className="mb-1 text-sm font-semibold text-white">
            Mitjanes de la temporada
          </h2>
          <p className="mb-3 text-[11px] text-zinc-500">
            {data.season ?? "Temporada actual"}
          </p>

          {data.averages.length > 0 ? (
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {data.averages.map((stat) => (
                <div
                  key={stat.name}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <dt className="text-[11px] uppercase tracking-wider text-zinc-500">
                    {stat.label}
                  </dt>
                  <dd className="mt-0.5 text-base font-semibold tabular-nums text-white">
                    {caNumber(stat.value)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : data.stats.length > 0 ? (
            <dl>
              {data.stats.map((stat) => (
                <div
                  key={stat.name}
                  className="flex items-baseline justify-between gap-3 border-b border-white/5 py-2 last:border-0"
                >
                  <dt className="text-xs text-zinc-500">{stat.label}</dt>
                  <dd className="text-right">
                    <span className="text-lg font-semibold tabular-nums text-white">
                      {caNumber(stat.value)}
                    </span>
                    {stat.rankLabel && (
                      <span className="ml-2 text-[11px] text-zinc-500">
                        {rankLabel(stat.rankLabel)}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-xs text-zinc-500">
              No hi ha estadístiques disponibles per a aquest jugador.
            </p>
          )}

          <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">
            Les xifres provenen del resum de temporada d&apos;ESPN i es
            refresquen només quan prems el botó.
          </p>
        </section>
      </div>
    </div>
  );
}
