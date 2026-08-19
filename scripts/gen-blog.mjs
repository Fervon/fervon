/* ============================================================================
   scripts/gen-blog.mjs
   ----------------------------------------------------------------------------
   Escribe src-i18n/blog/ (índice + un artículo por entrada de blog-articles.mjs)
   a partir de los bloques declarados allí. Después, scripts/i18n-build.mjs
   genera la versión española en la raíz y la inglesa en /en/.

   POR QUÉ UN GENERADOR Y NO HTML A MANO: cada página tiene que cumplir los 26
   puntos que audita scripts/seo-check.mjs —TL;DR después del H1, un CTA antes
   de que acabe el resumen, tabla + lista, FAQ visible con su FAQPage, jerarquía
   de encabezados sin saltos, tres enlaces internos, barra fija y botón de
   compartir—. Escrito a mano se incumple uno cada vez que se añade un artículo;
   generado, se cumplen por construcción.

   Uso:  node scripts/gen-blog.mjs
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARTICLES, NOVEDADES } from './blog-articles.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://fervon.dev';
const V = 'v=20260819a';

/* Las portadas van con ?v=<hash del fichero>, y no es cosmético: fervon.dev va
   tras el proxy de Cloudflare, que cachea por URL COMPLETA con max-age=14400.
   Al rediseñar una portada el nombre no cambia, así que sin el hash el borde
   sigue sirviendo la vieja durante horas —y las redes sociales la guardan como
   og:image mucho más— mientras en local se ve la nueva. Es el mismo fallo que
   dejó 18 páginas sin maquetar en agosto, pero con imágenes.
   bump-cache-buster.mjs solo mira css/js, así que esto tiene que ir aquí. */
