# NbaStats

Estadístiques de l'NBA en una web app **offline-first**. Les dades es guarden al
navegador (IndexedDB) i **només s'actualitzen quan tu prems el botó**. No hi ha
cap petició automàtica en obrir l'app, navegar-hi ni tornar a la finestra.

- Partits i calendari diari
- Detall de cada partit: parcials, estadístiques, líders i box score
- Classificació per conferències
- Equips amb plantilla i calendari (descàrrega sota demanda)
- Líders estadístics i fitxes de jugador (descàrrega sota demanda)
- PWA instal·lable, amb app shell i imatges d'ESPN a la cache del navegador

Interfície en català. Les dades provenen de les APIs JSON públiques d'ESPN
(`site.web.api.espn.com`); no es fa cap mena de scraping.

## Requisits

- Node.js 20 o superior
- Un navegador modern amb IndexedDB i service workers

## Desenvolupament

```bash
npm install
npm run dev
```

Obre `http://localhost:5173`. El service worker només s'activa en compilacions de
producció, però la resta de funcions (cache, sincronització manual) ja
funcionen en desenvolupament.

## Compilació i proves locals

```bash
npm run build
npm run preview
```

`npm run preview` serveix la build a `http://localhost:4173`.

> El service worker requereix `http://localhost` o HTTPS. Obrir
> `dist/index.html` amb `file://` no el registrarà, i algunes funcions de
> persistència tampoc no hi estaran disponibles.

### Scripts

| Script              | Què fa                                    |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Servidor de desenvolupament amb HMR       |
| `npm run build`     | Typecheck (`tsc --noEmit`) i build a `dist` |
| `npm run preview`   | Serveix la build de producció             |
| `npm run typecheck` | Només comprovació de tipus                |

### Comprovacions opcionals

Amb `npm run preview` en marxa i Google Chrome instal·lat:

| Comanda                          | Què comprova                                                        |
| -------------------------------- | ------------------------------------------------------------------- |
| `npx tsx scripts/smoke.ts`       | Els adaptadors d'ESPN retornen dades vàlides                        |
| `node scripts/check-app.mjs`     | E2E: cap petició en obrir, sync manual, IndexedDB, offline, PWA      |
| `node scripts/overflow-audit.mjs`| Desbordament horitzontal a 390 px a totes les pàgines                |
| `node scripts/mobile-shots.mjs`  | Captures de mòbil a `%TEMP%\nbastats-shots\mobile`                  |

Aquestes comprovacions fan peticions reals a ESPN i necessiten connexió.

## Com funciona la sincronització manual

El panell **Actualitza les dades** (capçalera, inici i pàgina *Dades*) permet
triar:

1. **Marcadors al voltant d'avui**: 0, 3, 7, 14 o 30 dies (rang complet
   `±dies`).
2. **Detalls dels 30 equips**: afegeix plantilles i calendaris complets
   (unes 60 peticions addicionals).

Cada acció desa els resultats a IndexedDB amb la marca de temps
`{ data, fetchedAt }`. La resta de la interfície llegeix **sempre** d'aquesta
memòria, també quan hi ha connexió.

A més, hi ha descàrregues puntuals:

- Un dia concret de partits, des de *Partits*.
- Els detalls d'un partit, des de la seva pàgina.
- La fitxa d'un equip, des de la seva pàgina.
- La fitxa d'un jugador, des de la seva pàgina.

Els parcials per quart ja viatgen dins del marcador diari. La resta del detall
(estadístiques d'equip, líders i box score) es descarrega a part perquè el
calendari pugui cobrir molts dies sense fer una petició per partit.

Cancel·lar una sincronització conserva les dades que ja hi havia. Si una
petició falla, la resta continuen i els errors es mostren en un desplegable.

### Què es desa

| Clau                            | Contingut                          |
| ------------------------------- | ---------------------------------- |
| `snapshot:standings`            | Classificació (Est/Oest)           |
| `snapshot:scoreboard:<AAAA-MM-DD>` | Partits d'un dia                |
| `snapshot:leaders:<categoria>`  | Rànquing de líders                 |
| `snapshot:team:<id>`            | Plantilla i calendari d'un equip   |
| `snapshot:player:<id>`          | Biografia i estadístiques          |
| `snapshot:game:<id>`            | Parcials, estadístiques i box score |
| `meta:lastSync`                 | Marca de temps de l'última sync    |
| `meta:settings`                 | Perfil de sincronització           |

La pàgina *Dades* mostra l'espai utilitzat, permet exportar/importar un JSON de
backup, esborrar la cache i demanar emmagatzematge persistent al navegador.

## Desplegament estàtic

La build genera fitxers estàtics a `dist/`. Com que les rutes fan servir
`HashRouter` (`/#/partits`), no calen reescriptures del costat del servidor;
n'hi ha prou de publicar el contingut de `dist/`.

```bash
npm run build
# puja el contingut de dist/ al teu host estàtic
```

### Publicació en un subdirectori

Si l'app no viu a l'arrel del domini, defineix `VITE_BASE` abans de compilar:

```bash
# PowerShell
$env:VITE_BASE = "/nba/"; npm run build
```

```bash
# bash
VITE_BASE=/nba/ npm run build
```

Això ajusta les rutes dels assets, el manifest i l'abast del service worker.

## Estructura

```
src/
  components/     UI reutilitzable (targetes, taules, panells, icones)
  context/        DataContext: estat de sync, offline, toasts, backup
  hooks/          Hooks de lectura de la cache
  lib/            Tipus, client i normalitzadors d'ESPN, cache, sync, format
  pages/          Rutes de l'app
  App.tsx         Router i shell
  main.tsx        Arrencada, fonts i registre del service worker
```

## Notes

- La cache és per navegador i per origen: exporta un backup si vols moure les
  dades.
- Les imatges d'ESPN (`a.espncdn.com`) es cachegen quan es mostren per primera
  vegada (estratègia `CacheFirst`).
- Els resultats d'ESPN poden variar segons la temporada; l'app normalitza les
  respostes abans de desar-les, així que els canvis de format no afecten la
  resta de la interfície.
- Projecte no afiliat a l'NBA ni a ESPN.
