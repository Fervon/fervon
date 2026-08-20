/* ============================================================================
   scripts/seo-audit-full.mjs
   ----------------------------------------------------------------------------
   Auditoría SEO página a página de todo lo que se publica. Solo lectura: no
   escribe ni un byte en el sitio.

   Comprueba, por página: title y description (presencia y longitud), canonical
   auto-referencial, hreflang recíproco y absoluto con x-default, Open Graph y
   Twitter Card, JSON-LD que parsee, un solo h1 y sin saltos de nivel, imágenes
   con alt/dimensiones/lazy y que existan, enlaces internos rotos, enlaces
   externos sin rel=noopener, anclas sin texto, contenido pobre y si el idioma
   del texto casa con la ruta. Y de todo el sitio: títulos, descripciones y
   canonicals duplicados, cobertura del sitemap, páginas huérfanas y hreflang
   sin reciprocidad.

   A las páginas `noindex` (la 404) se le saltan las comprobaciones de indexación
   a propósito: no le toca canonical, ni hreflang, ni Open Graph, ni longitud
   mínima, ni enlaces entrantes.

   Uso:  npm run seo:full                informe legible
         npm run seo:full -- --paginas   + la ficha de cada página
         npm run seo:full -- --json      salida en bruto para encadenar

   Sale con 1 si hay algo crítico o alto, para poder usarlo en CI.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || '.');
const ORIGIN = 'https://fervon.dev';

// ---------- descubrir páginas publicadas (lo que sale en el deploy) ----------
const EXCLUDE_DIRS = new Set(['node_modules', '.git', '.github', '.claude', '.wrangler', 'scripts', 'src-i18n', 'dist']);
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (EXCLUDE_DIRS.has(e.name)) continue;
      walk(path.join(dir, e.name), out);
    } else if (e.name.endsWith('.html')) out.push(path.join(dir, e.name));
  }
  return out;
}
const files = walk(ROOT).sort();

const rel = f => path.relative(ROOT, f).split(path.sep).join('/');
function urlFor(f) {
  let r = rel(f);
  if (r.endsWith('/index.html')) r = r.slice(0, -'index.html'.length);
  else if (r === 'index.html') r = '';
  else r = r.replace(/\.html$/, '');   // GitHub Pages sirve /x para x.html
  return ORIGIN + '/' + r;
}

// ---------- helpers de parseo ----------
const attr = (tag, name) => {
  const m = tag.match(new RegExp('\\b' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i'));
  return m ? (m[2] !== undefined ? m[2] : m[3]) : null;
};
const hasAttr = (tag, name) => new RegExp('\\b' + name + '(\\b|=)', 'i').test(tag);
const tagsOf = (html, name) => html.match(new RegExp('<' + name + '\\b[^>]*>', 'gi')) || [];
const meta = (html, kind, val) =>
  tagsOf(html, 'meta').filter(t => (attr(t, kind) || '').toLowerCase() === val.toLowerCase())
    .map(t => attr(t, 'content'));
const metaName = (html, n) => meta(html, 'name', n)[0] ?? null;
const metaProp = (html, p) => meta(html, 'property', p)[0] ?? null;

function textContent(html) {
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, html])[1];
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ').trim();
}

// ---------- sitemap ----------
const sitemapPath = path.join(ROOT, 'sitemap.xml');
const sitemapXml = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf8') : '';
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

// ---------- auditar ----------
const pages = [];
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const url = urlFor(f);
  const p = { file: rel(f), url, bytes: Buffer.byteLength(html), issues: [] };
  const add = (sev, code, msg) => p.issues.push({ sev, code, msg });

  const htmlTag = (html.match(/<html\b[^>]*>/i) || [''])[0];
  p.lang = attr(htmlTag, 'lang');
  const r0 = rel(f);
  // Convención invertida: las landings de Trace y el report viven en INGLÉS en la raíz
  // (el español de esas mismas páginas está bajo /es/).
  const EN_EN_RAIZ = /^(trace\/(?!index\.html)[a-z-]+\.html|veredicto\/report\.html)$/;
  const expectedLang = r0.startsWith('en/') ? 'en' : (EN_EN_RAIZ.test(r0) ? 'en' : 'es');
  p.expectedLang = expectedLang;
  if (!p.lang) add('alta', 'lang', 'sin atributo lang en <html>');
  else if (p.lang.slice(0, 2) !== expectedLang) add('alta', 'lang', 'lang="' + p.lang + '" pero la ruta es ' + expectedLang);

  /* Una página noindex (la 404) no juega en el índice: no le toca canonical, ni
     hreflang, ni Open Graph, ni la miden por longitud, ni tiene que estar
     enlazada. Se lee pronto porque media docena de comprobaciones dependen. */
  p.robots = metaName(html, 'robots');
  const noindex = !!(p.robots && /noindex/i.test(p.robots));
  if (noindex) add('info', 'noindex', 'meta robots: ' + p.robots + ' — se le saltan las comprobaciones de indexación');

  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  p.title = t ? t[1].trim() : null;
  if (!p.title) add('critica', 'title', 'sin <title>');
  else {
    if (p.title.length > 60) add('media', 'title-largo', 'title ' + p.title.length + ' car. (se corta en ~60)');
    if (p.title.length < 25) add('media', 'title-corto', 'title ' + p.title.length + ' car.');
  }
  const htmlSinSvg = html.replace(/<svg[\s\S]*?<\/svg>/gi, ' ');   // los <title> de SVG son accesibilidad, no SEO
  if ((htmlSinSvg.match(/<title[^>]*>/gi) || []).length > 1) add('alta', 'title-dup', 'mas de un <title>');

  p.desc = metaName(html, 'description');
  if (!p.desc) add('critica', 'desc', 'sin meta description');
  else {
    if (p.desc.length > 160) add('media', 'desc-larga', 'description ' + p.desc.length + ' car. (se corta ~155-160)');
    if (p.desc.length < 70) add('media', 'desc-corta', 'description ' + p.desc.length + ' car.');
  }

  const links = tagsOf(html, 'link');
  const canon = links.filter(l => (attr(l, 'rel') || '').toLowerCase() === 'canonical').map(l => attr(l, 'href'));
  p.canonical = canon[0] ?? null;
  if (canon.length === 0) { if (!noindex) add('critica', 'canonical', 'sin rel=canonical'); }
  else if (canon.length > 1) add('critica', 'canonical-dup', canon.length + ' canonicals');
  else {
    if (!/^https?:\/\//.test(p.canonical)) add('alta', 'canonical-rel', 'canonical relativo');
    if (p.canonical !== url) add('alta', 'canonical-mismatch', 'canonical ' + p.canonical + ' != URL real ' + url);
  }

  const alts = links.filter(l => (attr(l, 'rel') || '').toLowerCase() === 'alternate' && attr(l, 'hreflang'));
  p.hreflang = alts.map(l => ({ lang: attr(l, 'hreflang'), href: attr(l, 'href') }));
  if (p.hreflang.length === 0) { if (!noindex) add('media', 'hreflang-falta', 'sin hreflang (sitio bilingue)'); }
  else {
    const langs = p.hreflang.map(h => h.lang);
    if (!langs.includes('x-default')) add('media', 'hreflang-xdefault', 'sin x-default');
    if (!langs.includes(expectedLang)) add('alta', 'hreflang-self', 'sin hreflang auto-referencial (' + expectedLang + ')');
    for (const h of p.hreflang) if (!/^https?:\/\//.test(h.href)) add('alta', 'hreflang-rel', 'hreflang ' + h.lang + ' relativo');
  }


  if (!metaName(html, 'viewport')) add('alta', 'viewport', 'sin meta viewport');
  if (!/charset\s*=/i.test(html.slice(0, 2000))) add('alta', 'charset', 'sin charset en los primeros 2 KB');

  const og = {
    type: metaProp(html, 'og:type'), title: metaProp(html, 'og:title'),
    desc: metaProp(html, 'og:description'), url: metaProp(html, 'og:url'),
    image: metaProp(html, 'og:image'), site: metaProp(html, 'og:site_name'),
    locale: metaProp(html, 'og:locale'),
  };
  p.og = og;
  const ogLabel = { type: 'og:type', title: 'og:title', desc: 'og:description', url: 'og:url', image: 'og:image', site: 'og:site_name', locale: 'og:locale' };
  for (const [k, v] of Object.entries(og)) if (!v && !noindex) add((k === 'image' || k === 'title') ? 'alta' : 'baja', 'og-' + k, 'falta ' + ogLabel[k]);
  if (og.url && og.url !== url) add('media', 'og-url', 'og:url ' + og.url + ' != URL real ' + url);
  if (og.image && !/^https?:/.test(og.image)) add('alta', 'og-image-rel', 'og:image relativa (debe ser absoluta)');
  if (og.image && og.image.startsWith(ORIGIN)) {
    const local = path.join(ROOT, og.image.replace(ORIGIN, '').split('?')[0]);
    if (!fs.existsSync(local)) add('critica', 'og-image-404', 'og:image no existe: ' + og.image);
  }
  if (og.locale) {
    const want = expectedLang === 'en' ? 'en' : 'es';
    if (!og.locale.startsWith(want)) add('media', 'og-locale', 'og:locale ' + og.locale + ' no casa con ' + want);
  }
  p.twCard = metaName(html, 'twitter:card');
  if (!p.twCard && !noindex) add('media', 'tw-card', 'sin twitter:card');
  if (!metaName(html, 'twitter:image') && !og.image && !noindex) add('media', 'tw-image', 'sin twitter:image');

  const lds = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  p.ldTypes = [];
  if (!lds.length && !noindex) add('media', 'jsonld', 'sin datos estructurados JSON-LD');
  for (const raw of lds) {
    try {
      const j = JSON.parse(raw);
      const collect = n => {
        if (!n || typeof n !== 'object') return;
        if (Array.isArray(n)) return n.forEach(collect);
        if (n['@type']) p.ldTypes.push(...[].concat(n['@type']));
        if (n['@graph']) collect(n['@graph']);
      };
      collect(j);
    } catch (e) { add('critica', 'jsonld-roto', 'JSON-LD no parsea: ' + e.message.slice(0, 90)); }
  }

  const heads = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map(m => ({ lvl: +m[1], text: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }));
  p.h1 = heads.filter(h => h.lvl === 1).map(h => h.text);
  p.heads = heads.map(h => 'h' + h.lvl + ':' + h.text.slice(0, 60));
  if (p.h1.length === 0) add('alta', 'h1-falta', 'sin <h1>');
  if (p.h1.length > 1) add('media', 'h1-multi', p.h1.length + ' <h1>');
  let prev = 0; const skips = [];
  for (const h of heads) { if (prev && h.lvl > prev + 1) skips.push('h' + prev + '->h' + h.lvl); prev = h.lvl; }
  if (skips.length) add('baja', 'h-salto', 'saltos de nivel: ' + [...new Set(skips)].join(', '));
  p.headCount = heads.length;

  const imgs = tagsOf(html, 'img');
  p.imgs = imgs.length;
  let noAlt = 0, emptyAlt = 0, noDim = 0, noLazy = 0; const missing = [];
  imgs.forEach((im, i) => {
    const a = attr(im, 'alt');
    if (a === null) noAlt++; else if (a.trim() === '' && !hasAttr(im, 'aria-hidden')) emptyAlt++;
    if ((!attr(im, 'width') || !attr(im, 'height')) && !hasAttr(im, 'aria-hidden')) noDim++;
    const src = attr(im, 'src') || '';
    if (i > 0 && !hasAttr(im, 'loading') && !/^data:/.test(src) && !hasAttr(im, 'aria-hidden')) noLazy++;
    if (src.startsWith('/') && !src.startsWith('//')) {
      const lp = path.join(ROOT, src.split('?')[0]);
      if (!fs.existsSync(lp)) missing.push(src);
    }
  });
  if (noAlt) add('alta', 'img-alt', noAlt + '/' + imgs.length + ' <img> sin atributo alt');
  if (emptyAlt) add('baja', 'img-alt-vacio', emptyAlt + '/' + imgs.length + ' <img> con alt="" (decorativas)');
  if (noDim) add('media', 'img-dim', noDim + '/' + imgs.length + ' <img> sin width/height (riesgo CLS)');
  if (noLazy) add('baja', 'img-lazy', noLazy + ' <img> despues de la primera sin loading=lazy');
  if (missing.length) add('critica', 'img-404', 'imagenes que no existen: ' + [...new Set(missing)].join(', '));

  const as = tagsOf(html, 'a');
  p.linksInt = []; p.linksExt = [];
  const extNoRel = []; const emptyAnchor = [];
  const anchorText = [...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)];
  for (const a of as) {
    const href = attr(a, 'href');
    if (!href || href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) continue;
    if (/^https?:\/\//.test(href)) {
      if (href.startsWith(ORIGIN)) p.linksInt.push(href.replace(ORIGIN, '') || '/');
      else {
        p.linksExt.push(href);
        const target = (attr(a, 'target') || '');
        const r = (attr(a, 'rel') || '');
        if (target === '_blank' && !/noopener/i.test(r)) extNoRel.push(href);
      }
    } else p.linksInt.push(href);
  }
  for (const m of anchorText) {
    const inner = m[1].replace(/<svg[\s\S]*?<\/svg>/gi, '').replace(/<[^>]+>/g, '').trim();
    const tag = m[0].match(/<a\b[^>]*>/i)[0];
    if (!inner && !attr(tag, 'aria-label') && !/\<img/i.test(m[1])) emptyAnchor.push((attr(tag, 'href') || '?'));
  }
  if (extNoRel.length) add('baja', 'rel-noopener', extNoRel.length + ' enlaces target=_blank sin rel=noopener');
  if (emptyAnchor.length) add('media', 'anchor-vacio', emptyAnchor.length + ' enlaces sin texto ni aria-label: ' + [...new Set(emptyAnchor)].slice(0, 3).join(', '));
  p.extDomains = [...new Set(p.linksExt.map(u => { try { return new URL(u).hostname; } catch { return u; } }))];

  const text = textContent(html);
  p.words = text.split(/\s+/).filter(Boolean).length;
  if (p.words < 300 && !noindex) add(p.words < 150 ? 'alta' : 'media', 'thin', 'solo ' + p.words + ' palabras de texto visible');

  const es = (text.match(/\b(el|la|los|las|de|que|para|con|una|como|mas|sin|por|desde|cuando|pero|todo)\b/gi) || []).length;
  const en = (text.match(/\b(the|and|of|to|for|with|that|from|when|your|this|are|is|but|all)\b/gi) || []).length;
  p.langGuess = es === en ? '?' : (es > en ? 'es' : 'en');
  p.langScore = { es, en };
  if (p.words > 120 && p.langGuess !== '?' && p.langGuess !== expectedLang)
    add('critica', 'idioma', 'la ruta es /' + expectedLang + ' pero el texto parece ' + p.langGuess + ' (es:' + es + ' en:' + en + ')');

  // rendimiento basico
  const inlineCss = (html.match(/<style[\s\S]*?<\/style>/gi) || []).join('').length;
  const scripts = tagsOf(html, 'script');
  p.blockingScripts = scripts.filter(s => attr(s, 'src') && !hasAttr(s, 'defer') && !hasAttr(s, 'async') && (attr(s, 'type') || '') !== 'module').length;
  if (p.blockingScripts) add('media', 'js-bloqueante', p.blockingScripts + ' <script src> sin defer/async');
  p.inlineCss = inlineCss;
  const cssLinks = links.filter(l => (attr(l, 'rel') || '') === 'stylesheet');
  p.cssLinks = cssLinks.map(l => attr(l, 'href'));
  p.preload = links.filter(l => /preload|preconnect/i.test(attr(l, 'rel') || '')).length;

  pages.push(p);
}

