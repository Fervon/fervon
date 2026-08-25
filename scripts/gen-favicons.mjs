#!/usr/bin/env node
/**
 * scripts/gen-favicons.mjs
 * ────────────────────────────────────────────────────────────────────────────
 * Genera el juego completo de favicons a partir de assets/favicon.svg.
 *
 * POR QUÉ EXISTE (2026-08-25): Google no pintaba el logo en los resultados de
 * búsqueda —salía el globo gris genérico— por dos incumplimientos MEDIDOS de
 * sus requisitos publicados:
 *
 *   1) https://fervon.dev/favicon.ico devolvía 404. Es la ruta de reserva que
 *      el rastreador de favicons prueba cuando no puede usar los <link>.
 *   2) El único PNG declarado era de 32x32. Google exige un cuadrado múltiplo
 *      de 48px (48, 96, 144, 192...); 32 queda por debajo y lo descarta.
 *
 * Comprobación de que no era otra cosa (para no volver a sospechar de ellas):
 *   · robots.txt permite /assets/  ✔
 *   · los assets responden 200 a Googlebot, Googlebot-Image y "Google Favicon" ✔
 *     (Bot Fight Mode de Cloudflare NO los estaba desafiando)
 *   · t2.gstatic.com/faviconV2 SIN fallback_opts devolvía 404 → Google no
 *     tenía guardado ningún favicon para el host. Ese es el 404 que hay que
 *     ver desaparecer cuando esto surta efecto.
 *
 * Uso:  node scripts/gen-favicons.mjs
 *       node scripts/gen-favicons.mjs --check   (falla si algo está desfasado)
 */
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FUENTE = join(ROOT, 'assets', 'favicon.svg');
const CHECK = process.argv.includes('--check');

/* PNG sueltos. Los tamaños ≥48 son múltiplos de 48 a propósito: es el
   requisito literal de Google para el favicon de los resultados. */
const PNGS = [
  { archivo: 'assets/favicon-32.png',      px: 32  },  // pestaña del navegador
  { archivo: 'assets/favicon-48.png',      px: 48  },  // mínimo que acepta Google
  { archivo: 'assets/favicon-96.png',      px: 96  },
  { archivo: 'assets/favicon-192.png',     px: 192 },  // el que declaramos en el <link>
  { archivo: 'assets/favicon-512.png',     px: 512 },  // logo de la Organization en JSON-LD
  { archivo: 'assets/apple-touch-icon.png', px: 180 }, // iOS; 180 no es múltiplo de 48 y da igual
];

/* Dentro del .ico. 48 es el que mira Google; 16 y 32 son para Windows y para
   los navegadores viejos que aún leen el .ico de la raíz. */
const ICO_PX = [16, 32, 48];

const svg = readFileSync(FUENTE, 'utf8');

const rasterizar = (px) =>
  Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: px } }).render().asPng());

/**
 * Empaqueta varios PNG en un .ico (PNG-in-ICO).
 *
 * El formato admite tanto DIB como PNG dentro de cada entrada; el PNG lo leen
 * Chrome, Firefox, Safari, Edge y las librerías de imagen estándar que usa
 * Google, y evita tener que escribir un codificador BMP a mano.
 *
 * Cabecera: ICONDIR (6 bytes) + una ICONDIRENTRY (16 bytes) por imagen.
 */
function empaquetarIco(imagenes) {
  const cabecera = Buffer.alloc(6);
  cabecera.writeUInt16LE(0, 0);              // reservado
  cabecera.writeUInt16LE(1, 2);              // tipo 1 = icono
  cabecera.writeUInt16LE(imagenes.length, 4);

  const entradas = [];
  let offset = 6 + imagenes.length * 16;
  for (const { px, png } of imagenes) {
    const e = Buffer.alloc(16);
    e.writeUInt8(px >= 256 ? 0 : px, 0);     // ancho (0 significa 256)
    e.writeUInt8(px >= 256 ? 0 : px, 1);     // alto
    e.writeUInt8(0, 2);                      // paleta: ninguna
    e.writeUInt8(0, 3);                      // reservado
    e.writeUInt16LE(1, 4);                   // planos
    e.writeUInt16LE(32, 6);                  // bits por pixel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    entradas.push(e);
    offset += png.length;
  }
  return Buffer.concat([cabecera, ...entradas, ...imagenes.map((i) => i.png)]);
}

const salidas = [];
for (const { archivo, px } of PNGS) salidas.push([archivo, rasterizar(px)]);
salidas.push(['favicon.ico', empaquetarIco(ICO_PX.map((px) => ({ px, png: rasterizar(px) })))]);

let desfasados = 0;
for (const [rel, buf] of salidas) {
  const destino = join(ROOT, rel);
  /* Comparamos por tamaño, no byte a byte: resvg mete metadatos que cambian
     entre versiones y un diff binario por eso sería ruido. */
  const igual = existsSync(destino) && readFileSync(destino).length === buf.length;
  if (CHECK) {
    if (!igual) { console.error(`✗ desfasado: ${rel}`); desfasados++; }
    continue;
  }
  if (igual) { console.log(`= ${rel} (sin cambios)`); continue; }
  writeFileSync(destino, buf);
  console.log(`✓ ${rel} (${buf.length} B)`);
}

if (CHECK) {
  if (desfasados) {
    console.error(`\n${desfasados} favicon(s) desfasados. Regenera con: node scripts/gen-favicons.mjs`);
    process.exit(1);
  }
  console.log('✓ favicons al día');
}
