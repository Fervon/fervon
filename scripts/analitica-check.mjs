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

   Cuatro estados posibles y ninguno es ambiguo:
     · SIN TOKEN  — el sitio no mide. Sale 1 y dice el paso exacto que falta.
     · ROTO       — hay token pero el beacon no carga (CSP, caché vieja,
                    token mal pegado). Sale 1 con el motivo.
     · MIDIENDO   — el beacon carga y responde. Sale 0.
     · SIN PODER COMPROBARLO — el DNS de esta red anula el host del beacon.
                    Sale 2 ANTES de abrir Chrome, y lo dice con esas palabras.

   EL CUARTO ESTADO NO ES COSMÉTICO, es la razón de que exista la sonda de más
   abajo. Sin él, «el sitio no mide» y «mide y yo no puedo verlo» daban la misma
   salida, y el script parecía prudente mientras no comprobaba nada. El filtro
   se quitó el 2026-08-25 poniendo el host en la lista blanca del Pi-hole (lo
   bloqueaba el adlist StevenBlack/hosts), pero vuelve en cuanto se actualicen
   las listas: el aviso se queda.

   TRAMPA HERMANA, medida el mismo día: mientras el host estuvo a 0.0.0.0,
   abortar el POST de RUM y no abortarlo daban EL MISMO resultado, así que esa
   comprobación salía «bien» sin probar nada. Antes de dar por bueno que
   bloqueas algo, comprueba que sin el bloqueo llegaría — si no, estás midiendo
   el bloqueo del vecino.

   Uso:  node scripts/analitica-check.mjs            # contra producción
         node scripts/analitica-check.mjs --local    # contra los ficheros
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:http';
import dns from 'node:dns/promises';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL = process.argv.includes('--local');
const ORIGIN = 'https://fervon.dev';
const PUERTO = 4089;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BEACON = 'static.cloudflareinsights.com';
/* El .js que hay que ver cargar y el POST que crea la visita son cosas
   distintas: `beacon.min.js` sale de static.cloudflareinsights.com y es lo
   que este script verifica; la visita la crea el POST a /cdn-cgi/rum. Se
   aborta el segundo y se deja pasar el primero, para no contarnos a
   nosotros mismos en la analitica que venimos a comprobar. */
const PING_RUM = '/cdn-cgi/rum';

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

/* NO se sale aquí aunque el token esté vacío, y esta es la razón: hasta el
   2026-08-25 este script hacía `exit 1` en este punto y NUNCA llegaba al paso
   2, que es el único que mira el sitio de verdad. Mientras tanto fervon.dev
   llevaba una semana midiendo — Cloudflare inyecta su propio beacon en el
   BORDE cuando Web Analytics está en "Automatic Setup", sin tocar el HTML del
   repo. O sea que el script decía «no mide nada» de una web que medía.
   El token del fichero es una PISTA, no la respuesta; la respuesta la da el
   navegador en el paso 2. */
if (!token) {
  console.log('\n· assets/shared.js no lleva token propio. Puede que igualmente mida:');
  console.log('  Cloudflare inyecta su beacon en el borde si Web Analytics está en modo automático.');
  console.log('  Se comprueba abajo, con Chrome, contra el sitio de verdad.');
}

/* -- 1 bis. ¿Puede este equipo llegar al beacon? ---------------------------- */
/* Sin esto el script gastaba tres cargas y tres timeouts de 45 s para acabar
   en «SIN VEREDICTO», que suena prudente y se lee como normalidad. Medido el
   2026-08-25: el resolver de casa devuelve 0.0.0.0 para los dos hosts del
   beacon —es un bloqueador de rastreadores haciendo su trabajo, no una averia—
   mientras 1.1.1.1, 8.8.8.8 y 9.9.9.9 devolvian la IP real. Era el adlist
   StevenBlack/hosts del Pi-hole de casa, y con la lista blanca puesta el host
   ya resuelve; esta sonda se queda porque el bloqueo puede volver con
   cualquier actualizacion de listas, y sin ella el sintoma es un «SIN
   VEREDICTO» que suena prudente y se lee como normalidad.
   La trampa que dejo, y que casi cuesta cara: mientras el DNS estuvo a
   0.0.0.0, poner el abort() del ping y no ponerlo daban EXACTAMENTE el mismo
   resultado. La comprobacion salia bien por el motivo equivocado. Antes de
   validar nada de esto, mirar que el host resuelva. */
async function sondaBeacon() {
  let local = null;
  try {
    local = (await dns.lookup(BEACON)).address;
  } catch (e) {
    local = 'no resuelve (' + (e.code || 'sin respuesta') + ')';
  }
  if (local !== '0.0.0.0' && local !== '::' && !local.startsWith('no resuelve')) return { ok: true, local };
  /* Separar «lo bloquean aqui» de «el host esta caido»: son fallos opuestos. */
  let publico = null;
  try {
    const r = new dns.Resolver();
    r.setServers(['1.1.1.1', '8.8.8.8']);
    publico = (await r.resolve4(BEACON))[0];
  } catch { publico = null; }
  return { ok: false, local, publico };
}