// ---------- comprobaciones globales ----------
const global = [];
const G = (sev, code, msg) => global.push({ sev, code, msg });

const push = (map, k, v) => { if (!map.has(k)) map.set(k, []); map.get(k).push(v); };
const byTitle = new Map(), byDesc = new Map(), byCanon = new Map(), byH1 = new Map();
for (const p of pages) {
  if (p.title) push(byTitle, p.title, p.url);
  if (p.desc) push(byDesc, p.desc, p.url);
  if (p.canonical) push(byCanon, p.canonical, p.url);
  if (p.h1[0]) push(byH1, p.h1[0] + '|' + p.expectedLang, p.url);
}
for (const [t, us] of byTitle) if (us.length > 1) G('alta', 'title-duplicado', 'title repetido x' + us.length + ': "' + t.slice(0, 70) + '" -> ' + us.join(' , '));
for (const [d, us] of byDesc) if (us.length > 1) G('alta', 'desc-duplicada', 'description repetida x' + us.length + ': "' + d.slice(0, 70) + '..." -> ' + us.join(' , '));
for (const [c, us] of byCanon) if (us.length > 1) G('critica', 'canonical-compartido', us.length + ' paginas comparten canonical ' + c + ' -> ' + us.join(' , '));
for (const [h, us] of byH1) if (us.length > 1) G('media', 'h1-duplicado', 'h1 repetido x' + us.length + ': "' + h.split('|')[0].slice(0, 60) + '" -> ' + us.join(' , '));

