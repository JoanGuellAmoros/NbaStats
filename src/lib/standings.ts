import type { GameDetail, Standing, StandingsSnapshot } from "./types";

/**
 * Marge després del salt inicial per donar el partit per acabat. Serveix per
 * decidir si un partit pot estar inclòs a la classificació d'ESPN: si el
 * snapshot es va desar abans que el partit acabés, el resultat no hi és.
 */
const GAME_END_MARGIN_MS = 3.5 * 60 * 60 * 1000;

type AddedRecord = {
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  results: ("W" | "L")[];
};

export type StandingsWithResults = {
  snapshot: StandingsSnapshot;
  appliedGames: number;
};

function number(value?: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sideScore(value?: string): number | null {
  const parsed = number(value);
  return parsed === null ? null : parsed;
}

function pctText(wins: number, losses: number): string {
  const games = wins + losses;
  if (games === 0) return ".000";
  const pct = wins / games;
  return `.${Math.round(pct * 1000).toString().padStart(3, "0")}`;
}

function streakLetter(record: Standing["record"]): {
  letter: "W" | "L";
  count: number;
} | null {
  const match = /^([WL])(\d+)$/i.exec((record.streak ?? "").trim());
  if (!match) return null;
  return {
    letter: match[1].toUpperCase() === "W" ? "W" : "L",
    count: Number(match[2]) || 0,
  };
}

function gbText(leader: Standing, row: Standing): string {
  const difference =
    (leader.record.wins - row.record.wins +
      (row.record.losses - leader.record.losses)) /
    2;
  if (difference <= 0) return "-";
  return difference.toFixed(1);
}

function sortAndSeed(rows: Standing[]): Standing[] {
  const sorted = [...rows].sort((a, b) => {
    const aPct = a.record.wins / Math.max(1, a.record.wins + a.record.losses);
    const bPct = b.record.wins / Math.max(1, b.record.wins + b.record.losses);
    if (bPct !== aPct) return bPct - aPct;
    if (b.record.wins !== a.record.wins) return b.record.wins - a.record.wins;
    if (a.record.losses !== b.record.losses) {
      return a.record.losses - b.record.losses;
    }
    return a.team.shortName.localeCompare(b.team.shortName);
  });

  const leader = sorted[0];
  return sorted.map((row, index) => ({
    ...row,
    record: {
      ...row.record,
      seed: index + 1,
      gb: leader ? gbText(leader, row) : "-",
    },
  }));
}

/**
 * Afegeix a la classificació els resultats dels partits descarregats que,
 * segons l'hora en què es va desar el snapshot, no hi podien ser inclosos.
 * Així la classificació també es calcula amb els partits jugats que l'usuari
 * ha descarregat, sense comptar-los dues vegades si ESPN ja els incloïa.
 */
export function applyGameResults(
  snapshot: StandingsSnapshot,
  fetchedAt: number,
  details: GameDetail[],
): StandingsWithResults {
  const rows = new Map<string, Standing>();
  for (const row of [...snapshot.east, ...snapshot.west]) {
    rows.set(row.team.id, row);
  }

  const seen = new Set<string>();
  const added = new Map<string, AddedRecord>();

  const games = details
    .filter((detail) => {
      if (detail.game.state !== "post") return false;
      if (seen.has(detail.game.id)) return false;
      const homeId = detail.game.home.team.id;
      const awayId = detail.game.away.team.id;
      if (!rows.has(homeId) || !rows.has(awayId)) return false;

      const homeScore = sideScore(detail.game.home.score);
      const awayScore = sideScore(detail.game.away.score);
      if (homeScore === null || awayScore === null) return false;

      // Sense data de desada (0) s'aplica tot el que hi hagi descarregat.
      if (fetchedAt > 0) {
        const start = new Date(detail.game.date).getTime();
        if (
          Number.isFinite(start) &&
          fetchedAt > start + GAME_END_MARGIN_MS
        ) {
          return false;
        }
      }

      seen.add(detail.game.id);
      return true;
    })
    .sort(
      (a, b) =>
        new Date(a.game.date).getTime() - new Date(b.game.date).getTime(),
    );

  for (const detail of games) {
    const homeScore = sideScore(detail.game.home.score) ?? 0;
    const awayScore = sideScore(detail.game.away.score) ?? 0;

    for (const [id, own, rival] of [
      [detail.game.home.team.id, homeScore, awayScore],
      [detail.game.away.team.id, awayScore, homeScore],
    ] as const) {
      const current = added.get(id) ?? {
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        results: [],
      };
      current.pointsFor += own;
      current.pointsAgainst += rival;
      if (own > rival) {
        current.wins += 1;
        current.results.push("W");
      } else {
        current.losses += 1;
        current.results.push("L");
      }
      added.set(id, current);
    }
  }

  const appliedGames = games.length;
  if (appliedGames === 0) {
    return { snapshot, appliedGames };
  }

  const adjust = (row: Standing): Standing => {
    const record = added.get(row.team.id);
    if (!record) return row;

    const oldGames = row.record.wins + row.record.losses;
    const addedGames = record.wins + record.losses;
    if (addedGames === 0) return row;

    const wins = row.record.wins + record.wins;
    const losses = row.record.losses + record.losses;
    const totalGames = oldGames + addedGames;

    const ppgOld = number(row.record.ppg);
    const oppgOld = number(row.record.oppg);
    const diffOld = number(row.record.diff);
    const ppg =
      ppgOld === null || oldGames === 0
        ? record.pointsFor / addedGames
        : (ppgOld * oldGames + record.pointsFor) / totalGames;
    const oppg =
      oppgOld === null || oldGames === 0
        ? record.pointsAgainst / addedGames
        : (oppgOld * oldGames + record.pointsAgainst) / totalGames;
    const diff =
      diffOld === null || oldGames === 0
        ? (record.pointsFor - record.pointsAgainst) / addedGames
        : (diffOld * oldGames +
            (record.pointsFor - record.pointsAgainst)) /
          totalGames;

    let streak = streakLetter(row.record);
    for (const result of record.results) {
      if (streak && streak.letter === result) {
        streak = { letter: result, count: streak.count + 1 };
      } else {
        streak = { letter: result, count: 1 };
      }
    }

    return {
      ...row,
      record: {
        ...row.record,
        wins,
        losses,
        pct: pctText(wins, losses),
        ppg: ppg.toFixed(1),
        oppg: oppg.toFixed(1),
        diff: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}`,
        streak: streak ? `${streak.letter}${streak.count}` : row.record.streak,
      },
    };
  };

  return {
    snapshot: {
      ...snapshot,
      east: sortAndSeed(snapshot.east.map(adjust)),
      west: sortAndSeed(snapshot.west.map(adjust)),
    },
    appliedGames,
  };
}
