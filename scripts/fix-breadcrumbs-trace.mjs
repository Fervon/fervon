#!/usr/bin/env node
/* ============================================================================
   scripts/fix-breadcrumbs-trace.mjs
   ----------------------------------------------------------------------------
   Pone cada BreadcrumbList de las landings de Trace en el árbol de idioma que
   le toca.

   QUÉ PASABA (medido el 2026-08-19). Los 21 ficheros —7 fuentes + 7 páginas EN
   + 7 páginas ES— llevaban EL MISMO breadcrumb, copiado sin traducir:

     Home → /   |   Trace → /trace/   |   Rewind AI alternative → /trace/rewind-ai-alternative

   En las 7 páginas ESPAÑOLAS eso contradice su propio canonical: la página es
   /es/trace/<slug> pero su breadcrumb declara la URL inglesa, y con los nombres
   en inglés, así que el rich result de la SERP española saldría en inglés.
   En las 7 INGLESAS el fallo es simétrico: el paso «Trace» apunta a /trace/,
   que es la página ESPAÑOLA del producto, y «Home» a /, la home española.

   Recordatorio de por qué es tan fácil equivocarse aquí: en las landings de
   Trace la convención de idioma está INVERTIDA respecto al resto del sitio —el
   inglés vive en /trace/<slug> y el español en /es/trace/<slug>—, mientras que
   en todo lo demás el español está en la raíz y el inglés bajo /en/.

   Idempotente. Uso:  npm run breadcrumbs:fix  [--check]
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const O = 'https://fervon.dev';

/* Nombre del último escalón, por slug y por idioma. */
export const HOJA = {
  'limitless-alternative': { en: 'Limitless alternative', es: 'Alternativa a Limitless' },
  'microsoft-recall-alternative': { en: 'Microsoft Recall alternative', es: 'Alternativa a Microsoft Recall' },
  'personal-memory-tool-without-screen-recording': { en: 'Personal memory without screen recording', es: 'Memoria personal sin grabar la pantalla' },
  'rewind-ai-alternative': { en: 'Rewind AI alternative', es: 'Alternativa a Rewind AI' },
  'rewind-alternative-mac': { en: 'Rewind alternative for Mac', es: 'Alternativa a Rewind para Mac' },
  'rewind-alternative-windows': { en: 'Rewind alternative for Windows', es: 'Alternativa a Rewind para Windows' },
  'rewind-shut-down-what-to-use': { en: 'What to use after Rewind', es: 'Qué usar tras el cierre de Rewind' },
  'screenpipe-alternative': { en: 'Screenpipe alternative', es: 'Alternativa a Screenpipe' },
};

/* Los dos primeros escalones, por idioma. El inglés cuelga de /en/; el español,
   de la raíz. */
const RAIZ = {
  en: [['Home', O + '/en/'], ['Trace', O + '/en/trace/']],
  es: [['Inicio', O + '/'], ['Trace', O + '/trace/']],
};

const item = (pos, nombre, url) =>
  `      { "@type": "ListItem", "position": ${pos}, "name": ${JSON.stringify(nombre)}, "item": ${JSON.stringify(url)} }`;

function bloque(slug, lang) {
  const hoja = HOJA[slug];
  if (!hoja) throw new Error('slug sin nombre de breadcrumb: ' + slug + ' (añádelo a HOJA)');
  const url = lang === 'en' ? `${O}/trace/${slug}` : `${O}/es/trace/${slug}`;
  const pasos = [...RAIZ[lang].map(([n, u], i) => item(i + 1, n, u)), item(3, hoja[lang], url)];
  return '<script type="application/ld+json">\n'
    + '  {\n'
    + '    "@context": "https://schema.org",\n'
    + '    "@type": "BreadcrumbList",\n'
    + '    "itemListElement": [\n'
    + pasos.join(',\n') + '\n'
    + '    ]\n'
    + '  }\n'
    + '  </script>';
}

/* Sólo el <script> que contiene BreadcrumbList; los otros bloques ld+json de la
   página (Organization, FAQPage) no se tocan. */
const BLOQUE_BC = /<script[^>]*type="application\/ld\+json"[^>]*>(?:(?!<\/script>)[\s\S])*?"BreadcrumbList"[\s\S]*?<\/script>/;
const MAX_TRAMO = 1200;   // el bloque real mide ~490 caracteres

const slugs = fs.readdirSync(path.join(ROOT, 'src-i18n/trace'))
  .filter((f) => f.endsWith('.html') && f !== 'index.html')
  .map((f) => f.replace(/\.html$/, ''));

let tocados = 0, yaBien = 0;
const avisos = [];

for (const slug of slugs) {
  const objetivos = [
    { file: `src-i18n/trace/${slug}.html`, lang: 'en' },   // la fuente es el inglés
    { file: `trace/${slug}.html`, lang: 'en' },
    { file: `es/trace/${slug}.html`, lang: 'es' },
  ];
  for (const { file, lang } of objetivos) {
    const abs = path.join(ROOT, file);
    if (!fs.existsSync(abs)) { avisos.push('no existe: ' + file); continue; }
    const html = fs.readFileSync(abs, 'utf8');
    const hit = html.match(BLOQUE_BC);
    if (!hit) { avisos.push('sin BreadcrumbList: ' + file); continue; }
    if (hit[0].length > MAX_TRAMO) {
      console.error(`\n✗ ${file}: el patrón capturó ${hit[0].length} caracteres (máx ${MAX_TRAMO}). Se ha desbordado — no se toca.`);
      process.exit(1);
    }
    const nuevo = bloque(slug, lang);
    if (hit[0] === nuevo) { yaBien++; continue; }
    if (!CHECK) fs.writeFileSync(abs, html.replace(BLOQUE_BC, nuevo), 'utf8');
    console.log((CHECK ? 'CAMBIARÍA  ' : 'corregido  ') + file.padEnd(56) + lang);
    tocados++;
  }
}

console.log('\n' + (CHECK ? 'a corregir' : 'corregidos') + ': ' + tocados + '  ·  ya correctos: ' + yaBien);
for (const a of avisos) console.log('AVISO  ' + a);