const hashFichero = (rel) => {
  const f = path.join(ROOT, rel.replace(/^\//, ''));
  if (!fs.existsSync(f)) return V;
  const b = fs.readFileSync(f);
  let h = 5381;
  for (let i = 0; i < b.length; i += 7) h = ((h * 33) ^ b[i]) >>> 0;
  return 'v=' + h.toString(36);
};
const portadaURL = (slug) => {
  const rel = `/assets/blog/${slug}.jpg`;
  return `${rel}?${hashFichero(rel)}`;
};

/* El nav y el pie son bloques compartidos: se toman de contacto para que un
   cambio ahí llegue solo al blog al regenerar, en vez de quedar desincronizado. */
const contacto = fs.readFileSync(path.join(ROOT, 'src-i18n/contacto/index.html'), 'utf8').replace(/\r\n/g, '\n');
const NAV_BASE = contacto.match(/ {2}<nav><div class="bar">[\s\S]*?<\/div><\/nav>\n/)[0]
  .replace('<a class="cta" href="#top" aria-current="page" data-en="Let\'s talk">Hablemos</a>',
           '<a class="cta" href="/contacto/" data-en="Let\'s talk">Hablemos</a>');
const FOOTER = contacto.match(/ {2}<footer><div class="wrap">[\s\S]*?<\/div><\/footer>\n/)[0];

/* El enlace al blog solo se inyecta si contacto no lo trae ya: en cuanto se
   añadió allí, inyectarlo a ciegas dejaba «Taller» DOS VECES en el nav. */
const NAV = NAV_BASE.includes('href="/blog/"') ? NAV_BASE
  : NAV_BASE.replace('<a href="/about/" data-en="About">Sobre Fervon</a>',
      '<a href="/blog/" data-en="News">Noticias</a>\n      <a href="/about/" data-en="About">Sobre Fervon</a>');
const navDe = (activa) => NAV.replace(`<a href="${activa}"`, `<a href="${activa}" aria-current="page"`);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/* Comilla SIMPLE cuando el inglés lleva etiquetas: con comilla doble el
   atributo se corta en el primer href y el idioma sale roto en silencio. */
const t = (par) => {
  const en = par.en, es = par.es;
  return /[<>"]/.test(en) ? `data-en='${en.replace(/&/g, '&amp;').replace(/'/g, '&#39;')}'>${es}`
                          : `data-en="${esc(en)}">${es}`;
};
const FECHA_ES = { '01': 'enero', '02': 'febrero', '03': 'marzo', '04': 'abril', '05': 'mayo', '06': 'junio', '07': 'julio', '08': 'agosto', '09': 'septiembre', 10: 'octubre', 11: 'noviembre', 12: 'diciembre' };
const FECHA_EN = { '01': 'January', '02': 'February', '03': 'March', '04': 'April', '05': 'May', '06': 'June', '07': 'July', '08': 'August', '09': 'September', 10: 'October', 11: 'November', 12: 'December' };
const fechaLarga = (iso, en) => {
  const [y, m, d] = iso.split('-');
  return en ? `${FECHA_EN[m]} ${+d}, ${y}` : `${+d} de ${FECHA_ES[m]} de ${y}`;
};

/* ── Bloques del cuerpo ──────────────────────────────────────────────────── */
const bloque = (b) => {
  switch (b.k) {
    case 'h2': return `      <h2 ${t(b)}</h2>`;
    case 'h3': return `      <h3 ${t(b)}</h3>`;
    case 'p': return `      <p ${t(b)}</p>`;
    case 'quote': return `      <blockquote class="pull"><p ${t(b)}</p></blockquote>`;
    case 'ul': return `      <ul class="bullets">\n${b.items.map((i) => `        <li ${t(i)}</li>`).join('\n')}\n      </ul>`;
    case 'fig': return `      <figure class="diag">\n        ${b.svg.split('\n').join('\n        ')}\n        <figcaption ${t(b)}</figcaption>\n      </figure>`;
    case 'table': return `      <div class="tablewrap">
        <table class="seotable">
          <caption class="vh" ${t(b.caption)}</caption>
          <thead><tr>${b.head.map((h) => `<th ${t(h)}</th>`).join('')}</tr></thead>
          <tbody>
${b.rows.map((r) => `            <tr><th ${t(r[0])}</th>${r.slice(1).map((c) => `<td ${t(c)}</td>`).join('')}</tr>`).join('\n')}
          </tbody>
        </table>
      </div>`;
    default: throw new Error('bloque desconocido: ' + b.k);
  }
};

/* ── Piezas comunes a toda página del blog ───────────────────────────────── */
const tldrSec = (items, cta) => `    <!-- seo:tldr -->
    <section class="sec seosec" id="resumen" aria-labelledby="resumen-h">
      <div class="wrap">
        <div class="tldr reveal">
          <h2 id="resumen-h" ${t({ es: 'En 30 segundos', en: 'In 30 seconds' })}</h2>
          <ul>
${items.map((i) => `        <li ${t(i)}</li>`).join('\n')}
          </ul>
      <div class="cta-row s-tldrcta">
        <a class="btn btn-fire" href="${cta.href}" ${t(cta)}</a>
      </div>
        </div>
      </div>
    </section>`;

const faqSec = (faq) => `    <section class="sec seosec" id="faq" aria-labelledby="faq-h">
      <div class="wrap">
        <div class="center reveal">
          <span class="eye" data-en="FAQ">FAQ</span>
          <h2 id="faq-h" ${t({ es: 'Preguntas frecuentes', en: 'Frequently asked questions' })}</h2>
        </div>
        <div class="faq reveal">
${faq.map((f) => `        <details>
          <summary ${t(f.q)}</summary>
          <p ${t(f.a)}</p>
        </details>`).join('\n')}
        </div>
      </div>
    </section>`;

const shareBlock = () => `      <div class="fv-share">
        <button type="button" class="sharebtn" aria-label="Compartir esta página">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
          <span ${t({ es: 'Compartir', en: 'Share' })}</span>
        </button>
        <span class="sharemsg" role="status" aria-live="polite"></span>
      </div>`;

const sticky = (b, s, href, cta) => `  <!-- seo:sticky -->
  <div class="stickycta">
    <div class="sct">
      <b ${t(b)}</b>
      <span ${t(s)}</span>
    </div>
    <a class="btn btn-fire" href="${href}" ${t(cta)}</a>
  </div>
`;

const head = ({ url, title, desc, ogTitle, ogDesc, img, jsonld, tipo = 'website' }) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${ORIGIN}${url}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta name="author" content="Fervon" />
  <meta name="theme-color" content="#0E0B0A" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="/assets/favicon-32.png" sizes="32x32" type="image/png" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />

  <meta property="og:type" content="${tipo}" />
  <meta property="og:site_name" content="Fervon" />
  <meta property="og:title" content="${esc(ogTitle)}" />
  <meta property="og:description" content="${esc(ogDesc)}" />
  <meta property="og:url" content="${ORIGIN}${url}" />
  <meta property="og:image" content="${ORIGIN}${img}" />
  <meta name="twitter:image" content="${ORIGIN}${img}" />
  <meta property="og:locale" content="es_ES" />
  <meta name="twitter:card" content="summary_large_image" />

  <script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
  </script>

  <link rel="preload" href="/assets/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin="">
  <link rel="stylesheet" href="/index.css?${V}" />
  <link rel="stylesheet" href="/assets/blog.css?${V}" />
  <link rel="stylesheet" href="/assets/shared.css?${V}" />
</head>`;

/* ══════════════════════════════════════════════════════════════════════════
   ARTÍCULOS
   ══════════════════════════════════════════════════════════════════════════ */
const orgRef = { '@id': `${ORIGIN}/#organization` };

for (const a of ARTICLES) {
  const url = `/blog/${a.slug}/`;
  const img = portadaURL(a.slug);
  const rel = a.relacionados.map((s) => ARTICLES.find((x) => x.slug === s)).filter(Boolean);

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${ORIGIN}${url}#post`,
        headline: a.titulo.es,
        description: a.desc.es,
        url: ORIGIN + url,
        datePublished: a.fecha,
        dateModified: a.fecha,
        inLanguage: 'es',
        image: ORIGIN + img,
        wordCount: a.cuerpo.filter((b) => b.k === 'p').reduce((n, b) => n + b.es.split(/\s+/).length, 0),
        author: { '@id': `${ORIGIN}/#jonathan` },
        publisher: orgRef,
        isPartOf: { '@id': `${ORIGIN}/blog/#blog` },
        mainEntityOfPage: { '@id': `${ORIGIN}${url}#post` },
      },
      { '@type': 'Person', '@id': `${ORIGIN}/#jonathan`, name: 'Jonathan Martín', url: `${ORIGIN}/about/`, worksFor: orgRef },
      {
        '@type': 'BreadcrumbList',
        '@id': `${ORIGIN}${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Fervon', item: ORIGIN + '/' },
          { '@type': 'ListItem', position: 2, name: 'Noticias', item: `${ORIGIN}/blog/` },
          { '@type': 'ListItem', position: 3, name: a.titulo.es, item: ORIGIN + url },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${ORIGIN}${url}#faq`,
        mainEntity: a.faq.map((f) => ({ '@type': 'Question', name: f.q.es, acceptedAnswer: { '@type': 'Answer', text: f.a.es.replace(/<[^>]+>/g, '') } })),
      },
    ],
  };

  const html = `${head({ url, title: a.metaTitulo.es, desc: a.desc.es, ogTitle: a.metaTitulo.es, ogDesc: a.desc.es, img, jsonld, tipo: 'article' })}
<body class="blog-page">
  <a class="skip" href="#top" ${t({ es: 'Saltar al contenido', en: 'Skip to content' })}</a>

${navDe('/blog/')}
  <main class="wrap">

    <header class="chero bhero" id="top">
      <p class="bmeta">
        <a href="/blog/" ${t({ es: 'Noticias', en: 'News' })}</a>
        <span aria-hidden="true">·</span>
        <time datetime="${a.fecha}" ${t({ es: fechaLarga(a.fecha, false), en: fechaLarga(a.fecha, true) })}</time>
        <span aria-hidden="true">·</span>
        <span ${t({ es: `${a.minutos} min de lectura`, en: `${a.minutos} min read` })}</span>
      </p>
      <h1 ${t(a.titulo)}</h1>
      <p class="lead" ${t(a.lead)}</p>
    </header>

    <figure class="bcover reveal">
      <img src="${img}" width="1200" height="630" alt="${esc(a.titulo.es)} — Fervon" data-en="${esc(a.titulo.en)} — Fervon" data-i18n-attr="alt" fetchpriority="high" decoding="async">
      <figcaption ${t(a.figuraHero)}</figcaption>
    </figure>

${tldrSec(a.tldr, { href: '#cuerpo', es: 'Ir al artículo', en: 'Read the article' })}

    <section class="sec" id="cuerpo">
      <article class="prose reveal">
${a.cuerpo.map(bloque).join('\n\n')}
      </article>
    </section>

${faqSec(a.faq)}

    <!-- seo:related -->
    <section class="sec seosec" id="mas" aria-labelledby="mas-h">
      <div class="wrap">
        <div class="center reveal">
          <span class="eye" ${t({ es: 'Sigue leyendo', en: 'Keep reading' })}</span>
          <h2 id="mas-h" ${t({ es: 'Más noticias', en: 'More news' })}</h2>
        </div>
        <div class="bcards reveal">
${rel.map((r) => `          <a class="bcard" href="/blog/${r.slug}/">
            <img src="${portadaURL(r.slug)}" width="1200" height="630" alt="${esc(r.titulo.es)}" data-en="${esc(r.titulo.en)}" data-i18n-attr="alt" loading="lazy" decoding="async">
            <span class="bc-t" ${t(r.titulo)}</span>
            <span class="bc-d" ${t(r.desc)}</span>
          </a>`).join('\n')}
          <a class="bcard bcard-cta" href="/about/">
            <span class="bc-t" ${t({ es: 'Quién escribe esto', en: 'Who writes this' })}</span>
            <span class="bc-d" ${t({ es: 'Fervon es el estudio de software autónomo de Jonathan Martín. Una persona y una flota de agentes.', en: 'Fervon is Jonathan Martín\'s autonomous software studio. One person and a fleet of agents.' })}</span>
          </a>
        </div>
${shareBlock()}
      </div>
    </section>

  </main>

${sticky({ es: 'Esto sale de trabajar así de verdad', en: 'This comes from actually working this way' },
         { es: 'Herramientas open source, self-serve y sin dejar el correo', en: 'Open-source tools, self-serve, no email gate' },
         '/#productos', { es: 'Ver productos', en: 'See the products' })}
${FOOTER}
  <script src="/assets/shared.js?${V}" defer></script>
</body>
</html>
`;

  const dir = path.join(ROOT, 'src-i18n/blog', a.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`  + src-i18n/blog/${a.slug}/index.html   ${Math.round(html.length / 1024)} KB`);
}

