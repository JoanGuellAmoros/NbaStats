import {
  fetchLeaders,
  fetchPlayerDetail,
  fetchScoreboard,
  fetchStandings,
  fetchTeamDetail,
} from "./espn";
import { KEY, readEntry, setLastSync, writeEntry } from "./cache";
import { dateRange, errorMessage, todayIso } from "./format";
import type {
  LeaderCategory,
  PlayerDetail,
  StandingsSnapshot,
  SyncError,
  SyncProfile,
  SyncProgress,
  SyncResult,
  Team,
  TeamDetail,
} from "./types";

export const LEADER_CATEGORIES: LeaderCategory[] = [
  {
    key: "punts",
    label: "Punts",
    short: "PTS",
    description: "Punts per partit",
    sort: "offensive.avgPoints",
    stat: "avgPoints",
  },
  {
    key: "rebots",
    label: "Rebots",
    short: "REB",
    description: "Rebots per partit",
    sort: "general.avgRebounds",
    stat: "avgRebounds",
  },
  {
    key: "assistencies",
    label: "Assistències",
    short: "AST",
    description: "Assistències per partit",
    sort: "offensive.avgAssists",
    stat: "avgAssists",
  },
  {
    key: "robatoris",
    label: "Robatoris",
    short: "ROB",
    description: "Robatoris per partit",
    sort: "defensive.avgSteals",
    stat: "avgSteals",
  },
  {
    key: "taps",
    label: "Taps",
    short: "TAP",
    description: "Taps per partit",
    sort: "defensive.avgBlocks",
    stat: "avgBlocks",
  },
  {
    key: "triples",
    label: "Triples",
    short: "3PM",
    description: "Triples anotats per partit",
    sort: "offensive.avgThreePointFieldGoalsMade",
    stat: "avgThreePointFieldGoalsMade",
  },
];

export function categoryByKey(key?: string | null): LeaderCategory {
  return LEADER_CATEGORIES.find((category) => category.key === key) ?? LEADER_CATEGORIES[0];
}

type Task = {
  label: string;
  run: () => Promise<unknown>;
};

type SyncCallbacks = {
  onProgress: (progress: SyncProgress) => void;
};

export async function runSync(
  profile: SyncProfile,
  callbacks: SyncCallbacks,
  signal: AbortSignal,
): Promise<SyncResult> {
  const errors: SyncError[] = [];
  let ok = 0;
  let done = 0;
  let total = 1;

  callbacks.onProgress({ total, done, label: "Classificació" });

  let standings: StandingsSnapshot | undefined;
  try {
    standings = await fetchStandings(signal);
    await writeEntry(KEY.standings, standings);
    ok += 1;
  } catch (error) {
    if (!signal.aborted) {
      errors.push({ label: "Classificació", message: errorMessage(error) });
    }
  }

  done += 1;
  callbacks.onProgress({ total, done, label: "Classificació" });

  if (signal.aborted) {
    if (ok > 0) await setLastSync(Date.now());
    return { ok, failed: errors.length, errors, cancelled: true };
  }

  const dates = dateRange(todayIso(), Math.max(0, profile.days));
  const tasks: Task[] = [];

  for (const date of dates) {
    tasks.push({
      label: `Partits · ${date}`,
      run: () =>
        fetchScoreboard(date, signal).then((day) =>
          writeEntry(KEY.scoreboard(date), day),
        ),
    });
  }

  for (const category of LEADER_CATEGORIES) {
    tasks.push({
      label: `Líders · ${category.label}`,
      run: () =>
        fetchLeaders(category, signal).then((snapshot) =>
          writeEntry(KEY.leaders(category.key), snapshot),
        ),
    });
  }

  if (profile.includeTeamDetails) {
    let teams: Team[] = [];

    if (standings) {
      teams = [...standings.east, ...standings.west].map((row) => row.team);
    } else {
      const cached = await readEntry<StandingsSnapshot>(KEY.standings);
      if (cached) {
        teams = [...cached.data.east, ...cached.data.west].map(
          (row) => row.team,
        );
      }
    }

    for (const team of teams) {
      tasks.push({
        label: `Equip · ${team.shortName}`,
        run: () =>
          fetchTeamDetail(team.id, signal).then((detail) =>
            writeEntry(KEY.team(team.id), detail),
          ),
      });
    }
  }

  total += tasks.length;
  callbacks.onProgress({
    total,
    done,
    label: tasks.length > 0 ? "Descarregant dades…" : "Fet",
  });

  let cursor = 0;
  const concurrency = Math.min(4, tasks.length);

  const workers = Array.from({ length: concurrency }, async () => {
    while (true) {
      if (signal.aborted) return;

      const index = cursor;
      cursor += 1;
      if (index >= tasks.length) return;

      const task = tasks[index];
      callbacks.onProgress({ total, done, label: task.label });

      try {
        await task.run();
        ok += 1;
      } catch (error) {
        if (signal.aborted) return;
        errors.push({ label: task.label, message: errorMessage(error) });
      } finally {
        if (!signal.aborted) {
          done += 1;
          callbacks.onProgress({ total, done, label: task.label });
        }
      }
    }
  });

  await Promise.all(workers);

  const cancelled = signal.aborted;
  if (ok > 0) await setLastSync(Date.now());

  return {
    ok,
    failed: errors.length,
    errors,
    cancelled,
  };
}

export async function downloadDay(
  date: string,
  signal?: AbortSignal,
): Promise<void> {
  const day = await fetchScoreboard(date, signal);
  await writeEntry(KEY.scoreboard(date), day);
}

export async function downloadTeam(
  teamId: string,
  signal?: AbortSignal,
): Promise<TeamDetail> {
  const detail = await fetchTeamDetail(teamId, signal);
  await writeEntry(KEY.team(teamId), detail);
  return detail;
}

export async function downloadPlayer(
  playerId: string,
  signal?: AbortSignal,
): Promise<PlayerDetail> {
  const detail = await fetchPlayerDetail(playerId, signal);
  await writeEntry(KEY.player(playerId), detail);
  return detail;
}
