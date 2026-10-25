import { chromium } from "playwright-core";
import path from "node:path";
import os from "node:os";

const APP_URL = process.env.APP_URL ?? "http://localhost:4173/";
const SHOTS = path.join(os.tmpdir(), "nbastats-shots", "mobile");

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
  locale: "ca-ES",
});
const page = await context.newPage();

await page.goto(APP_URL, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(SHOTS, "m01-home-empty.png"), fullPage: true });

await page.getByRole("button", { name: /Actualitza/i }).first().click();
await page.locator("select").selectOption("0");
await page.getByRole("button", { name: /Actualitza ara/i }).click();
await page
  .getByText("Totes les dades seleccionades")
  .waitFor({ timeout: 120_000 });
await page.getByRole("button", { name: /^Tanca$/ }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(SHOTS, "m02-home.png"), fullPage: true });

await page.getByRole("link", { name: "Partits", exact: true }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(SHOTS, "m03-games.png"), fullPage: true });

await page.evaluate(() => {
  window.location.hash = "#/partits/401909853";
});
await page
  .getByRole("button", { name: /Descarrega els detalls/i })
  .first()
  .click();
await page
  .getByRole("heading", { name: "Estadístiques d'equip" })
  .waitFor({ timeout: 60_000 });
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(SHOTS, "m04-game.png"), fullPage: true });

await page.getByRole("link", { name: "Classificació" }).first().click();
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(SHOTS, "m04-standings.png"), fullPage: true });

await page.getByRole("link", { name: "Equips", exact: true }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(SHOTS, "m05-teams.png"), fullPage: true });

await page.locator('a[href^="#/equips/"]').first().click();
await page.getByRole("button", { name: /Descarrega la fitxa/i }).click();
await page.getByRole("heading", { name: "Plantilla" }).waitFor({ timeout: 60_000 });
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(SHOTS, "m06-team.png"), fullPage: true });

await page.getByRole("link", { name: "Jugadors", exact: true }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(SHOTS, "m07-players.png"), fullPage: true });
await page.locator("table tbody tr a").first().click();
await page.getByRole("button", { name: /Descarrega la fitxa/i }).click();
await page.getByRole("heading", { name: "Mitjanes de la temporada" }).waitFor({ timeout: 60_000 });
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(SHOTS, "m08-player.png"), fullPage: true });

await page.getByRole("link", { name: "Dades", exact: true }).first().click();
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(SHOTS, "m09-data.png"), fullPage: true });

const overflow = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}));
console.log("overflow:", overflow);

await browser.close();
