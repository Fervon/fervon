/* ============================================================================
   scripts/head-check.mjs
   ----------------------------------------------------------------------------
   Comprueba con el parser REAL de Chrome que las etiquetas que Google solo
   respeta dentro del <head> están dentro del <head>.

   POR QUÉ CON UN NAVEGADOR Y NO CON UNA EXPRESIÓN REGULAR: porque el fallo que
   este script existe para pillar es INVISIBLE a una expresión regular. El
   2026-08-25, 24 de las 50 páginas servían `<head></head>` y toda la cabecera
   dentro del `<body>`; `seo-check.mjs` las daba por buenas 49/49 porque las
   etiquetas SÍ estaban en el HTML — solo que en el sitio donde Google las
   ignora. Lo único que distingue un caso del otro es dónde las coloca el
   parser, así que hay que preguntárselo al parser.

   Se ignoran, ahí sí, las etiquetas del <body>: OG y Twitter en el cuerpo son
   síntoma del mismo fallo, así que también se exige que estén arriba.

   NO CUENTA COMO VISITA: con `--live` se aborta `cloudflareinsights.com` y se
   fija el viewport, para no ensuciar la analítica del sitio. Medido: sin el
   aborto el beacon responde 200 y la pasada se registra; con él, no. Ver el
   bloque de arranque del navegador.

   Uso:  node scripts/head-check.mjs                  todo el sitio, en local
         node scripts/head-check.mjs --live           lo que sirve fervon.dev
         node scripts/head-check.mjs a.html b.html    solo esas
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const LIVE = process.argv.includes('--live');
const ORIGIN = 'https://fervon.dev';

/* Los directorios de salida y las copias del sitio NO se recorren: ya nos costó
   una vez tener herramientas ciegas y lentas por olvidarse de dist/. */
const SALTAR = new Set(['node_modules', '.git', 'dist', 'src-i18n', '.claude', '.wrangler', '.github', 'scripts', 'docs']);

function paginas(dir, out = []) {
  for (const e of fs.readdirSync(dir)) {
    if (SALTAR.has(e)) continue;
    const p = path.join(dir, e);
    if (fs.statSync(p).isDirectory()) paginas(p, out);
    else if (e.endsWith('.html')) out.push(path.relative(ROOT, p).split(path.sep).join('/'));
  }
  return out;
}

const sueltas = process.argv.slice(2).filter((a) => !a.startsWith('--'));
/* La 404 no se indexa: no lleva canonical ni hreflang y no debe llevarlos. */
const LISTA = (sueltas.length ? sueltas : paginas(ROOT)).filter((f) => !/(^|\/)404\.html$/.test(f));
/* fervon.dev sirve URLs limpias: /trace/x.html se pide como /trace/x. */
const urlDe = (f) => ORIGIN + '/' + f.replace(/index\.html$/, '').replace(/\.html$/, '');

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();

/* ── Dos cosas para que COMPROBAR el sitio no sea VISITAR el sitio ──────────
   Este script cargaba producción con Chrome sin fijar viewport y sin tocar la
   red, así que heredaba el 800x600 por defecto de Puppeteer y dejaba libre al
   beacon de Cloudflare Web Analytics, que el borde inyecta en el HTML. Un
   medidor que puede alterar lo que mide no sirve para medir.

   FUNCIONA, y está MEDIDO el 2026-08-25 con el host resolviendo de verdad:

       sin abort()  ->  1 peticion a cloudflareinsights, 1 respuesta 200
       con abort()  ->  1 peticion,                      0 respuestas

   Sin esa respuesta el beacon no se ejecuta y no hay visita. Ojo a la trampa
   que casi nos come: durante unas horas de ese mismo dia el Pi-hole de casa
   resolvia `static.cloudflareinsights.com` y `cloudflareinsights.com` a 0.0.0.0
   (adlist StevenBlack/hosts), y con eso el abort() daba EXACTAMENTE el mismo
   resultado que no ponerlo — 0 respuestas en los dos casos. O sea que la
   comprobacion salia "bien" por el motivo equivocado. Si vuelves a validar
   esto, mira antes que el host resuelva; si no, no estas midiendo nada.

   NO ATRIBUIRSE EL CLS DEL PANEL, que este viewport lo hizo parecer. El
   2026-08-25 hubo un CLS de 0.707 con el rect del nav en 784x574@8,26 y llego a
   pensarse que el cliente eramos nosotros. NO LO ERAMOS, y ya no es deduccion:
   se sacaron los eventos crudos por GraphQL (`rumWebVitalsEventsAdaptive`, que
   trae el campo `bot`, invisible en la interfaz del panel) y los tres eventos
   son `bot:1`, ChromeHeadless/Linux, pais NL. Un escaner de datacenter que
   pinta sin esperar la hoja de estilos. **El peor visitante humano de esa
   ventana tuvo 0.02, con el umbral de "bueno" en 0.1.** El nav esta sano y no
   habia nada que arreglar ahi. */

