#!/usr/bin/env node
/* ============================================================================
   scripts/gen-demos-video.mjs
   ----------------------------------------------------------------------------
   Convierte las tres demos de producto de WebP animado a vídeo.

   EL PROBLEMA (medido el 2026-08-19): eran GIF convertidos a WebP animado y
   pesaban lo que pesa un vídeo, porque ESO es lo que son:

     inferbench-demo.webp    800×500   271 fotogramas   2 158 KB
     launchpad-demo.webp     920×588   204 fotogramas     948 KB
     claudescope-promo.webp  900×506   208 fotogramas     644 KB

   2,1 MB para 800×500 son 5,4 bytes por píxel. Van con loading="lazy", así que
   no tocan el LCP, pero se comen el plan de datos de cualquiera que baje hasta
   ahí en el móvil.

   POR QUÉ DESDE EL GIF Y NO DESDE EL WEBP: ffmpeg no decodifica WebP animado
   («image data not found»). Y recomprimir el WebP con ffmpeg lo empeora —sale
   MÁS grande que el original— porque libwebp en ffmpeg escribe cada fotograma
   entero, sin deltas, mientras que el original venía de gif2webp, que sí los
   hace. Los GIF de partida siguen en el worktree del repo.

   SALIDA: WebM (VP9) como formato principal, MP4 (H.264) de respaldo para los
   Safari que no llevan VP9, y un póster JPG. El póster no es decorativo: si la
   CSP bloquea el vídeo —hoy lo hace, ver más abajo— es lo único que se ve.

   OJO CON LA CSP: la política del sitio no tiene `media-src`, así que cae en
   `default-src 'none'` y el vídeo NO carga hasta que se pegue la nueva regla en
   Cloudflare. Comprobado en local con la CSP exacta de producción: el vídeo se
   bloquea, el póster se muestra y la página NO se rompe — degrada a imagen
   estática, pesando 53 KB en vez de 2 158.

   Uso:  npm run demos:video
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GIFS = path.join(ROOT, '.claude/worktrees/infallible-meninsky-da48cf/assets');

/* `poster` es el segundo del GIF que mejor representa la demo: hay que elegirlo
   a mano y MIRARLO, porque el fotograma 0 suele ser una pantalla de carga. */
const DEMOS = [
  { nombre: 'inferbench-demo', poster: 20 },
  { nombre: 'launchpad-demo', poster: 10 },
  { nombre: 'claudescope-promo', poster: 11 },
];

const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'pipe' });
const kb = (f) => Math.round(fs.statSync(f).size / 1024);

if (!fs.existsSync(GIFS)) {
  console.error('✗ no encuentro los GIF de partida en ' + path.relative(ROOT, GIFS));
  console.error('  Sin ellos no se puede regenerar: ffmpeg no sabe leer WebP animado.');
  process.exit(1);
}

console.log('  origen              →  webm    mp4     póster   (antes)');
for (const d of DEMOS) {
  const gif = path.join(GIFS, d.nombre + '.gif');
  if (!fs.existsSync(gif)) { console.error('✗ falta ' + path.relative(ROOT, gif)); process.exit(1); }
  const base = path.join(ROOT, 'assets', d.nombre);
  const antes = fs.existsSync(base + '.webp') ? kb(base + '.webp') : 0;

  // VP9: crf 40 mantiene legible el texto de una UI y baja ~6× frente al WebP.
  ff(['-i', gif, '-c:v', 'libvpx-vp9', '-crf', '40', '-b:v', '0',
      '-pix_fmt', 'yuv420p', '-row-mt', '1', '-an', base + '.webm']);
  // H.264 sólo para los Safari sin VP9; +faststart para que empiece sin bajarlo entero.
  ff(['-i', gif, '-c:v', 'libx264', '-crf', '30', '-preset', 'slow',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', base + '.mp4']);
  ff(['-ss', String(d.poster), '-i', gif, '-frames:v', '1', '-q:v', '4', base + '-poster.jpg']);

  console.log(`  ${d.nombre.padEnd(20)}${String(kb(base + '.webm')).padStart(4)} KB${String(kb(base + '.mp4')).padStart(6)} KB${String(kb(base + '-poster.jpg')).padStart(7)} KB   (${antes} KB)`);
}

const total = DEMOS.reduce((a, d) => a + kb(path.join(ROOT, 'assets', d.nombre + '.webm')), 0);
const antes = DEMOS.reduce((a, d) => {
  const f = path.join(ROOT, 'assets', d.nombre + '.webp');
  return a + (fs.existsSync(f) ? kb(f) : 0);
}, 0);
if (antes) console.log(`\n  total en WebM: ${total} KB  ·  antes en WebP: ${antes} KB  ·  ${(antes / total).toFixed(1)}× menos`);
