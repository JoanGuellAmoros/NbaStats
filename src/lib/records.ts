import type { GameDetail, GameSide, Team } from "./types";
import { shooting, valuation } from "./boxscore";
import { decimal, integer } from "./format";

export type RecordMetricKey =
  | "points"
  | "rebounds"
  | "assists"
  | "valuation"
  | "fieldGoalsMade"
  | "fieldGoalsMissed"
  | "twoPointersMade"
  | "twoPointersMissed"
  | "threePointersMade"
  | "threePointersMissed"
  | "freeThrowsMade"
  | "freeThrowsMissed"
  | "offensiveRebounds"
  | "defensiveRebounds"
  | "steals"
  | "blocks"
  | "turnovers"
  | "plusMinus"
  | "minutes";

export type TeamRecordMetricKey =
  | "teamPoints"
  | "winMargin"
  | "teamRebounds"
  | "teamAssists"
  | "teamSteals"
  | "teamBlocks";

export type RecordValueFormat = "integer" | "minutes" | "signed";

export type RecordMetric<K extends string = string> = {
  key: K;
  label: string;
  short: string;
  format: RecordValueFormat;
};

export type RecordEntry = {
  id: string;
  name: string;
  team: Team;
  value: number;
  gameId: string;
  date: string;
  opponent: Team;
  homeAway: "home" | "away";
  teamScore: number;
  opponentScore: number;
  won: boolean;
};

export type RankedRecordEntry = RecordEntry & {
  rank: number;
  tied: boolean;
};

export type RecordCategory = RecordMetric<RecordMetricKey> & {
  entries: RankedRecordEntry[];
};

export type TeamRecordCategory = RecordMetric<TeamRecordMetricKey> & {
  entries: RankedRecordEntry[];
};

export type RecordsResult = {
  categories: RecordCategory[];
  teamCategories: TeamRecordCategory[];
  games: number;
  players: number;
  teams: number;
};

export type RecordBreak = {
  scope: "player" | "team";
  categoryKey: string;
  label: string;
  short: string;
  format: RecordValueFormat;
  name: string;
  team: Team;
  value: number;
  previous: number;
  /** Noms dels qui tenien el rècord anterior (pot haver-hi empat). */
  previousNames: string[];
  equalled: boolean;
  gameId: string;
  date: string;
};

const FG_KEY = "fieldGoalsMade-fieldGoalsAttempted";
const THREE_KEY =
  "threePointFieldGoalsMade-threePointFieldGoalsAttempted";
const FT_KEY = "freeThrowsMade-freeThrowsAttempted";

const TOP_LIMIT = 5;

export const RECORD_METRICS: RecordMetric<RecordMetricKey>[] = [
  { key: "points", label: "Punts", short: "PTS", format: "integer" },
  { key: "rebounds", label: "Rebots", short: "REB", format: "integer" },
  { key: "assists", label: "Assistències", short: "AST", format: "integer" },
  { key: "valuation", label: "Valoració", short: "VAL", format: "integer" },
  {
    key: "fieldGoalsMade",
    label: "Tirs de camp anotats",
    short: "TCA",
    format: "integer",
  },
  {
    key: "fieldGoalsMissed",
    label: "Tirs de camp fallats",
    short: "TCF",
    format: "integer",
  },
  {
    key: "twoPointersMade",
    label: "Tirs de 2 anotats",
    short: "2PA",
    format: "integer",
  },
  {
    key: "twoPointersMissed",
    label: "Tirs de 2 fallats",
    short: "2PF",
    format: "integer",
  },
  {
    key: "threePointersMade",
    label: "Triples anotats",
    short: "3PA",
    format: "integer",
  },
  {
    key: "threePointersMissed",
    label: "Triples fallats",
    short: "3PF",
    format: "integer",
  },
  {
    key: "freeThrowsMade",
    label: "Tirs lliures anotats",
    short: "TLA",
    format: "integer",
  },
  {
    key: "freeThrowsMissed",
    label: "Tirs lliures fallats",
    short: "TLF",
    format: "integer",
  },
  {
    key: "offensiveRebounds",
    label: "Rebots ofensius",
    short: "RO",
    format: "integer",
  },
  {
    key: "defensiveRebounds",
    label: "Rebots defensius",
    short: "RD",
    format: "integer",
  },
  { key: "steals", label: "Robatoris", short: "ROB", format: "integer" },
  { key: "blocks", label: "Taps", short: "TAP", format: "integer" },
  { key: "turnovers", label: "Pèrdues", short: "PÉR", format: "integer" },
  { key: "plusMinus", label: "Plus/minus", short: "+/−", format: "signed" },
  { key: "minutes", label: "Minuts jugats", short: "MIN", format: "minutes" },
];

