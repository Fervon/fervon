/* ============================================================================
   scripts/render-og-blog.mjs
   ----------------------------------------------------------------------------
   Portadas de los artículos del blog: assets/blog/<slug>.jpg (1200×630).

   POR QUÉ CADA UNA ES DISTINTA. La primera versión usaba UNA plantilla y solo
   cambiaba el titular, la píldora y el color de acento: en la rejilla de /blog/
   las cuatro se leían como la misma imagen repetida, y encima el titular salía
   dentro de la portada Y como texto debajo de la tarjeta —la misma frase dos
   veces, y la de la imagen invisible para Google.

   Ahora cada artículo lleva SU motivo, sacado de la figura que ya vive dentro
   del artículo, y cada uno tiene una silueta distinta a tamaño de miniatura:
     · estudio  → el bucle (anillo)      · tests → la cadena interceptada (verde)
     · flotas   → el abanico (triángulo) · coste → las barras
   El titular se queda, pero pequeño y a un lado: manda el dibujo.

   Mismo lenguaje visual que scripts/render-og.mjs (forja, brasa, chispas).

   SALE EN JPEG, NO EN PNG: resvg solo escribe PNG y un PNG de 1200×630 con
   degradados pesa ~570 KB. Las portadas se usan como imagen de artículo Y como
   miniatura en /blog/, así que las carga el visitante, no solo el rastreador.
   Se recomprime con Chrome headless, que deja el mismo peso (~100 KB) que las
   og-*.jpg que ya había.

   Uso:  node scripts/render-og-blog.mjs
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { ARTICLES, C } from './blog-articles.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = path.join(ROOT, 'assets', 'blog');
/* La fuente va INCRUSTADA en base64. La página se monta sobre about:blank y ahí
   una url file:// está bloqueada, así que la petición no llega ni a salir y
   `networkidle0` se quedaba esperando hasta agotar el tiempo. */
