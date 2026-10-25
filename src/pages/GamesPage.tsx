import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useEntry } from "@/hooks/useCache";
import { KEY } from "@/lib/cache";
import type { GameDay } from "@/lib/types";
import {
  formatDateLong,
  isValidIsoDate,
  shiftIsoDate,
  timeAgo,
  todayIso,
} from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  RefreshIcon,
} from "@/components/icons";
import { Spinner } from "@/components/ui";

export default function GamesPage() {
  const [params] = useSearchParams();
  const { downloadDay, online, openPanel } = useData();

  const today = todayIso();
  const requested = params.get("data");
  const date = requested && isValidIsoDate(requested) ? requested : today;

  const { entry, data, loading, fetchedAt } = useEntry<GameDay>(
    KEY.scoreboard(date),
  );
  const [busy, setBusy] = useState(false);

  const previous = shiftIsoDate(date, -1);
  const next = shiftIsoDate(date, 1);
  const isToday = date === today;

  const handleDownload = async () => {
    setBusy(true);
    await downloadDay(date);
    setBusy(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <PageHeader
        eyebrow="Calendari"
        title="Partits"
        description={formatDateLong(date)}
        action={
          <div className="flex items-center gap-2">
            <Link
              to={`/partits?data=${previous}`}
              aria-label="Dia anterior"
              className="btn-secondary px-2.5"
            >
              <ChevronLeftIcon className="size-4" />
            </Link>
            <Link
              to="/partits"
              className={
                isToday ? "btn-primary px-3 text-xs" : "btn-secondary px-3 text-xs"
              }
            >
              Avui
            </Link>
            <Link
              to={`/partits?data=${next}`}
              aria-label="Dia següent"
              className="btn-secondary px-2.5"
            >
              <ChevronRightIcon className="size-4" />
            </Link>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
        <span className="rounded-md bg-white/5 px-2 py-1 text-zinc-300">
          {loading
            ? "Carregant…"
            : `${data?.games.length ?? 0} ${
                (data?.games.length ?? 0) === 1 ? "partit" : "partits"
              }`}
        </span>
        {isToday && <span>· jornada d&apos;avui</span>}
        {fetchedAt && (
          <span>· desat {timeAgo(fetchedAt)}</span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="skeleton h-32" />
          <div className="skeleton h-32" />
          <div className="skeleton h-32" />
        </div>
      ) : data && data.games.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : entry ? (
        <EmptyState
          title="No hi ha partits aquest dia"
          description="Prova un altre dia amb les fletxes de navegació. Les dates que ja has descarregat es poden consultar sense connexió."
          action={
            <Link to="/partits" className="btn-secondary">
              Torna a avui
            </Link>
          }
        />
      ) : (
        <EmptyState
          title="Aquest dia encara no és a la memòria"
          description="L'app no fa peticions automàtiques. Pots descarregar només aquest dia o sincronitzar un rang sencer de calendari."
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
                Descarrega aquest dia
              </button>
              <button type="button" className="btn-secondary" onClick={openPanel}>
                <RefreshIcon className="size-4" />
                Sincronitza un rang
              </button>
            </div>
          }
        />
      )}

      {!online && (
        <p className="mt-4 text-xs text-zinc-500">
          Estàs offline: les dates que no s&apos;hagin descarregat abans no es
          poden consultar.
        </p>
      )}
    </div>
  );
}