const pageUrls = new Set(pages.map(p => p.url));
const smSet = new Set(sitemapUrls);
for (const u of sitemapUrls) {
  if (!pageUrls.has(u) && !pageUrls.has(u + '/') && !pageUrls.has(u.replace(/\/$/, '')))
    G('alta', 'sitemap-404', 'en sitemap pero no hay fichero: ' + u);
}
for (const p of pages) {
  if (p.robots && /noindex/i.test(p.robots)) { if (smSet.has(p.url)) G('alta', 'sitemap-noindex', 'noindex pero esta en sitemap: ' + p.url); continue; }
  if (!smSet.has(p.url) && !smSet.has(p.url.replace(/\/$/, ''))) G('media', 'sitemap-falta', 'indexable pero fuera del sitemap: ' + p.url);
}
for (const u of sitemapUrls) {
  const pg = pages.find(p => p.url === u || p.url === u + '/');
  if (pg && pg.canonical && pg.canonical !== u) G('alta', 'sitemap-canonical', 'sitemap lista ' + u + ' pero su canonical es ' + pg.canonical);
}
// sitemap: <lastmod> coherentes
const lastmods = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>[\s\S]*?<lastmod>([^<]+)<\/lastmod>/g)];
for (const [, u, d] of lastmods) if (!/^\d{4}-\d{2}-\d{2}/.test(d)) G('media', 'lastmod', 'lastmod no ISO en ' + u + ': ' + d);

