import { useCallback, useEffect, useState } from "react";
import {
  CACHE_EVENT,
  cacheSummary,
  readEntry,
} from "@/lib/cache";
import type { CacheEntry, CacheSummary } from "@/lib/types";

type EntryState<T> = {
  key: string | null;
  entry: CacheEntry<T> | null;
  loading: boolean;
};

export function useEntry<T>(key: string | null) {
  const [state, setState] = useState<EntryState<T>>({
    key: null,
    entry: null,
    loading: Boolean(key),
  });

  useEffect(() => {
    if (!key) {
      setState({ key: null, entry: null, loading: false });
      return;
    }

    let alive = true;
    setState((previous) => ({
      key,
      entry: previous.key === key ? previous.entry : null,
      loading: true,
    }));

    const load = () => {
      readEntry<T>(key)
        .then((entry) => {
          if (alive) {
            setState({ key, entry: entry ?? null, loading: false });
          }
        })
        .catch(() => {
          if (alive) {
            setState({ key, entry: null, loading: false });
          }
        });
    };

    load();

    const onChange = () => load();
    window.addEventListener(CACHE_EVENT, onChange);

    return () => {
      alive = false;
      window.removeEventListener(CACHE_EVENT, onChange);
    };
  }, [key]);

  return {
    entry: state.key === key ? state.entry : null,
    data: state.key === key ? (state.entry?.data ?? null) : null,
    fetchedAt:
      state.key === key ? (state.entry?.fetchedAt ?? null) : null,
    loading: state.loading,
  };
}

const EMPTY_SUMMARY: CacheSummary = {
  total: 0,
  standings: 0,
  days: 0,
  leaders: 0,
  teams: 0,
  players: 0,
};

export function useCacheSummary(): CacheSummary {
  const [summary, setSummary] = useState<CacheSummary>(EMPTY_SUMMARY);

  const load = useCallback(() => {
    cacheSummary()
      .then(setSummary)
      .catch(() => setSummary(EMPTY_SUMMARY));
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(CACHE_EVENT, load);
    return () => window.removeEventListener(CACHE_EVENT, load);
  }, [load]);

  return summary;
}
