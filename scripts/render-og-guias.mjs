/* ============================================================================
   scripts/render-og-guias.mjs
   ----------------------------------------------------------------------------
   Portadas de las cinco guías de Veredicto: assets/veredicto/<slug>.jpg
   (1200×630).

   POR QUÉ CADA UNA LLEVA SU DIBUJO, y no una plantilla con el titular cambiado:
   es la lección que ya costó rehacer las del blog. Con una sola plantilla, en
   cualquier sitio donde salgan juntas —o simplemente al compartir dos enlaces
   seguidos— se leen como la misma imagen repetida, y el titular sale DOS veces:
   dentro de la portada y como texto del enlace.

   El criterio es la SILUETA a tamaño de miniatura, no el detalle:
     · prove-nothing  → una rejilla        (siete casillas, una sin marca)
     · review         → una columna        (lista de comprobaciones)
     · over-mocking   → un anillo          (el bucle que se comprueba a sí mismo)
     · skipped        → unos interruptores (tres formas de silenciar)
     · mutation       → unas barras        (tres capas de distinto alcance)
   Si dos siluetas se parecen, la portada no está terminada.

   Mismo lenguaje visual que render-og-blog.mjs (forja, brasa, chispas) y misma
   salida en JPEG: resvg solo escribe PNG y uno de 1200×630 con degradados pesa
   ~570 KB; recomprimido con Chrome se queda en ~100 KB.

   Uso:  node scripts/render-og-guias.mjs
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = path.join(ROOT, 'assets', 'veredicto');
const FONT_B64 = fs.readFileSync(path.join(ROOT, 'assets/fonts/inter-var.woff2')).toString('base64');

const C = { ember: '#FF6A00', brasa: '#E0480F', amber: '#FFB02E', spark: '#FFD37A', ash: '#A89A8E' };
const VERDE = '#79d17f', VERDE_L = '#2f6b34', VERDE_BG = '#122413';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const lighten = (hex, t) => {
  const n = parseInt(hex.slice(1), 16);
  const m = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * t));
  return '#' + m.map((v) => v.toString(16).padStart(2, '0')).join('');
};
const lineas = (txt, max) => {
  const out = [];
  let l = '';
  for (const w of txt.split(' ')) {
    if ((l + ' ' + w).trim().length > max && l) { out.push(l.trim()); l = w; } else l = (l + ' ' + w).trim();
  }
  if (l) out.push(l);
  return out;
};
/* Semilla fija por clave: las chispas tienen que salir iguales en cada pasada o
   el fichero cambia sin que haya cambiado nada y ensucia el diff. */
const chispas = (semilla, n = 40) => {
  let s = semilla;
  const r = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  return Array.from({ length: n }, () => {
    const x = Math.round(r() * 1200), y = Math.round(r() * 630);
    const rad = (0.7 + r() * 1.8).toFixed(1), op = (0.10 + r() * 0.45).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${rad}" fill="${r() > 0.5 ? C.amber : C.ember}" opacity="${op}"/>`;
  }).join('');
};

/* ── Ladrillos ────────────────────────────────────────────────────────────
   Todo path de trazo lleva fill="none": un <path> se rellena por defecto y en
   un camino en L eso pinta un bloque que tapa media figura. */
const nodo = (x, y, w, h, t, col, fill = '#170f0b', fs = 19) =>
  `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${col}" stroke-width="2"/>` +
  `<text x="${x + w / 2}" y="${y + h / 2 + fs * 0.36}" text-anchor="middle" font-family="Inter,sans-serif" font-size="${fs}" font-weight="700" fill="#efe7dc">${esc(t)}</text></g>`;
const linea = (d, col, dash = '') =>
  `<path fill="none" d="${d}" stroke="${col}" stroke-width="2.5" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''} marker-end="url(#pt)"/>`;
const tick = (x, y, col = VERDE, s = 1) =>
  `<path fill="none" transform="translate(${x},${y}) scale(${s})" d="M0 10 L9 19 L26 0" stroke="${col}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`;

