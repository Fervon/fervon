/* ============================================================================
   scripts/sitemap-sync.mjs
   ----------------------------------------------------------------------------
   Mantiene sitemap.xml a la par de lo que hay publicado, y con los MISMOS
   alternates que declara cada página.

   POR QUÉ EXISTE (medido el 2026-08-25): el sitemap se mantenía a mano y se
   había separado de la realidad por los dos lados a la vez.

     · Le faltaban páginas. Cada landing nueva había que acordarse de añadirla
       en dos sitios, y el checklist solo se queja DESPUÉS de publicar.
     · Y contradecía al HTML: en las 16 landings de Trace el sitemap decía
       `x-default → /es/…` mientras la página decía `x-default → /trace/…`.
       El arreglo de x-default se aplicó al HTML y nadie tocó el sitemap.
       Google recibía dos señales opuestas sobre la misma URL.

   La fuente de verdad es el HTML: los `<link rel="alternate" hreflang>` que
   sirve cada página. Este script los copia al sitemap tal cual, así que las
   dos señales no se pueden volver a separar.

   `changefreq` y `priority` son criterio editorial, no dato: se conservan los
   que ya tenga la URL y las nuevas heredan el de su sección.

   Uso:  node scripts/sitemap-sync.mjs           reescribe sitemap.xml
         node scripts/sitemap-sync.mjs --check   informa (exit 1 si hay deriva)
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const ORIGIN = 'https://fervon.dev';
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

/* fervon.dev sirve URLs limpias: /veredicto/x.html se pide como /veredicto/x. */
const urlDe = (f) => ORIGIN + '/' + f.replace(/index\.html$/, '').replace(/\.html$/, '');

const smPath = path.join(ROOT, 'sitemap.xml');
const viejo = fs.readFileSync(smPath, 'utf8');

/* Lo que el sitemap ya dice de cada URL, para conservar el criterio editorial
   y el lastmod de lo que no ha cambiado. */
const previo = new Map();
for (const m of viejo.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const loc = (m[1].match(/<loc>([^<]+)<\/loc>/) || [, ''])[1];
  if (!loc) continue;
  previo.set(loc, {
    lastmod: (m[1].match(/<lastmod>([^<]+)<\/lastmod>/) || [, ''])[1],
    changefreq: (m[1].match(/<changefreq>([^<]+)<\/changefreq>/) || [, ''])[1],
    priority: (m[1].match(/<priority>([^<]+)<\/priority>/) || [, ''])[1],
  });
}

/* Una página traducida vale menos que su original: es la misma convención que
   ya seguía el sitemap escrito a mano. */
const prioridadDe = (url) => {
  const traducida = /^\/(en|es)\//.test(url.replace(ORIGIN, ''));
  if (url === ORIGIN + '/' || url === ORIGIN + '/en/') return traducida ? '1.0' : '1.0';
  return traducida ? '0.7' : '0.9';
};
const frecuenciaDe = (url) => (/\/blog\/.+\/$|\/about\/$/.test(url.replace(ORIGIN, '')) ? 'monthly' : 'weekly');

const hoy = new Date(fs.statSync(smPath).mtime).toISOString().slice(0, 10);
const entradas = [];
const nuevas = [];
const corregidas = [];

for (const f of paginas(ROOT).sort()) {
  if (/(^|\/)404\.html$/.test(f)) continue;         // la 404 no se indexa
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/.test(html)) continue;
  const url = urlDe(f);
  const p = previo.get(url);
  if (!p) nuevas.push(url);

  /* Los alternates salen del HTML, no de aquí: es la única forma de que las
     dos declaraciones no se puedan contradecir. */
  const alts = [...html.matchAll(/<link[^>]+rel="alternate"[^>]+hreflang="([^"]+)"[^>]+href="([^"]+)"/g)]
    .map((m) => ({ lang: m[1], href: m[2] }));

  if (p) {
    const antes = (viejo.match(new RegExp('<loc>' + url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</loc>[\\s\\S]*?</url>')) || [''])[0];
    for (const a of alts) {
      if (antes && !antes.includes(`hreflang="${a.lang}" href="${a.href}"`)) { corregidas.push(`${url} · ${a.lang}`); break; }
    }
  }

  entradas.push(
    '  <url>\n' +
    `    <loc>${url}</loc>\n` +
    `    <lastmod>${p?.lastmod || hoy}</lastmod>\n` +
    `    <changefreq>${p?.changefreq || frecuenciaDe(url)}</changefreq>\n` +
    `    <priority>${p?.priority || prioridadDe(url)}</priority>\n` +
    alts.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.href}"/>\n`).join('') +
    '  </url>'
  );
}

const fuera = [...previo.keys()].filter((u) => !entradas.some((e) => e.includes(`<loc>${u}</loc>`)));

const nuevo = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
  '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
  entradas.join('\n') + '\n</urlset>\n';

/* UNA PÁGINA QUE GIT NO SIGUE NO SE PUBLICA, y no lo dice nadie.

   Medido el 2026-09-01: /servicios/ y /en/servicios/ se generaron, entraron en
   el sitemap, pasaron head-check, cabecera y cache:check, se commitearon... y
   dieron 404. El `git add` de aquel commit usaba `git ls-files '*.html'` para
   enumerar lo generado, y `ls-files` lista lo que YA se sigue: una carpeta
   nueva no aparece nunca. El workflow desplegó en verde 36 segundos sin ellas.

   Todas las comprobaciones miraban el ÁRBOL DE TRABAJO, donde los ficheros
   estaban perfectos. Ninguna preguntaba si git se los iba a llevar. Ese es el
   hueco: no un fallo del contenido, sino de que el contenido llegue.

   Se avisa siempre y no se sale con error, porque durante una construcción
   normal es legítimo que una página recién creada aún no esté en el índice.
   Con --check sí corta: ahí la pregunta es «¿esto está listo para salir?». */
{
  let seguidos = null;
  try {
    seguidos = new Set(execFileSync('git', ['ls-files', '*.html'], { cwd: ROOT, encoding: 'utf8' })
      .split('\n').filter(Boolean));
  } catch { /* fuera de un repo: no hay nada que comprobar */ }
  if (seguidos) {
    const sinSeguir = paginas(ROOT).sort().filter((f) => !seguidos.has(f));
    if (sinSeguir.length) {
      console.log(`\n⚠ ${sinSeguir.length} página(s) que git NO sigue — el despliegue NO las subirá:`);
      for (const f of sinSeguir) console.log(`   ? ${f}`);
      console.log('  Añádelas explícitamente: `git add <ruta>`. Un `git ls-files` no las ve.\n');
      if (CHECK) process.exit(1);
    }
  }
}

console.log(`${entradas.length} URLs · ${nuevas.length} nuevas · ${corregidas.length} con alternates que no coincidían · ${fuera.length} sobrantes`);
for (const u of nuevas) console.log(`   + ${u}`);
for (const c of corregidas) console.log(`   ~ ${c}`);
for (const u of fuera) console.log(`   - ${u}  (ya no existe esa página)`);

if (CHECK) {
  if (nuevas.length || corregidas.length || fuera.length) {
    console.log('\n  Sincronízalo con:  node scripts/sitemap-sync.mjs');
    process.exit(1);
  }
  console.log('✔ El sitemap coincide con lo publicado.');
  process.exit(0);
}
fs.writeFileSync(smPath, nuevo, 'utf8');
console.log('\n✔ sitemap.xml sincronizado. Pasa `node scripts/sitemap-lastmod.mjs` para los lastmod reales.');
