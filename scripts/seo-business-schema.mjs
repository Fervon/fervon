/* ============================================================================
   scripts/seo-business-schema.mjs
   ----------------------------------------------------------------------------
   Punto 16 del checklist ("schema de negocio local") en TODAS las páginas.

   Criterio, para no hacer spam de marcado:

     · La home ya define el nodo gordo `ProfessionalService` (#localbusiness),
       que es un subtipo de LocalBusiness. No se toca aquí.
     · /contacto/ ES la página del negocio, así que recibe también el nodo
       completo con el MISMO @id: Google los funde en una sola entidad.
     · El resto de páginas van de un PRODUCTO, no del negocio. Meterles
       LocalBusiness sería marcado irrelevante y Google puede penalizarlo.
       Lo correcto es que declaren su editor y lo enlacen por @id a la entidad
       de la home: así toda página queda conectada al negocio sin duplicarlo.
         - Si ya tenían `publisher` Organization → se le añade el @id.
         - Si no tenían ninguna Organization (los 7 artículos de Trace) → se
           añade un nodo Organization compacto con ese mismo @id.

   Idempotente. Uso:  node scripts/seo-business-schema.mjs
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORG_ID = 'https://fervon.dev/#organization';
const BIZ_ID = 'https://fervon.dev/#localbusiness';

const PAGES = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    /* `src-i18n` NO se toca, y esto no es higiene: es la ENTRADA de la cadena.
       Lo que se escribe ahi lo propaga el siguiente `npm run i18n:build` a las
       61 paginas generadas, asi que un fallo en este script deja de ser un
       fallo de una pasada y pasa a ser permanente. El 2026-09-01 una regex mal
       acotada reescribio el ProfessionalService de la fuente de /contacto/ y
       se llevo por delante la entidad del negocio en los dos idiomas.
       `dist` queda fuera por lo mismo al reves: es artefacto de compilacion. */
    if (['node_modules', '.git', '.claude', 'src-i18n', 'dist'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) PAGES.push(path.relative(ROOT, p).split(path.sep).join('/'));
  }
})(ROOT);
PAGES.sort();

const SAME_AS = [
  'https://github.com/Fervon',
  'https://www.linkedin.com/company/fervondev',
  'https://www.npmjs.com/package/fervon',
  'https://dev.to/jonimatiin',
  'https://bsky.app/profile/jonimartin.bsky.social',
  'https://mastodon.social/@jonimartin',
];

const orgStub = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'Fervon',
  url: 'https://fervon.dev/',
  logo: 'https://fervon.dev/assets/favicon-512.png',
  description: 'Estudio de software autónomo: productos local-first y herramientas open source construidas con flotas de agentes de IA.',
  /* La misma ubicación que declara bizNode: Bing penaliza que una entidad se
     describa distinto según la página en la que aparezca. */
  address: { '@type': 'PostalAddress', addressLocality: 'Málaga', addressRegion: 'Andalucía', addressCountry: 'ES' },
  areaServed: [
    { '@type': 'Country', name: 'España' },
    { '@type': 'AdministrativeArea', name: 'Andalucía' },
    { '@type': 'City', name: 'Málaga' },
  ],
  sameAs: SAME_AS,
};

const bizNode = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': BIZ_ID,
  name: 'Fervon',
  url: 'https://fervon.dev/contacto/',
  logo: 'https://fervon.dev/assets/favicon-512.png',
  description: 'Desarrollo de software a medida dirigiendo flotas de agentes de IA. Precio por proyecto con alcance cerrado, el código entregado es del cliente. Remoto desde España.',
  parentOrganization: { '@id': ORG_ID },
  address: { '@type': 'PostalAddress', addressLocality: 'Málaga', addressRegion: 'Andalucía', addressCountry: 'ES' },
  /* Este es el nodo que un asistente lee cuando le preguntan «quién hace esto
     en <sitio>». España cubre las 50 provincias; Andalucía y Málaga concretan
     de dónde se trabaja. Todo remoto, que es como se presta de verdad. */
  areaServed: [
    { '@type': 'Country', name: 'España' },
    { '@type': 'AdministrativeArea', name: 'Andalucía' },
    { '@type': 'City', name: 'Málaga' },
  ],
  availableLanguage: ['es', 'en'],
  priceRange: '$19–$39',
  currenciesAccepted: 'USD, EUR',
  serviceType: ['Desarrollo de software a medida', 'Automatización con agentes de IA', 'Integración de LLM', 'Software local-first'],
  contactPoint: { '@type': 'ContactPoint', contactType: 'sales', url: 'https://fervon.dev/contacto/', availableLanguage: ['es', 'en'] },
  sameAs: SAME_AS,
};

