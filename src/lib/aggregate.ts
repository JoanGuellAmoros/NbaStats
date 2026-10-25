import type { GameDetail, Team } from "./types";
import { valuation } from "./boxscore";

export type AggregatedPlayer = {
  id: string;
  name: string;
  team: Team;
  stats: Record<string, number | undefined>;
};

export type AggregatedLeaders = {
  players: AggregatedPlayer[];
  games: number;
};

type Totals = {
  player: AggregatedPlayer;
  games: number;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  twoPointersMade: number;
  threePointersMade: number;
  freeThrowsMade: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  valuation: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersAttempted: number;
  lastDate: number;
};

function number(value?: string): number {
  if (!value || value === "—") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function minutes(value?: string): number {
  if (!value || value === "—") return 0;
  if (value.includes(":")) {
    const [whole, fraction] = value.split(":").map(Number);
    return (whole || 0) + (fraction || 0) / 60;
  }
  return number(value);
}

function madeAttempted(value?: string): [number, number] {
  if (!value || value === "—") return [0, 0];
  const [made, attempted] = value.split("-").map(Number);
  return [made || 0, attempted || 0];
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function percentage(made: number, attempted: number): number | undefined {
  return attempted > 0 ? round((made / attempted) * 100) : undefined;
}

export function aggregatePlayers(details: GameDetail[]): AggregatedLeaders {
  const seen = new Set<string>();
  const totals = new Map<string, Totals>();
  let games = 0;

  for (const detail of details) {
    if (detail.game.state !== "post" || seen.has(detail.game.id)) continue;
    seen.add(detail.game.id);

    const date = new Date(detail.game.date).getTime();
    let used = false;

    for (const box of detail.boxscore) {
      for (const player of box.players) {
        if (player.didNotPlay) continue;

        const played = minutes(player.stats.minutes);
        if (played <= 0) continue;

        used = true;
        const id = player.id || `${box.team.id}:${player.name}`;
        const [fgm, fga] = madeAttempted(
          player.stats["fieldGoalsMade-fieldGoalsAttempted"],
        );
        const [tpm, tpa] = madeAttempted(
          player.stats[
            "threePointFieldGoalsMade-threePointFieldGoalsAttempted"
          ],
        );
        const [ftm] = madeAttempted(
          player.stats["freeThrowsMade-freeThrowsAttempted"],
        );

        const entry = totals.get(id) ?? {
          player: {
            id,
            name: player.name,
            team: box.team,
            stats: {},
          },
          games: 0,
          minutes: 0,
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0,
          twoPointersMade: 0,
          threePointersMade: 0,
          freeThrowsMade: 0,
          offensiveRebounds: 0,
          defensiveRebounds: 0,
          valuation: 0,
          fieldGoalsMade: 0,
          fieldGoalsAttempted: 0,
          threePointersAttempted: 0,
          lastDate: 0,
        };

        entry.games += 1;
        entry.minutes += played;
        entry.points += number(player.stats.points);
        entry.rebounds += number(player.stats.rebounds);
        entry.assists += number(player.stats.assists);
        entry.steals += number(player.stats.steals);
        entry.blocks += number(player.stats.blocks);
        entry.twoPointersMade += fgm - tpm;
        entry.threePointersMade += tpm;
        entry.freeThrowsMade += ftm;
        entry.offensiveRebounds += number(player.stats.offensiveRebounds);
        entry.defensiveRebounds += number(player.stats.defensiveRebounds);
        entry.valuation += valuation(player.stats);
        entry.fieldGoalsMade += fgm;
        entry.fieldGoalsAttempted += fga;
        entry.threePointersAttempted += tpa;

        if (date >= entry.lastDate) {
          entry.lastDate = date;
          entry.player.name = player.name;
          entry.player.team = box.team;
        }

        totals.set(id, entry);
      }
    }

    if (used) games += 1;
  }

  const players = [...totals.values()]
    .map(({ player, games: played, ...value }) => ({
      ...player,
      stats: {
        gamesPlayed: played,
        avgMinutes: round(value.minutes / played),
        avgPoints: round(value.points / played),
        avgRebounds: round(value.rebounds / played),
        avgAssists: round(value.assists / played),
        avgSteals: round(value.steals / played),
        avgBlocks: round(value.blocks / played),
        avgValuation: round(value.valuation / played),
        avgTwoPointFieldGoalsMade: round(value.twoPointersMade / played),
        avgThreePointFieldGoalsMade: round(
          value.threePointersMade / played,
        ),
        avgFreeThrowsMade: round(value.freeThrowsMade / played),
        avgOffensiveRebounds: round(value.offensiveRebounds / played),
        avgDefensiveRebounds: round(value.defensiveRebounds / played),
        totalMinutes: round(value.minutes, 0),
        totalPoints: value.points,
        totalRebounds: value.rebounds,
        totalAssists: value.assists,
        totalSteals: value.steals,
        totalBlocks: value.blocks,
        totalValuation: value.valuation,
        totalTwoPointFieldGoalsMade: value.twoPointersMade,
        totalThreePointFieldGoalsMade: value.threePointersMade,
        totalFreeThrowsMade: value.freeThrowsMade,
        totalOffensiveRebounds: value.offensiveRebounds,
        totalDefensiveRebounds: value.defensiveRebounds,
        fieldGoalPct: percentage(
          value.fieldGoalsMade,
          value.fieldGoalsAttempted,
        ),
        threePointFieldGoalPct: percentage(
          value.threePointersMade,
          value.threePointersAttempted,
        ),
      },
    }))
    .sort(
      (a, b) =>
        (b.stats.avgPoints ?? 0) - (a.stats.avgPoints ?? 0) ||
        a.name.localeCompare(b.name),
    );

  return { players, games };
}
