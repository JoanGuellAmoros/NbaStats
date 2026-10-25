const SITE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const WEB = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba";
const WEB_V2 = "https://site.web.api.espn.com/apis/v2/sports/basketball/nba";

type Logo = { href: string };

export type TeamRef = {
  id: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName?: string;
  name?: string;
  location?: string;
  nickname?: string;
  slug?: string;
  color?: string;
  alternateColor?: string;
  logo?: string;
  logos?: Logo[];
  groups?: { id?: string; name?: string; abbreviation?: string };
  standingSummary?: string;
};

export type Competitor = {
  id: string;
  homeAway: "home" | "away";
  winner?: boolean;
  score?: string;
  team: TeamRef;
  records?: { summary?: string; type?: string }[];
};

export type GameStatus = {
  clock?: number;
  displayClock?: string;
  period?: number;
  type: {
    id: string;
    name: string;
    state: "pre" | "in" | "post";
    completed: boolean;
    description: string;
    detail: string;
    shortDetail: string;
  };
};

export type Game = {
  id: string;
  date: string;
  name: string;
  shortName: string;
  season?: { year?: number; type?: number };
  competitions?: {
    competitors?: Competitor[];
    status?: GameStatus;
    venue?: { fullName?: string; address?: { city?: string } };
    broadcasts?: { market?: string; names?: string[] }[];
  }[];
};

export type Scoreboard = {
  events?: Game[];
  day?: { date?: string };
  season?: { year?: number; type?: number };
};

export type StandingStat = {
  name: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  value?: number;
  displayValue: string;
};

export type StandingEntry = {
  team: TeamRef;
  stats: StandingStat[];
};

export type Conference = {
  id?: string;
  name: string;
  abbreviation?: string;
  standings?: { entries?: StandingEntry[] };
};

export type Standings = {
  children?: Conference[];
  season?: { year?: number; displayName?: string };
};

export type TeamsResponse = {
  sports?: {
    leagues?: { teams?: { team: TeamRef }[] }[];
  }[];
};

export type Athlete = {
  id: string;
  fullName?: string;
  displayName: string;
  jersey?: string;
  position?: { abbreviation?: string; displayName?: string; name?: string };
  headshot?: { href?: string };
  age?: number;
  displayHeight?: string;
  displayWeight?: string;
  experience?: { years?: number };
  status?: { name?: string; type?: string };
};

export type RosterResponse = {
  team?: TeamRef;
  athletes?: Athlete[];
};

export type ScheduleResponse = {
  team?: TeamRef;
  events?: Game[];
};

export type Article = {
  id: string | number;
  headline: string;
  description?: string;
  published: string;
  images?: { url?: string; caption?: string }[];
  links?: { web?: { href?: string } };
};

export type NewsResponse = {
  articles?: Article[];
};

export type LeaderAthlete = {
  athlete: {
    id: string;
    displayName: string;
    shortName?: string;
    jersey?: string;
    headshot?: { href?: string };
    position?: { abbreviation?: string };
    teamName?: string;
    teamShortName?: string;
    teamId?: string;
    teamLogos?: Logo[];
  };
  categories: { name: string; values: number[]; totals?: string[] }[];
};

export type LeadersResponse = {
  categories?: { name: string; displayName?: string; names: string[] }[];
  athletes?: LeaderAthlete[];
  pagination?: { count?: number; limit?: number; page?: number };
};

export type PlayerResponse = {
  athlete?: {
    id: string;
    fullName?: string;
    displayName: string;
    jersey?: string;
    position?: { abbreviation?: string; displayName?: string };
    team?: TeamRef;
    headshot?: { href?: string };
    displayHeight?: string;
    displayWeight?: string;
    displayDOB?: string;
    displayBirthPlace?: string;
    age?: number;
    college?: { name?: string } | string;
    displayExperience?: string;
    displayDraft?: { displayText?: string } | string;
    statsSummary?: {
      displayName?: string;
      statistics?: {
        name: string;
        displayName?: string;
        shortDisplayName?: string;
        displayValue: string;
        value?: number;
        rank?: number;
        rankDisplayValue?: string;
      }[];
    };
  };
  season?: { year?: number; displayName?: string };
};

async function getJSON<T>(url: string, revalidate: number): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "application/json",
    },
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`ESPN ${res.status} · ${url}`);
  }

  return (await res.json()) as T;
}

export function getScoreboard(date?: string): Promise<Scoreboard> {
  const query = date ? `?dates=${date}` : "";
  return getJSON<Scoreboard>(`${SITE}/scoreboard${query}`, 60);
}

export function getStandings(): Promise<Standings> {
  return getJSON<Standings>(
    `${WEB_V2}/standings?region=us&lang=en&contentorigin=espn&type=0&level=2&sort=winpercent%3Adesc&seasontype=2`,
    300,
  );
}

export async function getTeams(): Promise<TeamRef[]> {
  const data = await getJSON<TeamsResponse>(`${SITE}/teams`, 3600);
  return data.sports?.[0]?.leagues?.[0]?.teams?.map((entry) => entry.team) ?? [];
}

export async function getTeam(teamId: string): Promise<TeamRef> {
  const data = await getJSON<{ team: TeamRef }>(
    `${SITE}/teams/${teamId}`,
    3600,
  );
  return data.team;
}

export function getTeamRoster(teamId: string): Promise<RosterResponse> {
  return getJSON<RosterResponse>(`${SITE}/teams/${teamId}/roster`, 3600);
}

export function getTeamSchedule(teamId: string): Promise<ScheduleResponse> {
  return getJSON<ScheduleResponse>(`${SITE}/teams/${teamId}/schedule`, 600);
}

export function getNews(limit = 8): Promise<NewsResponse> {
  return getJSON<NewsResponse>(`${SITE}/news?limit=${limit}`, 300);
}

export function getPlayerLeaders(
  sort: string,
  limit = 50,
): Promise<LeadersResponse> {
  return getJSON<LeadersResponse>(
    `${WEB}/statistics/byathlete?region=us&lang=en&contentorigin=espn&isqualified=true&page=1&limit=${limit}&sort=${encodeURIComponent(sort)}`,
    300,
  );
}

export function getPlayer(playerId: string): Promise<PlayerResponse> {
  return getJSON<PlayerResponse>(`${WEB}/athletes/${playerId}`, 3600);
}

export function teamLogo(team?: TeamRef | null): string {
  return team?.logo ?? team?.logos?.[0]?.href ?? "";
}

export function statOf(
  entry: StandingEntry,
  name: string,
): StandingStat | undefined {
  return entry.stats.find((stat) => stat.name === name);
}

export function statText(entry: StandingEntry, name: string): string {
  return statOf(entry, name)?.displayValue ?? "—";
}

export function leaderStatValue(
  response: LeadersResponse,
  athlete: LeaderAthlete,
  key: string,
): number | undefined {
  const definition = response.categories?.find((category) =>
    category.names.includes(key),
  );
  if (!definition) return undefined;

  const category = athlete.categories.find(
    (item) => item.name === definition.name,
  );
  if (!category) return undefined;

  return category.values[definition.names.indexOf(key)];
}
