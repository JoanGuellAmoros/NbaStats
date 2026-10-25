import {
  fetchGameDetail,
  fetchLeaders,
  fetchPlayerDetail,
  fetchScoreboard,
  fetchStandings,
  fetchTeamDetail,
} from "../src/lib/espn";
import { LEADER_CATEGORIES } from "../src/lib/sync";
import { shiftIsoDate, todayIso } from "../src/lib/format";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${message}`);
  }
}

async function main() {
  const standings = await fetchStandings();
  console.log(
    `standings season=${standings.season} east=${standings.east.length} west=${standings.west.length}`,
  );
  assert(standings.east.length === 15, "15 equips a l'Est");
  assert(standings.west.length === 15, "15 equips a l'Oest");

  const sample = standings.east[0];
  console.log("standings sample:", {
    team: sample.team.name,
    logo: sample.team.logo,
    color: sample.team.color,
    record: sample.record,
  });
  assert(Boolean(sample.team.logo), "logo d'equip present");
  assert(sample.record.wins >= 0, "victòries numèriques");

  const today = todayIso();
  for (const offset of [-1, 0, 1]) {
    const date = shiftIsoDate(today, offset);
    const day = await fetchScoreboard(date);
    console.log(`scoreboard ${date}: ${day.games.length} partits, season=${day.season}`);
    assert(day.date === date, `data normalitzada ${date}`);
    if (day.games[0]) {
      const game = day.games[0];
      console.log("game sample:", {
        name: game.name,
        state: game.state,
        status: game.statusLabel,
        away: `${game.away.team.abbreviation} ${game.away.score ?? ""}`,
        home: `${game.home.team.abbreviation} ${game.home.score ?? ""}`,
        venue: game.venue,
      });
      assert(game.away.team.id && game.home.team.id, "equips del partit");
    }
  }

  const yesterday = await fetchScoreboard(shiftIsoDate(today, -1));
  const completed = yesterday.games.find(
    (game) => game.state === "post" && game.away.score && game.home.score,
  );
  const detail = await fetchGameDetail(completed?.id ?? "401909853");
  const boxPlayers = detail.boxscore.flatMap((box) =>
    box.players.filter((player) => !player.didNotPlay),
  );
  console.log("game detail:", {
    id: detail.game.id,
    name: detail.game.name,
    season: detail.season,
    venue: detail.venue,
    city: detail.venueCity,
    attendance: detail.attendance,
    quarters: detail.game.away.linescores?.length,
    teamStats: detail.teamStats.length,
    leaders: detail.leaders.length,
    boxTeams: detail.boxscore.length,
    boxPlayers: boxPlayers.length,
    officials: detail.officials.length,
  });
  assert(detail.game.id.length > 0, "identificador del partit");
  assert(detail.game.away.team.id && detail.game.home.team.id, "equips del resum");
  assert(
    (detail.game.away.linescores?.length ?? 0) >= 4,
    "parcials per quart del partit",
  );
  assert(detail.teamStats.length === 2, "estadístiques dels dos equips");
  assert(detail.boxscore.length === 2, "box score dels dos equips");
  assert(boxPlayers.length > 10, "jugadors amb minuts al box score");
  assert(detail.leaders.length === 2, "líders dels dos equips");
  assert(Boolean(detail.game.venue ?? detail.venue), "pavelló del partit");

  let allLeadersOk = true;
  for (const category of LEADER_CATEGORIES) {
    const leaders = await fetchLeaders(category);
    const top = leaders.players[0];
    console.log(
      `leaders ${category.key}: ${leaders.players.length} jugadors, top=${top?.name} ${category.stat}=${top?.stats[category.stat]}`,
    );
    allLeadersOk =
      allLeadersOk &&
      leaders.players.length > 0 &&
      typeof top?.stats[category.stat] === "number";
  }
  assert(allLeadersOk, "totes les categories tenen el stat del rànquing");

  const team = await fetchTeamDetail("1");
  console.log("team:", {
    name: team.team.name,
    season: team.season,
    record: team.record,
    standing: team.standing,
    roster: team.roster.length,
    schedule: team.schedule.length,
    firstPlayer: team.roster[0]?.name,
  });
  assert(team.roster.length > 0, "plantilla de l'equip");
  assert(team.schedule.length > 0, "calendari de l'equip");
  assert(Boolean(team.roster[0]?.headshot), "foto del primer jugador");

  const player = await fetchPlayerDetail("4065733");
  console.log("player:", {
    name: player.name,
    team: player.team?.name,
    season: player.season,
    position: player.position,
    stats: player.stats.length,
    averages: player.averages.length,
    first: player.stats[0],
  });
  assert(player.stats.length > 0, "estadístiques del jugador");
  assert(player.averages.length > 0, "mitjanes de la temporada");
  assert(Boolean(player.headshot), "foto del jugador");
}

main().catch((error) => {
  console.error("ERROR", error);
  process.exitCode = 1;
});