/* 1. Viewport explícito. El valor da igual para lo que este script comprueba
      —dónde acaban las etiquetas del <head> no depende del ancho— pero
      heredarlo en silencio sí importa: hace que el ruido se disfrace de
      visitante real en los informes. */
await page.setViewport({ width: 1280, height: 900 });

/* 2. El beacon no se carga. Nada de analítica: aquí venimos a leer el <head>,
      no a sumar una visita. Se aborta la petición entera en vez de bloquear
      cookies, porque lo que cuenta como visita es que el script llegue a
      ejecutarse. */
await page.setRequestInterception(true);
page.on('request', (req) => {
  if (/cloudflareinsights\.com/.test(req.url())) return req.abort().catch(() => {});
  req.continue().catch(() => {});
});

const malas = [];

for (const f of LISTA) {
  /* Con ?cb= para no pinchar la caché del borde: una regla de Cloudflare de
     esta zona cachea por URL completa y guarda hasta los 404. */
  const url = LIVE ? urlDe(f) + '?cb=' + Math.random() : pathToFileURL(path.join(ROOT, f)).href;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  } catch (e) { malas.push([f, 'no carga: ' + e.message.slice(0, 60)]); continue; }
  const r = await page.evaluate(() => ({
    hijos: document.head.children.length,
    title: !!document.head.querySelector('title'),
    canonical: !!document.head.querySelector('link[rel="canonical"]'),
    hreflang: document.head.querySelectorAll('link[rel="alternate"][hreflang]').length,
    robots: !!document.head.querySelector('meta[name="robots"]'),
    desc: !!document.head.querySelector('meta[name="description"]'),
    ogCuerpo: document.body.querySelectorAll('meta[property^="og:"],meta[name^="twitter:"]').length,
    linkCuerpo: document.body.querySelectorAll('link[rel="canonical"],link[rel="alternate"]').length,
  }));
  const fallos = [];
  if (!r.title) fallos.push('title fuera del head');
  if (!r.canonical) fallos.push('canonical fuera del head');
  if (r.hreflang < 2) fallos.push(`solo ${r.hreflang} hreflang en el head`);
  if (!r.robots) fallos.push('meta robots fuera del head');
  if (!r.desc) fallos.push('description fuera del head');
  if (r.ogCuerpo) fallos.push(`${r.ogCuerpo} meta og/twitter en el cuerpo`);
  if (r.linkCuerpo) fallos.push(`${r.linkCuerpo} link canonical/alternate en el cuerpo`);
  if (fallos.length) malas.push([f, fallos.join('; ')]);
}

await browser.close();

console.log(`${LISTA.length} páginas comprobadas ${LIVE ? 'EN VIVO' : 'en local'} con el parser de Chrome`);
if (!malas.length) { console.log('✔ La cabecera está dentro del <head> en todas.'); process.exit(0); }
console.log(`\n✗ ${malas.length} con la cabecera fuera del <head>:`);
for (const [f, d] of malas) console.log(`   ${f}\n      ${d}`);
console.log('\n  Google IGNORA canonical, hreflang, robots y description fuera del <head>.');
console.log('  Arréglalo con:  node scripts/fix-head-vacio.mjs');
process.exit(1);
