/* ============================================================================
   scripts/render-og-blog.mjs
   ----------------------------------------------------------------------------
   Portadas de los artículos del blog: assets/blog/<slug>.jpg (1200×630).

   Mismo lenguaje visual que scripts/render-og.mjs (forja, brasa, chispas), pero
   con el titular partido en varias líneas — los títulos de artículo no caben en
   una, que es lo único que impedía reutilizar aquel tal cual.

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
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
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
const chispas = (semilla) => {
  let s = semilla;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  let out = '';
  for (let i = 0; i < 46; i++) {
    const x = 40 + rnd() * 1120, y = 30 + rnd() * 570, r = 0.9 + rnd() * 2.2, o = 0.18 + rnd() * 0.6;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#ffcf8a" opacity="${o.toFixed(2)}"/>`;
  }
  return out;
};

function portada({ titulo, pill, accent, sub, semilla }) {
  const ls = lineas(titulo, titulo.length > 46 ? 24 : 22);
  const fs2 = ls.length >= 4 ? 54 : ls.length === 3 ? 62 : 74;
  const y0 = 336 - (ls.length - 1) * (fs2 * 0.58);
  const a1 = lighten(accent, 0.8), a2 = lighten(accent, 0.15);
  const pillW = 44 + pill.length * 15;
  return `<svg viewBox="0 0 1200 630" width="1200" height="630" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(titulo)} — Fervon">
  <title>${esc(titulo)} — Fervon</title>
  <defs>
    <radialGradient id="bgr" cx="0.72" cy="0.62" r="1.0"><stop offset="0" stop-color="#20130a"/><stop offset="0.45" stop-color="#120c08"/><stop offset="1" stop-color="#070504"/></radialGradient>
    <radialGradient id="forge" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff8a26" stop-opacity="0.5"/><stop offset="0.45" stop-color="#e0480f" stop-opacity="0.18"/><stop offset="1" stop-color="#e0480f" stop-opacity="0"/></radialGradient>
    <linearGradient id="nameA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a1}"/><stop offset="1" stop-color="${a2}"/></linearGradient>
    <linearGradient id="fi" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#E0480F"/><stop offset="0.5" stop-color="#FF6A00"/><stop offset="1" stop-color="#FFB02E"/></linearGradient>
    <linearGradient id="name" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF6A00"/><stop offset="1" stop-color="#FFB02E"/></linearGradient>
    <linearGradient id="vig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.30"/><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.42"/></linearGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bgr)"/>
  <ellipse cx="960" cy="470" rx="520" ry="330" fill="url(#forge)"/>
  <g>${chispas(semilla)}</g>
  <rect width="1200" height="630" fill="url(#vig)"/>
  <g transform="translate(74,50) scale(0.46)"><ellipse cx="56" cy="82" rx="62" ry="62" fill="#FF6A00" opacity="0.16"/><path d="M58 6 C40 6 30 17 30 38 L30 48 L10 48 L10 70 L30 70 L30 116 C30 120 33 123 37 123 L51 123 C55 123 58 120 58 116 L58 70 L82 70 L82 48 L58 48 L58 38 C58 30 62 26 71 26 L86 26 L86 6 Z" fill="url(#fi)"/><circle cx="100" cy="22" r="5" fill="#FFD37A"/><path d="M86 30 L98 20" stroke="#FFB02E" stroke-width="3.2" stroke-linecap="round"/><path d="M94 12 L99 2" stroke="#FF6A00" stroke-width="3.2" stroke-linecap="round"/><circle cx="116" cy="30" r="2.8" fill="#FF6A00"/></g>
  <text x="146" y="98" font-family="Inter, sans-serif" font-size="34" font-weight="700" fill="#efe7dc" letter-spacing="0.5">fervon</text>
  <text x="1104" y="96" text-anchor="end" font-family="Inter, sans-serif" font-size="26" font-weight="700" fill="url(#name)" letter-spacing="0.3">fervon.dev/blog</text>
  <rect x="96" y="150" width="${pillW}" height="52" rx="26" fill="none" stroke="${accent}" stroke-opacity="0.55"/>
  <text x="${96 + pillW / 2}" y="184" text-anchor="middle" font-family="Inter, sans-serif" font-size="23" font-weight="700" fill="${accent}" letter-spacing="1">${esc(pill.toUpperCase())}</text>
${ls.map((l, i) => `  <text x="96" y="${(y0 + i * fs2 * 1.16).toFixed(0)}" font-family="Inter, sans-serif" font-size="${fs2}" font-weight="800" fill="url(#nameA)" letter-spacing="-1.6">${esc(l)}</text>`).join('\n')}
  <rect x="98" y="${(y0 + (ls.length - 1) * fs2 * 1.16 + 34).toFixed(0)}" width="150" height="6" rx="3" fill="url(#rule)"/>
  <text x="96" y="${(y0 + (ls.length - 1) * fs2 * 1.16 + 96).toFixed(0)}" font-family="Inter, sans-serif" font-size="27" font-weight="400" fill="#d8ccc0">${esc(sub)}</text>
</svg>`;
}

/* Portadas: una por artículo + la del índice de Noticias. */
const PORTADAS = [
  ...ARTICLES.map((a, i) => ({
    key: a.slug,
    titulo: a.ogTitulo.es,
    pill: a.ogPill,
    accent: a.ogAccent,
    sub: `${a.minutos} min de lectura · noticias de Fervon`,
    semilla: 7919 + i * 104729,
  })),
  { key: 'noticias', titulo: 'Noticias', pill: 'Fervon', accent: C.ember, sub: 'Novedades de los proyectos y cómo se construyen', semilla: 424242 },
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
