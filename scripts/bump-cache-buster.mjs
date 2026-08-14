/* ============================================================================
   scripts/bump-cache-buster.mjs
   ----------------------------------------------------------------------------
   Refresca el `?v=` de los assets compartidos en las 18 páginas.

   POR QUÉ EXISTE (pagado en producción el 2026-08-14): fervon.dev va detrás
   del proxy de Cloudflare, que cachea los .css y .js por URL COMPLETA. Si se
   edita `assets/shared.css` y se despliega sin tocar el `?v=` del enlace, el
   borde sigue sirviendo la copia vieja y la página sale SIN MAQUETAR: las
   clases nuevas no existen en el CSS cacheado. Pasó tal cual al desplegar los
   bloques de SEO (16 de las 18 páginas enlazaban `shared.css` sin `?v=`).

   REGLA: cada vez que se toque un asset compartido, correr esto antes de
   commitear.

   Uso:  node scripts/bump-cache-buster.mjs [version]
         (por defecto usa la fecha de hoy, formato AAAAMMDD)
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* Assets compartidos cuyo enlace lleva cache-buster. */
const ASSETS = ['shared.css', 'shared.js', 'index.css', 'core.css', 'product.css', 'base.css'];

const V = process.argv[2] || (() => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
})();

const PAGES = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.claude'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) PAGES.push(path.relative(ROOT, p).split(path.sep).join('/'));
  }
})(ROOT);
PAGES.sort();

let changed = 0;
for (const rel of PAGES) {
  const file = path.join(ROOT, rel);
  const raw = fs.readFileSync(file, 'utf8');
  const crlf = /\r\n/.test(raw);
  let h = raw.replace(/\r\n/g, '\n');
  const before = h;

  for (const asset of ASSETS) {
    const esc = asset.replace('.', '\\.');
    // Captura href/src que terminen en el asset, con o sin ?v= previo.
    h = h.replace(
      new RegExp(`((?:href|src)="[^"]*?${esc})(\\?v=[^"]*)?"`, 'g'),
      `$1?v=${V}"`,
    );
  }

  if (h !== before) {
    fs.writeFileSync(file, crlf ? h.replace(/\n/g, '\r\n') : h);
    changed++;
    console.log(`✔ ${rel}`);
  }
}
console.log(`\n${changed} página(s) actualizadas a ?v=${V}`);
