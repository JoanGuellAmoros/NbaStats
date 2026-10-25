export type Conference = "East" | "West";

export type Team = {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  color?: string;
  logo?: string;
  conference?: Conference;
};

export type RecordInfo = {
  wins: number;
  losses: number;
  pct: string;
  seed?: number;
  gb?: string;
  streak?: string;
  ppg?: string;
  oppg?: string;
  diff?: string;
  home?: string;
  away?: string;
  last10?: string;
};

export type Standing = {
  team: Team;
  record: RecordInfo;
};

export type StandingsSnapshot = {
  season: string;
  updatedSeason?: number;
  east: Standing[];
  west: Standing[];
};

export type GameState = "pre" | "in" | "post";

export type GameSide = {
  team: Team;
  score?: string;
  winner?: boolean;
  record?: string;
  linescores?: string[];
};

export type Game = {
  id: string;
  date: string;
  name: string;
  shortName: string;
  state: GameState;
  statusLabel: string;
  statusDetail?: string;
  clock?: string;
  period?: number;
  venue?: string;
  broadcast?: string;
  home: GameSide;
  away: GameSide;
};

export type GameDay = {
  date: string;
  season?: string;
  games: Game[];
};

export type GameStat = {
  name: string;
  label: string;
  value: string;
  abbreviation?: string;
};

export type GameTeamStats = {
  team: Team;
  homeAway: "home" | "away";
  stats: GameStat[];
};

export type GameLeaderPlayer = {
  id: string;
  name: string;
  headshot?: string;
  jersey?: string;
  position?: string;
  value: string;
};

export type GameLeaderCategory = {
  key: string;
  label: string;
  players: GameLeaderPlayer[];
};

export type GameTeamLeaders = {
  team: Team;
  categories: GameLeaderCategory[];
};

export type GameBoxColumn = {
  key: string;
  label: string;
};

export type GameBoxPlayer = {
  id: string;
  name: string;
  shortName?: string;
  jersey?: string;
  position?: string;
  headshot?: string;
  starter: boolean;
  didNotPlay: boolean;
  reason?: string;
  stats: Record<string, string>;
};

export type GameBoxTeam = {
  team: Team;
  homeAway: "home" | "away";
  columns: GameBoxColumn[];
  players: GameBoxPlayer[];
  totals?: Record<string, string>;
};

export type GameOfficial = {
  name: string;
  role?: string;
};

export type GameDetail = {
  game: Game;
  season?: string;
  venue?: string;
  venueCity?: string;
  attendance?: number;
  officials: GameOfficial[];
  teamStats: GameTeamStats[];
  leaders: GameTeamLeaders[];
  boxscore: GameBoxTeam[];
};

export type LeaderPlayer = {
  id: string;
  name: string;
  teamId?: string;
  teamAbbreviation?: string;
  teamName?: string;
  headshot?: string;
  position?: string;
  jersey?: string;
  stats: Record<string, number>;
};

export type LeaderSnapshot = {
  category: string;
  stat: string;
  season?: string;
  players: LeaderPlayer[];
};

export type LeaderCategory = {
  key: string;
  label: string;
  short: string;
  description: string;
  sort: string;
  stat: string;
};

export type RosterPlayer = {
  id: string;
  name: string;
  jersey?: string;
  position?: string;
  headshot?: string;
  age?: number;
  height?: string;
  weight?: string;
  experience?: string;
  college?: string;
  status?: string;
};

export type TeamDetail = {
  team: Team;
  record?: string;
  standing?: string;
  season?: string;
  roster: RosterPlayer[];
  schedule: Game[];
};

export type PlayerStat = {
  name: string;
  label: string;
  value: string;
  rank?: number;
  rankLabel?: string;
};

export type PlayerAverage = {
  name: string;
  label: string;
  value: string;
};

export type PlayerDetail = {
  id: string;
  name: string;
  team?: Team;
  jersey?: string;
  position?: string;
  headshot?: string;
  height?: string;
  weight?: string;
  birthDate?: string;
  birthPlace?: string;
  age?: number;
  college?: string;
  experience?: string;
  draft?: string;
  hand?: string;
  status?: string;
  season?: string;
  stats: PlayerStat[];
  averages: PlayerAverage[];
};

export type Settings = {
  days: number;
  includeTeamDetails: boolean;
};

export type SyncProfile = Settings;

export type SyncProgress = {
  total: number;
  done: number;
  label: string;
};

export type SyncError = {
  label: string;
  message: string;
};

export type SyncResult = {
  ok: number;
  failed: number;
  errors: SyncError[];
  cancelled: boolean;
};

export type SyncStatus = "idle" | "running" | "done" | "error" | "cancelled";

export type CacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

export type CacheSummary = {
  total: number;
  standings: number;
  days: number;
  leaders: number;
  teams: number;
  players: number;
  games: number;
};

export type StorageInfo = {
  usage: number;
  quota: number;
  persisted: boolean;
};