const block = (obj) => `  <script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n  </script>\n`;

let changed = 0;
for (const rel of PAGES) {
  const file = path.join(ROOT, rel);
  const raw = fs.readFileSync(file, 'utf8');
  const crlf = /\r\n/.test(raw);
  let h = raw.replace(/\r\n/g, '\n');
  const before = h;
  const did = [];

  if (rel === 'index.html') { console.log(`· ${rel} — ya define el negocio, no se toca`); continue; }

  /* 1. publisher Organization existente → enlazarlo por @id */
  if (h.includes('"publisher": { "@type": "Organization"') && !h.includes(`"@id": "${ORG_ID}"`)) {
    h = h.replace('"publisher": { "@type": "Organization",', `"publisher": { "@type": "Organization", "@id": "${ORG_ID}",`);
    did.push('publisher enlazado por @id');
  }

  /* 2. páginas sin ninguna Organization → nodo compacto */
  if (!/"@type":\s*"Organization"/.test(h)) {
    const anchor = '  <link rel="stylesheet"';
    if (!h.includes(anchor)) throw new Error(`${rel}: no encuentro dónde colgar el schema`);
    h = h.replace(anchor, block(orgStub) + '\n' + anchor);
    did.push('Organization añadida');
  }

  /* 3. /contacto/ es la página del negocio → nodo completo */
  if (rel === 'contacto/index.html' && !h.includes(BIZ_ID)) {
    const anchor = '  <link rel="stylesheet"';
    h = h.replace(anchor, block(bizNode) + '\n' + anchor);
    did.push('ProfessionalService añadido');
  }

  /* 4. Y si el nodo YA estaba, se REESCRIBE con la versión de arriba.

     Hasta el 2026-08-31 este script solo sabía AÑADIR: los pasos 2 y 3 miran
     `!h.includes(...)`, así que en cuanto un nodo existía quedaba congelado en
     la forma que tuviera el día que se inyectó. Al ampliar la cobertura
     geográfica salió a la luz — decía «0 páginas modificadas» con 27 páginas
     sirviendo el schema viejo. Un inyector que no actualiza es una verdad
     congelada que nadie vuelve a mirar.

     SE PARSEA, NO SE BUSCA CON UNA REGEX, y esto costó dos rondas el
     2026-09-01. Buscar `"@id": "…#organization"` con texto casa con el bloque
     equivocado por dos motivos distintos:

       · Un `[\s\S]*?` perezoso no está acotado a un bloque: en las páginas
         donde el FAQPage va antes, arrancaba en su `<script>`, cruzaba el
         cierre buscando el @id y se llevaba los dos por delante.
       · Y aunque se acote al bloque, ese mismo @id vive TAMBIÉN dentro del
         SoftwareApplication de cada producto — el paso 1 lo mete ahí como
         `publisher`. Así que casaba con el bloque del producto y lo sustituía
         por la Organization pelada: 10 páginas de /en/ perdían su
         SoftwareApplication y su Offer.

     Comparar `data['@id']` del nodo raíz es lo único que distingue «este
     bloque ES la entidad» de «este bloque la MENCIONA». */
  {
    const bloques = [...h.matchAll(/  <script type="application\/ld\+json">\n([\s\S]*?)\n  <\/script>\n/g)];
    for (const nodo of [orgStub, bizNode]) {
      for (const m of bloques) {
        let data;
        try { data = JSON.parse(m[1]); } catch { continue; }
        if (data['@id'] !== nodo['@id']) continue;   // lo menciona, no lo es
        const nuevoBloque = block(nodo);
        if (m[0] === nuevoBloque) continue;
        h = h.replace(m[0], nuevoBloque);
        did.push(`${nodo['@type']} actualizado`);
      }
    }
  }

  if (h !== before) {
    fs.writeFileSync(file, crlf ? h.replace(/\n/g, '\r\n') : h);
    changed++;
    console.log(`✔ ${rel.padEnd(56)} ${did.join(' + ')}`);
  } else {
    console.log(`· ${rel.padEnd(56)} sin cambios`);
  }
}
console.log(`\n${changed} página(s) modificadas.`);
