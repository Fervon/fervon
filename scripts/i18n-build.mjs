/* ============================================================================
   scripts/i18n-build.mjs
   ----------------------------------------------------------------------------
   Convierte fervon.dev de "bilingüe por JavaScript" a MULTIIDIOMA DE VERDAD.

   EL PROBLEMA (medido el 2026-08-14): 17 de las 18 páginas guardaban la
   traducción en atributos `data-en`/`data-es` que un script intercambiaba al
   pulsar un botón. Para un buscador eso NO es contenido: el segundo idioma
   vive en atributos, no en texto, así que Google sólo indexaba UNA versión por
   página y la otra era invisible. Y no había ni un hreflang. La mitad del
   contenido escrito no rankeaba en ninguna parte.

   LO QUE HACE: una página FÍSICA por idioma, monolingüe, con el texto real en
   el HTML, enlazadas con hreflang recíproco.

   REGLA DE ORO — NINGUNA URL EXISTENTE SE MUEVE. Lo de hoy ya está indexado
   (las de Trace son keyword pages con tráfico), así que se queda donde está y
   las traducciones cuelgan de un prefijo:
     · página hoy en español → /en/<ruta> y /zh/<ruta>
     · página hoy en inglés  → /es/<ruta> y /zh/<ruta>
   Asimétrico a propósito: cero riesgo para lo que ya posiciona.

   POR QUÉ USA UN NAVEGADOR: el intercambio de idioma no se puede hacer con
   expresiones regulares. Los titulares llevan etiquetas dentro
   (`data-en="See every <span>span</span>…"`) y hay elementos donde el atributo
   traduce el ALT de una imagen, no su contenido (`data-i18n-attr="alt"`). Se
   usa el DOMParser de Chrome, que parsea igual que el navegador del visitante
   y NO ejecuta los scripts de la página.

   Uso:  node scripts/i18n-build.mjs           genera
         node scripts/i18n-build.mjs --check   informa sin escribir
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const ORIGIN = 'https://fervon.dev';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const LANGS = {
  es: { htmlLang: 'es', hreflang: 'es', ogLocale: 'es_ES', label: 'ES', navLabel: 'Idioma' },
  en: { htmlLang: 'en', hreflang: 'en', ogLocale: 'en_US', label: 'EN', navLabel: 'Language' },
  zh: { htmlLang: 'zh-Hans', hreflang: 'zh-Hans', ogLocale: 'zh_CN', label: '中文', navLabel: '语言' },
};
const X_DEFAULT = 'es';

const PAGES = [
  { src: 'index.html', url: '/', lang: 'es' },
  { src: 'contacto/index.html', url: '/contacto/', lang: 'es' },
  { src: 'claudescope/index.html', url: '/claudescope/', lang: 'es' },
  { src: 'inferbench/index.html', url: '/inferbench/', lang: 'es' },
  { src: 'launchpad/index.html', url: '/launchpad/', lang: 'es' },
  { src: 'lookspan/index.html', url: '/lookspan/', lang: 'es' },
  { src: 'pregon/index.html', url: '/pregon/', lang: 'es' },
  { src: 'regenta/index.html', url: '/regenta/', lang: 'es' },
  { src: 'trace/index.html', url: '/trace/', lang: 'es' },
  { src: 'veredicto/index.html', url: '/veredicto/', lang: 'es' },
  { src: 'veredicto/report.html', url: '/veredicto/report', lang: 'en' },
  { src: 'trace/limitless-alternative.html', url: '/trace/limitless-alternative', lang: 'en' },
  { src: 'trace/microsoft-recall-alternative.html', url: '/trace/microsoft-recall-alternative', lang: 'en' },
  { src: 'trace/personal-memory-tool-without-screen-recording.html', url: '/trace/personal-memory-tool-without-screen-recording', lang: 'en' },
  { src: 'trace/rewind-ai-alternative.html', url: '/trace/rewind-ai-alternative', lang: 'en' },
  { src: 'trace/rewind-alternative-windows.html', url: '/trace/rewind-alternative-windows', lang: 'en' },
  { src: 'trace/rewind-shut-down-what-to-use.html', url: '/trace/rewind-shut-down-what-to-use', lang: 'en' },
  { src: 'trace/screenpipe-alternative.html', url: '/trace/screenpipe-alternative', lang: 'en' },
];

const urlFor = (page, lang) => (lang === page.lang ? page.url : `/${lang}${page.url}`);
const fileFor = (page, lang) => {
  const u = urlFor(page, lang);
  return (u.endsWith('/') ? u.slice(1) + 'index.html' : u.slice(1) + '.html');
};

/* El chino sólo se genera si existe su diccionario; si no, se avisa en vez de
   publicar páginas a medio traducir. */
let dictZh = null;
const dictPath = path.join(ROOT, 'scripts', 'i18n-zh.json');
if (fs.existsSync(dictPath)) dictZh = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

/* title/description/og por idioma. NO viven en atributos data-*, así que sin
   esta tabla las páginas generadas heredaban el meta del idioma original — el
   peor error posible, porque el título es justo lo que muestra Google. */