const FONT_B64 = fs.readFileSync(path.join(ROOT, 'assets/fonts/inter-var.woff2')).toString('base64');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const lighten = (hex, tt) => {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const L = (v) => Math.round(v + (255 - v) * tt);
  return '#' + [L(r), L(g), L(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
};

/* Parte el titular por palabras en líneas de como mucho `max` caracteres. */
const lineas = (txt, max) => {
  const out = []; let cur = '';
  for (const w of txt.split(' ')) {
    if (cur && (cur + ' ' + w).length > max) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) out.push(cur);
  return out;
};

/* Chispas deterministas: sin Math.random, para que regenerar no cambie el
   fichero y el diff no se llene de imágenes «modificadas» que son iguales. */
const chispas = (semilla, n = 40) => {
  let s = semilla;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = 40 + rnd() * 1120, y = 30 + rnd() * 570, r = 0.9 + rnd() * 2.2, o = 0.16 + rnd() * 0.5;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#ffcf8a" opacity="${o.toFixed(2)}"/>`;
  }
  return out;
};

/* ── Ladrillos de los motivos ─────────────────────────────────────────────
   OJO: un <path> de SVG se RELLENA por defecto; en un camino en L eso pinta un
   bloque que tapa media figura. Todo path de trazo lleva fill="none". */
const nodo = (x, y, w, h, t, col, fill = '#170f0b') =>
  `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${col}" stroke-width="2"/>` +
  `<text x="${x + w / 2}" y="${y + h / 2 + 7}" text-anchor="middle" font-family="Inter,sans-serif" font-size="19" font-weight="700" fill="#efe7dc">${t}</text></g>`;
const linea = (d, col, dash = '') =>
  `<path fill="none" d="${d}" stroke="${col}" stroke-width="2.5" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''} marker-end="url(#pt)"/>`;

/* Los motivos devuelven SOLO su contenido, sin el <g transform> de fuera: quien
   los coloca es MOTIVOS (portada de artículo) o motivoIndice (rejilla del
   índice). Cuando el transform vivía dentro, el índice lo quitaba con un
   replace por cadena exacta y bastaba mover un motivo dos píxeles para que el
   replace no casara y la rejilla se fuera fuera del lienzo sin avisar. */

/* MOTIVO 1 — el bucle: anillo de cuatro nodos con el rechazo que vuelve. */
const motivoCiclo = (a) => `
    <circle cx="256" cy="230" r="196" fill="none" stroke="${a}" stroke-opacity="0.18" stroke-width="2" stroke-dasharray="9 11"/>
    ${nodo(166, 8, 180, 60, 'Criterio', a)}
    ${nodo(346, 200, 172, 60, 'Flota', '#3A2C22')}
    ${nodo(166, 392, 180, 60, 'Jueces', '#3A2C22')}
    ${nodo(-6, 200, 172, 60, 'Producto', C.amber)}
    ${linea('M346 44 C430 60 470 130 452 196', a)}
    ${linea('M432 262 C420 340 360 392 348 400', a)}
    ${linea('M166 408 C86 392 40 330 58 264', C.brasa, '7 7')}
    ${linea('M80 196 C96 118 160 66 172 58', a)}`;

/* MOTIVO 2 — el abanico: una raíz que se abre en cuatro worktrees. */
const motivoAbanico = (a) => `
    ${nodo(180, 0, 200, 58, 'Repositorio', a)}
    ${linea('M262 58 L74 148', a)} ${linea('M272 58 L200 148', a)}
    ${linea('M288 58 L360 148', a)} ${linea('M298 58 L486 148', a)}
    ${nodo(10, 150, 128, 56, 'wt A', '#3A2C22')}
    ${nodo(146, 150, 128, 56, 'wt B', '#3A2C22')}
    ${nodo(282, 150, 128, 56, 'wt C', '#3A2C22')}
    ${nodo(418, 150, 128, 56, 'wt D', '#3A2C22')}
    ${linea('M74 206 L262 300', C.amber)} ${linea('M200 206 L272 300', C.amber)}
    ${linea('M360 206 L288 300', C.amber)} ${linea('M486 206 L298 300', C.amber)}
    ${nodo(180, 302, 200, 58, 'Integración', C.amber)}`;

/* MOTIVO 3 — la cadena interceptada: el mock corta antes del código real. */
const motivoIntercepta = (a) => `
    ${nodo(0, 96, 150, 62, 'Test', '#3A2C22')}
    ${linea('M152 127 L206 127', a)}
    ${nodo(212, 96, 164, 62, 'Mock', a)}
    <path fill="none" d="M380 127 L446 127" stroke="#A89A8E" stroke-width="2.5" stroke-dasharray="6 6"/>
    <path fill="none" d="M400 106 L426 148 M426 106 L400 148" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    ${nodo(452, 96, 168, 62, 'Código real', '#2a2018', '#110d0b')}
    <g transform="translate(232,246)">
      <rect x="0" y="0" width="164" height="58" rx="29" fill="#122413" stroke="#2f6b34" stroke-width="2"/>
      <path fill="none" d="M40 30 L56 46 L84 16" stroke="#79d17f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="112" y="38" text-anchor="middle" font-family="Inter,sans-serif" font-size="22" font-weight="800" fill="#79d17f">PASA</text>
    </g>
    <text x="310" y="352" text-anchor="middle" font-family="Inter,sans-serif" font-size="19" fill="#A89A8E">el fallo sigue ahí</text>`;

/* MOTIVO 4 — las barras: dónde se va el gasto de una tarea. */
const motivoBarras = () => {
  const partidas = [
    ['Contexto reenviado', 46, C.brasa],
    ['Salida de herramientas', 24, C.ember],
    ['Reintentos', 16, C.amber],
    ['Razonamiento', 10, C.spark],
    ['Lo que querías', 4, '#8FD06B'],
  ];
  const max = 46;
  return partidas.map(([t, pct, col], i) => {
    const y = i * 76;
    return `<g><text x="0" y="${y + 18}" font-family="Inter,sans-serif" font-size="19" fill="#d8ccc0">${t}</text>` +
      `<rect x="0" y="${y + 30}" width="470" height="20" rx="10" fill="#1b1310"/>` +
      `<rect x="0" y="${y + 30}" width="${Math.round(470 * pct / max)}" height="20" rx="10" fill="${col}"/>` +
      `<text x="500" y="${y + 47}" font-family="Inter,sans-serif" font-size="21" font-weight="800" fill="${col}">${pct}%</text></g>`;
  }).join('');
};

/* MOTIVO 0 — índice: los cuatro motivos reducidos, para que /blog/ se lea como
   el conjunto y no como un quinto artículo. */
const motivoIndice = () => `
  <g opacity="0.92">
    <g transform="translate(636,148) scale(0.34)">${motivoCiclo(C.ember)}</g>
    <g transform="translate(908,150) scale(0.34)">${motivoAbanico(C.amber)}</g>
    <g transform="translate(628,398) scale(0.34)">${motivoIntercepta(C.brasa)}</g>
    <g transform="translate(908,392) scale(0.34)">${motivoBarras()}</g>
  </g>`;

/* Cada portada define su motivo Y dónde cae el resplandor, para que ni siquiera
   el fondo se repita entre artículos. */
const MOTIVOS = {
  'estudio-software-autonomo': { dibujo: motivoCiclo, pos: 'translate(640,112) scale(0.92)', glow: [880, 330, 430, 300] },
  'flotas-agentes-ia': { dibujo: motivoAbanico, pos: 'translate(614,132) scale(0.95)', glow: [890, 250, 460, 320] },
  'tests-amanados-agentes': { dibujo: motivoIntercepta, pos: 'translate(606,170) scale(0.88)', glow: [900, 430, 470, 280] },
  'coste-real-agentes-ia': { dibujo: motivoBarras, pos: 'translate(610,150)', glow: [820, 300, 420, 340] },
  noticias: { dibujo: motivoIndice, pos: 'translate(0,0)', glow: [880, 320, 520, 360] },
};

function portada({ key, titulo, pill, accent }) {
  const { dibujo, pos, glow } = MOTIVOS[key];
  /* 13 caracteres por línea, no más: el titular tiene que caber en la columna
     izquierda (x 96 → ~540) y dejar libre de 600 en adelante, que es donde
     empieza el motivo. Con 17 el titular llegaba a x≈680 y se comía el dibujo. */
  const ls = lineas(titulo, 13);
  const fs2 = ls.length >= 3 ? 50 : 58;
  const y0 = 330 - (ls.length - 1) * (fs2 * 0.58);
  const a1 = lighten(accent, 0.78), a2 = lighten(accent, 0.12);
  const pillW = 40 + pill.length * 14;
  const semilla = [...key].reduce((s, c) => (s * 31 + c.charCodeAt(0)) & 0x7fffffff, 7);
  return `<svg viewBox="0 0 1200 630" width="1200" height="630" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(titulo)} — Fervon">
  <title>${esc(titulo)} — Fervon</title>
  <defs>
    <radialGradient id="bgr" cx="0.72" cy="0.62" r="1.0"><stop offset="0" stop-color="#20130a"/><stop offset="0.45" stop-color="#120c08"/><stop offset="1" stop-color="#070504"/></radialGradient>
    <radialGradient id="forge" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff8a26" stop-opacity="0.42"/><stop offset="0.45" stop-color="#e0480f" stop-opacity="0.15"/><stop offset="1" stop-color="#e0480f" stop-opacity="0"/></radialGradient>
    <linearGradient id="nameA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a1}"/><stop offset="1" stop-color="${a2}"/></linearGradient>
    <linearGradient id="fi" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#E0480F"/><stop offset="0.5" stop-color="#FF6A00"/><stop offset="1" stop-color="#FFB02E"/></linearGradient>
    <linearGradient id="name" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF6A00"/><stop offset="1" stop-color="#FFB02E"/></linearGradient>
    <linearGradient id="vig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.30"/><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.42"/></linearGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></linearGradient>
    <marker id="pt" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${accent}"/></marker>
  </defs>
  <rect width="1200" height="630" fill="url(#bgr)"/>
  <ellipse cx="${glow[0]}" cy="${glow[1]}" rx="${glow[2]}" ry="${glow[3]}" fill="url(#forge)"/>
  <g>${chispas(semilla)}</g>
  <g transform="${pos}">${dibujo(accent)}</g>
  <rect width="1200" height="630" fill="url(#vig)"/>
  <g transform="translate(74,50) scale(0.46)"><ellipse cx="56" cy="82" rx="62" ry="62" fill="#FF6A00" opacity="0.16"/><path d="M58 6 C40 6 30 17 30 38 L30 48 L10 48 L10 70 L30 70 L30 116 C30 120 33 123 37 123 L51 123 C55 123 58 120 58 116 L58 70 L82 70 L82 48 L58 48 L58 38 C58 30 62 26 71 26 L86 26 L86 6 Z" fill="url(#fi)"/><circle cx="100" cy="22" r="5" fill="#FFD37A"/><path d="M86 30 L98 20" stroke="#FFB02E" stroke-width="3.2" stroke-linecap="round"/><path d="M94 12 L99 2" stroke="#FF6A00" stroke-width="3.2" stroke-linecap="round"/><circle cx="116" cy="30" r="2.8" fill="#FF6A00"/></g>
  <text x="146" y="98" font-family="Inter, sans-serif" font-size="34" font-weight="700" fill="#efe7dc" letter-spacing="0.5">fervon</text>
  <text x="1104" y="96" text-anchor="end" font-family="Inter, sans-serif" font-size="26" font-weight="700" fill="url(#name)" letter-spacing="0.3">fervon.dev/blog</text>
  <rect x="96" y="182" width="${pillW}" height="50" rx="25" fill="none" stroke="${accent}" stroke-opacity="0.55"/>
  <text x="${96 + pillW / 2}" y="215" text-anchor="middle" font-family="Inter, sans-serif" font-size="22" font-weight="700" fill="${accent}" letter-spacing="1">${esc(pill.toUpperCase())}</text>
${ls.map((l, i) => `  <text x="96" y="${(y0 + i * fs2 * 1.16).toFixed(0)}" font-family="Inter, sans-serif" font-size="${fs2}" font-weight="800" fill="url(#nameA)" letter-spacing="-1.4">${esc(l)}</text>`).join('\n')}
  <rect x="98" y="${(y0 + (ls.length - 1) * fs2 * 1.16 + 34).toFixed(0)}" width="150" height="6" rx="3" fill="url(#rule)"/>
</svg>`;
}

/* Portadas: una por artículo + la del índice de Noticias. */
const PORTADAS = [
  ...ARTICLES.map((a) => ({ key: a.slug, titulo: a.ogTitulo.es, pill: a.ogPill, accent: a.ogAccent })),
  { key: 'noticias', titulo: 'Noticias', pill: 'Fervon', accent: C.ember },
];

fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

for (const p of PORTADAS) {
  const svg = portada(p);
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:#070504}svg{display:block}
     @font-face{font-family:"Inter";src:url(data:font/woff2;base64,${FONT_B64}) format("woff2");font-weight:100 900;font-display:block}
     *{font-family:"Inter",system-ui,sans-serif}</style>${svg}`,
    { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const jpg = await page.screenshot({ type: 'jpeg', quality: 84 });
  const dest = path.join(OUT, p.key + '.jpg');
  fs.writeFileSync(dest, jpg);
  console.log(`  + assets/blog/${p.key}.jpg   ${Math.round(jpg.length / 1024)} KB`);
}
await browser.close();
console.log(`${PORTADAS.length} portadas escritas.`);
