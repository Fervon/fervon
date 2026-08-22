#!/usr/bin/env node
/**
 * Sirve el sitio en local con la CSP QUE DE VERDAD SIRVE fervon.dev y recorre
 * todas las páginas con Chrome headless apuntando cada violación que dispara el
 * navegador. Así el fallo salta aquí y no en la consola de un visitante.
 *
 * Por qué existe: la política es `style-src 'self'` sin 'unsafe-inline', y un
 * simple `style="--i:0"` que se cuele en el HTML queda bloqueado en silencio —
 * la tarjeta se queda sin su retardo y nadie se entera hasta que alguien abre
 * la consola. `grep style=` no basta: hay que ver al navegador rechazarlo.
 *
 * Uso:
 *   node scripts/csp-check.mjs                  # coge la CSP de https://fervon.dev
 *   node scripts/csp-check.mjs --csp "..."      # o le pasas una a mano
 *
 * Sale != 0 si queda alguna violación. Necesita puppeteer-core y Chrome.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readdirSync, statSync } from 'node:fs';
import { join, extname, normalize, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = normalize(join(dirname(fileURLToPath(import.meta.url)), '..'));
const PUERTO = 4088;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const TIPO = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain',
};

// --- la política a probar -----------------------------------------------
const iArg = process.argv.indexOf('--csp');
let CSP = iArg > -1 ? process.argv[iArg + 1] : null;
if (!CSP) {
  const r = await fetch('https://fervon.dev/', { redirect: 'follow' });
  CSP = r.headers.get('content-security-policy');
  if (!CSP) { console.error('fervon.dev no devolvió cabecera CSP; usa --csp "..."'); process.exit(2); }
  console.log('CSP tomada de producción\n');
}

// --- servidor estático ---------------------------------------------------
const srv = createServer(async (req, res) => {
  try {
    let p = normalize(join(ROOT, decodeURIComponent(req.url.split('?')[0])));
    if (!p.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    if ((await stat(p).catch(() => null))?.isDirectory()) p = join(p, 'index.html');
    const buf = await readFile(p);
    const cab = { 'content-type': TIPO[extname(p)] || 'application/octet-stream' };
    if (extname(p) === '.html') cab['content-security-policy'] = CSP;
    res.writeHead(200, cab).end(buf);
  } catch { res.writeHead(404).end('404'); }
});
// Si el puerto está pillado hay que parar aquí: seguir contra el servidor de
// otro (sin la cabecera CSP puesta) daría 0 violaciones y sería mentira.
srv.on('error', e => {
  console.error(e.code === 'EADDRINUSE'
    ? `El puerto ${PUERTO} está ocupado. Cierra lo que haya ahí y repite.`
    : e.message);
  process.exit(2);
});
await new Promise(r => srv.listen(PUERTO, '127.0.0.1', r));

// --- recorrido -----------------------------------------------------------
function paginas(dir, out = []) {
  for (const f of readdirSync(dir)) {
    /* dist es la copia de build, src-i18n las fuentes con data-en y .claude puede
       guardar worktrees de agentes: ninguna se publica, y recorrerlas multiplicaba
       por 4 el tiempo de Chrome sobre páginas que nadie sirve. */
    if (['node_modules', '.git', '.wrangler', 'scripts', 'dist', 'src-i18n', '.claude'].includes(f)) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) paginas(p, out);
    else if (p.endsWith('.html')) out.push('/' + relative(ROOT, p).replace(/\\/g, '/'));
  }
  return out;
}

const { default: puppeteer } = await import('puppeteer-core');
const nav = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

let fallos = 0;
for (const ruta of paginas(ROOT)) {
  const pag = await nav.newPage();
  await pag.setViewport({ width: 1280, height: 900 });
  await pag.evaluateOnNewDocument(() => {
    window.__viol = [];
    document.addEventListener('securitypolicyviolation', e => window.__viol.push(
      `${e.violatedDirective} ← ${e.blockedURI || e.sourceFile}:${e.lineNumber}`));
  });
  await pag.goto(`http://127.0.0.1:${PUERTO}${ruta}`, { waitUntil: 'networkidle0' });
  // El mega menú y el reveal aplican estilos DESPUÉS de cargar: hay que
  // provocarlos o la página sale limpia sin haberlo estado.
  await pag.hover('.hasmega .navbtn').catch(() => {});
  await pag.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 1200));
  const viol = await pag.evaluate(() => window.__viol);
  await pag.close();
  if (viol.length) { fallos += viol.length; console.log(`FALLA ${ruta}`); viol.forEach(v => console.log('    ' + v)); }
  else console.log(`ok    ${ruta}`);
}

await nav.close();
srv.close();
console.log(fallos ? `\n${fallos} violaciones de CSP` : '\n0 violaciones de CSP');
process.exit(fallos ? 1 : 0);