const METAS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'i18n-meta.json'), 'utf8'));

/* Cadenas sueltas que tampoco llevan atributo (el h1 para lectores de pantalla
   de la home, los aria-label que escribe el generador de bloques…). */
const SUELTAS = {
  en: {
    'Fervon — estudio de software autónomo. Forjado al rojo vivo.': 'Fervon — autonomous software studio. Forged red-hot.',
    'Compartir esta página': 'Share this page',
    'Cambiar idioma / Switch language': 'Switch language',
    'Menú': 'Menu',
  },
  es: {
    'Share this page': 'Compartir esta página',
    'Menu': 'Menú',
  },
};

const LANGS_ACTIVOS = Object.keys(LANGS).filter((l) => l !== 'zh' || dictZh);
if (!dictZh) console.log('· Sin scripts/i18n-zh.json: se genera ES/EN. El chino entra cuando exista el diccionario.\n');

/* Cuántas cadenas traducibles tiene cada página: si son 0, no hay versión en
   el otro idioma escrita y generarla sería duplicar contenido en el idioma
   equivocado (le pasa a /veredicto/report, que sólo existe en inglés). */
const traducibles = (html) => (html.match(/ data-(?:en|es)="/g) || []).length;

/* Se lee TODO el material de partida ANTES de escribir nada. Sin esto había un
   bug real: los originales se reescriben en la misma pasada (perdiendo sus
   data-*), así que al calcular el mapa de enlaces de una página posterior las
   anteriores ya parecían "sin traducción" y los enlaces de la versión inglesa
   se quedaban apuntando al español. */
const FUENTE = new Map(PAGES.map((p) => {
  const html = fs.readFileSync(path.join(ROOT, p.src), 'utf8').replace(/\r\n/g, '\n');
  return [p.src, { html, n: (html.match(/ data-(?:en|es)="/g) || []).length }];
}));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const pg = await browser.newPage();
await pg.goto('about:blank');

async function transformar(srcHtml, cfg) {
  return pg.evaluate((html, cfg) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');   // no ejecuta scripts

    /* 1. Intercambio de idioma. */
    for (const el of doc.querySelectorAll('[data-en],[data-es]')) {
      const valor = el.getAttribute('data-en') ?? el.getAttribute('data-es');
      if (cfg.swap) {
        const attrDestino = el.getAttribute('data-i18n-attr');
        if (attrDestino) el.setAttribute(attrDestino, cfg.dict ? (cfg.dict[el.getAttribute(attrDestino)] ?? valor) : valor);
        else if (cfg.dict) {
          const t = cfg.dict[el.innerHTML.trim()] ?? cfg.dict[valor.trim()];
          if (t) el.innerHTML = t;
        } else el.innerHTML = valor;
      }
      el.removeAttribute('data-en'); el.removeAttribute('data-es'); el.removeAttribute('data-i18n-attr');
    }

    /* 1b. Cadenas sin atributo data-*: h1 para lectores de pantalla, aria-label… */
    if (cfg.swap && cfg.sueltas) {
      const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
      const textos = [];
      while (walker.nextNode()) textos.push(walker.currentNode);
      for (const t of textos) {
        const v = cfg.sueltas[t.nodeValue.trim()];
        if (v) t.nodeValue = t.nodeValue.replace(t.nodeValue.trim(), v);
      }
      for (const el of doc.querySelectorAll("[aria-label]")) {
        const v = cfg.sueltas[el.getAttribute("aria-label").trim()];
        if (v) el.setAttribute("aria-label", v);
      }
    }

    /* 2. Idioma del documento. */
    doc.documentElement.setAttribute('lang', cfg.htmlLang);

    /* 3. Metas propias del idioma. */
    if (cfg.meta) {
      const set = (sel, attr, v) => { const e = doc.querySelector(sel); if (e && v) e.setAttribute(attr, v); };
      if (cfg.meta.title) doc.querySelector('title').textContent = cfg.meta.title;
      set('meta[name="description"]', 'content', cfg.meta.desc);
      set('meta[property="og:title"]', 'content', cfg.meta.ogTitle);
      set('meta[property="og:description"]', 'content', cfg.meta.ogDesc);
    }

    /* 4. canonical / og:url / og:locale apuntan a ESTA versión. */
    const can = doc.querySelector('link[rel="canonical"]');
    if (can) can.setAttribute('href', cfg.self);
    const ogu = doc.querySelector('meta[property="og:url"]');
    if (ogu) ogu.setAttribute('content', cfg.self);
    const ogl = doc.querySelector('meta[property="og:locale"]');
    if (ogl) ogl.setAttribute('content', cfg.ogLocale);

    /* 5. hreflang recíproco + x-default, justo tras el canonical. */
    for (const v of doc.querySelectorAll('link[rel="alternate"][hreflang]')) v.remove();
    if (can) {
      let ref = can;
      for (const a of cfg.alts) {
        const l = doc.createElement('link');
        l.setAttribute('rel', 'alternate'); l.setAttribute('hreflang', a.hreflang); l.setAttribute('href', a.href);
        ref.after(l); ref = l;
      }
    }

    /* 6. Assets relativos → absolutos: en /en/claudescope/ un href="index.css"
          resolvería a /en/claudescope/index.css, que no existe. */
    for (const el of doc.querySelectorAll('link[href],script[src]')) {
      const at = el.hasAttribute('href') ? 'href' : 'src';
      const v = el.getAttribute(at);
      if (!v || /^(https?:|\/|#|data:|mailto:)/.test(v)) continue;
      el.setAttribute(at, cfg.dir.replace(/\/$/, '') + '/' + v);
    }

    /* 7. Enlaces internos → misma versión de idioma. */
    for (const a of doc.querySelectorAll('a[href^="/"]')) {
      const href = a.getAttribute('href');
      const [ruta, hash] = href.split('#');
      const destino = cfg.mapa[ruta] || cfg.mapa[ruta + '/'] || cfg.mapa[ruta.replace(/\/$/, '')];
      if (destino) a.setAttribute('href', destino + (hash ? '#' + hash : ''));
    }

    /* 8. Selector de idioma: de botón que intercambia texto a ENLACES reales. */
    const btn = doc.querySelector('#lang');
    if (btn) {
      const nav = doc.createElement('nav');
      nav.className = 'langseg'; nav.id = 'lang';
      nav.setAttribute('aria-label', cfg.navLabel);
      for (const o of cfg.opciones) {
        if (o.actual) {
          const s = doc.createElement('span');
          s.className = 'langopt on'; s.setAttribute('aria-current', 'true'); s.textContent = o.label;
          nav.append(s);
        } else {
          const a = doc.createElement('a');
          a.className = 'langopt'; a.href = o.href; a.hreflang = o.hreflang;
          a.setAttribute('lang', o.htmlLang); a.textContent = o.label;
          nav.append(a);
        }
      }
      btn.replaceWith(nav);
    }

    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML + '\n';
  }, srcHtml, cfg);
}

const generadas = [];
const saltadas = [];

for (const page of PAGES) {
  const { html: srcHtml, n: nTrad } = FUENTE.get(page.src);

  for (const lang of LANGS_ACTIVOS) {
    const esOriginal = lang === page.lang;
    /* Sin traducción escrita no se genera: duplicar en el idioma equivocado
       es peor que no tener la página. */
    if (!esOriginal && lang !== 'zh' && nTrad === 0) { saltadas.push(`${urlFor(page, lang)} (no hay texto traducido)`); continue; }

    const alts = LANGS_ACTIVOS
      .filter((l) => l === page.lang || nTrad > 0)
      .map((l) => ({ hreflang: LANGS[l].hreflang, href: ORIGIN + urlFor(page, l) }));
    alts.push({ hreflang: 'x-default', href: ORIGIN + urlFor(page, nTrad > 0 ? X_DEFAULT : page.lang) });

    const mapa = {};
    for (const p of PAGES) mapa[p.url] = urlFor(p, (FUENTE.get(p.src).n > 0 || p.lang === lang) ? lang : p.lang);

    const dir = path.posix.dirname(page.url.endsWith('/') ? page.url + 'x' : page.url);
    const cfg = {
      swap: !esOriginal,
      dict: lang === 'zh' ? dictZh : null,
      htmlLang: LANGS[lang].htmlLang,
      ogLocale: LANGS[lang].ogLocale,
      navLabel: LANGS[lang].navLabel,
      self: ORIGIN + urlFor(page, lang),
      alts, mapa, dir,
      meta: (lang === 'zh' ? (dictZh && dictZh.__meta && dictZh.__meta[page.url]) : (METAS[page.url] && METAS[page.url][lang])) || null,
      sueltas: SUELTAS[lang] || {},
      opciones: alts.filter((a) => a.hreflang !== 'x-default').map((a) => {
        const l = Object.keys(LANGS).find((k) => LANGS[k].hreflang === a.hreflang);
        return { label: LANGS[l].label, href: urlFor(page, l), hreflang: a.hreflang, htmlLang: LANGS[l].htmlLang, actual: l === lang };
      }),
    };

    const html = await transformar(srcHtml, cfg);
    const out = esOriginal ? page.src : fileFor(page, lang);
    if (!CHECK) {
      fs.mkdirSync(path.join(ROOT, path.dirname(out)), { recursive: true });
      fs.writeFileSync(path.join(ROOT, out), html);
    }
    generadas.push({ out, lang, original: esOriginal, kb: Math.round(html.length / 1024) });
  }
}

await browser.close();

const nuevas = generadas.filter((g) => !g.original);
console.log(`${generadas.length} páginas ${CHECK ? 'se escribirían' : 'escritas'} — ${nuevas.length} nuevas, ${generadas.length - nuevas.length} originales actualizadas`);
for (const g of nuevas) console.log(`  + ${g.out.padEnd(58)} ${g.kb} KB`);
if (saltadas.length) { console.log('\nSaltadas a propósito:'); saltadas.forEach((s) => console.log('  · ' + s)); }
