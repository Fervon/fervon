#!/usr/bin/env node
/* ============================================================================
   scripts/fix-demos-a-video.mjs
   ----------------------------------------------------------------------------
   Cambia el <img> de las tres demos de producto por un <video>, ahora que
   `gen-demos-video.mjs` ha generado el WebM, el MP4 y el póster.

   Detalles que importan:

   · El `alt` del <img> pasa a `aria-label`: los <video> no tienen alt. Se
     conserva `data-i18n-attr` para que el build siga traduciéndolo.

   · Launchpad y ClaudeScope no tenían `data-en` en su alt, así que sus páginas
     INGLESAS describían la imagen en castellano. Se añade aquí la traducción.

   · `preload="none"`: con `autoplay muted`, el navegador sólo empieza a
     descargar cuando el elemento se acerca al viewport, que es el equivalente
     al `loading="lazy"` que tenía el <img>.

   · `playsinline` es obligatorio o iOS abre el vídeo a pantalla completa.

   · El póster hace de red de seguridad: mientras la CSP no tenga `media-src`,
     el vídeo no carga y es lo único que se ve.

   Idempotente. Uso:  node scripts/fix-demos-a-video.mjs [--check]
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const DEMOS = [
  {
    fuente: 'src-i18n/inferbench/index.html', base: 'inferbench-demo', w: 800, h: 500,
    es: 'inferbench en acción: hardware detectado, catálogo con optimización, benchmark en vivo con tok/s, comparación de runs Q8 vs Q4 y Serve/MCP generando una imagen',
    en: 'inferbench in action: detected hardware, catalog with optimization, live benchmark with tok/s, Q8 vs Q4 run comparison and Serve/MCP generating an image',
  },
  {
    fuente: 'src-i18n/launchpad/index.html', base: 'launchpad-demo', w: 920, h: 588,
    es: 'Mission Control en acción: lanza dos proyectos en puertos sin colisión y observa los logs en vivo en el cajón de detalle',
    en: 'Mission Control in action: it starts two projects on non-colliding ports and streams their logs live in the detail drawer',
  },
  {
    fuente: 'src-i18n/claudescope/index.html', base: 'claudescope-promo', w: 900, h: 506,
    es: 'ClaudeScope en acción: tarjetas de estadísticas, desglose de gasto por modelo y búsqueda full-text de sesiones de Claude Code',
    en: 'ClaudeScope in action: stat cards, spend broken down by model and full-text search across Claude Code sessions',
  },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function video(d) {
  return `<video class="s-h9OptjuP" width="${d.w}" height="${d.h}"`
    + ` poster="/assets/${d.base}-poster.jpg"`
    + ` autoplay muted loop playsinline preload="none"`
    + ` aria-label="${esc(d.es)}" data-i18n-attr="aria-label" data-en="${esc(d.en)}">`
    + `<source src="/assets/${d.base}.webm" type="video/webm">`
    + `<source src="/assets/${d.base}.mp4" type="video/mp4">`
    + `</video>`;
}

let tocados = 0, yaEstaban = 0;
for (const d of DEMOS) {
  const abs = path.join(ROOT, d.fuente);
  const html = fs.readFileSync(abs, 'utf8');

  if (html.includes(`/assets/${d.base}.webm`)) { yaEstaban++; continue; }

  const re = new RegExp(`<img[^>]*src="/assets/${d.base}\\.webp"[^>]*>`);
  const hit = html.match(re);
  if (!hit) { console.error(`✗ ${d.fuente}: no encuentro el <img> de ${d.base}.webp`); process.exit(1); }

  // Los ficheros tienen que existir antes de apuntar a ellos.
  for (const f of [`${d.base}.webm`, `${d.base}.mp4`, `${d.base}-poster.jpg`]) {
    if (!fs.existsSync(path.join(ROOT, 'assets', f))) {
      console.error(`✗ falta assets/${f} — pasa antes \`npm run demos:video\``);
      process.exit(1);
    }
  }

  if (!CHECK) fs.writeFileSync(abs, html.replace(re, video(d)), 'utf8');
  console.log(`  ${CHECK ? 'cambiaría' : 'cambiado '}  ${d.fuente}  (${d.base})`);
  tocados++;
}

console.log('\n  ' + (CHECK ? 'a cambiar' : 'cambiados') + ': ' + tocados + '  ·  ya en vídeo: ' + yaEstaban);
if (tocados && !CHECK) console.log('  Ahora: npm run i18n:build');
