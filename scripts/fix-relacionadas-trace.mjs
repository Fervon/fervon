#!/usr/bin/env node
/* ============================================================================
   scripts/fix-relacionadas-trace.mjs
   ----------------------------------------------------------------------------
   Arregla el bloque «Sigue explorando» del árbol de Trace: los títulos de las
   tarjetas y qué landings se listan.

   DOS COSAS, medidas el 2026-08-19:

   1. Los <span class="rt"> no llevaban atributo de traducción, así que el texto
      base se colaba tal cual en el otro idioma. En /en/trace/ y en las siete
      landings inglesas las tarjetas salían EN CASTELLANO —«Alternativa a Rewind
      AI», «Memoria sin grabar la pantalla»— justo en las páginas que rankean.

   2. El índice de Trace listaba seis landings de ocho. La de Windows se quedaba
      fuera y por eso arrastraba 4 enlaces internos frente a los 6-8 de sus
      hermanas; la de Mac es nueva.

   Ojo con la dirección de la traducción, que aquí va al revés según el fichero:
   el índice (src-i18n/trace/index.html) tiene el ESPAÑOL como base y traduce
   con `data-en`; las landings tienen el INGLÉS como base y traducen con
   `data-es`.

   Idempotente. Uso:  npm run relacionadas:fix  [--check]
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

/* Título de tarjeta por destino. Más corto que el <title> de la página: tiene
   que caber en una tarjeta. */
const TARJETA = {
  '/trace/': { es: 'Trace', en: 'Trace' },
  '/trace/rewind-ai-alternative': { es: 'Alternativa a Rewind AI', en: 'Rewind AI alternative' },
  '/trace/rewind-alternative-mac': { es: 'Alternativa a Rewind en Mac', en: 'Rewind alternative for Mac' },
  '/trace/rewind-alternative-windows': { es: 'Alternativa a Rewind en Windows', en: 'Rewind alternative for Windows' },
  '/trace/microsoft-recall-alternative': { es: 'Alternativa a Microsoft Recall', en: 'Microsoft Recall alternative' },
  '/trace/personal-memory-tool-without-screen-recording': { es: 'Memoria sin grabar la pantalla', en: 'Memory without screen recording' },
  '/trace/limitless-alternative': { es: 'Alternativa a Limitless', en: 'Limitless alternative' },
  '/trace/screenpipe-alternative': { es: 'Alternativa a Screenpipe', en: 'Screenpipe alternative' },
  '/trace/rewind-shut-down-what-to-use': { es: 'Rewind cerró: qué usar ahora', en: 'Rewind shut down: what to use' },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Reescribe el <span class="rt"> de cada tarjeta con su par de idiomas. */
function arreglarTitulos(html, base) {
  const otro = base === 'es' ? 'en' : 'es';
  let n = 0;
  const out = html.replace(
    /(<a class="relcard" href="([^"]+)">\s*<span class="rt")[^>]*>([^<]*)(<\/span>)/g,
    (todo, cabeza, href, _viejo, cierre) => {
      const t = TARJETA[href];
      if (!t) return todo;                       // destino desconocido: no se toca
      n++;
      return `${cabeza} data-${otro}="${esc(t[otro])}">${t[base]}${cierre}`;
    },
  );
  return { html: out, n };
}

/* La tarjeta que se inserta en el índice cuando falta una landing. */
function tarjeta(href, base, desc) {
  const otro = base === 'es' ? 'en' : 'es';
  const t = TARJETA[href];
  return `        <a class="relcard" href="${href}">\n`
    + `          <span class="rt" data-${otro}="${esc(t[otro])}">${t[base]}</span>\n`
    + `          <span class="rd" data-${otro}="${esc(desc[otro])}">${desc[base]}</span>\n`
    + `        </a>\n`;
}

const DESCS = {
  '/trace/rewind-alternative-windows': { es: 'La misma memoria local, en tu PC con Windows.', en: 'The same local memory, on your Windows PC.' },
  '/trace/rewind-alternative-mac': { es: 'Rewind era solo para Mac. Esto la sustituye.', en: 'Rewind was Mac-only. This replaces it.' },
};

/* Enlaces que DEBEN existir en cada página, además de los que ya tenga.
   Una landing nueva sin enlaces entrantes tarda en rastrearse y no hereda nada:
   la de Mac nacía con 2 mientras sus hermanas tenían entre 6 y 9. Aquí se
   declara qué páginas de la familia Rewind deben apuntarle. */
const ENLACES_MINIMOS = {
  'index.html': ['/trace/rewind-alternative-windows', '/trace/rewind-alternative-mac'],
  'rewind-ai-alternative.html': ['/trace/rewind-alternative-mac'],
  'rewind-shut-down-what-to-use.html': ['/trace/rewind-alternative-mac', '/trace/rewind-alternative-windows'],
  'rewind-alternative-windows.html': ['/trace/rewind-alternative-mac'],
  'rewind-alternative-mac.html': ['/trace/rewind-alternative-windows'],
  'limitless-alternative.html': ['/trace/rewind-alternative-mac'],
};

let cambios = 0;
const informe = [];

for (const f of fs.readdirSync(path.join(ROOT, 'src-i18n/trace')).filter((x) => x.endsWith('.html'))) {
  const rel = 'src-i18n/trace/' + f;
  const abs = path.join(ROOT, rel);
  let html = fs.readFileSync(abs, 'utf8');
  const original = html;
  const base = f === 'index.html' ? 'es' : 'en';   // el índice está en español; las landings, en inglés

  // 1. Enlaces que deben existir y no están: se insertan al final del bloque.
  for (const href of ENLACES_MINIMOS[f] || []) {
    if (html.includes(`href="${href}"`)) continue;
    const cierre = '        </div>\n      <div class="fv-share">';
    if (!html.includes(cierre)) { informe.push('no encuentro dónde insertar en ' + rel); continue; }
    html = html.replace(cierre, tarjeta(href, base, DESCS[href]) + cierre);
    informe.push('  + ' + href + '  en  ' + f);
  }

  // 2. Títulos con su par de idiomas.
  const r = arreglarTitulos(html, base);
  html = r.html;

  if (html === original) continue;
  if (!CHECK) fs.writeFileSync(abs, html, 'utf8');
  console.log((CHECK ? 'CAMBIARÍA  ' : 'arreglado  ') + rel.padEnd(58) + r.n + ' tarjetas');
  cambios++;
}

for (const i of informe) console.log(i);
console.log('\n' + (CHECK ? 'a tocar' : 'tocados') + ': ' + cambios + ' ficheros fuente');
if (cambios && !CHECK) console.log('Ahora hace falta `npm run i18n:build` para propagarlo a las páginas publicadas.');
