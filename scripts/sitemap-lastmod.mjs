#!/usr/bin/env node
/* ============================================================================
   scripts/sitemap-lastmod.mjs
   ----------------------------------------------------------------------------
   Pone el <lastmod> de cada URL del sitemap a la fecha del último commit que
   tocó su fichero.

   POR QUÉ. Los lastmod se escribían a mano y se quedaban atrás: el 2026-08-20,
   once páginas que se acababan de cambiar —títulos nuevos, og:image nueva, las
   demos pasadas a vídeo— seguían declarando `2026-08-14`. Es decirle a Google
   «no he cambiado» justo cuando sí. Y ya había señales de rastreo rancio: los
   títulos que Google mostraba para /inferbench/ y /trace/rewind-alternative-windows
   no eran los del repo.

   Un lastmod inventado es peor que no tenerlo: si Google detecta que miente,
   deja de hacerle caso. Por eso se saca de git, que es la única fecha real.

   Uso:  npm run sitemap:lastmod  [--check]
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const ORIGIN = 'https://fervon.dev';

/** El fichero que sirve una URL: /x/ → x/index.html, /x → x.html, / → index.html */
function ficheroDe(url) {
  const p = url.replace(ORIGIN, '') || '/';
  const cands = p.endsWith('/')
    ? [path.join(ROOT, p, 'index.html')]
    : [path.join(ROOT, p + '.html'), path.join(ROOT, p, 'index.html')];
  return cands.find((f) => fs.existsSync(f)) || null;
}

/** Fecha del último commit que tocó el fichero, en ISO corto. */
function fechaGit(file) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', rel], { cwd: ROOT, encoding: 'utf8' }).trim();
  return out || null;
}

let xml = fs.readFileSync(SITEMAP, 'utf8');
const bloques = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)];
let cambiados = 0;
const sinFichero = [];

for (const [, url, viejo] of bloques) {
  const f = ficheroDe(url);
  if (!f) { sinFichero.push(url); continue; }
  const nuevo = fechaGit(f);
  if (!nuevo || nuevo === viejo) continue;
  // Se sustituye sólo dentro del <url> de ESTA loc, no el primer lastmod que aparezca.
  const re = new RegExp('(<loc>' + url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</loc>\\s*<lastmod>)[^<]+(</lastmod>)');
  xml = xml.replace(re, '$1' + nuevo + '$2');
  console.log('  ' + (url.replace(ORIGIN, '') || '/').padEnd(56) + viejo + ' → ' + nuevo);
  cambiados++;
}

if (cambiados && !CHECK) fs.writeFileSync(SITEMAP, xml, 'utf8');
for (const u of sinFichero) console.log('  AVISO  sin fichero que lo sirva: ' + u);
console.log('\n  ' + (CHECK ? 'se actualizarían' : 'actualizados') + ': ' + cambiados + ' de ' + bloques.length + ' lastmod');