/* ══════════════════════════════════════════════════════════════════════════
   ÍNDICE DEL BLOG
   ══════════════════════════════════════════════════════════════════════════ */
const idxJsonld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Blog',
      '@id': `${ORIGIN}/blog/#blog`,
      name: 'Noticias de Fervon',
      description: 'Novedades de los proyectos de Fervon y artículos sobre cómo se construye software dirigiendo flotas de agentes de IA.',
      url: `${ORIGIN}/blog/`,
      inLanguage: 'es',
      publisher: orgRef,
      author: { '@id': `${ORIGIN}/#jonathan` },
      blogPost: ARTICLES.map((a) => ({
        '@type': 'BlogPosting',
        '@id': `${ORIGIN}/blog/${a.slug}/#post`,
        headline: a.titulo.es,
        description: a.desc.es,
        url: `${ORIGIN}/blog/${a.slug}/`,
        datePublished: a.fecha,
        image: `${ORIGIN}${portadaURL(a.slug)}`,
        author: { '@id': `${ORIGIN}/#jonathan` },
        publisher: orgRef,
      })),
    },
    { '@type': 'Person', '@id': `${ORIGIN}/#jonathan`, name: 'Jonathan Martín', url: `${ORIGIN}/about/`, worksFor: orgRef },
    {
      '@type': 'BreadcrumbList',
      '@id': `${ORIGIN}/blog/#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Fervon', item: ORIGIN + '/' },
        { '@type': 'ListItem', position: 2, name: 'Noticias', item: `${ORIGIN}/blog/` },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${ORIGIN}/blog/#faq`,
      mainEntity: [
        { '@type': 'Question', name: '¿De qué va este blog?', acceptedAnswer: { '@type': 'Answer', text: 'De dos cosas: las novedades de cada proyecto de Fervon según van saliendo, y artículos de fondo sobre cómo se construye software dirigiendo flotas de agentes de IA. Nada de relleno: solo se publica lo que se ha medido trabajando.' } },
        { '@type': 'Question', name: '¿Cada cuánto se publica?', acceptedAnswer: { '@type': 'Answer', text: 'Cuando hay algo medido que contar. Es un estudio de una persona, así que se prefiere un artículo útil al mes que cuatro de relleno a la semana.' } },
        { '@type': 'Question', name: '¿Hay que suscribirse para leerlo?', acceptedAnswer: { '@type': 'Answer', text: 'No. No hay muro, ni registro, ni ventana pidiendo el correo. Todo el contenido está abierto, igual que la mayoría del código.' } },
        { '@type': 'Question', name: '¿Quién escribe los artículos?', acceptedAnswer: { '@type': 'Answer', text: 'Jonathan Martín, fundador y única persona de Fervon. Los artículos cuentan su método real de trabajo, con los límites y las cosas que salieron mal incluidas.' } },
      ],
    },
  ],
};

