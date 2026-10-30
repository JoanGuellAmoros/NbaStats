import { chromium } from "playwright-core";

const APP_URL = process.env.APP_URL ?? "http://localhost:4173/";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  locale: "ca-ES",
});
const page = await context.newPage();

await page.goto(APP_URL, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Actualitza/i }).first().click();
await page.locator("select").selectOption("3");
await page.getByRole("button", { name: /Actualitza ara/i }).click();
await page.getByText("Totes les dades seleccionades").waitFor({ timeout: 120_000 });
await page.getByRole("button", { name: /^Tanca$/ }).click();

function shiftIsoDate(iso, days) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const previousDay = shiftIsoDate(
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(new Date()),
  -1,
);

const routes = [
  ["Inici", "/"],
  ["Partits", "/partits"],
  ["Classificació", "/classificacio"],
  ["Equips", "/equips"],
  ["Jugadors", "/jugadors"],
  ["Dades", "/dades"],
];

async function audit(label) {
  await page.waitForTimeout(800);
  const result = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll("body *")]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.right > width + 1 && r.width > 0)
      .sort((a, b) => b.r.right - a.r.right)
      .slice(0, 4)
      .map(({ el, r }) => `${el.tagName}.${String(el.className).slice(0, 40)} right=${Math.round(r.right)}`);
    return { scrollWidth: document.documentElement.scrollWidth, clientWidth: width, offenders };
  });
  const bad = result.scrollWidth > result.clientWidth;
  console.log(`${bad ? "OVERFLOW" : "ok      "} ${label} (${result.scrollWidth}/${result.clientWidth})`);
  for (const offender of result.offenders) console.log("   ", offender);
  return !bad;
}

for (const [label, route] of routes) {
  await page.evaluate((target) => {
    window.location.hash = `#${target}`;
  }, route);
  await audit(label);
}

// Game detail (past day)
await page.evaluate((day) => {
  window.location.hash = `#/partits?data=${day}`;
}, previousDay);
await page.locator('a[href^="#/partits/"]').first().click();
await page
  .getByRole("button", { name: /Descarrega els detalls/i })
  .first()
  .click();
await page
  .getByRole("heading", { name: "Estadístiques d'equip" })
  .waitFor({ timeout: 60_000 });
await page.waitForTimeout(600);
await audit("Detall de partit");

// Rècords (amb el boxscore descarregat)
await page.evaluate(() => {
  window.location.hash = "#/records";
});
await page.getByRole("heading", { name: "Rècords" }).waitFor({ timeout: 15_000 });
await audit("Rècords");

// Team detail
await page.evaluate(() => {
  window.location.hash = "#/equips";
});
await page.waitForTimeout(700);
await page.locator('a[href^="#/equips/"]').first().click();
await page.getByRole("button", { name: /Descarrega la fitxa/i }).click();
await page.getByRole("heading", { name: "Plantilla" }).waitFor({ timeout: 60_000 });
await page.waitForTimeout(600);
await audit("Fitxa d'equip");

// Player detail
await page.evaluate(() => {
  window.location.hash = "#/jugadors";
});
await page.waitForTimeout(700);
await page.locator("table tbody tr a").first().click();
await page.getByRole("button", { name: /Descarrega la fitxa/i }).click();
await page.getByRole("heading", { name: "Mitjanes de la temporada" }).waitFor({ timeout: 60_000 });
await page.waitForTimeout(600);
await audit("Fitxa de jugador");

await browser.close();
