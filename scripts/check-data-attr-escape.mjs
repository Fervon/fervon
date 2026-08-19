#!/usr/bin/env node
/* ============================================================================
   scripts/check-data-attr-escape.mjs
   ----------------------------------------------------------------------------
   Guardia del bug que ya ha mordido tres veces: un atributo `data-en`/`data-es`
   con el HTML escapado A MEDIAS. La apertura del tag viene como `&lt;` pero sus
   atributos llevan comillas LITERALES, así que la primera de ellas cierra el
   atributo antes de tiempo y el resto del payload se derrama al documento como
   texto visible.

   Historial: junio 2026 (5 pies de producto rotos meses), /about/ y —descubierto
   el 2026-08-19— las 14 landings de Trace, que enseñaban castellano suelto en
   las páginas inglesas que rankean en Google. Ninguna de las tres veces avisó
   nada: el HTML seguía siendo "válido", solo que significaba otra cosa.

   Sale con código 1 si encuentra algo. Uso:  npm run escape:check
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXCLUIR = new Set(['node_modules', '.git', '.github', '.claude', '.wrangler', 'scripts', 'dist']);

/* Un `&lt;tag …atributo="` dentro de un data-*: la apertura escapada y las
   comillas sin escapar no pueden convivir. */
const ESCAPE_A_MEDIAS = /\bdata-(?:en|es)="[^"]*&lt;[a-zA-Z][\w-]*\s[^"]*[a-zA-Z-]+="/;

/* Restos del derrame que ya llegaron al HTML publicado. */
const DERRAME = [
  { re: /<span assets=""/, que: 'atributos basura de un payload desbordado' },
  { re: /al rojo vivo"&gt;/, que: 'texto del atributo derramado al documento' },
  { re: /<a href="https:\/\/fervon\.dev"><\/a>/, que: 'enlace a fervon.dev sin texto de ancla' },
];

const hallazgos = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!EXCLUIR.has(e.name)) walk(path.join(dir, e.name)); continue; }
    if (!e.name.endsWith('.html')) continue;
    const file = path.join(dir, e.name);
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const html = fs.readFileSync(file, 'utf8');
    const m = html.match(ESCAPE_A_MEDIAS);
    if (m) hallazgos.push({ rel, que: 'escapado a medias en un data-*', muestra: m[0].slice(0, 120) });
    for (const d of DERRAME) {
      const dm = html.match(d.re);
      if (dm) hallazgos.push({ rel, que: d.que, muestra: dm[0].slice(0, 120) });
    }
  }
})(ROOT);

if (!hallazgos.length) {
  console.log('✓ ningún atributo data-* con el escapado roto, y ningún resto de derrame.');
  process.exit(0);
}
console.error('✗ ' + hallazgos.length + ' hallazgo(s):\n');
for (const h of hallazgos) console.error('  ' + h.rel + '\n    ' + h.que + '\n    ' + h.muestra + '…\n');
console.error('Reparador del pie de Trace: node scripts/fix-pie-landings-trace.mjs');
process.exit(1);