if (!LOCAL) {
  const sonda = await sondaBeacon();
  if (!sonda.ok) {
    console.log(`\n\u26a0 NO SE PUEDE COMPROBAR DESDE ESTE EQUIPO`);
    console.log(`\n  ${BEACON} resuelve aqui a: ${sonda.local}`);
    if (sonda.publico) {
      console.log(`  y en un resolver publico a: ${sonda.publico}`);
      console.log(`
  O sea: el host esta VIVO y lo esta anulando el DNS de esta red (un bloqueador
  de rastreadores). Dos consecuencias:

    \u00b7 Este script no puede dar veredicto sobre la analitica desde aqui: el
      beacon no llega a cargar, asi que «no mide» y «mide y yo no lo veo» dan
      exactamente la misma salida.
    \u00b7 Ninguna visita hecha desde esta red aparece en Web Analytics. Si el
      panel de fervon.dev tiene datos, son todos de fuera de casa.

  Arreglo: poner ${BEACON} y cloudflareinsights.com en la lista blanca del
  bloqueador (AdGuard/Pi-hole), o correr esto desde otra red.`);
    } else {
      console.log(`
  Y tampoco resuelve contra un resolver publico, asi que esto no parece un
  filtro local: o no hay salida a Internet, o el host esta caido de verdad.`);
    }
    process.exit(2);
  }
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
const cspAjenas = new Set();
/* Viewport FIJADO a proposito. Sin `defaultViewport` puppeteer usa 800x600,
   que no es ningun dispositivo real: ensuciaba el panel con un tamano
   inventado y ademas mando a investigar un CLS que no era nuestro. */
const nav = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
  defaultViewport: { width: 1280, height: 900 },
});
let fallos = 0;

for (const ruta of MUESTRA) {
  const pag = await nav.newPage();
  const peticiones = [];
  const respuestas = [];
  const caidas = [];
  const violaciones = [];
  /* Con la intercepcion activada hay que continuar TODAS las ramas que no
     se aborten: una peticion sin continuar se queda colgada hasta el
     timeout de 45 s del goto y parece un problema de red. */
  let pings = 0;
  await pag.setRequestInterception(true);
  pag.on('request', (r) => {
    if (r.url().includes(BEACON)) peticiones.push(r.url());
    if (r.url().includes(PING_RUM)) { pings++; return r.abort(); }
    return r.continue();
  });
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
  /* Chrome mete la POLITICA ENTERA en el texto de la violacion, y esa politica
     nombra a https://static.cloudflareinsights.com. Asi que buscar
     'cloudflareinsights' en el mensaje casaba con CUALQUIER violacion de
     script-src, incluida la del script inline de Bot Fight Mode, que no es
     nuestro. Efecto medido el 2026-08-25, la primera vez que este script llego
     a dar veredicto tras desbloquearse el DNS: dijo «ROTO, 3 de 3» de un sitio
     que SI mide. Comprobado aparte que el beacon iba bien -> HTTP 200 y POST a
     /cdn-cgi/rum intentado- con dos violaciones ajenas en la misma pagina (un
     style inline y el script de Bot Fight Mode).
     Una violacion cuenta contra el beacon solo si el recurso BLOQUEADO es el:
     el beacon es un script EXTERNO, asi que Chrome diria «Refused to load the
     script '<url>'»; un «Executing inline script» nunca puede ser suyo. */
  const csp = violaciones.filter((v) => /Refused to load the script '[^']*cloudflareinsights/i.test(v));
  for (const v of violaciones) if (!csp.includes(v)) cspAjenas.add(v.split(' Either')[0].slice(0, 120));

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
  /* En --local el beacon del borde no existe: lo inyecta Cloudflare, no el
     repo. Sin token propio, que falle en local es lo esperado y no es un
     fallo del sitio; decirlo evita mandar a nadie a arreglar lo que funciona. */
  if (LOCAL && !token) {
    console.log(`\n· EN LOCAL NO SE PUEDE SABER — no hay token en el repo, y el beacon que mide
  fervon.dev lo inyecta Cloudflare en el borde, que aquí no existe.
  Corre este script SIN --local para el veredicto de verdad.`);
    process.exit(0);
  }
  console.log(`\n✗ ROTO — ${fallos} de ${MUESTRA.length} páginas no llegan a medir.`);
  process.exit(1);
}
if (sinRed) {
  console.log(`\n? SIN VEREDICTO — las páginas piden el beacon como deben, pero esta máquina no resuelve
  ${BEACON}, así que no se puede confirmar que Cloudflare lo reciba.
  Vuelve a correrlo desde una red sin filtro de DNS.`);
  process.exit(2);
}
console.log(`
✓ MIDIENDO — el beacon carga y se ejecuta en las ${MUESTRA.length} páginas de muestra, sin cookies.`);
/* Se dice «la CSP no lo bloquea a EL», no «la pagina no viola la CSP»: son
   cosas distintas y confundirlas ya costo un falso ROTO. Si hay violaciones
   ajenas se avisan, porque el script las tiene en la mano y tirarlas seria
   esconder informacion que a alguien le hace falta. */
if (cspAjenas.size) {
  console.log(`
· Aviso aparte: la pagina tiene ${cspAjenas.size} violacion(es) de CSP que NO son del beacon:`);
  for (const v of cspAjenas) console.log(`    · ${v}`);
}
if (!token) {
  console.log(`
  Y lo hace SIN token en el repo: quien lo inyecta es Cloudflare en el borde
  (Web Analytics en modo automático). Funciona, pero conviene saber dos cosas:

    · NO pegues el token en assets/shared.js «para arreglarlo». Tendrías DOS
      beacons en cada página y las visitas se contarían por duplicado.
    · Deja de medir solo si se quita el proxy naranja de Cloudflare. Si algún
      día pasa, entonces sí: token en shared.js + bump-cache-buster.`);
}
