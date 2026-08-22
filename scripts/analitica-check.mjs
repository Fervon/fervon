#!/usr/bin/env node
/* ============================================================================
   scripts/analitica-check.mjs
   ----------------------------------------------------------------------------
   Dice si fervon.dev está midiendo algo, y lo comprueba EN EL SITIO, no en el
   fichero: abre las páginas con Chrome de verdad y mira si sale la petición al
   beacon y qué contesta.

   POR QUÉ EXISTE: la revisión del 2026-08-22 midió que el sitio no tenía NADA
   de analítica —ni GA4, ni Plausible, ni el beacon de Cloudflare— aunque la CSP
   llevaba desde junio autorizando `static.cloudflareinsights.com`. Nadie se
   enteró porque no había ninguna comprobación que lo mirara. Ahora la hay.

   Tres estados posibles y ninguno es ambiguo:
     · SIN TOKEN  — el sitio no mide. Sale 1 y dice el paso exacto que falta.
     · ROTO       — hay token pero el beacon no carga (CSP, caché vieja,
                    token mal pegado). Sale 1 con el motivo.
     · MIDIENDO   — el beacon carga y responde. Sale 0.

   Uso:  node scripts/analitica-check.mjs            # contra producción
         node scripts/analitica-check.mjs --local    # contra los ficheros
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL = process.argv.includes('--local');
const ORIGIN = 'https://fervon.dev';
const PUERTO = 4089;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BEACON = 'static.cloudflareinsights.com';

/* Una muestra, no las 49: con tres páginas de tres generadores distintos ya se
   ve si shared.js llega a todas. La cobertura completa la comprueba el paso 1. */
const MUESTRA = ['/', '/trace/rewind-ai-alternative', '/blog/'];

/* -- 1. ¿Hay token, y lo cargan todas las páginas? ------------------------- */
const shared = fs.readFileSync(path.join(ROOT, 'assets/shared.js'), 'utf8');
const m = shared.match(/var FERVON_ANALITICA_TOKEN\s*=\s*'([^']*)'/);
if (!m) {
  console.error('✗ assets/shared.js no declara FERVON_ANALITICA_TOKEN. ¿Se ha borrado el bloque de analítica?');
  process.exit(1);
}
const token = m[1].trim();

const paginas = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.claude', 'src-i18n', 'dist', 'scripts', 'assets'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html') && e.name !== '404.html') paginas.push(path.relative(ROOT, p).split(path.sep).join('/'));
  }
})(ROOT);
const sinShared = paginas.filter((p) => !fs.readFileSync(path.join(ROOT, p), 'utf8').includes('assets/shared.js'));

console.log(`\nPáginas que cargan assets/shared.js: ${paginas.length - sinShared.length}/${paginas.length}`);
if (sinShared.length) {
  console.log('  Sin él (no se medirían):');
  for (const p of sinShared) console.log(`    · /${p}`);
}

if (!token) {
  console.log(`
✗ SIN TOKEN — fervon.dev no está midiendo nada.

  El cableado está puesto y la CSP ya autoriza el beacon. Falta un solo paso,
  que es de panel porque el token de la API no tiene permiso de Web Analytics:

    1. Cloudflare -> Analytics & Logs -> Web Analytics -> Add a site
    2. Hostname: fervon.dev
    3. Copia el token del snippet que te enseña (el valor de data-cf-beacon)
    4. Pégalo en assets/shared.js, en FERVON_ANALITICA_TOKEN
    5. node scripts/bump-cache-buster.mjs     (si no, el borde sirve el viejo)
    6. node scripts/analitica-check.mjs       (esto debería salir en verde)
`);
  process.exit(1);
}

