/* ============================================================================
   scripts/revisar-publicado.mjs
   ----------------------------------------------------------------------------
   Revisión del sitio YA GENERADO. Busca las tres cosas que no saltan en ningún
   otro control y que se han colado de verdad en este repositorio:

   1. ENLACES INTERNOS ROTOS — un href a una ruta que no existe en el disco.
      Ni el build ni seo-check lo miran: seo-check solo cuenta cuántos enlaces
      internos hay, no si llevan a alguna parte.

   2. ATRIBUTOS data-en ROTOS — una comilla doble sin escapar dentro de un
      data-en corta el atributo, el navegador se traga el resto como atributos
      sueltos y el idioma inglés sale destrozado SIN QUE FALLE NADA. Es lo que
      les pasó a cinco pies de página de producto durante meses.

   3. ESPAÑOL COLADO EN /en/ — palabras que solo existen en castellano dentro
      de una página inglesa. Suele significar una cadena sin traducir.

   Uso:  node scripts/revisar-publicado.mjs
   Sale != 0 si encuentra algo.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IGNORA = new Set(['node_modules', '.git', '.claude', '.wrangler', 'src-i18n']);

const paginas = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORA.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) paginas.push(path.relative(ROOT, p).split(path.sep).join('/'));
  }
})(ROOT);

let fallos = 0;
const aviso = (p, msg) => { fallos++; console.log(`  ✗ ${p}\n      ${msg}`); };

/* ── 1. Enlaces internos ─────────────────────────────────────────────────── */
console.log('\n1. Enlaces internos que no llevan a ninguna parte');
const existe = (url) => {
  const limpio = url.split('#')[0].split('?')[0];
  if (!limpio || limpio === '/') return true;
  const rel = limpio.replace(/^\//, '');
  const candidatos = limpio.endsWith('/') ? [rel + 'index.html'] : [rel, rel + '.html', rel + '/index.html'];
  return candidatos.some((c) => fs.existsSync(path.join(ROOT, c)));
};
let rotos = 0;
for (const p of paginas) {
  const h = fs.readFileSync(path.join(ROOT, p), 'utf8');
  for (const m of h.matchAll(/(?:href|src)="(\/[^"#][^"]*)"/g)) {
    const u = m[1];
    if (/^\/\//.test(u)) continue;                      // //cdn… es externo
    if (!existe(u)) { aviso(p, `enlace roto → ${u}`); rotos++; }
    if (rotos > 25) break;
  }
}
if (!rotos) console.log('   ok — todos los enlaces internos resuelven a un fichero');

/* ── 2. data-en cortado ──────────────────────────────────────────────────── */
console.log('\n2. Atributos data-en cortados por comillas sin escapar');
let cortados = 0;
for (const p of paginas.filter((p) => p.startsWith('src-i18n/'))) {
  const h = fs.readFileSync(path.join(ROOT, p), 'utf8');
  /* Un data-en entre comillas DOBLES no puede contener ni " ni una etiqueta
     sin escapar: si la lleva, el atributo termina antes de tiempo. */
  for (const m of h.matchAll(/data-en="([^"]*)"/g)) {
    if (/<[a-z/]/i.test(m[1])) {
      aviso(p, `data-en con etiqueta sin escapar (usa comilla simple): ${m[1].slice(0, 70)}…`);
      cortados++;
    }
    if (cortados > 15) break;
  }
}
if (!cortados) console.log('   ok — ningún data-en con etiquetas dentro de comillas dobles');

/* ── 3. Español colado en las páginas inglesas ───────────────────────────── */
console.log('\n3. Castellano dentro de /en/');
const SOLO_ES = /\b(qué|cómo|dónde|también|según|además|aunque|porque|desde|hasta|entre|sobre el|para el|con el|sin el|los que|las que|nuestro|nuestra|siempre|nunca más|estudio de software autónomo)\b/i;
let colado = 0;
for (const p of paginas.filter((p) => p.startsWith('en/'))) {
  const h = fs.readFileSync(path.join(ROOT, p), 'utf8');
  /* Solo el texto visible: los href y los JSON-LD llevan nombres propios. */
  const cuerpo = (h.match(/<body[\s\S]*<\/body>/) || [''])[0]
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  const m = cuerpo.match(SOLO_ES);
  if (m) { aviso(p, `palabra en castellano: «${m[0]}» → …${cuerpo.slice(Math.max(0, m.index - 60), m.index + 70).replace(/\s+/g, ' ')}…`); colado++; }
  if (colado > 12) break;
}
if (!colado) console.log('   ok — ninguna página inglesa con castellano visible');

console.log(`\n${paginas.length} páginas revisadas · ${fallos} problema(s).`);
process.exit(fallos ? 1 : 0);
