/* ============================================================================
   scripts/entidad-fervon.mjs
   ----------------------------------------------------------------------------
   Los textos de la ENTIDAD Fervon en el JSON-LD, por idioma. Un solo sitio.

   Los usan dos scripts de la cadena de `npm run i18n:build`, y antes cada uno
   llevaba su copia: `i18n-build.mjs` ponía la descripción en inglés en las
   páginas inglesas y `seo-business-schema.mjs`, que corre después, la volvía a
   escribir en castellano. Dos copias de la misma frase acaban siendo dos
   frases distintas; aquí solo hay una.
   ========================================================================== */

/* Descripción de la ORGANIZACIÓN. No depende de la página, así que no puede
   salir de la meta description de cada una. */
export const ORG_DESC = {
  es: 'Estudio de software autónomo: productos local-first y herramientas open source construidas con flotas de agentes de IA.',
  en: 'Autonomous software studio: local-first products and open-source developer tools built with fleets of AI agents.',
};

/* Descripción del NEGOCIO (el ProfessionalService de /contacto/). */
export const BIZ_DESC = {
  es: 'Desarrollo de software a medida dirigiendo flotas de agentes de IA. Precio por proyecto con alcance cerrado, el código entregado es del cliente. Remoto desde España.',
  en: 'Custom software development directing fleets of AI agents. Per-project pricing with a closed scope, and the delivered code belongs to the client. Remote from Spain.',
};

/* Qué servicios presta el negocio, en el MISMO orden en los dos idiomas: la
   posición es lo que empareja cada término con su traducción. Los usan el
   ProfessionalService de /contacto/ y el de la home, que comparten @id
   (#localbusiness) y por tanto tienen que decir lo mismo. */
export const SERVICE_TYPE = {
  es: ['Desarrollo de software a medida', 'Automatización con agentes de IA', 'Integración de LLM', 'Software local-first'],
  en: ['Custom software development', 'AI agent automation', 'LLM integration', 'Local-first software'],
};

/* Idioma de una página a partir de su <html lang>; lo que no se conozca cae
   al castellano, que es el idioma en que se escribió la entidad. */
export const idiomaDe = (html) => {
  const m = /<html[^>]*\blang="([a-z]{2})/i.exec(html);
  return m && ORG_DESC[m[1].toLowerCase()] ? m[1].toLowerCase() : 'es';
};