/* MOTIVO 1 — la rejilla: siete formas de fingir verde, seis con huella. */
const motivoRejilla = (a, t) => {
  const celdas = [];
  for (let i = 0; i < 7; i++) {
    const c = i % 3, f = Math.floor(i / 3);
    const x = c * 172, y = f * 132;
    const ultima = i === 6;
    celdas.push(
      `<rect x="${x}" y="${y}" width="150" height="112" rx="16" fill="#170f0b" stroke="${ultima ? '#3A2C22' : a}" stroke-width="2"${ultima ? ' stroke-dasharray="8 8"' : ''}/>` +
      (ultima
        ? `<text x="${x + 75}" y="${y + 70}" text-anchor="middle" font-family="Inter,sans-serif" font-size="46" font-weight="800" fill="#5d4b3d">?</text>`
        : tick(x + 62, y + 46, a, 1)));
  }
  return `<g>${celdas.join('')}</g>
    <text x="258" y="418" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" fill="${C.ash}">${esc(t.pie)}</text>`;
};

/* MOTIVO 2 — la columna: la lista de revisión, de arriba abajo. */
const motivoColumna = (a, t) => {
  const filas = t.filas;
  const cuerpo = filas.map((fila, i) => {
    const y = i * 62;
    return `<rect x="0" y="${y}" width="470" height="50" rx="12" fill="#170f0b" stroke="#2a2018" stroke-width="2"/>` +
      tick(20, y + 15, a, 0.72) +
      `<text x="66" y="${y + 32}" font-family="Inter,sans-serif" font-size="20" fill="#d8ccc0">${esc(fila)}</text>`;
  }).join('');
  const y7 = 6 * 62;
  return `<g>${cuerpo}
    <rect x="0" y="${y7}" width="470" height="50" rx="12" fill="${VERDE_BG}" stroke="${VERDE_L}" stroke-width="2"/>
    ${tick(20, y7 + 15, VERDE, 0.72)}
    <text x="66" y="${y7 + 32}" font-family="Inter,sans-serif" font-size="20" font-weight="700" fill="${VERDE}">${esc(t.ultima)}</text></g>`;
};

/* MOTIVO 3 — el anillo: el test comprueba el doble que él mismo preparó. */
const motivoAnillo = (a, t) => `
    <circle cx="236" cy="176" r="140" fill="none" stroke="${a}" stroke-opacity="0.20" stroke-width="2" stroke-dasharray="9 11"/>
    ${nodo(126, -14, 220, 62, 'Test', a)}
    ${nodo(126, 306, 220, 62, 'Mock', a)}
    ${linea('M346 20 C430 46 442 250 350 330', a)}
    ${linea('M126 330 C34 250 46 46 130 20', a)}
    <text x="236" y="168" text-anchor="middle" font-family="Inter,sans-serif" font-size="22" font-weight="800" fill="${a}">${esc(t.centro1)}</text>
    <text x="236" y="196" text-anchor="middle" font-family="Inter,sans-serif" font-size="22" font-weight="800" fill="${a}">${esc(t.centro2)}</text>
    ${nodo(430, 140, 190, 62, t.real, '#2a2018', '#110d0b')}
    <path fill="none" d="M356 171 L424 171" stroke="#5d4b3d" stroke-width="2.5" stroke-dasharray="6 6"/>
    <text x="525" y="232" text-anchor="middle" font-family="Inter,sans-serif" font-size="18" fill="#5d4b3d">${esc(t.pie)}</text>`;

/* MOTIVO 4 — los interruptores: tres maneras de apagar la alarma. */
const motivoInterruptores = (a, t) => {
  const filas = t.filas;
  /* OJO: la variable del map NO puede llamarse t, que es el diccionario de
     textos del motivo. Cuando se llamaba asi, ${t.silencia} resolvia contra la
     cadena de la fila y las tres filas decian "undefined the case". Lo dijo la
     imagen al mirarla, no el script: escribio las 10 portadas sin una queja. */
  const cuerpo = filas.map(([etq, d], i) => {
    const y = i * 96;
    return `<g><rect x="0" y="${y}" width="330" height="70" rx="16" fill="#170f0b" stroke="${a}" stroke-width="2"/>` +
      `<text x="24" y="${y + 32}" font-family="Inter,sans-serif" font-size="21" font-weight="700" fill="#efe7dc">${esc(etq)}</text>` +
      `<text x="24" y="${y + 56}" font-family="Inter,sans-serif" font-size="17" fill="${C.ash}">${esc(t.silencia)} ${esc(d)}</text>` +
      `<rect x="366" y="${y + 16}" width="86" height="38" rx="19" fill="#241a14" stroke="#3A2C22" stroke-width="2"/>` +
      `<circle cx="${385}" cy="${y + 35}" r="13" fill="#5d4b3d"/></g>`;
  }).join('');
  return `<g>${cuerpo}</g>
    <g transform="translate(150,318)">
      <rect x="0" y="0" width="200" height="62" rx="31" fill="${VERDE_BG}" stroke="${VERDE_L}" stroke-width="2"/>
      ${tick(40, 20, VERDE, 0.85)}
      <text x="140" y="40" text-anchor="middle" font-family="Inter,sans-serif" font-size="23" font-weight="800" fill="${VERDE}">CI OK</text>
    </g>`;
};

