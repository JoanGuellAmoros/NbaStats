import type { Game } from "./types";
import { isPastDay, nbaCalendarDate } from "./format";

export function gameCalendarDay(game: Game): string {
  return game.day ?? nbaCalendarDate(game.date);
}

export function canViewGameDetail(game: Game): boolean {
  return isPastDay(gameCalendarDay(game));
}