export const TEAM_RECORD_METRICS: RecordMetric<TeamRecordMetricKey>[] = [
  {
    key: "teamPoints",
    label: "Punts d'equip",
    short: "PTS",
    format: "integer",
  },
  {
    key: "winMargin",
    label: "Marge de victòria",
    short: "MARGE",
    format: "integer",
  },
  {
    key: "teamRebounds",
    label: "Rebots d'equip",
    short: "REB",
    format: "integer",
  },
  {
    key: "teamAssists",
    label: "Assistències d'equip",
    short: "AST",
    format: "integer",
  },
  {
    key: "teamSteals",
    label: "Robatoris d'equip",
    short: "ROB",
    format: "integer",
  },
  {
    key: "teamBlocks",
    label: "Taps d'equip",
    short: "TAP",
    format: "integer",
  },
];

type PlayerLine = Record<RecordMetricKey, number>;

function number(value?: string): number {
  if (!value || value === "—") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function playedMinutes(value?: string): number {
  if (!value || value === "—") return 0;
  if (value.includes(":")) {
    const [whole, fraction] = value.split(":").map(Number);
    return (whole || 0) + (fraction || 0) / 60;
  }
  return number(value);
}

function playerLine(stats: Record<string, string>): PlayerLine {
  const [fgm, fga] = shooting(stats[FG_KEY]);
  const [tpm, tpa] = shooting(stats[THREE_KEY]);
  const [ftm, fta] = shooting(stats[FT_KEY]);
  const twoMade = fgm - tpm;
  const twoAttempted = fga - tpa;

  return {
    points: number(stats.points),
    rebounds: number(stats.rebounds),
    assists: number(stats.assists),
    valuation: valuation(stats),
    fieldGoalsMade: fgm,
    fieldGoalsMissed: Math.max(0, fga - fgm),
    twoPointersMade: twoMade,
    twoPointersMissed: Math.max(0, twoAttempted - twoMade),
    threePointersMade: tpm,
    threePointersMissed: Math.max(0, tpa - tpm),
    freeThrowsMade: ftm,
    freeThrowsMissed: Math.max(0, fta - ftm),
    offensiveRebounds: number(stats.offensiveRebounds),
    defensiveRebounds: number(stats.defensiveRebounds),
    steals: number(stats.steals),
    blocks: number(stats.blocks),
    turnovers: number(stats.turnovers),
    plusMinus: number(stats.plusMinus),
    minutes: playedMinutes(stats.minutes),
  };
}

function sideScore(side: GameSide): number | undefined {
  const parsed = Number(side.score);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function teamTotal(
  box: GameDetail["boxscore"][number],
  key: string,
): number {
  const total = number(box.totals?.[key]);
  if (total > 0) return total;

  return box.players
    .filter((player) => !player.didNotPlay)
    .reduce((sum, player) => sum + number(player.stats[key]), 0);
}

function byValue(a: RecordEntry, b: RecordEntry): number {
  return (
    b.value - a.value ||
    b.date.localeCompare(a.date) ||
    a.name.localeCompare(b.name)
  );
}

/**
 * Ordena de millor a pitjor i retorna els TOP_LIMIT valors distints. Si hi ha
 * empat en el tall (o en qualsevol posició), s'inclouen totes les entrades
 * empatades amb el mateix rang.
 */
function rankEntries(entries: RecordEntry[]): RankedRecordEntry[] {
  const sorted = [...entries].sort(byValue);
  const ranked: RankedRecordEntry[] = [];
  let index = 0;
  let groups = 0;

  while (index < sorted.length && groups < TOP_LIMIT) {
    const value = sorted[index].value;
    let end = index;
    while (end < sorted.length && sorted[end].value === value) end += 1;

    const group = sorted.slice(index, end);
    for (const entry of group) {
      ranked.push({ ...entry, rank: index + 1, tied: group.length > 1 });
    }

    index = end;
    groups += 1;
  }

  return ranked;
}

export function computeRecords(details: GameDetail[]): RecordsResult {
  const seenGames = new Set<string>();
  const players = new Set<string>();
  const teams = new Set<string>();
  const buckets = new Map<RecordMetricKey, RecordEntry[]>(
    RECORD_METRICS.map((metric) => [metric.key, []]),
  );
  const teamBuckets = new Map<TeamRecordMetricKey, RecordEntry[]>(
    TEAM_RECORD_METRICS.map((metric) => [metric.key, []]),
  );
  let games = 0;

  for (const detail of details) {
    if (detail.game.state !== "post" || seenGames.has(detail.game.id)) continue;
    seenGames.add(detail.game.id);

    let used = false;

    for (const box of detail.boxscore) {
      const isHome = box.homeAway === "home";
      const ownSide = isHome ? detail.game.home : detail.game.away;
      const rivalSide = isHome ? detail.game.away : detail.game.home;
      const teamScore = sideScore(ownSide) ?? 0;
      const opponentScore = sideScore(rivalSide) ?? 0;

      const teamBase = {
        id: box.team.id,
        name: box.team.name,
        team: box.team,
        gameId: detail.game.id,
        date: detail.game.date,
        opponent: rivalSide.team,
        homeAway: box.homeAway,
        teamScore,
        opponentScore,
        won: Boolean(ownSide.winner) || teamScore > opponentScore,
      };

      const teamLine: Record<TeamRecordMetricKey, number> = {
        teamPoints: teamScore,
        winMargin:
          teamScore > opponentScore ? teamScore - opponentScore : 0,
        teamRebounds: teamTotal(box, "rebounds"),
        teamAssists: teamTotal(box, "assists"),
        teamSteals: teamTotal(box, "steals"),
        teamBlocks: teamTotal(box, "blocks"),
      };

      for (const metric of TEAM_RECORD_METRICS) {
        const value = teamLine[metric.key];
        if (value <= 0) continue;
        used = true;
        teams.add(box.team.id);
        teamBuckets
          .get(metric.key)
          ?.push({ ...teamBase, value });
      }

      for (const player of box.players) {
        if (player.didNotPlay) continue;
        if (playedMinutes(player.stats.minutes) <= 0) continue;

        used = true;
        const id = player.id || `${box.team.id}:${player.name}`;
        players.add(id);

        const line = playerLine(player.stats);
        const base = {
          id,
          name: player.name,
          team: box.team,
          gameId: detail.game.id,
          date: detail.game.date,
          opponent: rivalSide.team,
          homeAway: box.homeAway,
          teamScore,
          opponentScore,
          won: Boolean(ownSide.winner) || teamScore > opponentScore,
        };

        for (const metric of RECORD_METRICS) {
          const value = line[metric.key];
          if (value === 0) continue;
          // La resta de mètriques es basen en fets positius: un valor negatiu
          // (per exemple una valoració negativa) no és cap rècord positiu.
          if (value < 0 && metric.format !== "signed") continue;
          buckets.get(metric.key)?.push({ ...base, value });
        }
      }
    }

    if (used) games += 1;
  }

  const categories = RECORD_METRICS.map((metric) => ({
    ...metric,
    entries: rankEntries(buckets.get(metric.key) ?? []),
  })).filter((category) => category.entries.length > 0);

  const teamCategories = TEAM_RECORD_METRICS.map((metric) => ({
    ...metric,
    entries: rankEntries(teamBuckets.get(metric.key) ?? []),
  })).filter((category) => category.entries.length > 0);

  return {
    categories,
    teamCategories,
    games,
    players: players.size,
    teams: teams.size,
  };
}

export function recordValue(
  metric: Pick<RecordMetric, "format">,
  value: number,
): string {
  if (metric.format === "minutes") return decimal(value, 1);
  if (metric.format === "signed") {
    if (value === 0) return "0";
    return `${value > 0 ? "+" : "−"}${integer(Math.abs(value))}`;
  }
  return integer(value);
}

/**
 * Retorna els rècords vigents després d'una descàrrega que hagin millorat el
 * màxim anterior. Només es tenen en compte els líders actuals (rang 1, amb
 * tots els empatats) i els partits acabats de descarregar.
 */
export function findRecordBreaks(
  previous: RecordsResult,
  next: RecordsResult,
  gameIds: Iterable<string>,
): RecordBreak[] {
  const downloaded = new Set(gameIds);
  const result: RecordBreak[] = [];

  const collect = (
    previousCategories: (RecordCategory | TeamRecordCategory)[],
    nextCategories: (RecordCategory | TeamRecordCategory)[],
    scope: RecordBreak["scope"],
  ) => {
    const before = new Map(
      previousCategories.map((category) => [
        category.key,
        category.entries[0]?.value ?? null,
      ]),
    );
    const previousLeaders = new Map(
      previousCategories.map((category) => [
        category.key,
        category.entries.filter((entry) => entry.rank === 1),
      ]),
    );

    for (const category of nextCategories) {
      const previousBest = before.get(category.key) ?? null;
      const previousHolders = previousLeaders.get(category.key) ?? [];

      for (const entry of category.entries) {
        if (entry.rank !== 1) continue;
        if (!downloaded.has(entry.gameId)) continue;
        // Sense un màxim anterior no es pot "superar" ni "igualar" res: el
        // primer registre d'una categoria no genera avís.
        if (previousBest === null) continue;

        const equalled = Math.abs(entry.value - previousBest) < 1e-9;
        if (!equalled && entry.value < previousBest) continue;

        result.push({
          scope,
          categoryKey: category.key,
          label: category.label,
          short: category.short,
          format: category.format,
          name: entry.name,
          team: entry.team,
          value: entry.value,
          previous: previousBest,
          previousNames: previousHolders.map((holder) => holder.name),
          equalled,
          gameId: entry.gameId,
          date: entry.date,
        });
      }
    }
  };

  collect(previous.categories, next.categories, "player");
  collect(previous.teamCategories, next.teamCategories, "team");

  return result;
}
