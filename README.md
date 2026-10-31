# NbaStats

Estadístiques de l'NBA en una web app **offline-first**. Les dades es guarden al
navegador (IndexedDB) i **només s'actualitzen quan tu prems el botó**. No hi ha
cap petició automàtica en obrir l'app, navegar-hi ni tornar a la finestra.

- Partits i calendari diari
- Detall de cada partit: parcials, estadístiques, líders i box score amb 2P i
  valoració (VAL) calculats (només partits de dies passats)
- Classificació per conferències
- Equips amb plantilla i calendari (descàrrega sota demanda)
- Jugadors amb estadístiques calculades a partir dels boxscores descarregats
- Rècords: top 5 per estadística individual i d'equip, amb tots els empatats
  (calculats localment amb els boxscores descarregats)
- PWA instal·lable, amb app shell i logos d'equip a la cache del navegador

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
- Tots els detalls dels partits d'un dia, amb un sol botó des de *Partits*
  (només per a dies passats).
- La fitxa d'un equip, des de la seva pàgina.
- La fitxa d'un jugador, des de la seva pàgina.

Els parcials per quart ja viatgen dins del marcador diari. La resta del detall
(estadístiques d'equip, líders i box score) es descarrega a part perquè el
calendari pugui cobrir molts dies sense fer una petició per partit.

Els detalls només es poden consultar i descarregar per als partits de **dies
passats**. El dia d'avui i els dies futurs no mostren el botó de descàrrega ni
enllacen a la pàgina de detall; si s'hi entra directament per l'adreça, es mostra
un avís i no s'ofereix cap descàrrega. El dia del calendari es calcula amb la
data NBA (zona horària `America/New_York`) del partit.

La pantalla *Jugadors* no fa cap descàrrega: agrega els boxscores de tots els
`snapshot:game:<id>` desats i en calcula partits jugats, minuts, punts, rebots
(totals, ofensius i defensius), assistències, robatoris, taps, tirs de 2,
triples, tirs lliures, valoració i percentatges (TC% i 3P%) de tots els jugadors
amb minuts. Es pot ordenar per qualsevol d'aquestes mètriques i un commutador
permet veure les **mitjanes per partit** o els **totals acumulats** (els
percentatges es calculen sempre amb els totals). La taula mostra totes les
columnes sense desplaçament horitzontal en pantalles d'escriptori; a mòbil es
mostra la columna de la categoria seleccionada. Els partits nous apareixen a la
llista tan bon punt es descarreguen els seus detalls. Si el snapshot del dia es
va desar abans que el partit acabés, la llista mostra l'estat i el resultat del
detall del partit que tinguis desat.

La pantalla *Rècords* també es calcula localment amb els `snapshot:game:<id>`:
mostra el **top 5** de punts, rebots, assistències, valoració, tirs de camp,
tirs de 2, triples, tirs lliures, rebots ofensius i defensius, robatoris, taps,
pèrdues, plus/minus i minuts dels jugadors, i també rècords d'equip
(punts, marge de victòria, rebots, assistències, robatoris i taps). Cada
estadística és una secció de targetes amb el **millor registre destacat** i, a
cada targeta, el jugador o equip, el partit (equip, rival, resultat i data) i el
valor. Si hi ha empat, es mostren **totes** les entrades amb el mateix registre
i el rang s'indica amb `=`. En clicar una targeta s'obre el detall del partit. Quan descarregues els detalls
d'un dia (botó *Carrega tots els detalls* o la descàrrega d'un partit), si algun
registre supera o iguala el màxim que ja tenies desat apareix un avís amb el
jugador o equip, el rècord batut o igualat i **qui tenia el rècord anterior**
(amb tots els empatats).

Al box score, la columna **2P** es calcula restant els triples dels tirs de camp
(`FG − 3P`) i la columna **VAL** aplica la fórmula
`PTS + REB + AST + STL + BLK + 2PM − 2PA + 3PM − 3PA + FTM − FTA`.

A les targetes dels partits finals, un punt **verd** indica que els detalls ja
són a la memòria i un de **vermell** que encara no s'han descarregat. L'indicador
s'actualitza sol quan acaba una descàrrega.

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
- Només es descarreguen imatges dels logos d'equip (`a.espncdn.com/i/teamlogos`).
  Es guarden una sola vegada amb estratègia `CacheFirst` i no caduquen. Els
  jugadors es mostren amb les inicials, sense fotos.
- Els resultats d'ESPN poden variar segons la temporada; l'app normalitza les
  respostes abans de desar-les, així que els canvis de format no afecten la
  resta de la interfície.
- Projecte no afiliat a l'NBA ni a ESPN.
