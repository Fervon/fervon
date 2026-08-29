/* ============================================================================
   scripts/cls-check.mjs
   ----------------------------------------------------------------------------
   Mide el CLS (Cumulative Layout Shift) REAL de las páginas del sitio con
   Chrome, y dice qué elemento lo provoca.

   POR QUÉ EXISTE: el 2026-08-29 el panel de Cloudflare daba «CLS 100% Poor» en
   fervon.dev y su Debug View señalaba dos elementos concretos —
   `div.proofcard.reveal>::after` y `div.meta-row>span`. Los dos eran fallos de
   verdad y los dos eran INVISIBLES a cualquier comprobación estática:

     · el barrido ámbar de las tarjetas se movía animando `left`, que es una
       propiedad de LAYOUT: el rect del pseudo cambia en cada fotograma y la
       Layout Instability API lo cuenta como desplazamiento (los `transform`
       están exentos por especificación, `left` no);
     · el contador de la demo de Lookspan iba de "0" a "1,284" sin ancho
       reservado, empujando a su vecino durante 1,1 s;
     · y de propina, el buscador que se teclea solo en /trace/ y /regenta/
       crecía dos veces (primera letra y salto a la segunda línea), empujando
       la página entera 22 px hacia abajo.

   Ninguno rompe nada, ninguno falla una petición, ninguno se ve en el HTML.
   Solo se ven midiendo. De ahí este script.

   HASTA DÓNDE LLEGA: comprobado el 2026-08-29 volviendo a poner cada fallo, este
   script marca en rojo el de /trace/ (0,0330) y el de /pregon/ (0,0270) y nombra
   los `::after` de la portada (0,0085). El contador de Lookspan NO: aquí medía
   0,0001 y Cloudflare lo veía igualmente. Un PC rápido con red local es el mejor
   de los casos posibles, así que un verde de este script no dice «no hay CLS»,
   dice «no hay CLS de los gordos». El panel de RUM sigue mandando.

   NO CUENTA COMO VISITA: con `--live` se aborta `cloudflareinsights.com`, como
   en head-check.mjs. Sin eso, medir el sitio ensucia la analítica del sitio —
   y encima con las métricas del propio medidor.

   QUÉ PÁGINAS MIDE: una por cada combinación distinta de CSS+JS, porque el CLS
   lo produce la plantilla, no el texto. Así se cubre el sitio entero sin medir
   59 páginas iguales. Con `--todas` las mide todas.

   Uso:  node scripts/cls-check.mjs             una por plantilla, en local
         node scripts/cls-check.mjs --live      contra fervon.dev
         node scripts/cls-check.mjs --todas     todas las páginas
         node scripts/cls-check.mjs /trace/     solo esas rutas
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const LIVE = process.argv.includes('--live');
const TODAS = process.argv.includes('--todas');

/* EL UMBRAL NO ES 0,1. Core Web Vitals llama «bueno» a todo lo que baje de 0,1
   y «Poor» a lo que pase de 0,25 — pero medidos en un PC rápido y con red
   local, los tres fallos que motivaron este script daban 0,0089 / 0,027 /
   0,033. Con el umbral de la especificación, este script habría dado verde el
   mismo día en que se escribió, mientras el panel de Cloudflare los veía en
   rojo en dispositivos de verdad. Así que el listón es lo que mide el sitio
   cuando está sano (≤0,0013 en las 41 plantillas, comprobado el 2026-08-29)
   con holgura, no lo que permite la especificación. Por debajo de AVISO no se
   dice nada; entre AVISO y UMBRAL se listan los culpables sin fallar. */
const UMBRAL = 0.02;
const AVISO = 0.001;
const VIEWPORTS = [{ width: 1280, height: 800 }, { width: 390, height: 800 }];

/* Mismos saltos que head-check.mjs: dist/ es una copia del sitio y medirla
   duplica el trabajo para no enterarse de nada nuevo. */
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

const rutaDe = (f) => '/' + f.replace(/index\.html$/, '').replace(/\.html$/, '');

/* La plantilla de una página = sus hojas, sus scripts y su IDIOMA. Las hojas y
   los scripts porque el desplazamiento lo produce la plantilla, no el texto. El
   idioma porque la MISMA plantilla se desplaza distinto en cada uno: el
   buscador de /trace/ salta a la segunda línea por debajo de 520px en español
   y de 414px en inglés, porque la frase es más corta. Medir solo una de las dos
   versiones deja la otra sin mirar. */
function firma(f) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const assets = [...html.matchAll(/(?:href|src)="([^"]+\.(?:css|js))(?:\?[^"]*)?"/g)].map((m) => m[1]);
  const lang = (html.match(/<html[^>]*\blang="([^"]+)"/) || [, '?'])[1];
  return lang + '|' + [...new Set(assets)].sort().join('|');
}

/* Git Bash convierte un argumento que empieza por `/` en una ruta de Windows:
   `/trace/` llega como `C:/Program Files/Git/trace/` y el navegador contesta
   «invalid URL». Se deshace aquí para que el fallo no parezca del sitio. */
