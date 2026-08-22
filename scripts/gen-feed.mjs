/* ============================================================================
   scripts/gen-feed.mjs
   ----------------------------------------------------------------------------
   Escribe el feed RSS del blog en los dos idiomas:

     /blog/feed.xml      · español
     /en/blog/feed.xml   · inglés

   POR QUÉ EXISTE: hasta hoy /feed.xml, /rss.xml y /blog/feed.xml devolvían 404
   y ninguna página declaraba `application/rss+xml`. Sin feed, nadie puede
   SEGUIR a Fervon: ni un lector, ni un agregador, ni una newsletter ajena que
   quiera republicar. Es el canal de distribución más barato que hay y era el
   único que faltaba por completo.

   RSS 2.0 y no Atom a propósito: es lo que entiende todo lector viejo, y es el
   tipo MIME que declara el <link rel="alternate"> que pinta gen-blog.mjs.

   LOS ITEMS son las dos cosas que la página del blog publica de verdad:
     · los artículos de fondo (ARTICLES) — cada uno con su URL propia;
     · las novedades de los proyectos (NOVEDADES) — que no tienen página propia,
       así que enlazan al ancla que gen-blog.mjs le pone a cada <li>.

   EL GUID NO PUEDE CAMBIAR NUNCA. Es lo que usa un lector para decidir si algo
   es nuevo; si se recalcula distinto, todos los suscriptores ven el feed entero
   como no leído. Por eso el ancla de las novedades vive en blog-articles.mjs
   (`anclaNovedad`) y la comparten este script y el generador del blog.

   Uso:  node scripts/gen-feed.mjs
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARTICLES, NOVEDADES, anclaNovedad } from './blog-articles.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://fervon.dev';

/* Los idiomas, con su prefijo de URL y sus textos fijos. El español vive en la
   raíz y el inglés bajo /en/, igual que el resto del sitio. */
const IDIOMAS = [
  {
    lang: 'es', prefijo: '', hreflang: 'es-ES',
    titulo: 'Fervon — Noticias',
    desc: 'Artículos y novedades de los proyectos de Fervon: herramientas locales para desarrolladores, agentes de IA y observabilidad.',
  },
  {
    lang: 'en', prefijo: '/en', hreflang: 'en-US',
    titulo: 'Fervon — News',
    desc: 'Long reads and project releases from Fervon: local-first developer tools, AI agents and observability.',
  },
];

/* --------------------------------------------------------------------------
   XML seguro. Ojo con dos cosas:
   · `&` va PRIMERO o se re-escapan las entidades que acabas de escribir.
   · el cuerpo de las novedades lleva <b> y <code>, que en RSS no pueden ir
     crudos dentro de <description>: se escapan y el lector los pinta.
   ------------------------------------------------------------------------ */
const escXml = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

/* Quita las etiquetas del cuerpo para el resumen, pero conserva el texto. */
const soloTexto = (s) => String(s)
  .replace(/<[^>]+>/g, '')
  .replace(/\s+/g, ' ')
  .trim();

/* RFC-822, que es lo que exige RSS 2.0. Las fechas del blog son días sueltos
   (`2026-08-19`) sin hora: se fijan a las 09:00 UTC para que el orden dentro
   de un mismo día sea estable y no dependa de la zona horaria del lector. */
const DIAS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MESES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const rfc822 = (iso) => {
  const d = new Date(`${iso}T09:00:00Z`);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${DIAS[d.getUTCDay()]}, ${dd} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()} ${hh}:${mm}:00 +0000`;
};

/* --------------------------------------------------------------------------
   Items
   ------------------------------------------------------------------------ */
function itemsDe(lang, prefijo) {
  const items = [];

  for (const a of ARTICLES) {
    items.push({
      fecha: a.fecha,
      titulo: a.titulo[lang],
      url: `${ORIGIN}${prefijo}/blog/${a.slug}/`,
      /* El guid de un artículo es su URL sin prefijo de idioma: el mismo
         artículo en dos idiomas son dos entradas de dos feeds distintos, y
         cada feed necesita un guid único DENTRO de él. */
      guid: `${ORIGIN}${prefijo}/blog/${a.slug}/`,
      desc: a.desc[lang],
      categoria: lang === 'es' ? 'A fondo' : 'Long read',
      imagen: `${ORIGIN}/assets/blog/${a.slug}.jpg`,
    });
  }

  for (const n of NOVEDADES) {
    const ancla = anclaNovedad(n);
    items.push({
      fecha: n.fecha,
      titulo: `${n.proyecto} ${n.version} — ${n.titulo[lang]}`,
      url: `${ORIGIN}${prefijo}/blog/#${ancla}`,
      guid: `${ORIGIN}/blog/${lang}/${ancla}`,
      desc: soloTexto(n.cuerpo[lang]),
      categoria: lang === 'es' ? 'Novedades' : 'Releases',
      imagen: null,
    });
  }

  /* Más reciente primero, que es lo que espera un lector de feeds. */
  return items.sort((a, b) => b.fecha.localeCompare(a.fecha) || a.titulo.localeCompare(b.titulo));
}

/* --------------------------------------------------------------------------
   Feed
   ------------------------------------------------------------------------ */
function feed({ lang, prefijo, titulo, desc, hreflang }) {
  const items = itemsDe(lang, prefijo);
  const ultima = items[0]?.fecha;

  const cuerpo = items.map((it) => `    <item>
      <title>${escXml(it.titulo)}</title>
      <link>${escXml(it.url)}</link>
      <guid isPermaLink="false">${escXml(it.guid)}</guid>
      <pubDate>${rfc822(it.fecha)}</pubDate>
      <category>${escXml(it.categoria)}</category>
      <description>${escXml(it.desc)}</description>${it.imagen ? `
      <enclosure url="${escXml(it.imagen)}" type="image/jpeg" length="0" />` : ''}
    </item>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escXml(titulo)}</title>
    <link>${ORIGIN}${prefijo}/blog/</link>
    <description>${escXml(desc)}</description>
    <language>${hreflang}</language>
    <copyright>Fervon</copyright>
    <generator>scripts/gen-feed.mjs</generator>
    <atom:link href="${ORIGIN}${prefijo}/blog/feed.xml" rel="self" type="application/rss+xml" />
${ultima ? `    <lastBuildDate>${rfc822(ultima)}</lastBuildDate>\n` : ''}${cuerpo}
  </channel>
</rss>
`;
}

/* --------------------------------------------------------------------------
   Escritura
   ------------------------------------------------------------------------ */
let escritos = 0;
for (const idioma of IDIOMAS) {
  const destino = path.join(ROOT, idioma.prefijo.replace(/^\//, ''), 'blog', 'feed.xml');
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  const xml = feed(idioma);
  const previo = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8') : null;
  fs.writeFileSync(destino, xml, 'utf8');
  const rel = path.relative(ROOT, destino).split(path.sep).join('/');
  console.log(`${previo === xml ? '=' : '+'} /${rel}   ${itemsDe(idioma.lang, idioma.prefijo).length} entradas`);
  escritos++;
}
console.log(`\n${escritos} feed(s) escritos.`);
