import type {
  Conference,
  Game,
  GameBoxColumn,
  GameBoxPlayer,
  GameBoxTeam,
  GameDay,
  GameDetail,
  GameLeaderCategory,
  GameLeaderPlayer,
  GameOfficial,
  GameSide,
  GameState,
  GameStat,
  GameTeamLeaders,
  GameTeamStats,
  LeaderCategory,
  LeaderPlayer,
  LeaderSnapshot,
  PlayerAverage,
  PlayerDetail,
  PlayerStat,
  RosterPlayer,
  Standing,
  StandingsSnapshot,
  Team,
  TeamDetail,
} from "./types";
import { espnDate, nbaCalendarDate, seasonLabel } from "./format";

const SITE = "https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba";
const WEB = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba";
const WEB_V2 = "https://site.web.api.espn.com/apis/v2/sports/basketball/nba";

const TIMEOUT_MS = 20_000;

async function getJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onAbort, { once: true });
  }

  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`ESPN ha respost ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted) {
      throw new Error("Temps d'espera esgotat");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onAbort);
  }
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeColor(value?: string): string | undefined {
  if (!value) return undefined;
  return value.startsWith("#") ? value : `#${value}`;
}

function pickLogo(raw: any): string | undefined {
  if (!raw) return undefined;
  if (typeof raw.logo === "string") return raw.logo;

  const logos = asArray<any>(raw.logos);
  const preferred =
    logos.find((logo) => asArray<string>(logo?.rel).includes("default")) ??
    logos.find((logo) => asArray<string>(logo?.rel).includes("scoreboard")) ??
    logos[0];

  return preferred?.href;
}

function toTeam(raw: any, conference?: Conference): Team {
  const id = raw?.id !== undefined ? String(raw.id) : "";
  const abbreviation = raw?.abbreviation ?? "—";
  const name =
    raw?.displayName ??
    [raw?.location, raw?.name].filter(Boolean).join(" ") ??
    abbreviation;

  return {
    id,
    name,
    shortName: raw?.shortDisplayName ?? raw?.name ?? raw?.location ?? abbreviation,
    abbreviation,
    color: normalizeColor(raw?.color),
    logo: pickLogo(raw),
    conference,
  };
}

function statOf(stats: any[] | undefined, name: string): any | undefined {
  return asArray<any>(stats).find((stat) => stat?.name === name);
}

function statText(
  stats: any[] | undefined,
  name: string,
  fallback = "—",
): string {
  return statOf(stats, name)?.displayValue ?? fallback;
}

function statNumber(
  stats: any[] | undefined,
  name: string,
): number | undefined {
  const value = statOf(stats, name)?.value;
  return typeof value === "number" ? value : undefined;
}

function toStanding(entry: any, conference: Conference): Standing {
  const stats = asArray<any>(entry?.stats);

  return {
    team: toTeam(entry?.team, conference),
    record: {
      wins: statNumber(stats, "wins") ?? 0,
      losses: statNumber(stats, "losses") ?? 0,
      pct: statText(stats, "winPercent", ".000"),
      seed: statNumber(stats, "playoffSeed"),
      gb: statText(stats, "gamesBehind"),
      streak: statText(stats, "streak"),
      ppg: statText(stats, "avgPointsFor"),
      oppg: statText(stats, "avgPointsAgainst"),
      diff: statText(stats, "differential"),
      home: statText(stats, "Home"),
      away: statText(stats, "Road"),
      last10: statText(stats, "Last Ten Games"),
    },
  };
}

function sortStandings(rows: Standing[]): Standing[] {
  return [...rows].sort((a, b) => {
    const seedA = a.record.seed ?? Number.MAX_SAFE_INTEGER;
    const seedB = b.record.seed ?? Number.MAX_SAFE_INTEGER;
    if (seedA !== seedB) return seedA - seedB;
    return b.record.wins - a.record.wins;
  });
}

function scoreText(score: any): string | undefined {
  if (score === null || score === undefined) return undefined;
  if (typeof score === "string" || typeof score === "number") {
    return String(score);
  }
  return score.displayValue ?? (score.value != null ? String(score.value) : undefined);
}

function normalizeGameState(status: any): GameState {
  const state = status?.type?.state;
  if (state === "post" || status?.type?.completed) return "post";
  if (state === "in") return "in";
  return "pre";
}

