import { useEffect, useMemo, useState } from "react";
import { CACHE_EVENT, KEY, readAllGameDetails } from "@/lib/cache";
import { applyGameResults } from "@/lib/standings";
import type { GameDetail, StandingsSnapshot } from "@/lib/types";
import { useEntry } from "./useCache";

/**
 * Classificació d'ESPN ajustada amb els partits descarregats que el snapshot
 * encara no podia incloure.
 */
export function useStandings() {
  const state = useEntry<StandingsSnapshot>(KEY.standings);
  const [details, setDetails] = useState<GameDetail[]>([]);

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;

    const load = () => {
      readAllGameDetails()
        .then((next) => {
          if (alive) setDetails(next);
        })
        .catch(() => undefined);
    };

    load();

    const onChange = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(load, 200);
    };

    window.addEventListener(CACHE_EVENT, onChange);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      window.removeEventListener(CACHE_EVENT, onChange);
    };
  }, []);

  const adjusted = useMemo(
    () =>
      state.data
        ? applyGameResults(state.data, state.fetchedAt ?? 0, details)
        : null,
    [state.data, state.fetchedAt, details],
  );

  return {
    data: adjusted?.snapshot ?? null,
    appliedGames: adjusted?.appliedGames ?? 0,
    loading: state.loading,
    fetchedAt: state.fetchedAt,
  };
}
