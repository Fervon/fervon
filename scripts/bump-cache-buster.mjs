/* ============================================================================
   scripts/bump-cache-buster.mjs
   ----------------------------------------------------------------------------
   Refresca el `?v=` de los assets propios (css/js) en todas las páginas.

   POR QUÉ EXISTE (pagado en producción el 2026-08-14): fervon.dev va detrás
   del proxy de Cloudflare, que cachea los .css y .js por URL COMPLETA. Si se
   edita `assets/shared.css` y se despliega sin tocar el `?v=` del enlace, el
   borde sigue sirviendo la copia vieja y la página sale SIN MAQUETAR: las
   clases nuevas no existen en el CSS cacheado. Pasó tal cual al desplegar los
   bloques de SEO (16 de las 18 páginas enlazaban `shared.css` sin `?v=`).

   POR QUÉ EL TOKEN ES UN HASH Y NO LA FECHA (medido el 2026-08-25): hasta hoy
   el token era `AAAAMMDD`, o sea IDEMPOTENTE DENTRO DEL MISMO DÍA. Ese día hubo
   19 despliegues bajo la etiqueta `20260825`, y uno de ellos (ca586ba) cambió
   reglas del nav en `assets/shared.css`. Quien cargara el sitio en un
   despliegue anterior se guardó esa URL con `Cache-Control: max-age=31536000`
   —un año— mientras el HTML se renueva cada 600 s: al volver recibía HTML nuevo
   y REUTILIZABA el CSS viejo, porque la URL no había cambiado. Sin que fallara
   una sola petición, así que no lo veía ninguna comprobación de estado.

   Con el token derivado del CONTENIDO eso no puede pasar: si el fichero cambia
   la URL cambia, y si no cambia la URL se queda quieta y no se tira la caché de
   nadie sin motivo.

   Hash: SHA-1 del fichero ENTERO. El muestreo cada N bytes que usa
   `gen-blog.mjs` para las portadas es demasiado grosero para código: en un CSS
   un cambio de un solo carácter tiene que mover el token SIEMPRE.

   REGLA: cada vez que se toque un asset compartido, correr esto antes de
   commitear. `--check` lo verifica sin escribir y sale con código 1 si algo se
   quedó desincronizado, para poder atarlo a CI o a un hook.

   Uso:  node scripts/bump-cache-buster.mjs            (reescribe lo que haga falta)
         node scripts/bump-cache-buster.mjs --check    (no escribe; falla si hay desfase)
         node scripts/bump-cache-buster.mjs <token>    (escape: fuerza un token fijo)
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const FORZADO = process.argv.slice(2).find((a) => !a.startsWith('--')) || null;

/* Se refresca TODO css/js propio del sitio, no una lista fija de nombres: la
   lista fija se dejaba fuera los CSS por artículo (trace/*.css) y el
   index.client.js, que también cambian y también los cachea Cloudflare.
   g1 = `href="` · g2 = la ruta · g3 = el `?v=...` que hubiera. */
const ASSET_RE = /((?:href|src)=")((?:\/|\.{0,2}\/)?[^":]*?\.(?:css|js))(\?v=[^"]*)?"/g;

/* Un fichero se lee y se hashea UNA vez aunque lo enlacen 90 páginas. */
const cacheHash = new Map();
const faltan = new Set();

function tokenDe(rutaAsset, paginaRel) {
  if (FORZADO) return FORZADO;
  /* Absoluta -> desde la raíz del sitio. Relativa -> desde la página que enlaza. */
  const abs = rutaAsset.startsWith('/')
    ? path.join(ROOT, rutaAsset.slice(1))
    : path.resolve(path.dirname(path.join(ROOT, paginaRel)), rutaAsset);
  if (cacheHash.has(abs)) return cacheHash.get(abs);
  let t;
  if (!fs.existsSync(abs)) {
    /* Sin fichero no hay hash. Se avisa y se deja el token quieto: inventarse
       uno tiraría la caché de todo el mundo en cada pasada. */
    faltan.add(path.relative(ROOT, abs).split(path.sep).join('/'));
    t = null;
  } else {
    t = crypto.createHash('sha1').update(fs.readFileSync(abs)).digest('hex').slice(0, 10);
  }
  cacheHash.set(abs, t);
  return t;
}

const PAGES = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    /* dist/ lo borra y lo rehace build-pages.mjs entero (`rmSync` + copia),
       así que tocarlo aquí sólo infla el recuento y hace pensar que se han
       actualizado el doble de páginas de las que existen.
       src-i18n/ son FUENTES, no el sitio: sus enlaces relativos apuntan a
       assets que sólo existen en la página ya generada, así que hashearlos
       desde aquí sólo produce 37 avisos de «no existe». Lo saltan igual
       head-check.mjs y analitica-check.mjs. */
    if (['node_modules', '.git', '.claude', 'dist', 'src-i18n'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) PAGES.push(path.relative(ROOT, p).split(path.sep).join('/'));
  }
})(ROOT);
PAGES.sort();

let changed = 0;
const desfasadas = [];
for (const rel of PAGES) {
  const file = path.join(ROOT, rel);
  const raw = fs.readFileSync(file, 'utf8');
  const crlf = /\r\n/.test(raw);
  let h = raw.replace(/\r\n/g, '\n');
  const before = h;

  /* Sólo assets propios: un href a otro dominio no se toca. */
  h = h.replace(ASSET_RE, (m, attr, ruta) => {
    if (/^https?:/.test(ruta)) return m;
    const t = tokenDe(ruta, rel);
    if (!t) return m;
    return `${attr}${ruta}?v=${t}"`;
  });

  if (h !== before) {
    if (CHECK) { desfasadas.push(rel); continue; }
    fs.writeFileSync(file, crlf ? h.replace(/\n/g, '\r\n') : h);
    changed++;
    console.log(`✔ ${rel}`);
  }
}

if (faltan.size) {
  console.log(`\n⚠ ${faltan.size} asset(s) enlazados que no existen en disco (token intacto):`);
  for (const f of [...faltan].sort()) console.log(`    ${f}`);
}

if (CHECK) {
  if (desfasadas.length) {
    console.error(`\n✗ ${desfasadas.length} página(s) con el ?v= desincronizado del contenido:`);
    for (const p of desfasadas) console.error(`    ${p}`);
    console.error('\n  Corrige con:  npm run cache:bump');
    process.exit(1);
  }
  console.log(`✔ ?v= al día en las ${PAGES.length} páginas`);
} else {
  console.log(`\n${changed} página(s) actualizadas (token = hash del contenido)`);
}