function statusLabel(status: any, state: GameState): string {
  if (state === "post") {
    const detail = String(status?.type?.detail ?? "");
    const period = Number(status?.period ?? 0);
    return /ot/i.test(detail) || period > 4 ? "Final · OT" : "Final";
  }

  if (state === "in") {
    if (
      /halftime/i.test(String(status?.type?.description ?? "")) ||
      (/half/i.test(String(status?.type?.shortDetail ?? "")) &&
        Number(status?.displayClock?.split(":")?.[0] ?? 1) === 0)
    ) {
      return "Descans";
    }
    return `${status?.period ?? 1}Q · ${status?.displayClock ?? ""}`.trim();
  }

  return "Programat";
}

function broadcastText(competition: any): string | undefined {
  const names: string[] = [];
  for (const broadcast of asArray<any>(competition?.broadcasts)) {
    for (const name of asArray<string>(broadcast?.names)) names.push(name);
    if (typeof broadcast?.media?.shortName === "string") {
      names.push(broadcast.media.shortName);
    }
  }
  return names.length > 0 ? [...new Set(names)].join(", ") : undefined;
}

function toGameSide(competitor: any, fallbackTeam?: Team): GameSide {
  const team = toTeam(competitor?.team);
  const records = asArray<any>(competitor?.records);
  const record =
    records.find((entry) => entry?.type === "total")?.summary ??
    records[0]?.summary;

  const linescores = asArray<any>(competitor?.linescores)
    .map((line) => scoreText(line?.displayValue ?? line?.value))
    .filter((line): line is string => Boolean(line));

  return {
    team:
      fallbackTeam && team.id === fallbackTeam.id
        ? { ...team, ...fallbackTeam, conference: team.conference }
        : team,
    score: scoreText(competitor?.score),
    winner: Boolean(competitor?.winner),
    record,
    linescores: linescores.length > 0 ? linescores : undefined,
  };
}

function normalizeGame(
  event: any,
  fallbackTeam?: Team,
  day?: string,
): Game | null {
  const competition = asArray<any>(event?.competitions)[0];
  const competitors = asArray<any>(competition?.competitors);
  const home = competitors.find((entry) => entry?.homeAway === "home");
  const away = competitors.find((entry) => entry?.homeAway === "away");

  if (!home || !away) return null;

  const status = competition?.status;
  const state = normalizeGameState(status);

  const homeSide = toGameSide(home, fallbackTeam);
  const awaySide = toGameSide(away, fallbackTeam);

  // ESPN returns "0" for games that have not started yet.
  if (state === "pre") {
    homeSide.score = undefined;
    awaySide.score = undefined;
  }

  const date = event?.date ?? competition?.date;

  return {
    id: String(event?.id ?? competition?.id ?? `${home?.team?.id}-${away?.team?.id}`),
    date,
    day: day ?? (date ? nbaCalendarDate(date) : undefined),
    name: event?.name ?? `${away?.team?.displayName} at ${home?.team?.displayName}`,
    shortName: event?.shortName ?? `${away?.team?.abbreviation} @ ${home?.team?.abbreviation}`,
    state,
    statusLabel: statusLabel(status, state),
    statusDetail: status?.type?.detail,
    clock: status?.displayClock,
    period: status?.period,
    venue: competition?.venue?.fullName,
    broadcast: broadcastText(competition),
    home: homeSide,
    away: awaySide,
  };
}

export async function fetchStandings(
  signal?: AbortSignal,
): Promise<StandingsSnapshot> {
  const data = await getJSON<any>(
    `${WEB_V2}/standings?region=us&lang=en&contentorigin=espn&type=0&level=2&sort=winpercent%3Adesc&seasontype=2`,
    signal,
  );

  const conferences = asArray<any>(data?.children);
  const east: Standing[] = [];
  const west: Standing[] = [];

  for (const conference of conferences) {
    const isEast =
      conference?.abbreviation === "East" || /eastern/i.test(String(conference?.name));
    const rows = asArray<any>(conference?.standings?.entries).map((entry) =>
      toStanding(entry, isEast ? "East" : "West"),
    );

    if (isEast) east.push(...rows);
    else west.push(...rows);
  }

  return {
    season:
      data?.season?.displayName ??
      seasonLabel(data?.season?.year ?? data?.children?.[0]?.standings?.season),
    updatedSeason: data?.season?.year,
    east: sortStandings(east),
    west: sortStandings(west),
  };
}