const resolvable = new Set(pages.map(p => new URL(p.url).pathname));
function fileExistsFor(pathname) {
  const clean = pathname.split('#')[0].split('?')[0];
  if (resolvable.has(clean) || resolvable.has(clean + '/') || resolvable.has(clean.replace(/\/$/, ''))) return true;
  const local = path.join(ROOT, clean);
  if (fs.existsSync(local)) return true;
  if (fs.existsSync(local + '.html')) return true;
  if (fs.existsSync(path.join(local, 'index.html'))) return true;
  return false;
}
const broken = new Map();
for (const p of pages) {
  for (const l of p.linksInt) {
    if (!l.startsWith('/')) { push(broken, 'RELATIVO:' + l, p.url); continue; }
    if (!fileExistsFor(l)) push(broken, l, p.url);
  }
}
for (const [l, from] of broken) {
  if (l.startsWith('RELATIVO:')) continue;
  G('critica', 'enlace-roto', l + ' -- enlazado desde ' + from.length + ': ' + [...new Set(from)].slice(0, 4).join(', '));
}

const inbound = new Map(pages.map(p => [new URL(p.url).pathname, 0]));
for (const p of pages) for (const l of new Set(p.linksInt)) {
  const clean = l.split('#')[0].split('?')[0];
  for (const k of [clean, clean + '/', clean.replace(/\/$/, '')]) if (inbound.has(k)) { inbound.set(k, inbound.get(k) + 1); break; }
}
const sinIndexar = new Set(pages.filter(p => p.robots && /noindex/i.test(p.robots)).map(p => new URL(p.url).pathname));
for (const [k, n] of inbound) if (n === 0 && !sinIndexar.has(k)) G('alta', 'huerfana', 'ninguna pagina enlaza a ' + k);

