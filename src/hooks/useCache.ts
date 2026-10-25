import { useCallback, useEffect, useState } from "react";
import {
  CACHE_EVENT,
  cacheSummary,
  findCachedGame,
  readEntry,
} from "@/lib/cache";
import type { CacheEntry, CacheSummary, Game } from "@/lib/types";

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

type CachedGameState = {
  id: string | null;
  game: Game | null;
  loading: boolean;
};

export function useCachedGame(gameId: string | null) {
  const [state, setState] = useState<CachedGameState>({
    id: null,
    game: null,
    loading: Boolean(gameId),
  });

  useEffect(() => {
    if (!gameId) {
      setState({ id: null, game: null, loading: false });
      return;
    }

    let alive = true;
    setState((previous) => ({
      id: gameId,
      game: previous.id === gameId ? previous.game : null,
      loading: true,
    }));

    const load = () => {
      findCachedGame(gameId)
        .then((game) => {
          if (alive) {
            setState({ id: gameId, game: game ?? null, loading: false });
          }
        })
        .catch(() => {
          if (alive) {
            setState({ id: gameId, game: null, loading: false });
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
  }, [gameId]);

  return {
    game: state.id === gameId ? state.game : null,
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
  games: 0,
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