export async function fetchScoreboard(
  date: string,
  signal?: AbortSignal,
): Promise<GameDay> {
  const data = await getJSON<any>(
    `${SITE}/scoreboard?dates=${espnDate(date)}`,
    signal,
  );

  const games = asArray<any>(data?.events)
    .map((event) => normalizeGame(event, undefined, date))
    .filter((game): game is Game => Boolean(game))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Amb `dates`, la temporada arriba dins de `leagues`.
  const seasonYear =
    data?.season?.year ??
    data?.leagues?.[0]?.season?.year;

  return {
    date,
    season: seasonYear ? seasonLabel(seasonYear) : undefined,
    games,
  };
}

function toRosterPlayer(raw: any): RosterPlayer {
  const college =
    typeof raw?.college === "string" ? raw.college : raw?.college?.name;
  const years = raw?.experience?.years;

  return {
    id: String(raw?.id ?? ""),
    name: raw?.displayName ?? raw?.fullName ?? "Jugador",
    jersey: raw?.jersey,
    position: raw?.position?.abbreviation,
    age: typeof raw?.age === "number" ? raw.age : undefined,
    height: raw?.displayHeight,
    weight: raw?.displayWeight,
    experience:
      raw?.displayExperience ??
      (typeof years === "number" ? `${years} anys` : undefined),
    college,
    status: raw?.status?.name,
  };
}

export async function fetchLeaders(
  category: LeaderCategory,
  signal?: AbortSignal,
): Promise<LeaderSnapshot> {
  const data = await getJSON<any>(
    `${WEB}/statistics/byathlete?region=us&lang=en&contentorigin=espn&isqualified=true&page=1&limit=50&sort=${encodeURIComponent(category.sort)}`,
    signal,
  );

  const definitions = new Map<string, string[]>();
  for (const item of asArray<any>(data?.categories)) {
    definitions.set(String(item?.name), asArray<string>(item?.names));
  }

  const players: LeaderPlayer[] = asArray<any>(data?.athletes).map((entry) => {
    const athlete = entry?.athlete ?? {};
    const stats: Record<string, number> = {};

    for (const group of asArray<any>(entry?.categories)) {
      const names = definitions.get(String(group?.name)) ?? [];
      asArray<number>(group?.values).forEach((value, index) => {
        const name = names[index];
        if (name && typeof value === "number") stats[name] = value;
      });
    }

    return {
      id: String(athlete?.id ?? ""),
      name: athlete?.displayName ?? "Jugador",
      teamId: athlete?.teamId ? String(athlete.teamId) : undefined,
      teamAbbreviation: athlete?.teamShortName,
      teamName: athlete?.teamName,
      position: athlete?.position?.abbreviation,
      jersey: athlete?.jersey,
      stats,
    };
  });

  return {
    category: category.key,
    stat: category.stat,
    season: normalizeSeasonName(data?.currentSeason?.displayName),
    players,
  };
}

export async function fetchTeamDetail(
  teamId: string,
  signal?: AbortSignal,
): Promise<TeamDetail> {
  const [rosterData, scheduleData] = await Promise.all([
    getJSON<any>(`${SITE}/teams/${teamId}/roster`, signal),
    getJSON<any>(`${SITE}/teams/${teamId}/schedule`, signal),
  ]);

  const rawTeam = rosterData?.team ?? {};
  const team = toTeam(rawTeam);
  const overallRecord = asArray<any>(rawTeam?.record?.items).find(
    (item) => item?.type === "total",
  );

  const athletes = Array.isArray(rosterData?.athletes)
    ? asArray<any>(rosterData.athletes)
    : asArray<any>(rosterData?.athletes).flatMap((group) =>
        asArray<any>(group?.items),
      );

  const schedule = asArray<any>(scheduleData?.events)
    .map((event) => normalizeGame(event, team))
    .filter((game): game is Game => Boolean(game))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    team,
    record: rawTeam?.recordSummary ?? overallRecord?.summary,
    standing: rawTeam?.standingSummary,
    season: normalizeSeasonName(
      rosterData?.season?.displayName ?? scheduleData?.season?.displayName,
    ),
    roster: athletes.map(toRosterPlayer).filter((player) => player.id),
    schedule,
  };
}

function toText(value: any): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  return value.displayText ?? value.text ?? value.displayValue ?? undefined;
}

async function fetchPlayerAverages(
  playerId: string,
  signal?: AbortSignal,
): Promise<PlayerAverage[]> {
  try {
    const data = await getJSON<any>(
      `${WEB}/athletes/${playerId}/gamelog`,
      signal,
    );

    const seasonType = asArray<any>(data?.seasonTypes).find(
      (entry) => entry?.summary,
    );
    const averages = asArray<any>(seasonType?.summary?.stats).find(
      (entry) => entry?.type === "avg",
    );

    const labels = asArray<string>(data?.labels);
    const names = asArray<string>(data?.names);
    const values = asArray<string>(averages?.stats);

    return labels
      .map((label, index) => ({
        name: names[index] ?? label,
        label,
        value: values[index] ?? "—",
      }))
      .filter((stat) => stat.value !== "—");
  } catch {
    return [];
  }
}

