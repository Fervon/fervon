/* ============================================================================
   scripts/seo-cabecera.mjs
   ----------------------------------------------------------------------------
   Completa la cabecera de cada página publicada con las cuatro cosas que la
   auditoría del 2026-08-25 encontró a faltar. Idempotente: pasarlo dos veces
   deja el fichero idéntico.

     1. BreadcrumbList en las 19 páginas que no lo tenían (las de producto,
        /contacto/ y el informe de Veredicto). Las de Trace y las del blog ya
        lo traían de sus propios generadores. Sin él, Google no puede pintar
        las migas en el resultado de búsqueda.
     2. <link rel="alternate" type="application/rss+xml"> en TODAS. Estaba
        solo en /blog/ y /en/blog/, así que el feed era invisible desde
        cualquier otra página.
     3. og:image:width y og:image:height. Todas las OG del sitio son 1200×630
        (comprobado leyendo la cabecera SOF de los JPEG); declararlo evita que
        el scraper tenga que descargar la imagen para saber si la pinta
        grande.
     4. width en el logo de las migas — llevaba height="17" y ningún ancho — y
        loading="lazy" en la copia del pie, que está siempre fuera de pantalla.

   POR QUÉ SOLO SOBRE LO PUBLICADO Y NO SOBRE src-i18n/: porque el
   BreadcrumbList y el enlace al feed dependen del IDIOMA de cada página, y
   una fuente bilingüe de src-i18n/ genera las dos. Meterlo ahí dejaría a
   /en/lookspan/ declarando el breadcrumb en español, que es justo el fallo
   que ya documenta i18n-build.mjs. Por eso este script va DESPUÉS del
   generador, igual que fix-breadcrumbs-trace.mjs, y está encadenado en
   `npm run i18n:build`.

   Uso:  node scripts/seo-cabecera.mjs           aplica
         node scripts/seo-cabecera.mjs --check   informa (exit 1 si falta algo)
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const SALTAR = new Set(['node_modules', '.git', 'dist', 'src-i18n', '.claude', '.wrangler', '.github', 'scripts', 'docs']);

function paginas(dir, out = []) {
  for (const e of fs.readdirSync(dir)) {
    if (SALTAR.has(e)) continue;
    const p = path.join(dir, e);
    if (fs.statSync(p).isDirectory()) paginas(p, out);
    else if (e.endsWith('.html')) out.push(path.relative(ROOT, p).split(path.sep).join('/'));
  }
  return out;
}

/* El nombre visible de cada sección, por idioma. Se usa tal cual en el
   BreadcrumbList: Google pide que el marcado diga lo mismo que la miga que ve
   el visitante, y la miga de estas páginas es "fervon › <producto>". */
const SECCION = {
  claudescope: 'ClaudeScope', inferbench: 'inferbench', launchpad: 'Mission Control',
  lookspan: 'Lookspan', pregon: 'Pregón', regenta: 'Regenta', trace: 'Trace',
  veredicto: 'Veredicto', about: { es: 'Sobre Fervon', en: 'About' },
  contacto: { es: 'Contacto', en: 'Contact' }, blog: { es: 'Noticias', en: 'News' },
};
const INICIO = { es: 'Inicio', en: 'Home' };
const RAIZ = { es: 'https://fervon.dev/', en: 'https://fervon.dev/en/' };
const FEED = { es: '/blog/feed.xml', en: '/en/blog/feed.xml' };

const nombreDe = (seg, lang) => {
  const v = SECCION[seg];
  if (!v) return seg;
  return typeof v === 'string' ? v : v[lang] || v.es;
};

/* Los eslabones INTERMEDIOS van siempre en el árbol del idioma de la página
   —una página inglesa cuelga de /en/, aunque su propia URL viva en la raíz—,
   que es el criterio que ya siguen las landings de Trace. El ÚLTIMO eslabón,
   en cambio, es la URL canónica real de la página, sin el .html: fervon.dev
   sirve URLs limpias y el canonical no lo lleva. */
function migas(url, lang, titulo) {
  const canonica = 'https://fervon.dev' + url.replace(/\.html$/, '');
  const partes = url.replace(/\.html$/, '').replace(/^\//, '').replace(/\/$/, '')
    .split('/').filter(Boolean).filter((x) => x !== 'en' && x !== 'es');
  const arbol = lang === 'en' ? 'https://fervon.dev/en' : 'https://fervon.dev';
  const lista = [{ name: INICIO[lang], item: RAIZ[lang] }];
  let ruta = '';
  for (let i = 0; i < partes.length; i++) {
    ruta += '/' + partes[i];
    const ultimo = i === partes.length - 1;
    lista.push({
      name: ultimo && partes.length > 1 ? titulo : nombreDe(partes[i], lang),
      item: ultimo ? canonica : arbol + ruta + '/',
    });
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: lista.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.item })),
  };
}

const faltan = [];
/* Aparte de `faltan`, que es lo que este script SABE poner. `problemas` es lo
   que solo puede arreglar una persona: recortar una frase es una decision
   editorial y hacerlo con `slice()` deja la descripcion cortada a media
   palabra, que es peor que la larga. */
