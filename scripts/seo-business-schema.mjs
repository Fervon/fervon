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
    if (['node_modules', '.git', '.claude'].includes(e.name)) continue;
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
  address: { '@type': 'PostalAddress', addressCountry: 'ES' },
  areaServed: { '@type': 'Place', name: 'Worldwide' },
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
  address: { '@type': 'PostalAddress', addressCountry: 'ES' },
  areaServed: { '@type': 'Place', name: 'Worldwide' },
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

  if (h !== before) {
    fs.writeFileSync(file, crlf ? h.replace(/\n/g, '\r\n') : h);
    changed++;
    console.log(`✔ ${rel.padEnd(56)} ${did.join(' + ')}`);
  } else {
    console.log(`· ${rel.padEnd(56)} sin cambios`);
  }
}
console.log(`\n${changed} página(s) modificadas.`);