/* MOTIVO 5 — las barras: hasta dónde llega cada capa. */
const motivoBarras = (a, t) => {
  const capas = t.capas;
  return capas.map(([t, pct, col, sub], i) => {
    const y = i * 128;
    return `<g><text x="0" y="${y + 20}" font-family="Inter,sans-serif" font-size="23" font-weight="700" fill="#efe7dc">${esc(t)}</text>` +
      `<rect x="0" y="${y + 36}" width="490" height="26" rx="13" fill="#1b1310"/>` +
      `<rect x="0" y="${y + 36}" width="${Math.round(490 * pct / 100)}" height="26" rx="13" fill="${col}"/>` +
      `<text x="0" y="${y + 88}" font-family="Inter,sans-serif" font-size="18" fill="${C.ash}">${esc(sub)}</text></g>`;
  }).join('');
};

const GUIAS = [
  { key: 'ai-generated-tests-prove-nothing', dibujo: motivoRejilla,
    pos: 'translate(612,112) scale(0.92)', glow: [900, 320, 440, 300], accent: C.brasa,
    es: { titulo: 'Tests que no prueban nada', pill: 'Catálogo', t: { pie: 'seis dejan huella · una no' } },
    en: { titulo: 'Tests that prove nothing', pill: 'Catalogue', t: { pie: 'six leave a mark · one does not' } } },

  { key: 'review-ai-generated-tests', dibujo: motivoColumna,
    pos: 'translate(626,110) scale(0.94)', glow: [880, 300, 430, 320], accent: C.ember,
    es: { titulo: 'Revisar tests de IA', pill: 'Revisión',
      t: { filas: ['¿Bajó el contador?', '¿Cuántos asserts?', '¿Resultado o llamada?', '¿Algo silenciado?', '¿Tocaron la config?', '¿Qué se mockeó?'],
           ultima: 'Rompe el código a propósito' } },
    en: { titulo: 'Reviewing AI tests', pill: 'Review',
      t: { filas: ['Did the count drop?', 'How many assertions?', 'Result or call?', 'Anything silenced?', 'Was config touched?', 'What got mocked?'],
           ultima: 'Break the code on purpose' } } },

  { key: 'over-mocking-detector', dibujo: motivoAnillo,
    pos: 'translate(566,132) scale(0.90)', glow: [910, 300, 450, 300], accent: C.amber,
    es: { titulo: 'El mock circular', pill: 'Over-mocking',
      t: { centro1: 'siempre', centro2: 'pasa', real: 'Código real', pie: 'nunca se ejecuta' } },
    en: { titulo: 'The circular mock', pill: 'Over-mocking',
      t: { centro1: 'always', centro2: 'passes', real: 'Real code', pie: 'never runs' } } },

  { key: 'agent-skipped-tests-green-ci', dibujo: motivoInterruptores,
    pos: 'translate(640,116) scale(0.96)', glow: [890, 310, 430, 310], accent: C.ember,
    es: { titulo: 'Tests silenciados', pill: 'Skip',
      t: { silencia: 'silencia', filas: [['.skip', 'el caso'], ['borrado', 'el fichero'], ['continue-on-error', 'el workflow']] } },
    en: { titulo: 'Silenced tests', pill: 'Skip',
      t: { silencia: 'silences', filas: [['.skip', 'the case'], ['deletion', 'the file'], ['continue-on-error', 'the workflow']] } } },

  { key: 'mutation-testing-alternative', dibujo: motivoBarras,
    pos: 'translate(614,142)', glow: [860, 300, 430, 330], accent: C.spark,
    es: { titulo: 'Tres capas, tres preguntas', pill: 'Comparativa',
      t: { capas: [['Cobertura', 26, C.spark, '¿se ejecutó la línea?'], ['Check en el PR', 62, C.ember, '¿han vaciado la suite?'], ['Mutation testing', 100, C.brasa, '¿lo notaría la suite?']] } },
    en: { titulo: 'Three layers, three questions', pill: 'Comparison',
      t: { capas: [['Coverage', 26, C.spark, 'did the line run?'], ['Check on the PR', 62, C.ember, 'was the suite hollowed?'], ['Mutation testing', 100, C.brasa, 'would the suite notice?']] } } },
];