export async function fetchPlayerDetail(
  playerId: string,
  signal?: AbortSignal,
): Promise<PlayerDetail> {
  const [data, averages] = await Promise.all([
    getJSON<any>(`${WEB}/athletes/${playerId}`, signal),
    fetchPlayerAverages(playerId, signal),
  ]);
  const athlete = data?.athlete ?? {};

  const stats: PlayerStat[] = asArray<any>(
    athlete?.statsSummary?.statistics,
  ).map((stat) => ({
    name: String(stat?.name ?? ""),
    label: stat?.shortDisplayName ?? stat?.displayName ?? stat?.name ?? "—",
    value: stat?.displayValue ?? "—",
    rank: typeof stat?.rank === "number" ? stat.rank : undefined,
    rankLabel: stat?.rankDisplayValue,
  }));

  return {
    id: String(athlete?.id ?? playerId),
    name: athlete?.displayName ?? athlete?.fullName ?? "Jugador",
    team:
      athlete?.team && athlete?.team?.id
        ? toTeam(athlete.team)
        : undefined,
    jersey: athlete?.jersey,
    position: athlete?.position?.abbreviation,
    height: athlete?.displayHeight,
    weight: athlete?.displayWeight,
    birthDate: athlete?.displayDOB,
    birthPlace: athlete?.displayBirthPlace,
    age: typeof athlete?.age === "number" ? athlete.age : undefined,
    college:
      typeof athlete?.college === "string"
        ? athlete.college
        : athlete?.college?.name,
    experience: athlete?.displayExperience,
    draft: toText(athlete?.displayDraft),
    hand: athlete?.hand?.displayValue,
    status: athlete?.status?.name,
    season:
      normalizeSeasonName(
        data?.season?.displayName ?? athlete?.statsSummary?.displayName,
      ) ?? undefined,
    stats,
    averages,
  };
}

function normalizeSeasonName(value?: string): string | undefined {
  if (!value) return undefined;
  return value.replace(/^(\d{4})-(\d{2})/, "$1–$2");
}

const GAME_LEADER_LABELS: Record<string, string> = {
  points: "Punts",
  assists: "Assistències",
  rebounds: "Rebots",
};

const OFFICIAL_ROLE_LABELS: Record<string, string> = {
  referee: "Àrbitre",
  "crew chief": "Àrbitre principal",
  alternate: "Suplent",
};

function toGameStat(raw: any): GameStat {
  const name = String(raw?.name ?? "");
  const value =
    raw?.displayValue ??
    (raw?.value !== null && raw?.value !== undefined ? String(raw.value) : "—");

  return {
    name,
    label: raw?.label ?? raw?.abbreviation ?? name,
    value: String(value),
    abbreviation: raw?.abbreviation,
  };
}

function toGameTeamStats(raw: any): GameTeamStats | null {
  const team = raw?.team?.id ? toTeam(raw.team) : undefined;
  if (!team) return null;

  return {
    team,
    homeAway: raw?.homeAway === "away" ? "away" : "home",
    stats: asArray<any>(raw?.statistics).map(toGameStat),
  };
}

function toGameBoxTeam(
  raw: any,
  fallbackHomeAway: "home" | "away",
): GameBoxTeam | null {
  const team = raw?.team?.id ? toTeam(raw.team) : undefined;
  if (!team) return null;

  const statistics = asArray<any>(raw?.statistics)[0];
  const keys = asArray<string>(statistics?.keys);
  const labels = asArray<string>(statistics?.labels);
  const columns: GameBoxColumn[] = keys.map((key, index) => ({
    key,
    label: labels[index] ?? key,
  }));

  const players: GameBoxPlayer[] = asArray<any>(statistics?.athletes)
    .map((entry) => {
      const athlete = entry?.athlete ?? {};
      const values = asArray<string>(entry?.stats);
      const playerStats: Record<string, string> = {};

      keys.forEach((key, index) => {
        playerStats[key] = values[index] ?? "—";
      });

      return {
        id: String(athlete?.id ?? ""),
        name: athlete?.displayName ?? athlete?.fullName ?? "Jugador",
        shortName: athlete?.shortName,
        jersey: athlete?.jersey,
        position: athlete?.position?.abbreviation,
        starter: Boolean(entry?.starter),
        didNotPlay: Boolean(entry?.didNotPlay),
        reason: entry?.didNotPlay ? entry?.reason : undefined,
        stats: playerStats,
      };
    })
    .filter((player) => player.id || player.name !== "Jugador");

  const totalValues = asArray<string>(statistics?.totals);
  const totals =
    totalValues.length > 0
      ? Object.fromEntries(
          keys.map((key, index) => [key, totalValues[index] ?? "—"]),
        )
      : undefined;

  return {
    team,
    homeAway: raw?.homeAway === "away" ? "away" : fallbackHomeAway,
    columns,
    players,
    totals,
  };
}

