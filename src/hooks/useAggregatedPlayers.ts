import { useEffect, useState } from "react";
import { aggregatePlayers, type AggregatedLeaders } from "@/lib/aggregate";
import { CACHE_EVENT, readAllGameDetails } from "@/lib/cache";

const EMPTY: AggregatedLeaders = { players: [], games: 0 };

export function useAggregatedPlayers(): AggregatedLeaders & {
  loading: boolean;
} {
  const [state, setState] = useState<AggregatedLeaders & { loading: boolean }>(
    { ...EMPTY, loading: true },
  );

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;

    const load = () => {
      readAllGameDetails()
        .then((details) => {
          if (!alive) return;
          setState({ ...aggregatePlayers(details), loading: false });
        })
        .catch(() => {
          if (alive) setState({ ...EMPTY, loading: false });
        });
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

  return state;
}
