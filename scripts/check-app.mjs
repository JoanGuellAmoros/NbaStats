import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const APP_URL = process.env.APP_URL ?? "http://localhost:4173/";
const SHOTS = path.join(os.tmpdir(), "nbastats-shots");
const results = [];
let failures = 0;

function check(ok, label, detail = "") {
  results.push(`${ok ? "ok  " : "FAIL"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

const espnApi = (url) => /site(\.web)?\.api\.espn\.com|sports\.core\.api\.espn\.com/.test(url);

function todayInMadrid() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(new Date());
}

function shiftIsoDate(iso, days) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function main() {
  await mkdir(SHOTS, { recursive: true });

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 960 },
    deviceScaleFactor: 1,
    locale: "ca-ES",
  });
  const page = await context.newPage();

  const statsRequests = [];
  const allRequests = [];
  const failedRequests = [];
  const headshotRequests = [];
  const pageErrors = [];

  page.on("request", (request) => {
    const url = request.url();
    allRequests.push(url);
    if (espnApi(url)) statsRequests.push(url);
    if (/a\.espncdn\.com\/i\/headshots\//i.test(url)) headshotRequests.push(url);
  });
  page.on("requestfailed", (request) => {
    if (espnApi(request.url())) {
      failedRequests.push(`${request.url()} :: ${request.failure()?.errorText}`);
    }
  });
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") pageErrors.push(message.text());
  });

  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(SHOTS, "01-home-empty.png"), fullPage: true });

  check(statsRequests.length === 0, "sense peticions a l'API d'ESPN en obrir l'app", `${statsRequests.length} peticions`);
  check(
    (await page.getByText("Comença descarregant les dades").count()) > 0,
    "estat inicial buit visible",
  );

  // Registre del service worker
  const sw = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return "unsupported";
    const registration = await navigator.serviceWorker.ready;
    return registration.active ? "active" : "pending";
  });
  check(sw === "active", "service worker actiu", sw);

  // Panell de sincronització manual
  await page.getByRole("button", { name: /Actualitza/i }).first().click();
  await page.waitForTimeout(300);
  check(
    (await page.getByRole("dialog").count()) > 0,
    "s'obre el panell de sincronització",
  );
  await page.screenshot({ path: path.join(SHOTS, "02-sync-panel.png"), fullPage: true });

  await page.getByRole("button", { name: /Actualitza ara/i }).click();

  const outcome = await Promise.race([
    page
      .getByText("Dades actualitzades correctament.")
      .waitFor({ timeout: 180_000 })
      .then(() => "ok"),
    page
      .getByText(/N'han fallat/)
      .waitFor({ timeout: 180_000 })
      .then(() => "partial"),
    page
      .getByText(/No hi ha connexió/)
      .waitFor({ timeout: 180_000 })
      .then(() => "offline"),
  ]).catch(() => "timeout");

  check(outcome === "ok", "la sincronització completa acaba bé", outcome);
  check(statsRequests.length > 0, "la sincronització fa peticions a ESPN", `${statsRequests.length} peticions`);
  check(failedRequests.length === 0, "cap petició fallida", failedRequests.slice(0, 3).join(" | "));

  // Tanca el panell
  await page.getByRole("button", { name: /^Tanca$/ }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SHOTS, "03-home-synced.png"), fullPage: true });

  // IndexedDB
  const idb = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("nbastats");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction("cache", "readonly");
    const store = tx.objectStore("cache");
    const keys = await new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return keys.map(String);
  });
  check(idb.filter((key) => key.startsWith("snapshot:")).length > 0, "dades desades a IndexedDB", `${idb.length} claus`);
  check(idb.includes("snapshot:standings"), "classificació desada");
  check(idb.includes(`snapshot:scoreboard:${todayInMadrid()}`), "partits d'avui desats");

  // Classificació
  await page.getByRole("link", { name: "Classificació" }).first().click();
  await page.getByRole("heading", { name: "Conferència Est" }).waitFor();
  const standingsRows = await page.locator("table tbody tr").count();
  check(standingsRows === 30, "30 equips a la classificació", `${standingsRows} files`);
  await page.screenshot({ path: path.join(SHOTS, "04-standings.png"), fullPage: true });

  // Equips
  await page.getByRole("link", { name: "Equips", exact: true }).click();
  await page.waitForTimeout(500);
  const teamCards = await page.locator('a[href^="#/equips/"]').count();
  check(teamCards === 30, "30 targetes d'equip", `${teamCards} targetes`);
  await page.screenshot({ path: path.join(SHOTS, "05-teams.png"), fullPage: true });

  // Partits (avui): es poden veure, però no descarregar detalls
  await page.getByRole("link", { name: "Partits", exact: true }).click();
  await page.waitForTimeout(500);
  const gameCards = await page.locator("article").count();
  check(gameCards > 0, "partits d'avui renderitzats", `${gameCards} partits`);
  check(
    (await page
      .getByRole("button", { name: /Carrega tots els detalls/i })
      .count()) === 0,
    "sense botó massiu per als partits d'avui",
  );
  check(
    (await page.locator('a[href^="#/partits/"]').count()) === 0,
    "les targetes d'avui no enllacen al detall",
  );
  check(
    (await page.getByText("Detalls no disponibles").count()) === gameCards,
    "cada targeta d'avui indica que no hi ha detalls",
  );
  await page.screenshot({ path: path.join(SHOTS, "06-games.png"), fullPage: true });

  // Ruta directa a un partit d'avui: bloquejada
  const todayGameId = await page.evaluate(async (today) => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("nbastats");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction("cache", "readonly");
    const store = tx.objectStore("cache");
    const entry = await new Promise((resolve, reject) => {
      const request = store.get(`snapshot:scoreboard:${today}`);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return entry?.data?.games?.[0]?.id ?? null;
  }, todayInMadrid());
  check(Boolean(todayGameId), "hi ha un partit d'avui a la memòria", todayGameId ?? "cap");

  if (todayGameId) {
    const requestsBeforeBlocked = statsRequests.length;
    await page.evaluate((gameId) => {
      window.location.hash = `#/partits/${gameId}`;
    }, todayGameId);
    await page
      .getByText("Detalls no disponibles", { exact: true })
      .waitFor({ timeout: 15_000 });
    check(
      (await page
        .getByRole("button", { name: /Descarrega els detalls/i })
        .count()) === 0,
      "la ruta directa d'avui no ofereix descàrrega",
    );
    check(
      (await page
        .getByRole("heading", { name: "Estadístiques d'equip" })
        .count()) === 0,
      "la ruta directa d'avui no mostra estadístiques",
    );
    check(
      statsRequests.length === requestsBeforeBlocked,
      "bloquejar un partit d'avui no fa cap petició",
      `${statsRequests.length - requestsBeforeBlocked} peticions`,
    );
    await page.screenshot({
      path: path.join(SHOTS, "06-games-blocked.png"),
      fullPage: true,
    });

    await page.getByRole("link", { name: "Torna al calendari" }).click();
    await page.waitForTimeout(500);
  }

  // Detall de partit (descàrrega manual)
  const completedGameId = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("nbastats");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction("cache", "readonly");
    const store = tx.objectStore("cache");
    const values = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    const games = values.flatMap((entry) => entry?.data?.games ?? []);
    return games.find((game) => game?.state === "post" && game?.id)?.id ?? null;
  });
  check(Boolean(completedGameId), "hi ha un partit acabat a la memòria", completedGameId ?? "cap");

  if (completedGameId) {
    const requestsBeforeDetail = statsRequests.length;
    await page.evaluate((gameId) => {
      window.location.hash = `#/partits/${gameId}`;
    }, completedGameId);
    await page
      .getByRole("button", { name: /Descarrega els detalls/i })
      .first()
      .waitFor({ timeout: 15_000 });
    await page.waitForTimeout(500);
    const detailHeading = await page
      .getByRole("heading", { level: 1 })
      .innerText();
    check(
      !detailHeading.includes("Detalls del partit"),
      "el partit es resol des de la cache del calendari",
      detailHeading,
    );
    check(
      statsRequests.length === requestsBeforeDetail,
      "obrir un detall no fa cap petició automàtica",
      `${statsRequests.length - requestsBeforeDetail} peticions`,
    );

    await page
      .getByRole("button", { name: /Descarrega els detalls/i })
      .first()
      .click();
    await page
      .getByRole("heading", { name: "Estadístiques d'equip" })
      .waitFor({ timeout: 60_000 });
    await page.waitForTimeout(500);

    const quarters = await page
      .getByRole("heading", { name: "Punts per quart" })
      .count();
    const boxscoreTables = await page.locator("table").count();
    check(quarters === 1, "parcials per quart visibles");
    check(boxscoreTables >= 3, "box score visible", `${boxscoreTables} taules`);
    check(
      (await page.getByRole("heading", { name: "Líders del partit" }).count()) > 0,
      "líders del partit visibles",
    );
    await page.screenshot({
      path: path.join(SHOTS, "07-game-detail.png"),
      fullPage: true,
    });

    const gameKeys = await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open("nbastats");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const tx = db.transaction("cache", "readonly");
      const store = tx.objectStore("cache");
      const keys = await new Promise((resolve, reject) => {
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return keys.map(String);
    });
    check(
      gameKeys.includes(`snapshot:game:${completedGameId}`),
      "detall del partit desat a IndexedDB",
    );
  }

  // Descàrrega massiva dels detalls d'un dia passat
  const previousDay = shiftIsoDate(todayInMadrid(), -1);
  await page.evaluate((day) => {
    window.location.hash = `#/partits?data=${day}`;
  }, previousDay);
  await page
    .getByRole("button", { name: /Carrega tots els detalls/i })
    .waitFor({ timeout: 15_000 });
  await page.waitForTimeout(400);
  const pastCards = await page.locator("article").count();
  const pastLinks = await page.locator('a[href^="#/partits/"]').count();
  check(pastCards > 0, "partits del dia anterior renderitzats", `${pastCards} partits`);
  check(
    pastLinks === pastCards,
    "les targetes del dia anterior enllacen al detall",
    `${pastLinks}/${pastCards} enllaços`,
  );

  const bulkRequestsBefore = statsRequests.length;
  await page
    .getByRole("button", { name: /Carrega tots els detalls/i })
    .click();
  const bulkOutcome = await Promise.race([
    page
      .getByText(/detalls de partit desats a la memòria/)
      .waitFor({ timeout: 180_000 })
      .then(() => "ok"),
    page
      .getByText(/S'han desat \d+ de \d+ detalls/)
      .waitFor({ timeout: 180_000 })
      .then(() => "partial"),
  ]).catch(() => "timeout");
  check(bulkOutcome === "ok", "el botó massiu desa tots els detalls", bulkOutcome);
  check(
    statsRequests.length - bulkRequestsBefore >= pastCards,
    "el botó massiu fa una petició per partit",
    `${statsRequests.length - bulkRequestsBefore} peticions`,
  );

  const bulkGameKeys = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("nbastats");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction("cache", "readonly");
    const store = tx.objectStore("cache");
    const keys = await new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return keys.map(String).filter((key) => key.startsWith("snapshot:game:"));
  });
  check(
    bulkGameKeys.length >= pastCards,
    "detalls de tots els partits del dia a IndexedDB",
    `${bulkGameKeys.length} detalls`,
  );
  await page.screenshot({
    path: path.join(SHOTS, "06-games-bulk.png"),
    fullPage: true,
  });

  // Jugadors: es calculen dels boxscores, sense rànquings d'ESPN
  const removedLeaders = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("nbastats");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction("cache", "readwrite");
    const store = tx.objectStore("cache");
    const keys = await new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result.map(String));
      request.onerror = () => reject(request.error);
    });
    const leaders = keys.filter((key) => key.startsWith("snapshot:leaders:"));
    for (const key of leaders) store.delete(key);
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(undefined);
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return leaders.length;
  });
  check(
    removedLeaders === 6,
    "els rànquings d'ESPN s'esborren abans de calcular Jugadors",
    `${removedLeaders} claus`,
  );

  const requestsBeforePlayers = statsRequests.length;
  await page.getByRole("link", { name: "Jugadors", exact: true }).click();
  await page.waitForTimeout(500);
  const leaderRows = await page.locator("table tbody tr").count();
  check(leaderRows === 50, "50 líders calculats dels boxscores", `${leaderRows} files`);
  check(
    (await page.getByText(/boxscores de \d+ partits? descarregats?/).count()) > 0,
    "la pantalla indica que les dades són calculades",
  );
  check(
    (await page.getByRole("button", { name: /Descarrega/i }).count()) === 0,
    "la pantalla de jugadors no ofereix cap descàrrega",
  );
  check(
    statsRequests.length === requestsBeforePlayers,
    "la pantalla de jugadors no fa cap petició a ESPN",
    `${statsRequests.length - requestsBeforePlayers} peticions`,
  );
  const playerTeamLogos = await page
    .locator('table tbody img[src*="/teamlogos/"]')
    .count();
  check(
    playerTeamLogos >= 45,
    "logos d'equip a la llista de jugadors",
    `${playerTeamLogos} logos`,
  );
  await page.screenshot({ path: path.join(SHOTS, "07-players.png"), fullPage: true });

  // Fitxa de jugador (descàrrega manual)
  await page.locator("table tbody tr a").first().click();
  await page.getByRole("button", { name: /Descarrega la fitxa/i }).click();
  await page.getByRole("heading", { name: "Mitjanes de la temporada" }).waitFor({ timeout: 60_000 });
  await page.waitForTimeout(400);
  const avgTiles = await page.locator("dl.grid > div").count();
  check(avgTiles >= 10, "fitxa de jugador amb mitjanes", `${avgTiles} mètriques`);
  await page.screenshot({ path: path.join(SHOTS, "08-player.png"), fullPage: true });

  // Fitxa d'equip (descàrrega manual)
  await page.getByRole("link", { name: "Equips", exact: true }).click();
  await page.waitForTimeout(500);
  await page.locator('a[href^="#/equips/"]').first().click();
  await page.getByRole("button", { name: /Descarrega la fitxa/i }).click();
  await page.getByRole("heading", { name: "Plantilla" }).waitFor({ timeout: 60_000 });
  await page.waitForTimeout(600);
  const rosterRows = await page.locator("table tbody tr").count();
  check(rosterRows > 10, "fitxa d'equip amb plantilla", `${rosterRows} jugadors`);
  await page.screenshot({ path: path.join(SHOTS, "09-team.png"), fullPage: true });

  // Pàgina de dades
  await page.getByRole("link", { name: "Dades", exact: true }).first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SHOTS, "10-data.png"), fullPage: true });

  check(
    headshotRequests.length === 0,
    "cap imatge de jugador descarregada",
    headshotRequests.slice(0, 3).join(" | "),
  );

  // Offline: recàrrega completa sense xarxa
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Dades i emmagatzematge" }).waitFor({ timeout: 30_000 });
  check(true, "l'app obre offline gràcies al service worker");

  await page.getByRole("link", { name: "Classificació" }).first().click();
  await page.getByRole("heading", { name: "Conferència Est" }).waitFor({ timeout: 15_000 });
  const offlineRows = await page.locator("table tbody tr").count();
  check(offlineRows === 30, "la classificació es llegeix offline", `${offlineRows} files`);
  await page.screenshot({ path: path.join(SHOTS, "11-offline.png"), fullPage: true });

  if (completedGameId) {
    await page.evaluate((gameId) => {
      window.location.hash = `#/partits/${gameId}`;
    }, completedGameId);
    await page
      .getByRole("heading", { name: "Estadístiques d'equip" })
      .waitFor({ timeout: 15_000 });
    check(
      (await page.locator("table").count()) >= 3,
      "el detall del partit es llegeix offline",
    );
    await page.screenshot({
      path: path.join(SHOTS, "12-offline-game.png"),
      fullPage: true,
    });
  }

  const offlineStats = statsRequests.length;
  await page.waitForTimeout(800);
  check(statsRequests.length === offlineStats, "no hi ha reintents automàtics d'ESPN");

  await context.setOffline(false);

  const relevantErrors = pageErrors.filter(
    (message) => !/favicon|ERR_INTERNET_DISCONNECTED|Failed to load resource/i.test(message),
  );
  check(relevantErrors.length === 0, "sense errors de pàgina", relevantErrors.slice(0, 3).join(" | "));

  await browser.close();

  await writeFile(
    path.join(SHOTS, "report.txt"),
    `${results.join("\n")}\n\nESPN API requests: ${statsRequests.length}\nScreenshots: ${SHOTS}\n`,
  );

  console.log(results.join("\n"));
  console.log(`\nESPN API requests: ${statsRequests.length}`);
  console.log(`Screenshots: ${SHOTS}`);
  console.log(failures === 0 ? "\nTOT OK" : `\n${failures} FALLIDES`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch(async (error) => {
  console.error("ERROR", error);
  console.log(results.join("\n"));
  process.exitCode = 1;
});
