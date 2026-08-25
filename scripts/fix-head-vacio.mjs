/* ============================================================================
   scripts/fix-head-vacio.mjs
   ----------------------------------------------------------------------------
   EL FALLO (MEDIDO en producción el 2026-08-25 con Chrome headless):
   24 de las 50 páginas de fervon.dev servían

       <html lang="es"><head></head><body>
         <meta charset="UTF-8">
         <link rel="canonical" ...>
         <link rel="alternate" hreflang=...>
         ...

   es decir, un `<head>` con CERO hijos y TODAS las etiquetas de cabecera
   dentro del `<body>`. Comprobado con `document.head.children.length === 0`
   en https://fervon.dev/lookspan/ y en 5 keyword pages de Trace.

   POR QUÉ IMPORTA (y por qué ninguna comprobación del repo lo veía):
   `seo-check.mjs` y `seo-audit-*.mjs` buscan las etiquetas con expresiones
   regulares sobre el HTML — y ahí ESTÁN, así que salían en verde 49/49. Pero
   Google solo respeta dentro del `<head>`:
     · `<link rel="canonical">`   → fuera del head se IGNORA
     · `<link rel="alternate" hreflang>` → fuera del head se IGNORA
     · `<meta name="robots">`     → fuera del head se IGNORA
     · `<meta name="description">`→ fuera del head se IGNORA
   O sea: la mitad del sitio estaba sin canonical efectivo, sin hreflang
   efectivo (todo el trabajo de multiidioma muerto) y sin description propia.

   LA CAUSA: 12 ficheros de `src-i18n/` empiezan con BOM (U+FEFF). Cuando
   `i18n-build.mjs` los pasa por el DOMParser de Chrome, el BOM cuenta como
   contenido no-espacio: el parser CIERRA el `<head>` implícitamente y abre el
   `<body>` antes de haber leído un solo `<meta>`. Al reserializar, esa
   estructura rota se escribe a disco. Cada fuente genera 2 páginas → 24.

   QUÉ HACE: quita el BOM y devuelve al `<head>` todo el bloque de cabecera que
   quedó atrapado al principio del `<body>`. Idempotente: si el head ya tiene
   hijos, no toca el fichero.

   Uso:  node scripts/fix-head-vacio.mjs           arregla
         node scripts/fix-head-vacio.mjs --check   solo informa (exit 1 si hay)
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

/* Los directorios de salida y las copias del sitio NO se recorren. Cada vez que
   aparece uno nuevo (dist/, un worktree…) hay que añadirlo aquí: ya nos costó
   una vez tener herramientas ciegas y lentas por no hacerlo. */
const SALTAR = new Set(['node_modules', '.git', 'dist', '.claude', '.wrangler', '.github', 'scripts', 'docs']);

function paginas(dir, out = []) {
  for (const e of fs.readdirSync(dir)) {
    if (SALTAR.has(e)) continue;
    const p = path.join(dir, e);
    if (fs.statSync(p).isDirectory()) paginas(p, out);
    else if (e.endsWith('.html')) out.push(p);
  }
  return out;
}

/* Un token cuenta como "de cabecera" si es meta/title/link/base/style/script,
   un comentario o espacio en blanco. En cuanto aparece cualquier otra cosa
   (en estas páginas, el `<a class="skip">`) se acabó la cabecera. */
const ABRE_CABECERA = /^<(meta|title|link|base|style|script)\b/i;

function separaCabecera(cuerpo) {
  let i = 0;
  let fin = 0;
  while (i < cuerpo.length) {
    // espacios y BOM sueltos
    const esp = /^[\s﻿]+/.exec(cuerpo.slice(i));
    if (esp) { i += esp[0].length; continue; }
    if (cuerpo.startsWith('<!--', i)) {
      const j = cuerpo.indexOf('-->', i);
      if (j < 0) break;
      i = j + 3; fin = i; continue;
    }
    const resto = cuerpo.slice(i);
    const m = ABRE_CABECERA.exec(resto);
    if (!m) break;
    const etiqueta = m[1].toLowerCase();
    if (etiqueta === 'link' || etiqueta === 'meta' || etiqueta === 'base') {
      const j = cuerpo.indexOf('>', i);
      if (j < 0) break;
      i = j + 1; fin = i; continue;
    }
    // title, style y script llevan cierre
    const cierre = `</${etiqueta}>`;
    const j = cuerpo.toLowerCase().indexOf(cierre, i);
    if (j < 0) break;
    i = j + cierre.length; fin = i; continue;
  }
  return [cuerpo.slice(0, fin), cuerpo.slice(fin)];
}

const rotas = [];
for (const f of paginas(ROOT)) {
  let s = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f).split(path.sep).join('/');

  const mHead = /<head>([\s\S]*?)<\/head>/i.exec(s);
  if (!mHead) continue;
  // Si el head ya tiene una etiqueta dentro, esta página está bien.
  if (/<[a-z]/i.test(mHead[1])) continue;

  const mBody = /<body([^>]*)>/i.exec(s);
  if (!mBody) continue;
  const iniCuerpo = mBody.index + mBody[0].length;
  const [cabecera, resto] = separaCabecera(s.slice(iniCuerpo));
  if (!cabecera.trim()) continue;

  rotas.push(rel);
  if (CHECK) continue;

  const limpia = cabecera.replace(/﻿/g, '');
  s = s.slice(0, mHead.index) + '<head>\n' + limpia.trim() + '\n</head>' +
      s.slice(mHead.index + mHead[0].length, iniCuerpo) + '\n' + resto.replace(/^[\s﻿]+/, '\n  ');
  // Un BOM en mitad del documento no pinta nada en ningún caso.
  s = s.replace(/﻿/g, '');
  fs.writeFileSync(f, s, 'utf8');
}

if (!rotas.length) {
  console.log('✔ Todas las páginas tienen etiquetas dentro del <head>.');
  process.exit(0);
}
console.log(`${CHECK ? '✗' : '↻'} ${rotas.length} página(s) con el <head> vacío:`);
for (const r of rotas) console.log('   ' + r);
if (CHECK) {
  console.log('\n  Google ignora canonical, hreflang, robots y description fuera del <head>.');
  console.log('  Arréglalo con:  node scripts/fix-head-vacio.mjs');
  process.exit(1);
}
console.log('\n✔ Arregladas. Vuelve a pasar --check para confirmar.');