// hreflang reciproco
for (const p of pages) {
  for (const h of p.hreflang) {
    if (h.lang === 'x-default') continue;
    const target = pages.find(q => q.url === h.href || q.url === h.href + '/');
    if (!target) { G('alta', 'hreflang-404', p.url + ' apunta hreflang ' + h.lang + ' a ' + h.href + ' que no existe'); continue; }
    const back = target.hreflang.some(t => t.href === p.url && t.lang === (p.expectedLang));
    if (!back) G('alta', 'hreflang-no-reciproco', target.url + ' no devuelve el hreflang a ' + p.url);
  }
}

// ---------- salida ----------
const datos = { pages, global, inbound: Object.fromEntries(inbound), sitemapUrls };

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(datos, null, 1));
  process.exit(0);
}

/* Informe legible. Es la salida POR DEFECTO a propósito: quien ejecuta esto
   quiere saber qué está mal, no 5.000 líneas de JSON. Para encadenarlo con otra
   herramienta, `--json`; para la ficha de cada página, `--paginas`. */
const ORDEN = { critica: 0, alta: 1, media: 2, baja: 3, info: 4 };
const sinOrigen = (u) => u.replace(ORIGIN, '') || '/';

const todas = pages.flatMap((p) => p.issues.map((i) => ({ ...i, url: p.url })));
const porSev = {};
for (const i of [...todas, ...global]) porSev[i.sev] = (porSev[i.sev] || 0) + 1;

