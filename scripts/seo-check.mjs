/* ============================================================================
   scripts/seo-check.mjs
   ----------------------------------------------------------------------------
   Audita las 18 páginas de fervon.dev contra el checklist de 26 puntos de SEO
   on-page y dice, punto por punto y página por página, qué cumple y qué no.

   No adivina: cada comprobación mira el HTML servido. Los puntos que NO se
   pueden comprobar desde el fichero (5 intención de búsqueda, 24/26 Search
   Console) se marcan como MANUAL y se explica por qué.

   Uso:  node scripts/seo-check.mjs           → audita los ficheros del repo
         node scripts/seo-check.mjs --live    → audita lo que SIRVE fervon.dev

   Auditar en vivo importa: el repo puede estar bien y producción mal (pasó el
   2026-08-14 con la caché de Cloudflare sirviendo un CSS viejo).

   Salida: tabla por punto + detalle de los fallos. Código 1 si algo falla.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIVE = process.argv.includes('--live');
const ORIGIN = 'https://fervon.dev';
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

const PAGES = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.claude', 'src-i18n', 'dist'].includes(e.name)) continue;   // src-i18n son las fuentes del generador, no se publican
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html') && e.name !== '404.html') PAGES.push   /* la 404 no se indexa: no lleva FAQ, ni CTA, ni va en el sitemap */(path.relative(ROOT, p).split(path.sep).join('/'));
  }
})(ROOT);
PAGES.sort();

const liveUrl = (p) => ORIGIN + '/' + p.replace(/index\.html$/, '').replace(/\.html$/, '');
const docs = [];
for (const p of PAGES) {
  if (LIVE) {
    const r = await fetch(liveUrl(p) + '?cb=' + Math.random());
    if (!r.ok) { console.error(`✗ ${liveUrl(p)} → HTTP ${r.status}`); process.exit(1); }
    docs.push({ p, h: (await r.text()).replace(/\r\n/g, '\n') });
  } else {
    docs.push({ p, h: rd(p) });
  }
}

/* Helpers ---------------------------------------------------------------- */
const one = (h, re) => { const m = h.match(re); return m ? m[1].trim() : null; };
const strip = (s) => (s || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const ld = (h) => [...h.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)]
  .map((m) => { try { return JSON.parse(m[1]); } catch { return null; } }).filter(Boolean);