const normaliza = (r) => '/' + String(r).replace(/^[A-Za-z]:[\/].*?[\/]Git[\/]/i, '').replace(/^\/+/, '');
const sueltas = process.argv.slice(2).filter((a) => !a.startsWith('--')).map(normaliza);
let rutas;
if (sueltas.length) {
  rutas = sueltas;
} else {
  const todas = paginas(ROOT).filter((f) => !/(^|\/)404\.html$/.test(f));
  if (TODAS) rutas = todas.map(rutaDe);
  else {
    const vistas = new Map();
    for (const f of todas) if (!vistas.has(firma(f))) vistas.set(firma(f), rutaDe(f));
    rutas = [...vistas.values()].sort();
  }
}

/* En local hace falta un servidor: con file:// no hay rutas limpias ni assets
   absolutos, y el sitio se sirve con URLs sin extensión. */
let servidor = null;
let origen = 'https://fervon.dev';
if (!LIVE) {
  const TIPOS = { '.html': 'text/html;charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.txt': 'text/plain' };
  servidor = http.createServer((req, res) => {
    let f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); }
    catch { if (fs.existsSync(f + '.html')) f += '.html'; }
    fs.readFile(f, (e, d) => {
      if (e) { res.writeHead(404).end('404'); return; }
      res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' });
      res.end(d);
    });
  });
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  origen = `http://127.0.0.1:${servidor.address().port}`;
}

const navegador = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--force-device-scale-factor=1'] });
const malas = [];

/* DOS PASADAS POR PAGINA, y no una. La primera se queda quieta arriba; la
   segunda baja hasta el final. Hace falta porque un desplazamiento solo puntua
   si ocurre DENTRO de la pantalla: el mensaje que se teclea solo en el hero de
   /pregon/ desplazaba 0,027 quieto y 0,0000 si el barrido de scroll ya habia
   pasado de largo cuando le tocaba crecer. Con una sola pasada el mismo fallo
   salia rojo o verde segun el reloj — un guardian intermitente da falsos
   verdes, que es peor que no tenerlo. Se puntua la peor de las dos. */
const PASADAS = [
  { nombre: 'quieto', hacer: async (page) => { await page.evaluate(() => new Promise((r) => setTimeout(r, 5000))); } },
  { nombre: 'scroll', hacer: async (page) => {
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 180));
        }
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 1200));
      });
    } },
];

async function medir(ruta, vp, pasada) {
  const page = await navegador.newPage();
  await page.setViewport(vp);
  if (LIVE) {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (/cloudflareinsights\.com/.test(req.url())) return req.abort().catch(() => {});
      return req.continue().catch(() => {});
    });
  }
  /* El observador se instala ANTES de que exista el documento: los primeros
     desplazamientos son los que mas puntuan y ocurren antes de que cualquier
     script de la pagina haya corrido. */
  await page.evaluateOnNewDocument(() => {
    window.__shifts = [];
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__shifts.push({
          v: e.value,
          t: Math.round(e.startTime),
          src: (e.sources || []).map((s) => {
            const n = s.node;
            return n && n.nodeType === 1
              ? n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\s+/).join('.') : '')
              : String(n && n.nodeName);
          }),
        });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(origen + ruta, { waitUntil: 'networkidle2', timeout: 60000 });
  await pasada.hacer(page);
  const shifts = await page.evaluate(() => window.__shifts);
  await page.close();
  return { shifts, cls: shifts.reduce((a, s) => a + s.v, 0) };
}

for (const ruta of rutas) {
  for (const vp of VIEWPORTS) {
    let peor = null;
    for (const pasada of PASADAS) {
      const r = await medir(ruta, vp, pasada);
      if (!peor || r.cls > peor.cls) peor = { ...r, pasada: pasada.nombre };
    }
    const { cls, shifts } = peor;
    const mal = cls > UMBRAL;
    if (mal) malas.push({ ruta, vp, cls, shifts });
    console.log(`${mal ? 'MAL ' : cls > AVISO ? 'ojo ' : 'ok  '} ${cls.toFixed(4)}  ${String(vp.width).padStart(4)}px  ${ruta}  (${peor.pasada})`);
    if (mal || cls > AVISO) {
      for (const s of shifts.slice().sort((a, b) => b.v - a.v).slice(0, 3)) {
        console.log(`        ${s.v.toFixed(4)} @${s.t}ms  <- ${s.src.slice(0, 3).join(' , ') || '(sin fuente)'}`);
      }
    }
  }
}

await navegador.close();
if (servidor) servidor.close();

console.log(`\n${rutas.length} página(s) × ${VIEWPORTS.length} anchos · umbral ${UMBRAL}`);
if (malas.length) {
  console.log(`${malas.length} medición(es) por encima del umbral.`);
  process.exit(1);
}
console.log('Ninguna página se desplaza por encima del umbral.');
