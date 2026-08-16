/* Auditoría técnica de fervon.dev en vivo: redirecciones, canonicals, longitud
   de title/description en el SERP, bilingüismo/hreflang, indexabilidad y grafo
   de enlaces internos. Todo medido contra el sitio, no contra el repo.

   Uso: node scripts/seo-audit-tecnica.mjs */

const ORIGIN = 'https://fervon.dev';
const P = ['/', '/contacto/', '/claudescope/', '/inferbench/', '/launchpad/', '/lookspan/',
  '/pregon/', '/regenta/', '/trace/', '/veredicto/', '/veredicto/report',
  '/trace/limitless-alternative', '/trace/microsoft-recall-alternative',
  '/trace/personal-memory-tool-without-screen-recording', '/trace/rewind-ai-alternative',
  '/trace/rewind-alternative-windows', '/trace/rewind-shut-down-what-to-use',
  '/trace/screenpipe-alternative'];

const get = async (u, opt = {}) => fetch(u, { redirect: 'manual', ...opt });
const one = (h, re) => { const m = h.match(re); return m ? m[1].trim() : null; };
const strip = (s) => (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

console.log('══════ 1. REDIRECCIONES Y VARIANTES DE HOST ══════');
for (const [label, url] of [
  ['http → https', 'http://fervon.dev/'],
  ['www', 'https://www.fervon.dev/'],
  ['sin barra final', 'https://fervon.dev/lookspan'],
  ['con index.html', 'https://fervon.dev/lookspan/index.html'],
  ['404 inventado', 'https://fervon.dev/no-existe-xyz'],
]) {
  try {
    const r = await get(url);
    console.log(`  ${label.padEnd(18)} ${r.status} ${r.headers.get('location') || ''}`);
  } catch (e) { console.log(`  ${label.padEnd(18)} ERROR ${e.message}`); }
}

console.log('\n══════ 2. TITLE / DESCRIPTION: LONGITUD PARA EL SERP ══════');
console.log('  Google corta el título a ~580px (~60 car.) y la descripción a ~155-160.');
const docs = [];
for (const p of P) {
  const h = await (await fetch(ORIGIN + p + '?cb=' + Math.random())).text();
  docs.push({ p, h });
  const t = strip(one(h, /<title>([\s\S]*?)<\/title>/));
  const d = one(h, /<meta name="description" content="([\s\S]*?)"\s*\/?>/);
  const tw = t.length > 60 ? `⚠ ${t.length}` : `  ${t.length}`;
  const dw = !d ? '⚠ FALTA' : d.length > 160 ? `⚠ ${d.length}` : d.length < 70 ? `⚠ ${d.length} corta` : `  ${d.length}`;
  console.log(`  ${p.padEnd(56)} title ${tw}  desc ${dw}`);
}

console.log('\n══════ 3. CANONICAL, ROBOTS Y OG ══════');
for (const { p, h } of docs) {
  const can = one(h, /<link rel="canonical" href="([^"]+)"/);
  const rob = one(h, /<meta name="robots" content="([^"]+)"/);
  const ogu = one(h, /<meta property="og:url" content="([^"]+)"/);
  const ogi = one(h, /<meta property="og:image" content="([^"]+)"/);
  const esperado = ORIGIN + p;
  const problemas = [];
  if (!can) problemas.push('sin canonical');
  else if (can !== esperado) problemas.push(`canonical≠URL (${can})`);
  if (!rob || !/index/.test(rob)) problemas.push('robots no index');
  if (ogu && ogu !== esperado) problemas.push(`og:url≠URL`);
  if (!ogi) problemas.push('sin og:image');
  console.log(`  ${problemas.length ? '✗' : '✔'} ${p.padEnd(56)} ${problemas.join(' | ')}`);
}

console.log('\n══════ 4. BILINGÜISMO: ¿VE GOOGLE LAS DOS VERSIONES? ══════');
let sinHreflang = 0, conDataAttr = 0;
for (const { p, h } of docs) {
  const lang = one(h, /<html lang="([^"]+)"/);
  const hreflang = (h.match(/rel="alternate"[^>]+hreflang/g) || []).length;
  const dataEn = (h.match(/data-en="/g) || []).length;
  const dataEs = (h.match(/data-es="/g) || []).length;
  if (!hreflang) sinHreflang++;
  if (dataEn + dataEs > 0) conDataAttr++;
  console.log(`  ${p.padEnd(56)} lang=${lang}  hreflang=${hreflang}  traducciones-en-atributos=${dataEn + dataEs}`);
}
console.log(`\n  → ${sinHreflang}/${docs.length} páginas SIN hreflang; ${conDataAttr} guardan la traducción en atributos data-*.`);

console.log('\n══════ 5. GRAFO DE ENLACES INTERNOS ══════');
const norm = (u) => u.replace(/\/$/, '') || '/';
const enlaces = new Map();
for (const { p, h } of docs) {
  const body = h.slice(h.indexOf('<body'));
  const outs = [...new Set([...body.matchAll(/href="(\/[^"#]*)"/g)].map((m) => m[1])
    .filter((u) => !/\.(css|js|png|jpe?g|svg|xml|txt|ico|webp|gif|woff2?)$/i.test(u)))];
  enlaces.set(norm(p), outs.map(norm));
}
const entrantes = new Map(P.map((p) => [norm(p), 0]));
for (const [, outs] of enlaces) for (const o of outs) if (entrantes.has(o)) entrantes.set(o, entrantes.get(o) + 1);
const orden = [...entrantes.entries()].sort((a, b) => a[1] - b[1]);
for (const [u, n] of orden) console.log(`  ${n === 0 ? '✗ HUÉRFANA' : n < 3 ? '⚠ pocos  ' : '✔        '} ${String(n).padStart(2)} enlaces entrantes  ${u}`);

/* Profundidad de clic desde la home */
console.log('\n══════ 6. PROFUNDIDAD DESDE LA HOME ══════');
const dist = new Map([['/', 0]]);
const cola = ['/'];
while (cola.length) {
  const cur = cola.shift();
  for (const o of enlaces.get(cur) || []) {
    if (!dist.has(o) && entrantes.has(o)) { dist.set(o, dist.get(cur) + 1); cola.push(o); }
  }
}
for (const p of P) {
  const d = dist.get(norm(p));
  console.log(`  ${d === undefined ? '✗ INALCANZABLE' : d > 2 ? `⚠ ${d} clics    ` : `✔ ${d} clic(s)  `} ${p}`);
}