console.log('\n' + '═'.repeat(72));
console.log('  AUDITORÍA SEO DE ' + ORIGIN.replace('https://', '').toUpperCase());
console.log('═'.repeat(72));
console.log('  ' + pages.length + ' páginas publicadas · ' +
  pages.reduce((a, p) => a + p.words, 0).toLocaleString('es-ES') + ' palabras · ' +
  pages.filter((p) => !p.issues.length).length + ' sin ninguna incidencia');
const resumen = ['critica', 'alta', 'media', 'baja', 'info']
  .filter((s) => porSev[s]).map((s) => porSev[s] + ' ' + s).join(' · ');
console.log('  ' + (resumen || 'ninguna incidencia'));

if (global.length) {
  console.log('\n── DE TODO EL SITIO ' + '─'.repeat(52));
  for (const g of [...global].sort((a, b) => ORDEN[a.sev] - ORDEN[b.sev])) {
    console.log('  [' + g.sev.toUpperCase() + '] ' + g.code + ': ' + g.msg);
  }
}

if (todas.length) {
  console.log('\n── POR TIPO ' + '─'.repeat(60));
  const porCodigo = {};
  for (const i of todas) (porCodigo[i.code] = porCodigo[i.code] || []).push(i);
  const codigos = Object.entries(porCodigo)
    .sort((a, b) => ORDEN[a[1][0].sev] - ORDEN[b[1][0].sev] || b[1].length - a[1].length);
  for (const [codigo, xs] of codigos) {
    console.log('\n  [' + xs[0].sev.toUpperCase() + '] ' + codigo + '  ×' + xs.length);
    for (const x of xs) console.log('     ' + sinOrigen(x.url) + ' — ' + x.msg);
  }
} else {
  console.log('\n  Ninguna página tiene incidencias.');
}

if (process.argv.includes('--paginas')) {
  console.log('\n── FICHA DE CADA PÁGINA ' + '─'.repeat(48));
  for (const p of pages) {
    console.log('\n  ' + sinOrigen(p.url) + '   (' + p.file + ')');
    console.log('    lang=' + p.lang + ' palabras=' + p.words + ' imgs=' + p.imgs +
      ' encabezados=' + p.headCount + ' enlaces-entrantes=' + (inbound.get(new URL(p.url).pathname) ?? '?'));
    console.log('    title(' + (p.title || '').length + '): ' + p.title);
    console.log('    desc(' + (p.desc || '').length + '): ' + (p.desc || '').slice(0, 160));
    console.log('    h1: ' + (p.h1[0] || '—'));
    console.log('    canonical: ' + p.canonical);
    console.log('    hreflang: ' + (p.hreflang.map((h) => h.lang + '→' + sinOrigen(h.href)).join(' | ') || '—'));
    console.log('    datos estructurados: ' + ([...new Set(p.ldTypes)].join(', ') || '—'));
    console.log('    incidencias: ' + (p.issues.map((i) => i.sev + ':' + i.code).join(' ') || 'ninguna'));
  }
}

console.log('\n  Opciones:  --paginas  ficha de cada página   ·   --json  salida en bruto\n');
process.exit(porSev.critica || porSev.alta ? 1 : 0);