const idx = `${head({
  url: '/blog/',
  title: 'Noticias · Fervon',
  desc: 'Novedades de Trace, Veredicto, Lookspan, ClaudeScope, inferbench y launchpad, y artículos sobre cómo se construye software con flotas de agentes de IA.',
  ogTitle: 'Noticias · Fervon',
  ogDesc: 'Novedades de los proyectos de Fervon y el método con el que se construyen: flotas de agentes de IA, medidas y revisadas.',
  img: portadaURL('noticias'),
  jsonld: idxJsonld,
  tipo: 'website',
})}
<body class="blog-page blog-index">
  <a class="skip" href="#top" ${t({ es: 'Saltar al contenido', en: 'Skip to content' })}</a>

${navDe('/blog/')}
  <main class="wrap">

    <header class="chero" id="top">
      <h1 ${t({ es: 'Noticias. <span class="grad">Qué sale del taller.</span>', en: 'News. <span class="grad">What comes out of the workshop.</span>' })}</h1>
      <p ${t({ es: 'Las novedades de cada proyecto según van saliendo, y el método con el que se construyen. Se publica lo que se ha medido trabajando, no lo que suena bien.', en: 'Each project&#39;s releases as they ship, and the method they are built with. What gets published is what was measured while working, not what sounds good.' })}</p>
      <div class="cta-row">
        <a class="btn btn-fire" href="#novedades" ${t({ es: 'Ver las novedades', en: 'See the releases' })}</a>
        <a class="btn btn-ghost" href="/about/" ${t({ es: 'Sobre Fervon', en: 'About Fervon' })}</a>
      </div>
    </header>

${tldrSec([
  { es: 'Este es el blog de <b>Fervon</b>, el estudio de software autónomo de Jonathan Martín.', en: 'This is the blog of <b>Fervon</b>, Jonathan Martín\'s autonomous software studio.' },
  { es: 'Dos cosas: las <b>novedades de cada proyecto</b> según van saliendo, y artículos de fondo sobre <b>cómo se dirige una flota de agentes de IA</b>.', en: 'Two things: <b>each project&#39;s releases</b> as they ship, and long-form articles on <b>how to direct a fleet of AI agents</b>.' },
  { es: 'Sin muro, sin registro y <b>sin pedir el correo</b>. Todo abierto, igual que la mayoría del código.', en: 'No paywall, no signup and <b>no email gate</b>. Everything open, like most of the code.' },
  { es: 'Se publica <b>cuando hay algo medido</b> que contar, no por calendario.', en: 'Published <b>when there is something measured</b> to say, not on a schedule.' },
], { href: '#novedades', es: 'Ver las novedades', en: 'See the releases' })}

    <section class="sec" id="novedades">
      <h2 ${t({ es: 'Novedades de los proyectos', en: 'Project releases' })}</h2>
      <p class="sub" ${t({ es: 'Lo que ha ido saliendo del catálogo, con la versión y lo que cambia de verdad.', en: 'What has shipped from the catalogue, with the version and what actually changes.' })}</p>
      <ol class="novedades reveal">
${[...NOVEDADES].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((n) => `        <li>
          <div class="nv-h">
            <time datetime="${n.fecha}" ${t({ es: fechaLarga(n.fecha, false), en: fechaLarga(n.fecha, true) })}</time>
            <a class="nv-p" href="${n.url}">${n.proyecto}</a>
            <span class="nv-v">${n.version}</span>
          </div>
          <h3 ${t(n.titulo)}</h3>
          <p ${t(n.cuerpo)}</p>
        </li>`).join('\n')}
      </ol>
    </section>

    <section class="sec" id="articulos">
      <h2 ${t({ es: 'A fondo', en: 'Long reads' })}</h2>
      <p class="sub" ${t({ es: 'Cuatro artículos largos que se leen en cualquier orden, aunque el primero es el que sostiene los otros tres.', en: 'Four long articles that read in any order, though the first is the one holding up the other three.' })}</p>
      <div class="bcards big reveal">
${ARTICLES.map((a) => `        <a class="bcard" href="/blog/${a.slug}/">
          <img src="${portadaURL(a.slug)}" width="1200" height="630" alt="${esc(a.titulo.es)} — Fervon" data-en="${esc(a.titulo.en)} — Fervon" data-i18n-attr="alt" loading="lazy" decoding="async">
          <span class="bc-m"><time datetime="${a.fecha}" ${t({ es: fechaLarga(a.fecha, false), en: fechaLarga(a.fecha, true) })}</time> · <span ${t({ es: `${a.minutos} min`, en: `${a.minutos} min` })}</span></span>
          <span class="bc-t" ${t(a.titulo)}</span>
          <span class="bc-d" ${t(a.desc)}</span>
        </a>`).join('\n')}
      </div>
    </section>

    <!-- seo:table -->
    <section class="sec seosec" id="indice" aria-labelledby="indice-h">
      <div class="wrap">
        <div class="center reveal">
          <span class="eye" ${t({ es: 'De un vistazo', en: 'At a glance' })}</span>
          <h2 id="indice-h" ${t({ es: 'Qué artículo te interesa', en: 'Which article you want' })}</h2>
        </div>
        <div class="tablewrap reveal">
          <table class="seotable">
            <caption class="vh" ${t({ es: 'Artículos del blog de Fervon con su tema y a quién le sirve cada uno.', en: 'Fervon blog articles with their topic and who each one is for.' })}</caption>
            <thead><tr>
              <th ${t({ es: 'Artículo', en: 'Article' })}</th>
              <th ${t({ es: 'De qué va', en: 'What it covers' })}</th>
              <th ${t({ es: 'Para quién', en: 'Who it is for' })}</th>
              <th ${t({ es: 'Lectura', en: 'Read' })}</th>
            </tr></thead>
            <tbody>
${[
  ['estudio-software-autonomo', { es: 'El reparto de trabajo entre criterio humano y flota', en: 'How work splits between human judgement and the fleet' }, { es: 'Quien quiere entender el modelo', en: 'Anyone wanting to understand the model' }],
  ['flotas-agentes-ia', { es: 'Aislamiento, cuántos agentes, medir y revisar', en: 'Isolation, how many agents, measuring and reviewing' }, { es: 'Quien ya lanza agentes y se pisan', en: 'Anyone already running agents that collide' }],
  ['tests-amanados-agentes', { es: 'Seis formas de poner un test en verde sin arreglar', en: 'Six ways to green a test without fixing anything' }, { es: 'Quien revisa PRs de agentes', en: 'Anyone reviewing agent PRs' }],
  ['coste-real-agentes-ia', { es: 'Dónde se esconde el gasto y cómo medirlo', en: 'Where the spend hides and how to measure it' }, { es: 'Quien ve la factura y no sabe por qué', en: 'Anyone staring at an invoice they cannot explain' }],
].map(([slug, tema, quien]) => {
  const a = ARTICLES.find((x) => x.slug === slug);
  return `          <tr><th><a href="/blog/${slug}/" ${t(a.titulo)}</a></th><td ${t(tema)}</td><td ${t(quien)}</td><td ${t({ es: `${a.minutos} min`, en: `${a.minutos} min` })}</td></tr>`;
}).join('\n')}
            </tbody>
          </table>
        </div>
      </div>
    </section>

${faqSec([
  { q: { es: '¿De qué va este blog?', en: 'What is this blog about?' },
    a: { es: 'De dos cosas: las novedades de cada proyecto de Fervon según van saliendo, y artículos de fondo sobre cómo se construye software dirigiendo flotas de agentes de IA. Nada de relleno: solo se publica lo que se ha medido trabajando.', en: 'Two things: each Fervon project&#39;s releases as they ship, and long-form articles on how software gets built by directing fleets of AI agents. No filler: only what was measured while working gets published.' } },
  { q: { es: '¿Cada cuánto se publica?', en: 'How often does it publish?' },
    a: { es: 'Cuando hay algo medido que contar. Es un estudio de una persona, así que se prefiere un artículo útil al mes que cuatro de relleno a la semana.', en: 'When there is something measured worth saying. It is a one-person studio, so one useful article a month beats four filler posts a week.' } },
  { q: { es: '¿Hay que suscribirse para leerlo?', en: 'Do you have to subscribe to read it?' },
    a: { es: 'No. No hay muro, ni registro, ni ventana pidiendo el correo. Todo el contenido está abierto, igual que la mayoría del código.', en: 'No. No paywall, no signup and no popup asking for your email. All the content is open, like most of the code.' } },
  { q: { es: '¿Quién escribe los artículos?', en: 'Who writes the articles?' },
    a: { es: 'Jonathan Martín, fundador y única persona de Fervon. Los artículos cuentan su método real de trabajo, con los límites y las cosas que salieron mal incluidas.', en: 'Jonathan Martín, founder and sole person behind Fervon. The articles describe his actual working method, limits and things that went wrong included.' } },
])}

    <section class="sec" id="hablemos">
      <div class="services">
        <h3 ${t({ es: 'Lo que sale de aquí', en: 'What comes out of here' })}</h3>
        <p class="intro" ${t({ es: 'Los artículos cuentan el método; el catálogo es la prueba. Dos productos de pago y seis herramientas open source, todas construidas así.', en: 'The articles describe the method; the catalogue is the evidence. Two paid products and six open-source tools, all built this way.' })}</p>
        <div class="cta-row sact">
          <a class="btn btn-fire" href="/#productos" ${t({ es: 'Ver los productos', en: 'See the products' })}</a>
          <a class="btn btn-ghost" href="/contacto/" ${t({ es: 'Hablemos', en: "Let's talk" })}</a>
        </div>
      </div>
${shareBlock()}
    </section>

  </main>

${sticky({ es: 'Noticias de Fervon', en: 'Fervon news' },
         { es: 'Cómo se construye software con flotas de agentes', en: 'How software gets built with agent fleets' },
         '#articulos', { es: 'Leer', en: 'Read' })}
${FOOTER}
  <script src="/assets/shared.js?${V}" defer></script>
</body>
</html>
`;

fs.mkdirSync(path.join(ROOT, 'src-i18n/blog'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'src-i18n/blog/index.html'), idx);
console.log(`  + src-i18n/blog/index.html             ${Math.round(idx.length / 1024)} KB`);
console.log(`${ARTICLES.length + 1} fuentes del blog escritas.`);