/* -- 2. ¿Carga de verdad? -------------------------------------------------- */
let servidor = null;
let base = ORIGIN;
if (LOCAL) {
  const TIPO = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml; charset=utf-8' };
  servidor = createServer(async (req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel.endsWith('/')) rel += 'index.html';
    let f = path.join(ROOT, rel.replace(/^\//, ''));
    /* Las landings de Trace son ficheros sueltos sin extensión en la URL
       (/trace/rewind-ai-alternative -> trace/rewind-ai-alternative.html),
       igual que las sirve GitHub Pages. */
    if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
    try {
      const b = fs.readFileSync(f);
      res.writeHead(200, { 'content-type': TIPO[path.extname(f)] || 'application/octet-stream' });
      res.end(b);
    } catch { res.writeHead(404); res.end('no'); }
  });
  await new Promise((r) => servidor.listen(PUERTO, '127.0.0.1', r));
  base = `http://127.0.0.1:${PUERTO}`;
}

let sinRed = 0;
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
let fallos = 0;

for (const ruta of MUESTRA) {
  const pag = await nav.newPage();
  const peticiones = [];
  const respuestas = [];
  const caidas = [];
  const violaciones = [];
  pag.on('request', (r) => { if (r.url().includes(BEACON)) peticiones.push(r.url()); });
  pag.on('response', (r) => { if (r.url().includes(BEACON)) respuestas.push(r.status()); });
  /* Sin esto no se distingue «la página no pide el beacon» de «esta máquina no
     llega a Cloudflare». Son fallos opuestos y el arreglo no tiene nada que ver:
     uno es del sitio y el otro es de la red desde la que estás midiendo. */
  pag.on('requestfailed', (r) => { if (r.url().includes(BEACON)) caidas.push(r.failure()?.errorText || 'error desconocido'); });
  pag.on('console', (msg) => { if (/Content Security Policy/i.test(msg.text())) violaciones.push(msg.text()); });

  const url = base + ruta + (LOCAL ? '' : '?cb=' + Date.now());
  await pag.goto(url, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
  /* El beacon va con defer y se inyecta desde shared.js: hay que darle un
     respiro después de networkidle o se mide antes de que exista. */
  await new Promise((r) => setTimeout(r, 1500));

  const cargado = respuestas.some((c) => c >= 200 && c < 300);
  const csp = violaciones.filter((v) => v.includes('cloudflareinsights'));

  if (cargado && !csp.length) {
    console.log(`ok    ${ruta}`);
  } else if (!peticiones.length) {
    fallos++;
    console.log(`FALLA ${ruta}`);
    console.log('        la página no pide el beacon — ¿shared.js cacheado viejo? prueba bump-cache-buster');
    if (csp.length) console.log(`        y además la CSP lo bloqueó: ${csp[0].slice(0, 160)}`);
  } else if (caidas.length) {
    /* La página SÍ lo pide; lo que falla es la red de quien mide. */
    sinRed++;
    console.log(`?     ${ruta}   la página lo pide, pero desde aquí no se llega: ${caidas[0]}`);
  } else {
    fallos++;
    console.log(`FALLA ${ruta}`);
    console.log(`        respuesta inesperada del beacon: ${respuestas.join(', ') || 'ninguna'}`);
    if (csp.length) console.log(`        la CSP lo bloqueó: ${csp[0].slice(0, 160)}`);
  }
  await pag.close();
}

await nav.close();
if (servidor) servidor.close();

if (fallos) {
  console.log(`\n✗ ROTO — hay token pero ${fallos} de ${MUESTRA.length} páginas no llegan a medir.`);
  process.exit(1);
}
if (sinRed) {
  console.log(`\n? SIN VEREDICTO — las páginas piden el beacon como deben, pero esta máquina no resuelve
  ${BEACON}, así que no se puede confirmar que Cloudflare lo reciba.
  Vuelve a correrlo desde una red sin filtro de DNS.`);
  process.exit(2);
}
console.log(`\n✓ MIDIENDO — el beacon carga en las ${MUESTRA.length} páginas de muestra, sin cookies y sin violar la CSP.`);
