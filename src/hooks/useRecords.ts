import { useEffect, useState } from "react";
import { CACHE_EVENT, readAllGameDetails } from "@/lib/cache";
import { computeRecords, type RecordsResult } from "@/lib/records";

const EMPTY: RecordsResult = {
  categories: [],
  teamCategories: [],
  games: 0,
  players: 0,
  teams: 0,
};

export function useRecords(): RecordsResult & { loading: boolean } {
  const [state, setState] = useState<RecordsResult & { loading: boolean }>({
    ...EMPTY,
    loading: true,
  });

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;

    const load = () => {
      readAllGameDetails()
        .then((details) => {
          if (!alive) return;
          setState({ ...computeRecords(details), loading: false });
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