function portada({ key, accent, dibujo, pos, glow }, { titulo, pill, t }, lang) {
  /* 13 caracteres por línea como mucho: el titular vive en la columna izquierda
     (x 96 → ~540) y de 600 en adelante empieza el dibujo. Con más, el texto se
     mete encima del motivo. */
  const ls = lineas(titulo, 13);
  const fs2 = ls.length >= 3 ? 50 : 58;
  const y0 = 330 - (ls.length - 1) * (fs2 * 0.58);
  const a1 = lighten(accent, 0.78), a2 = lighten(accent, 0.12);
  const pillW = 40 + pill.length * 14;
  const semilla = [...key].reduce((s, c) => (s * 31 + c.charCodeAt(0)) & 0x7fffffff, 7);
  return `<svg viewBox="0 0 1200 630" width="1200" height="630" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(titulo)} — Veredicto de Fervon">
  <title>${esc(titulo)} — Veredicto de Fervon</title>
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
  <g transform="${pos}">${dibujo(accent, t)}</g>
  <rect width="1200" height="630" fill="url(#vig)"/>
  <g transform="translate(74,50) scale(0.46)"><ellipse cx="56" cy="82" rx="62" ry="62" fill="#FF6A00" opacity="0.16"/><path d="M58 6 C40 6 30 17 30 38 L30 48 L10 48 L10 70 L30 70 L30 116 C30 120 33 123 37 123 L51 123 C55 123 58 120 58 116 L58 70 L82 70 L82 48 L58 48 L58 38 C58 30 62 26 71 26 L86 26 L86 6 Z" fill="url(#fi)"/><circle cx="100" cy="22" r="5" fill="#FFD37A"/><path d="M86 30 L98 20" stroke="#FFB02E" stroke-width="3.2" stroke-linecap="round"/><path d="M94 12 L99 2" stroke="#FF6A00" stroke-width="3.2" stroke-linecap="round"/><circle cx="116" cy="30" r="2.8" fill="#FF6A00"/></g>
  <text x="146" y="98" font-family="Inter, sans-serif" font-size="34" font-weight="700" fill="#efe7dc" letter-spacing="0.5">fervon</text>
  <text x="1104" y="96" text-anchor="end" font-family="Inter, sans-serif" font-size="26" font-weight="700" fill="url(#name)" letter-spacing="0.3">fervon.dev/veredicto</text>
  <rect x="96" y="182" width="${pillW}" height="50" rx="25" fill="none" stroke="${accent}" stroke-opacity="0.55"/>
  <text x="${96 + pillW / 2}" y="215" text-anchor="middle" font-family="Inter, sans-serif" font-size="22" font-weight="700" fill="${accent}" letter-spacing="1">${esc(pill.toUpperCase())}</text>
${ls.map((l, i) => `  <text x="96" y="${(y0 + i * fs2 * 1.16).toFixed(0)}" font-family="Inter, sans-serif" font-size="${fs2}" font-weight="800" fill="url(#nameA)" letter-spacing="-1.4">${esc(l)}</text>`).join('\n')}
  <rect x="98" y="${(y0 + (ls.length - 1) * fs2 * 1.16 + 34).toFixed(0)}" width="150" height="6" rx="3" fill="url(#rule)"/>
</svg>`;
}

fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

/* Dos juegos: <slug>.jpg en castellano y <slug>-en.jpg en inglés. Es la misma
   convención de nombres que ya espera ogImagePorIdioma en i18n-build, así que
   cada página coge la de su idioma sin tocar nada más. */
let n = 0;
for (const g of GUIAS) {
  for (const lang of ['es', 'en']) {
    await page.setContent(
      `<style>html,body{margin:0;padding:0;background:#070504}svg{display:block}
       @font-face{font-family:"Inter";src:url(data:font/woff2;base64,${FONT_B64}) format("woff2");font-weight:100 900;font-display:block}
       *{font-family:"Inter",system-ui,sans-serif}</style>${portada(g, g[lang], lang)}`,
      { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const jpg = await page.screenshot({ type: 'jpeg', quality: 84 });
    const nombre = g.key + (lang === 'es' ? '' : '-en') + '.jpg';
    fs.writeFileSync(path.join(OUT, nombre), jpg);
    console.log(`  + assets/veredicto/${nombre}   ${Math.round(jpg.length / 1024)} KB`);
    n++;
  }
}
await browser.close();
console.log(`${n} portadas escritas.`);