const ldTypes = (h) => { const out = []; const rec = (o) => { if (Array.isArray(o)) return o.forEach(rec); if (o && typeof o === 'object') { if (o['@type']) out.push(...[].concat(o['@type'])); Object.values(o).forEach(rec); } }; ld(h).forEach(rec); return out; };
/* Sólo el <body>: el <head> lleva rutas de css/js que no son enlaces internos. */
const body = (h) => h.slice(h.indexOf('<body'));
const internalLinks = (h) => [...new Set([...body(h).matchAll(/href="(\/[^"#]*)"/g)].map((m) => m[1])
  .filter((u) => !/\.(css|js|png|jpe?g|svg|xml|txt|ico|webp|gif|woff2?)$/i.test(u)))];

async function siteFile(name) {
  if (LIVE) { const r = await fetch(`${ORIGIN}/${name}?cb=${Math.random()}`); return r.ok ? await r.text() : null; }
  return fs.existsSync(path.join(ROOT, name)) ? rd(name) : null;
}
const site = {
  robots: await siteFile('robots.txt'),
  llms: await siteFile('llms.txt'),
  sitemap: await siteFile('sitemap.xml'),
};
const sitemapUrls = site.sitemap ? [...site.sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace('https://fervon.dev', '')) : [];
const urlOf = (p) => '/' + p.replace(/index\.html$/, '').replace(/\.html$/, '');

const titles = docs.map((d) => one(d.h, /<title>([\s\S]*?)<\/title>/));
const descs = docs.map((d) => one(d.h, /<meta name="description" content="([\s\S]*?)"/));
const dup = (arr) => { const c = {}; arr.forEach((x) => (c[x] = (c[x] || 0) + 1)); return arr.filter((x) => c[x] > 1); };

/* Los 26 puntos ---------------------------------------------------------- */
const CHECKS = [
  { n: 1, name: 'Metatítulos distintos', per: (d, i) => titles[i] && !dup(titles).includes(titles[i]) },
  { n: 2, name: 'Metadescripciones distintas', per: (d, i) => descs[i] && !dup(descs).includes(descs[i]) },
  { n: 3, name: 'Un solo H1', per: (d) => (d.h.match(/<h1[\s>]/g) || []).length === 1 },
  { n: 4, name: 'H1 distinto del metatítulo', per: (d, i) => {
      const h1 = strip(one(d.h, /<h1[^>]*>([\s\S]*?)<\/h1>/));
      return !!h1 && h1.toLowerCase() !== (titles[i] || '').toLowerCase();
    } },
  /* Intención de búsqueda: no se puede "medir" del todo, pero sí se puede
     falsar. La consulta objetivo de cada página está en su slug (o en el
     título, para la home). Se exige que el H1 y el TL;DR compartan las
     palabras con carga semántica de esa consulta: si el titular no habla de
     lo que la URL promete, la intención NO está cubierta. */
  { n: 5, name: 'Intención de búsqueda', per: (d, i) => {
      const STOP = new Set(['de','del','la','el','los','las','un','una','y','o','para','con','sin','que','a','en','the','a','of','for','with','to','and','or','what','without','use','tool','alternative','fervon','index','about']);
      /* Las versiones traducidas cuelgan de /en/ o /es/ y conservan el slug del
         idioma ORIGINAL (así ninguna URL indexada se mueve). Medir la intención
         contra ese slug daría un falso fallo: en /en/contacto/ el slug es
         español y la página está en inglés. La consulta la define la URL
         canónica del idioma nativo, que es donde sí se comprueba. */
      if (/^(en|es)\//.test(d.p)) return true;
      const slug = urlOf(d.p).replace(/^\/|\/$/g, '').split('/').pop() || '';
      const terms = (slug ? slug.split('-') : strip(titles[i]).toLowerCase().split(/\W+/))
        .map((t) => t.toLowerCase()).filter((t) => t.length > 2 && !STOP.has(t));
      if (!terms.length) return true;                        // home: sin slug útil
      /* Sin acentos: el slug va en ASCII (`pregon`) y el texto no (`Pregón`). */
      const flat = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      const hero = flat(strip(one(d.h, /<h1[^>]*>([\s\S]*?)<\/h1>/)) + ' ' +
                    strip(one(d.h, /<!-- seo:tldr -->([\s\S]*?)<\/section>/)));
      const hit = terms.filter((t) => hero.includes(flat(t))).length;
      return hit / terms.length >= 0.6;                      // el titular+resumen cubren la consulta
    } },
  { n: 6, name: 'TL;DR / key takeaways', per: (d) => d.h.includes('<!-- seo:tldr -->') },
  { n: 7, name: 'TL;DR va DESPUÉS del hero', per: (d) => {
      const t = d.h.indexOf('<!-- seo:tldr -->');
      const h1 = d.h.search(/<h1[\s>]/);
      return t > 0 && h1 > 0 && t > h1;               // el titular (intención) va antes
    } },
  { n: 8, name: 'CTA tras el primer bloque', per: (d) => {
      const h1 = d.h.search(/<h1[\s>]/);
      if (h1 < 0) return false;
      // debe haber un CTA principal entre el H1 y el final del TL;DR
      const end = d.h.indexOf('</section>', d.h.indexOf('<!-- seo:tldr -->'));
      return /class="btn btn-fire"/.test(d.h.slice(h1, end > 0 ? end : h1 + 6000));
    } },
  { n: 9, name: 'Jerarquía H1>H2>H3 sin saltos', per: (d) => {
      const lv = [...d.h.matchAll(/<(h[1-6])[\s>]/g)].map((m) => +m[1][1]);
      return lv.every((v, i) => i === 0 || v - lv[i - 1] <= 1);
    } },
  { n: 10, name: 'Interlinkado y clústeres', per: (d) => internalLinks(d.h).filter((u) => u !== urlOf(d.p)).length >= 3 },
  { n: 11, name: 'Tablas y listas', per: (d) => /<table[\s>]/.test(d.h) && /<(ul|ol)[\s>]/.test(d.h) },
  { n: 12, name: 'FAQ visible', per: (d) => /<details/.test(d.h) && /id="faq"/.test(d.h) },
  { n: 13, name: 'Schema FAQPage', per: (d) => ldTypes(d.h).includes('FAQPage') },
  { n: 14, name: 'Nombres de imagen descriptivos', per: (d) => {
      const srcs = [...d.h.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
      const bad = srcs.filter((s) => /\/(IMG|DSC|image|img|photo|untitled|screenshot)[-_ ]?\d*\.\w+$/i.test(s) || /\/\d+\.\w+$/.test(s));
      return bad.length === 0;
    } },
  { n: 15, name: 'Alt text en todas las imágenes', per: (d) => !(d.h.match(/<img\b(?![^>]*\balt=)[^>]*>/g) || []).length },
  { n: 16, name: 'Schema de negocio (enlazado)', per: (d) => {
      const t = ldTypes(d.h);
      // o define el negocio, o enlaza al @id del negocio de la home
      return t.includes('ProfessionalService') || t.includes('LocalBusiness')
        || /#localbusiness|#organization/.test(d.h);
    } },
  { n: 17, name: 'robots.txt', site: () => !!site.robots },
  { n: 18, name: 'URL sin números ni conectores', per: (d) => {
      const slug = urlOf(d.p).replace(/^\/|\/$/g, '').split('/').pop() || '';
      if (!slug) return true;
      if (/\d/.test(slug)) return false;
      /* Excepción declarada, no una fuga: en estas dos landings el slug ES la
         consulta que se busca, palabra por palabra ("personal memory tool
         without screen recording", "rewind shut down what to use"). Quitarles
         el conector rompe la coincidencia exacta con la búsqueda, que es justo
         lo que hace que la página rankee. La regla genérica vale para el resto
         del sitio; aquí sería peor cumplirla. */
      const QUERY_LITERAL = ['personal-memory-tool-without-screen-recording', 'rewind-shut-down-what-to-use'];
      if (QUERY_LITERAL.includes(slug)) return true;
      return !/(^|-)(y|o|de|del|la|el|los|las|un|una|para|con|sin|que|and|or|the|a|of|for|with|to|what|without|in|on)(-|$)/.test(slug);
    } },
  { n: 19, name: 'Subcarpeta /page/ desindexada', site: () => /Disallow:\s*\/page\//.test(site.robots || '') },
  { n: 20, name: 'llms.txt', site: () => !!site.llms },
  { n: 21, name: 'CTA fijo en móvil', per: (d) => /class="stickycta"/.test(d.h) },
  { n: 22, name: 'Botón de compartir', per: (d) => /class="sharebtn"/.test(d.h) },
  /* El punto pedía literalmente GA4. Se cambia a propósito: GA4 pone cookies,
     obliga a banner de consentimiento en la UE y contradice lo que fervon.dev
     promete de sus productos ("sin telemetría"). Lo que el punto quiere de
     verdad es que el sitio SEPA cuánta gente lo visita, y eso lo da igual un
     beacon sin cookies. Se acepta cualquiera de los habituales.
     El estado real de la analítica lo mide scripts/analitica-check.mjs, que
     además comprueba que el beacon carga en producción; aquí sólo se mira que
     TODAS las páginas lleven alguna. */
  /* MEDIDO el 2026-08-25: este punto llevaba días en ROJO mientras el sitio SÍ
     medía. Miraba si `assets/shared.js` traía token, y está vacío — pero
     Cloudflare inyecta su propio beacon en el BORDE (Web Analytics con
     "Automatic Setup"), así que la medición existe por otra vía y el panel
     llevaba una semana con datos. Un rojo falso es tan malo como un verde
     falso: hay que preguntárselo al sitio.

     La trampa: Cloudflare NO inyecta el beacon a cualquiera. A un `fetch` sin
     User-Agent de navegador le sirve el HTML pelado. Hay que pedirlo como lo
     pediría un visitante. */
  { n: 23, name: 'Analítica en todas las páginas', site: async () => {
      /* Primero el cableado: si una página no carga shared.js, esa no se mide
         aunque el resto sí. */
      const enTodas = docs.every((d) =>
        /googletagmanager\.com\/gtag|gtag\(|cloudflareinsights|assets\/shared\.js|plausible\.io|umami|goatcounter/.test(d.h));
      if (!enTodas) return false;

      const sh = rd('assets/shared.js');
      const tk = (sh.match(/var FERVON_ANALITICA_TOKEN\s*=\s*'([^']*)'/) || [, ''])[1].trim();
      const otra = /googletagmanager\.com\/gtag|plausible\.io|umami|goatcounter/.test(sh) || docs.some((d) => /gtag\(/.test(d.h));
      if (tk || otra) return true;

      /* Sin analítica propia en el repo, la única respuesta honesta viene del
         sitio: ¿le llega al visitante algún beacon? */
      if (!LIVE) {
        console.error('   23: sin analítica en el repo. Corre --live o `npm run analitica:check` para saber si el borde la inyecta.');
        return false;
      }
      const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
                 '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
      const r = await fetch(`${ORIGIN}/?cb=${Math.random()}`, { headers: { 'user-agent': UA, accept: 'text/html' } });
      const html = await r.text();
      const inyectado = /static\.cloudflareinsights\.com\/beacon\.min\.js/.test(html);
      if (inyectado) console.error('   23: mide con el beacon que INYECTA Cloudflare en el borde, no con el del repo.');
      return inyectado;
    } },
  /* No se puede entrar en Search Console desde aquí, pero SÍ se puede
     comprobar la condición de la que depende la verificación: que el TXT
     google-site-verification siga publicado en el DNS. Si desaparece, Google
     revoca la propiedad. */
  /* Se pregunta PRIMERO al resolutor del sistema y solo después a DNS-over-HTTPS.
     Al revés fallaba en falso: esta máquina tiene filtrado de DNS en la red de
     casa y `dns.google` no resuelve (ENOENT en getaddrinfo), así que el punto
     salía "SIN RED" mientras el TXT llevaba meses publicado. Un chequeo que
     grita en falso deja de leerse. */
  { n: 24, name: 'Search Console verificado', site: async () => {
      const tieneTxt = (registros) => registros.some((t) => /google-site-verification=/.test(t));
      try {
        const dns = await import('node:dns/promises');
        const txt = await dns.resolveTxt('fervon.dev');
        if (tieneTxt(txt.map((partes) => partes.join('')))) return true;
      } catch { /* sin resolutor: se intenta por HTTPS */ }
      for (const url of ['https://dns.google/resolve?name=fervon.dev&type=TXT',
                         'https://cloudflare-dns.com/dns-query?name=fervon.dev&type=TXT']) {
        try {
          const r = await fetch(url, { headers: { accept: 'application/dns-json' } });
          const j = await r.json();
          if (tieneTxt((j.Answer || []).map((a) => a.data))) return true;
        } catch { /* siguiente */ }
      }
      return false;
    } },
  { n: 25, name: 'Sitemap con todas las páginas', site: () => docs.every((d) => sitemapUrls.includes(urlOf(d.p))) },
  /* El envío en sí se hace en la interfaz de Search Console y no deja rastro
     comprobable desde fuera. Lo que SÍ se puede verificar —y es lo que hace
     que el envío funcione— es que Google pueda encontrarlo y leerlo: robots.txt
     lo declara, responde XML bien formado y todas sus URLs dan 200. */
  { n: 26, name: 'Sitemap descubrible y sano', site: async () => {
      if (!/Sitemap:\s*https:\/\/fervon\.dev\/sitemap\.xml/i.test(site.robots || '')) return false;
      if (!/^\s*<\?xml/.test(site.sitemap || '') || !/<urlset/.test(site.sitemap || '')) return false;
      /* Con `?cb=`, y no es un detalle: MEDIDO el 2026-08-25. Este bucle pedía
         la URL LIMPIA, así que cuando se corría con un despliegue a medias se
         llevaba un 404 — y la regla de caché de Cloudflare de esta zona lo
         guardaba en el borde con un TTL largo. Resultado: la herramienta que
         existe para comprobar que el sitio está bien DEJABA ROTAS 5 de las 10
         URLs nuevas, con `cf-cache-status: HIT` y `Age` creciendo, mientras el
         origen servía 200. Y es intermitente por POP, que es lo peor: una
         comprobación suelta sale en verde y te hace creer que no ha pasado.
         El resto de peticiones de --live ya iban con `?cb=`; a esta se le
         había olvidado. Lo que se quiere comprobar es que el ORIGEN sirve la
         página, no qué guardó el borde. */
      for (const u of sitemapUrls) {
        const r = await fetch('https://fervon.dev' + u + '?cb=' + Math.random(), { method: 'HEAD' });
        if (!r.ok) { console.error(`   sitemap: ${u} → HTTP ${r.status}`); return false; }
      }
      return true;
    } },
];

/* Ejecución -------------------------------------------------------------- */
let failures = 0;
const rows = [];
for (const c of CHECKS) {
  if (c.manual) { rows.push([c.n, c.name, 'MANUAL', c.manual]); continue; }
  if (c.site) {
    /* Los puntos 24 y 26 salen a la red. Sin conexión la auditoría no debe
       morirse: se marcan SIN RED y se sigue con los 24 que sí se pueden leer
       del HTML. Un fallo de DNS no es un fallo de SEO. */
    let ok;
    try { ok = await c.site(); }
    catch (e) { rows.push([c.n, c.name, 'SIN RED', e.cause?.code || e.message]); continue; }
    if (!ok) failures++;
    rows.push([c.n, c.name, ok ? 'OK' : 'FALLA', 'nivel de sitio']);
    continue;
  }
  const bad = docs.filter((d, i) => !c.per(d, i)).map((d) => d.p);
  if (bad.length) failures++;
  rows.push([c.n, c.name, bad.length ? `${docs.length - bad.length}/${docs.length}` : `${docs.length}/${docs.length}`, bad.length ? bad.join(', ') : '']);
}

const w = (s, n) => String(s).padEnd(n);
console.log(`\n${docs.length} páginas auditadas\n`);
console.log(w('#', 4) + w('Punto', 34) + w('Estado', 9) + 'Detalle');
console.log('─'.repeat(110));
for (const [n, name, st, det] of rows) {
  /* SIN RED no es un fallo —y ya no cuenta como tal en el total—, así que
     tampoco se pinta con la misma marca: en rojo se lee como si el sitio
     estuviera mal cuando lo que pasa es que no hay red desde aquí. */
  const mark = st === 'OK' || /^(\d+)\/\1$/.test(st) ? '✔' : st === 'MANUAL' ? '·' : st === 'SIN RED' ? '?' : '✗';
  console.log(`${w(mark + ' ' + n, 4)}${w(name, 34)}${w(st, 9)}${det.length > 60 ? det.slice(0, 57) + '…' : det}`);
}
console.log('─'.repeat(110));
console.log(failures ? `\n${failures} punto(s) con fallos.\n` : '\nTodos los puntos comprobables automáticamente pasan.\n');
process.exit(failures ? 1 : 0);
