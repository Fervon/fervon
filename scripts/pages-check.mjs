#!/usr/bin/env node
/**
 * scripts/pages-check.mjs
 * ────────────────────────────────────────────────────────────────────────────
 * Prueba la SALIDA de `npm run pages:build` como la serviría Cloudflare Pages:
 * sirve `dist/` aplicando el `_headers` de verdad (parseado, no a mano), con
 * URLs sin extensión y sin servir `/_headers`, y recorre unas cuantas páginas
 * con Chrome comprobando violaciones de CSP, errores de consola, que el fondo
 * anima y que la caché sale como toca.
 *
 * Sirve para pillar antes del despliegue lo único que la preview de
 * `*.pages.dev` NO puede enseñarte: la CSP. En pages.dev no se aplican las
 * reglas de la zona, así que allí la política simplemente no está.
 *
 * Uso:  npm run pages:build && npm run pages:check
 *       CHROME_PATH=... para apuntar a otro Chrome.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = normalize(join(dirname(fileURLToPath(import.meta.url)), '..', 'dist'));
const PUERTO = Number(process.env.PUERTO || 4101);
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const RUTAS = ['/', '/en/', '/about/', '/blog/', '/trace/', '/trace/rewind-ai-alternative',
               '/veredicto/', '/contacto/', '/404.html'];

if (!existsSync(ROOT)) { console.error('No hay dist/. Corre `npm run pages:build` antes.'); process.exit(2); }

const TIPO = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2',
  '.ico':'image/x-icon','.json':'application/json','.xml':'application/xml','.txt':'text/plain',
  '.mp4':'video/mp4','.webm':'video/webm' };

/* _headers → reglas. En Pages, cuando dos casan y ponen la misma cabecera gana
   la última, así que se aplican en orden de aparición. */
const reglas = [];
{
  let actual = null;
  for (const raw of readFileSync(join(ROOT, '_headers'), 'utf8').split('\n')) {
    const l = raw.replace(/\r$/, '');
    if (!l.trim() || l.trim().startsWith('#')) continue;
    if (!/^\s/.test(l)) { actual = { patron: l.trim(), cab: {} }; reglas.push(actual); continue; }
    const i = l.indexOf(':');
    actual.cab[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  }
}
const casa = (patron, ruta) =>
  patron === '/*' ? true
  : patron.startsWith('/*.') ? ruta.endsWith(patron.slice(2))
  : patron.endsWith('/*') ? ruta.startsWith(patron.slice(0, -1))
  : patron === ruta;

const srv = createServer(async (req, res) => {
  let buf, p;
  const ruta = req.url.split('?')[0];
  try {
    if (ruta === '/_headers') throw new Error('Pages lo consume, no lo sirve');
    p = normalize(join(ROOT, decodeURIComponent(ruta)));
    if (!p.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    if ((await stat(p).catch(() => null))?.isDirectory()) p = join(p, 'index.html');
    if (!(await stat(p).catch(() => null))) p += '.html';
    buf = await readFile(p);
  } catch { res.writeHead(404).end('404'); return; }
  const cab = { 'content-type': TIPO[extname(p)] || 'application/octet-stream' };
  for (const r of reglas) if (casa(r.patron, ruta)) Object.assign(cab, r.cab);
  res.writeHead(200, cab).end(buf);
});
srv.on('error', e => { console.error(e.code === 'EADDRINUSE' ? `Puerto ${PUERTO} ocupado.` : e.message); process.exit(2); });
await new Promise(r => srv.listen(PUERTO, '127.0.0.1', r));
console.log('reglas de _headers:', reglas.map(r => r.patron).join(' - '), '\n');

const { default: puppeteer } = await import('puppeteer-core');
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });

let fallos = 0;
for (const ruta of RUTAS) {
  const pag = await nav.newPage();
  await pag.setViewport({ width: 412, height: 823, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errores = [];
  /* /favicon.ico lo pide Chrome por su cuenta y da 404 también en el árbol que
     sirve GitHub Pages hoy (comprobado): no es cosa de este build. */
  const propio = (u) => u && !u.endsWith('/favicon.ico');
  pag.on('console', m => { const u = (m.location() || {}).url || ''; if (m.type() === 'error' && propio(u)) errores.push(m.text().slice(0, 140)); });
  pag.on('pageerror', e => errores.push('pageerror: ' + e.message.slice(0, 140)));
  pag.on('response', r => { if (r.status() >= 400 && propio(r.url())) errores.push(r.status() + ' ' + r.url()); });
  await pag.evaluateOnNewDocument(() => {
    window.__v = [];
    document.addEventListener('securitypolicyviolation', e =>
      window.__v.push(e.violatedDirective + ' <- ' + (e.blockedURI || e.sourceFile)));
  });
  const resp = await pag.goto(`http://127.0.0.1:${PUERTO}${ruta}`, { waitUntil: 'networkidle0' });
  await new Promise(x => setTimeout(x, 1800));
  const est = await pag.evaluate(() => {
    const c = document.getElementById('fv-embers');
    let pintados = 0;
    if (c) {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 4) pintados++;
    }
    return { canvas: !!c, pct: c ? +(100 * pintados / (c.width * c.height)).toFixed(1) : 0, viol: window.__v };
  });
  const ok = !est.viol.length && !errores.length && (ruta === '/404.html' || est.canvas);
  if (!ok) fallos++;
  console.log(`${ok ? 'OK ' : 'MAL'} ${ruta.padEnd(30)} cache-control: ${resp.headers()['cache-control']} - fondo ${est.canvas ? est.pct + '%' : '--'} - CSP ${est.viol.length} - errores ${errores.length}`);
  if (est.viol.length) console.log('     violaciones:', est.viol);
  if (errores.length) console.log('     errores:', errores);
  await pag.close();
}

console.log('');
for (const a of ['/assets/shared.css', '/index.css', '/assets/shared.js', '/assets/fonts/inter-var.woff2', '/_headers']) {
  const r = await fetch(`http://127.0.0.1:${PUERTO}${a}`);
  const esHeaders = a === '/_headers';
  const real = esHeaders ? String(r.status) : (r.headers.get('cache-control') || '--');
  const bien = esHeaders ? r.status === 404 : real.includes('31536000');
  if (!bien) fallos++;
  console.log(`${bien ? 'OK ' : 'MAL'} ${a.padEnd(32)} ${real}`);
}

console.log(fallos ? `\n${fallos} problema(s)` : '\nTodo limpio');
await nav.close(); srv.close();
process.exit(fallos ? 1 : 0);