const problemas = [];
for (const f of paginas(ROOT)) {
  if (/(^|\/)404\.html$/.test(f)) continue;   // la 404 no se indexa
  const p = path.join(ROOT, f);
  let s = fs.readFileSync(p, 'utf8');
  const original = s;
  const url = '/' + f.replace(/index\.html$/, '');
  const lang = (s.match(/<html[^>]+lang="([^"]+)"/) || [, 'es'])[1].slice(0, 2) === 'en' ? 'en' : 'es';
  const pendiente = [];

  /* 1. Enlace al feed del idioma que corresponda. */
  if (!/type="application\/rss\+xml"/.test(s)) {
    pendiente.push('feed');
    const titulo = lang === 'en' ? 'Fervon · News' : 'Fervon · Noticias';
    const etiqueta = `\n  <link rel="alternate" type="application/rss+xml" title="${titulo}" href="${FEED[lang]}">`;
    s = s.replace(/(<link[^>]+rel="canonical"[^>]*>)/, `$1${etiqueta}`);
  }

  /* 2. Dimensiones de la OG. Todas las del sitio son 1200×630. */
  if (/property="og:image"/.test(s) && !/og:image:width/.test(s)) {
    pendiente.push('og-dims');
    s = s.replace(/(<meta[^>]+property="og:image"[^>]*>)/,
      '$1\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">');
  }

  /* 3. BreadcrumbList si no hay ninguno. La home no lleva: es la raíz. */
  if (!/"BreadcrumbList"/.test(s) && url !== '/' && url !== '/en/') {
    pendiente.push('breadcrumb');
    const titulo = (s.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1]
      .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().replace(/[.·|].*$/, '').trim();
    const ultimoSeg = url.replace(/\.html$/, '').split('/').filter(Boolean).pop();
    const json = JSON.stringify(migas(f.endsWith('index.html') ? url : '/' + f, lang, titulo || nombreDe(ultimoSeg, lang)), null, 2);
    const bloque = `\n  <script type="application/ld+json">\n${json}\n  </script>`;
    /* Detrás del último ld+json que ya haya, para no separarlos. */
    const ultimo = s.lastIndexOf('</script>', s.indexOf('</head>'));
    if (ultimo > 0) s = s.slice(0, ultimo + 9) + bloque + s.slice(ultimo + 9);
    else s = s.replace('</head>', bloque + '\n</head>');
  }

  /* 4. El logo aparece dos veces: en las migas de arriba y en el pie. Las dos
     copias llevaban height="17" y ningún ancho. A la del PIE, que está
     siempre fuera de la primera pantalla, se le pone además loading="lazy";
     a la de arriba no, porque diferir algo que se ve de entrada solo lo
     retrasa. */
  if (/<img src="\/assets\/logo-icon\.svg"(?! width=)/.test(s) || /logo-icon\.svg"[^>]*height="17"(?![^>]*loading)/.test(s)) {
    const antes = s;
    s = s.replace(/<img src="\/assets\/logo-icon\.svg" height="17"/g,
      '<img src="/assets/logo-icon.svg" width="17" height="17"');
    const marca = '<img src="/assets/logo-icon.svg" width="17" height="17"';
    const ultima = s.lastIndexOf(marca);
    const primera = s.indexOf(marca);
    if (ultima > primera && !/loading=/.test(s.slice(ultima, s.indexOf('>', ultima)))) {
      s = s.slice(0, ultima) + marca + ' loading="lazy"' + s.slice(ultima + marca.length);
    }
    if (s !== antes) pendiente.push('logo');
  }

  /* 5. La meta description, entre 25 y 160 caracteres. Es la banda que pide
     Bing literalmente en su inspector de URL: «Change the description in the
     <meta description> tag to be between 25 and 160 characters in length».

     Ningun comprobador miraba el LARGO. El punto 2 de seo-check.mjs comprueba
     que las descripciones sean DISTINTAS entre si, que es otra cosa, y por eso
     /about/ estuvo sirviendo 173 caracteres sin que saltara nada aqui: lo
     encontro Bing, no nosotros. La diferencia entre «distintas» y «bien
     dimensionadas» es exactamente el hueco por el que se colo.

     Las entidades HTML cuentan como un caracter, que es como las ve quien lee
     el resultado de busqueda. */
  {
    const bruto = (s.match(/name="description" content="([^"]*)"/) || [, ''])[1];
    const texto = bruto.replace(/&amp;/g, '&').replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const largo = [...texto].length;
    if (!bruto) problemas.push([f, 'sin meta description']);
    else if (largo > 160) problemas.push([f, `description de ${largo} caracteres (maximo 160)`]);
    else if (largo < 25) problemas.push([f, `description de ${largo} caracteres (minimo 25)`]);
  }

  if (pendiente.length) faltan.push([f, pendiente.join(', ')]);
  if (!CHECK && s !== original) fs.writeFileSync(p, s, 'utf8');
}

if (problemas.length) {
  console.log(`✗ ${problemas.length} descripción(es) fuera de la banda 25–160 de Bing:`);
  for (const [f, d] of problemas) console.log(`   ${f.padEnd(56)} ${d}`);
  console.log('  Esto NO se arregla solo: recortar la frase es una decisión editorial.');
  console.log('  Si la página es generada, el texto vive en su script de scripts/.\n');
}
if (!faltan.length && !problemas.length) { console.log('✔ Cabecera completa en todas las páginas.'); process.exit(0); }
if (!faltan.length) process.exit(1);
console.log(`${CHECK ? '✗' : '↻'} ${faltan.length} página(s):`);
for (const [f, d] of faltan) console.log(`   ${f.padEnd(56)} ${d}`);
if (CHECK) { console.log('\n  Aplícalo con:  node scripts/seo-cabecera.mjs'); process.exit(1); }
console.log('\n✔ Aplicado. Vuelve a pasar --check para confirmar.');
if (problemas.length) process.exit(1);   // arreglar unas cosas no absuelve las otras