function toGameTeamLeaders(raw: any): GameTeamLeaders | null {
  const team = raw?.team?.id ? toTeam(raw.team) : undefined;
  if (!team) return null;

  const categories: GameLeaderCategory[] = asArray<any>(raw?.leaders)
    .map((category) => {
      const key = String(category?.name ?? "");
      const players: GameLeaderPlayer[] = asArray<any>(category?.leaders)
        .map((entry) => {
          const athlete = entry?.athlete ?? {};
          return {
            id: String(athlete?.id ?? ""),
            name: athlete?.displayName ?? athlete?.fullName ?? "Jugador",
            jersey: athlete?.jersey,
            position: athlete?.position?.abbreviation,
            value: String(entry?.displayValue ?? entry?.mainStat?.value ?? "—"),
          };
        })
        .filter((player) => player.id || player.name !== "Jugador");

      return {
        key,
        label:
          GAME_LEADER_LABELS[key] ??
          category?.displayName ??
          category?.shortDisplayName ??
          key,
        players,
      };
    })
    .filter((category) => category.players.length > 0);

  return { team, categories };
}

function toGameOfficial(raw: any): GameOfficial {
  const role = String(raw?.position?.displayName ?? raw?.position?.name ?? "");
  return {
    name: raw?.displayName ?? raw?.fullName ?? "Àrbitre",
    role: OFFICIAL_ROLE_LABELS[role.toLowerCase()] ?? (role || undefined),
  };
}

export async function fetchGameDetail(
  eventId: string,
  signal?: AbortSignal,
): Promise<GameDetail> {
  const data = await getJSON<any>(`${SITE}/summary?event=${eventId}`, signal);

  const header = data?.header ?? {};
  const competition = asArray<any>(header?.competitions)[0];
  const competitors = asArray<any>(competition?.competitors);
  const home = competitors.find((entry) => entry?.homeAway === "home");
  const away = competitors.find((entry) => entry?.homeAway === "away");

  const game = normalizeGame({
    id: String(header?.id ?? eventId),
    date: competition?.date,
    name:
      home && away
        ? `${away?.team?.displayName} at ${home?.team?.displayName}`
        : undefined,
    shortName:
      home && away
        ? `${away?.team?.abbreviation} @ ${home?.team?.abbreviation}`
        : undefined,
    competitions: competition ? [competition] : [],
  });

  if (!game) {
    throw new Error("ESPN no ha retornat el marcador d'aquest partit");
  }

  const info = data?.gameInfo ?? {};
  const venue = info?.venue;
  const venueCity =
    venue?.address?.city && venue?.address?.state
      ? `${venue.address.city}, ${venue.address.state}`
      : venue?.address?.city;

  game.venue = game.venue ?? venue?.fullName;

  const teamStats = asArray<any>(data?.boxscore?.teams)
    .map(toGameTeamStats)
    .filter((entry): entry is GameTeamStats => Boolean(entry));

  const boxscore = asArray<any>(data?.boxscore?.players)
    .map((entry) => {
      const teamId = String(entry?.team?.id ?? "");
      const fallbackHomeAway =
        teamId && teamId === game.home.team.id ? "home" : "away";
      return toGameBoxTeam(entry, fallbackHomeAway);
    })
    .filter((entry): entry is GameBoxTeam => Boolean(entry));

  const leaders = asArray<any>(data?.leaders)
    .map(toGameTeamLeaders)
    .filter((entry): entry is GameTeamLeaders => Boolean(entry));

  return {
    game,
    season:
      normalizeSeasonName(header?.season?.displayName) ??
      (header?.season?.year ? seasonLabel(header.season.year) : undefined),
    venue: venue?.fullName ?? game.venue,
    venueCity,
    attendance:
      typeof info?.attendance === "number" ? info.attendance : undefined,
    officials: asArray<any>(info?.officials).map(toGameOfficial),
    teamStats,
    leaders,
    boxscore,
  };
}
