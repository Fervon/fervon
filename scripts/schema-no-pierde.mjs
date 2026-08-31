/* ============================================================================
   scripts/schema-no-pierde.mjs
   ----------------------------------------------------------------------------
   Comprueba que la cadena de construcción NO ha perdido ningún bloque de datos
   estructurados por el camino.

   POR QUÉ EXISTE, con fecha: el 2026-09-01, el paso que reescribe los nodos ya
   inyectados de `seo-business-schema.mjs` usaba un `[\s\S]*?` sin acotar para
   ir desde la apertura de un `<script type="application/ld+json">` hasta su
   `@id`. Perezoso no es lo mismo que acotado. En las páginas donde el FAQPage
   va ANTES del Organization, el motor arrancaba en el `<script>` del FAQPage,
   cruzaba su `</script>` buscando el `@id`, lo encontraba en el bloque de al
   lado y sustituía el tramo entero. Ocho páginas de /es/trace/ se quedaron sin
   su FAQPage.

   Y no saltó ninguna alarma: el script imprimió «Organization actualizado» y
   «39 páginas modificadas», que es exactamente lo que uno esperaba leer. El
   único sitio donde se veía era el diff — 49 líneas en rojo y ninguna en verde.
   Un comprobador que solo cuenta lo que añade no puede ver lo que borra.

   QUÉ COMPARA: los @type de JSON-LD de cada página del árbol de trabajo contra
   los de la misma página en HEAD. Sobrar es normal (se está añadiendo marcado);
   FALTAR es siempre un fallo, porque nada en la cadena tiene el cometido de
   quitar datos estructurados. También avisa si un JSON-LD deja de parsear.

   Uso:  node scripts/schema-no-pierde.mjs
         node scripts/schema-no-pierde.mjs --contra <ref>   (por defecto HEAD)
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--contra');
const REF = i !== -1 ? process.argv[i + 1] : 'HEAD';

const git = (args) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/* Los @type de una página, en una lista ordenada para poder restar. Un mismo
   @type puede salir dos veces (p. ej. dos Article), así que se cuenta, no se
   mete en un Set: perder uno de los dos también es perder. */
const tipos = (html) => {
  const out = [];
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let d;
    try { d = JSON.parse(m[1]); } catch { out.push('!JSON-ROTO'); continue; }
    const ver = (n) => {
      if (Array.isArray(n)) return n.forEach(ver);
      if (!n || typeof n !== 'object') return;
      if (typeof n['@type'] === 'string') out.push(n['@type']);
      for (const v of Object.values(n)) ver(v);
    };
    ver(d);
  }
  return out.sort();
};

/* Cuenta cuántos de cada tipo, y devuelve los que MENGUAN respecto a la base. */
const menguados = (base, ahora) => {
  const c = (xs) => xs.reduce((m, t) => m.set(t, (m.get(t) || 0) + 1), new Map());
  const a = c(base); const b = c(ahora);
  const falta = [];
  for (const [t, n] of a) {
    const m = b.get(t) || 0;
    if (m < n) falta.push(`${t} ${n}→${m}`);
  }
  return falta;
};

const paginas = git(['ls-files', '*.html'])
  .split('\n').filter((f) => f && !f.startsWith('src-i18n/'));

let malos = 0; let rotos = 0; let revisadas = 0;
for (const rel of paginas) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  let base;
  try { base = git(['show', `${REF}:${rel}`]); } catch { continue; } // página nueva
  revisadas++;
  const ahora = fs.readFileSync(file, 'utf8');
  const tAhora = tipos(ahora);
  if (tAhora.includes('!JSON-ROTO')) { console.error(`✗ ${rel} — un JSON-LD no parsea`); rotos++; }
  const falta = menguados(tipos(base), tAhora);
  if (falta.length) { console.error(`✗ ${rel}\n    perdido: ${falta.join(', ')}`); malos++; }
}

console.log(`\n${revisadas} página(s) comparadas contra ${REF}.`);
if (malos || rotos) {
  console.error(`✗ ${malos} con datos estructurados PERDIDOS, ${rotos} con JSON roto.`);
  console.error('  Nada en la cadena tiene por cometido quitar marcado: esto es un fallo, no un ajuste.');
  process.exit(1);
}
console.log('✔ ninguna página ha perdido datos estructurados.');
