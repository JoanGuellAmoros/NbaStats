export type BoxColumn = {
  key: string;
  label: string;
};

const FG_KEY = "fieldGoalsMade-fieldGoalsAttempted";
const THREE_KEY =
  "threePointFieldGoalsMade-threePointFieldGoalsAttempted";
const FT_KEY = "freeThrowsMade-freeThrowsAttempted";

export const BOX_COLUMNS: BoxColumn[] = [
  { key: "minutes", label: "MIN" },
  { key: "points", label: "PTS" },
  { key: "rebounds", label: "REB" },
  { key: "assists", label: "AST" },
  { key: "valuation", label: "VAL" },
  { key: "twoPoints", label: "2P" },
  { key: THREE_KEY, label: "3P" },
  { key: FT_KEY, label: "FT" },
  { key: "offensiveRebounds", label: "OREB" },
  { key: "defensiveRebounds", label: "DREB" },
  { key: "steals", label: "STL" },
  { key: "turnovers", label: "TO" },
  { key: "blocks", label: "BLK" },
  { key: "fouls", label: "PF" },
  { key: "plusMinus", label: "+/-" },
];

function number(value?: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function shooting(value?: string): [number, number] {
  if (!value || value === "—") return [0, 0];
  const [made, attempted] = value.split("-").map(Number);
  return [made || 0, attempted || 0];
}

export function valuation(stats: Record<string, string>): number {
  const [fgMade, fgAttempted] = shooting(stats[FG_KEY]);
  const [threeMade, threeAttempted] = shooting(stats[THREE_KEY]);
  const [ftMade, ftAttempted] = shooting(stats[FT_KEY]);

  const twoMade = fgMade - threeMade;
  const twoAttempted = fgAttempted - threeAttempted;

  return (
    number(stats.points) +
    number(stats.rebounds) +
    number(stats.assists) +
    number(stats.steals) +
    number(stats.blocks) +
    twoMade -
    twoAttempted +
    threeMade -
    threeAttempted +
    ftMade -
    ftAttempted
  );
}

export function twoPoints(stats: Record<string, string>): string {
  const [fgMade, fgAttempted] = shooting(stats[FG_KEY]);
  const [threeMade, threeAttempted] = shooting(stats[THREE_KEY]);
  return `${fgMade - threeMade}-${fgAttempted - threeAttempted}`;
}

export function boxValue(
  stats: Record<string, string> | undefined,
  key: string,
): string {
  if (!stats) return "—";
  if (key === "valuation") return String(valuation(stats));
  if (key === "twoPoints") return twoPoints(stats);
  return stats[key] ?? "—";
}
