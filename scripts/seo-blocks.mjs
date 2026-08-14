/* ============================================================================
   scripts/seo-blocks.mjs
   ----------------------------------------------------------------------------
   Inserta en cada página los bloques del checklist SEO que faltaban:

     · TL;DR / Key takeaways  (puntos 6 y 7) — SIEMPRE tras el hero, es decir,
       después de que la página haya declarado la intención de búsqueda.
     · CTA tras el primer bloque de texto (punto 8) — el TL;DR lo lleva dentro.
     · Clúster de enlaces internos (punto 10).
     · Listas (punto 11) — el TL;DR y el FAQ son listas semánticas.
     · FAQ + schema FAQPage (puntos 12 y 13) en las páginas que no lo tenían.
     · Botón de compartir (punto 22).
     · CTA fijo en móvil (punto 21).

   Es IDEMPOTENTE: cada bloque lleva un marcador `<!-- seo:xxx -->` y si ya
   está, no se vuelve a insertar. Se puede reejecutar sin duplicar nada.

   Todo el texto es bilingüe con el mismo mecanismo que ya usa el sitio:
   las páginas en español llevan `data-en` y las de Trace (en inglés) `data-es`;
   `assets/shared.js` intercambia el innerHTML al pulsar el selector de idioma.

   Uso:  node scripts/seo-blocks.mjs
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/* La copia de trabajo en Windows está en CRLF pero el origen sirve el blob de
   git en LF. Procesamos SIEMPRE en LF (así los anclajes `\n` funcionan) y
   devolvemos el fichero con el mismo final de línea que tenía, para no meter
   un diff de 400 líneas por un cambio de EOL. */
const eolOf = new Map();
const read = (p) => {
  const raw = fs.readFileSync(path.join(ROOT, p), 'utf8');
  eolOf.set(p, /\r\n/.test(raw) ? '\r\n' : '\n');
  return raw.replace(/\r\n/g, '\n');
};
const write = (p, s) => {
  const eol = eolOf.get(p) || '\n';
  fs.writeFileSync(path.join(ROOT, p), eol === '\r\n' ? s.replace(/\n/g, '\r\n') : s);
};

/* Escapa lo justo para meter texto dentro de un atributo HTML manteniendo las
   etiquetas (<b>, <span>) vivas, igual que hace el resto del sitio. */
const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/* Devuelve `atributo-de-traduccion>texto-visible` según la dirección de la
   página: 'es' = visible español + data-en; 'en' = visible inglés + data-es;
   'none' = monolingüe (la página no tiene selector de idioma). */
function bi(dir, es, en) {
  if (dir === 'es') return ` data-en="${attr(en)}">${es}`;
  if (dir === 'en') return ` data-es="${attr(es)}">${en}`;
  return `>${en}`;
}

/* ── Catálogo de destinos para el clúster de enlaces ─────────────────────── */
const P = {
  trace:       { href: '/trace/',        t: 'Trace',          es: 'Tu memoria personal, local-first y de pago único.',            en: 'Your personal memory: local-first, pay once.' },
  veredicto:   { href: '/veredicto/',    t: 'Veredicto',      es: 'El check de CI que pilla los tests de agentes que no prueban nada.', en: 'The CI check that catches agent tests proving nothing.' },
  inferbench:  { href: '/inferbench/',   t: 'inferbench',     es: 'Qué LLM cabe en tu GPU y a cuántos tok/s. Gratis.',            en: 'Which LLM fits your GPU, and at how many tok/s. Free.' },
  lookspan:    { href: '/lookspan/',     t: 'Lookspan',       es: 'Observabilidad local-first para tus agentes de IA. Gratis.',    en: 'Local-first observability for your AI agents. Free.' },
  claudescope: { href: '/claudescope/',  t: 'ClaudeScope',    es: 'Busca en todas tus sesiones de Claude Code. Gratis.',          en: 'Search every Claude Code session you have run. Free.' },
  launchpad:   { href: '/launchpad/',    t: 'Mission Control',es: 'Arranca todos tus repos a la vez, sin choques de puerto.',      en: 'Start every repo at once, with no port clashes.' },
  pregon:      { href: '/pregon/',       t: 'Pregón',         es: 'Compón una vez, anúncialo en catorce canales.',                en: 'Compose once, announce it on fourteen channels.' },
  regenta:     { href: '/regenta/',      t: 'Regenta',        es: 'Gobierna tu flota de agentes de IA.',                          en: 'Govern your fleet of AI agents.' },
  contacto:    { href: '/contacto/',     t: 'Contacto',       es: 'Desarrollo a medida con flotas de agentes.',                   en: 'Bespoke development with agent fleets.' },
  home:        { href: '/',              t: 'Fervon',         es: 'El estudio y todo el portfolio, en una página.',               en: 'The studio and the whole portfolio, on one page.' },
  report:      { href: '/veredicto/report', t: 'El informe de datos', es: '20 módulos con bugs, 20 suites en verde, 0 bugs detectados.', en: '20 buggy modules, 20 green suites, 0 bugs caught.' },
  rewindWin:   { href: '/trace/rewind-alternative-windows', t: 'Alternativa a Rewind en Windows', es: 'Rewind era solo para Mac. Qué usar en Windows.', en: 'Rewind was Mac-only. What to use on Windows.' },
  recall:      { href: '/trace/microsoft-recall-alternative', t: 'Alternativa a Microsoft Recall', es: 'Sin PC Copilot+ y sin los problemas de privacidad.', en: 'No Copilot+ PC, none of the privacy problems.' },
  limitless:   { href: '/trace/limitless-alternative', t: 'Alternativa a Limitless', es: 'Meta compró Limitless. La opción independiente.', en: 'Meta bought Limitless. The independent option.' },
  screenpipe:  { href: '/trace/screenpipe-alternative', t: 'Alternativa a Screenpipe', es: 'La misma idea, sin el consumo ni la suscripción.', en: 'Same idea, without the footprint or the subscription.' },
  rewindAI:    { href: '/trace/rewind-ai-alternative', t: 'Alternativa a Rewind AI', es: 'Rewind cerró. La sustituta local y multiplataforma.', en: 'Rewind is gone. The local, cross-platform replacement.' },
  shutdown:    { href: '/trace/rewind-shut-down-what-to-use', t: 'Rewind cerró: qué usar ahora', es: 'Repaso honesto de lo que quedó en pie.', en: 'An honest roundup of what survived.' },
  noRecording: { href: '/trace/personal-memory-tool-without-screen-recording', t: 'Memoria sin grabar la pantalla', es: 'Sin vídeo 24/7 ni capturas almacenadas.', en: 'No 24/7 video, no stored screenshots.' },
};

/* ── Constructores de bloques ────────────────────────────────────────────── */

function tldrBlock(dir, items, cta) {
  const lis = items.map((it) => `        <li${bi(dir, it.es, it.en)}</li>`).join('\n');
  const ctaHtml = cta
    ? `\n      <div class="cta-row s-tldrcta">\n        <a class="btn btn-fire" href="${cta.href}"${bi(dir, cta.es, cta.en)}</a>\n      </div>`
    : '';
  return `
    <!-- seo:tldr -->
    <section class="sec seosec" id="resumen" aria-labelledby="resumen-h">
      <div class="wrap">
        <div class="tldr reveal">
          <h2 id="resumen-h"${bi(dir, 'En 30 segundos', 'In 30 seconds')}</h2>
          <ul>
${lis}
          </ul>${ctaHtml}
        </div>
      </div>
    </section>
`;
}

function faqBlock(dir, qas) {
  const items = qas.map((qa) => `        <details>
          <summary${bi(dir, qa.qEs, qa.qEn)}</summary>
          <p${bi(dir, qa.aEs, qa.aEn)}</p>
        </details>`).join('\n');
  return `
    <!-- seo:faq -->
    <section class="sec seosec" id="faq" aria-labelledby="faq-h">
      <div class="wrap">
        <div class="center reveal">
          <span class="eye"${bi(dir, 'FAQ', 'FAQ')}</span>
          <h2 id="faq-h"${bi(dir, 'Preguntas frecuentes', 'Frequently asked questions')}</h2>
        </div>
        <div class="faq reveal">
${items}
        </div>
      </div>
    </section>
`;
}

/* El schema va SIEMPRE en el idioma principal de la página (el que sirve el
   HTML sin JavaScript), que es el que rastrea Google. */
function faqSchema(dir, qas) {
  const pick = (qa) => (dir === 'en' ? { q: qa.qEn, a: qa.aEn } : { q: qa.qEs, a: qa.aEs });
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qas.map((qa) => {
      const { q, a } = pick(qa);
      return { '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } };
    }),
  };
  return `  <script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n  </script>\n`;
}

function relatedBlock(dir, keys, share) {
  const cards = keys.map((k) => {
    const p = P[k];
    return `        <a class="relcard" href="${p.href}">
          <span class="rt">${p.t}</span>
          <span class="rd"${bi(dir, p.es, p.en)}</span>
        </a>`;
  }).join('\n');
  const shareHtml = share ? `
      <div class="fv-share">
        <button type="button" class="sharebtn" aria-label="${dir === 'en' ? 'Share this page' : 'Compartir esta página'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
          <span${bi(dir, 'Compartir', 'Share')}</span>
        </button>
        <span class="sharemsg" role="status" aria-live="polite"></span>
      </div>` : '';
  return `
    <!-- seo:related -->
    <section class="sec alt seosec" id="mas" aria-labelledby="mas-h">
      <div class="wrap">
        <div class="center reveal">
          <span class="eye"${bi(dir, 'Más de Fervon', 'More from Fervon')}</span>
          <h2 id="mas-h"${bi(dir, 'Sigue explorando', 'Keep exploring')}</h2>
        </div>
        <div class="related reveal">
${cards}
        </div>${shareHtml}
      </div>
    </section>
`;
}

function stickyBlock(dir, s) {
  return `
  <!-- seo:sticky -->
  <div class="stickycta">
    <div class="sct">
      <b${bi(dir, s.titleEs, s.titleEn)}</b>
      <span${bi(dir, s.subEs, s.subEn)}</span>
    </div>
    <a class="btn btn-fire" href="${s.href}"${bi(dir, s.ctaEs, s.ctaEn)}</a>
  </div>
`;
}

/* ── Contenido por página ────────────────────────────────────────────────── */
const PAGES = {

  'index.html': {
    dir: 'es',
    afterHero: '  <main class="wrap">\n',
    beforeEnd: '  </main>\n',
    tldr: [
      { es: '<b>Fervon</b> es el estudio de software autónomo de Jonathan Martín: una persona dirigiendo flotas de agentes de IA.', en: '<b>Fervon</b> is the autonomous software studio of Jonathan Martín: one person directing fleets of AI agents.' },
      { es: 'Dos productos de pago —<b>Trace</b> ($39, pago único) y <b>Veredicto</b> ($19/repo)— y cinco herramientas <b>open source y gratis</b>.', en: 'Two paid products —<b>Trace</b> ($39, pay once) and <b>Veredicto</b> ($19/repo)— plus five <b>free, open-source</b> tools.' },
      { es: 'Todo es <b>local-first</b>: sin nube obligatoria, sin suscripción y sin telemetría por defecto.', en: 'Everything is <b>local-first</b>: no mandatory cloud, no subscription, no telemetry by default.' },
      { es: 'También hago <b>desarrollo a medida</b> con el mismo método. Hablas conmigo, no con un comercial.', en: 'I also take on <b>bespoke development</b> with the same method. You talk to me, not to a salesperson.' },
    ],
    tldrCta: { href: '/contacto/', es: 'Cuéntame tu proyecto', en: 'Tell me about your project' },
    faq: [
      { qEs: '¿Qué es exactamente Fervon?', qEn: 'What exactly is Fervon?',
        aEs: 'Un estudio de software de una sola persona. Jonathan Martín dirige flotas de agentes de IA que construyen, prueban y despliegan; el resultado son productos propios y herramientas open source, no horas facturadas.',
        aEn: 'A one-person software studio. Jonathan Martín directs fleets of AI agents that build, test and ship; the output is products and open-source tools, not billable hours.' },
      { qEs: '¿Qué productos hay y cuáles son gratis?', qEn: 'Which products are there, and which are free?',
        aEs: 'De pago: Trace (memoria personal local, $39 de pago único) y Veredicto (check de CI contra tests amañados, $19 por repositorio). Gratis y open source: inferbench, Lookspan, ClaudeScope, Mission Control y Pregón.',
        aEn: 'Paid: Trace (local personal memory, $39 one-time) and Veredicto (a CI check against gamed tests, $19 per repository). Free and open source: inferbench, Lookspan, ClaudeScope, Mission Control and Pregón.' },
      { qEs: '¿Se puede comprar sin hablar con nadie?', qEn: 'Can I buy without talking to anyone?',
        aEs: 'Sí, y es lo normal. Todo es self-serve: se compra o se descarga desde la web, sin demo, sin llamada de ventas y sin dejar el correo para «que te contacten».',
        aEn: 'Yes, and that is the normal path. Everything is self-serve: buy or download from the site, with no demo, no sales call and no email-gate.' },
      { qEs: '¿Mis datos salen de mi máquina?', qEn: 'Does my data leave my machine?',
        aEs: 'No. Las herramientas corren en local y no envían telemetría por defecto. Las open source son inspeccionables en GitHub, así que no hace falta creerse la promesa.',
        aEn: 'No. The tools run locally and send no telemetry by default. The open-source ones are inspectable on GitHub, so you do not have to take the promise on faith.' },
      { qEs: '¿Aceptas encargos de desarrollo a medida?', qEn: 'Do you take on bespoke development work?',
        aEs: 'Sí. Aplico el mismo motor de agentes a los retos de tu empresa, por proyecto y con alcance y precio cerrados de antemano, no por horas. El código entregado es tuyo.',
        aEn: 'Yes. I apply the same agent engine to your company challenges, per project, with scope and price agreed up front rather than by the hour. The delivered code is yours.' },
    ],
    related: ['trace', 'veredicto', 'contacto'],
    sticky: { href: '/contacto/', titleEs: 'Fervon', titleEn: 'Fervon', subEs: 'Software a medida con agentes', subEn: 'Bespoke software with agents', ctaEs: 'Hablemos', ctaEn: "Let's talk" },
  },

  'contacto/index.html': {
    dir: 'es',
    afterHero: '    </header>\n',
    beforeEnd: '  </main>\n',
    tldr: [
      { es: 'Desarrollo a medida dirigiendo <b>flotas de agentes de IA</b>: del concepto al producto funcionando.', en: 'Bespoke development driven by <b>fleets of AI agents</b>: from concept to a working product.' },
      { es: 'Precio <b>por proyecto</b>, con alcance cerrado antes de empezar. Nunca por horas.', en: '<b>Per-project</b> pricing, with the scope closed before any work starts. Never by the hour.' },
      { es: 'El <b>código entregado es tuyo</b>, documentado y traspasado. Sin dependencia de mí ni de ninguna plataforma.', en: 'The <b>delivered code is yours</b>, documented and handed over. No lock-in to me or to any platform.' },
      { es: 'Hablas <b>directamente conmigo</b>. Remoto desde España (CET), con clientes en cualquier huso horario.', en: 'You talk <b>directly to me</b>. Remote from Spain (CET), working with clients in any timezone.' },
    ],
    tldrCta: { href: '#form', es: 'Escríbeme', en: 'Write to me' },
    schemaOnlyFaq: [
      { qEs: '¿Con qué tecnologías trabajas?', qEn: 'What do you build with?',
        aEs: 'TypeScript/Node y React en el front, Python donde encaja, SQLite/Postgres para datos, e integración profunda con LLMs —Claude y modelos locales vía llama.cpp. El mismo stack que hay detrás de mis productos.',
        aEn: 'TypeScript/Node and React on the front, Python where it fits, SQLite/Postgres for data, and deep LLM integration —Claude plus local models via llama.cpp. The same stack behind my own products.' },
      { qEs: '¿Trabajas con startups o con empresas?', qEn: 'Do you work with startups or companies?',
        aEs: 'Con ambas. Desde un MVP para un fundador hasta automatizar procesos internos de un equipo ya establecido.',
        aEn: 'Both. From a weekend MVP for a founder to automating internal processes for an established team.' },
      { qEs: '¿Cómo es el precio?', qEn: 'How does pricing work?',
        aEs: 'Por proyecto, con alcance y precio cerrados acordados antes de empezar —no por horas. Siempre sabes lo que vas a pagar antes de que arranque nada.',
        aEn: 'Per project, with a closed scope and price agreed up front —not per hour. You always know what you will pay before any work begins.' },
      { qEs: '¿Dónde estás?', qEn: 'Where are you based?',
        aEs: 'Remoto, desde España (CET). Trabajo con clientes de cualquier zona horaria — asíncrono por defecto y llamadas cuando hacen falta.',
        aEn: 'Remote, from Spain (CET). I work with clients in any timezone — async by default, calls when they help.' },
      { qEs: '¿De quién es el código?', qEn: 'Who owns the code?',
        aEs: 'Tuyo. Todo lo que entrego es tuyo, documentado y traspasado — sin dependencia de mí ni de ninguna plataforma.',
        aEn: 'You do. Everything I deliver is yours, documented and handed over — no lock-in to me or to any platform.' },
    ],
    related: ['home', 'trace', 'veredicto'],
    sticky: { href: '#form', titleEs: 'Cuéntame tu proyecto', titleEn: 'Tell me about your project', subEs: 'Respuesta directa, sin intermediarios', subEn: 'A direct reply, no middlemen', ctaEs: 'Escribir', ctaEn: 'Write' },
  },

  'claudescope/index.html': {
    dir: 'es',
    tldr: [
      { es: '<b>ClaudeScope</b> da búsqueda full-text sobre <b>todas</b> las sesiones de Claude Code que has corrido.', en: '<b>ClaudeScope</b> gives full-text search across <b>every</b> Claude Code session you have run.' },
      { es: 'Añade el <b>panel de uso</b> que la suscripción no te enseña: tokens, coste y lo que te ahorró la caché.', en: 'It adds the <b>usage dashboard</b> your subscription does not show: tokens, cost and what the cache saved you.' },
      { es: '<b>100% local</b>: lee los ficheros de sesión de tu disco. No sube nada y no pide API key.', en: '<b>100% local</b>: it reads the session files on your disk. Nothing is uploaded, no API key needed.' },
      { es: 'Un solo comando y <b>gratis</b>: <code>npx claudescope-cli</code>. Open source.', en: 'One command and <b>free</b>: <code>npx claudescope-cli</code>. Open source.' },
    ],
    tldrCta: { href: '#empezar', es: 'Cómo empezar', en: 'How to start' },
    faq: [
      { qEs: '¿ClaudeScope sube mis sesiones a algún sitio?', qEn: 'Does ClaudeScope upload my sessions anywhere?',
        aEs: 'No. Lee los ficheros de sesión que Claude Code ya guarda en tu disco y monta el índice y el panel en tu propia máquina. No hay servidor, no hay cuenta y no hay API key.',
        aEn: 'No. It reads the session files Claude Code already stores on your disk and builds the index and dashboard on your own machine. There is no server, no account and no API key.' },
      { qEs: '¿Hay que instalar algo?', qEn: 'Do I have to install anything?',
        aEs: 'No hace falta instalación permanente: con <code>npx claudescope-cli</code> se ejecuta directamente. Solo necesitas Node.js.',
        aEn: 'No permanent install is needed: <code>npx claudescope-cli</code> runs it directly. All you need is Node.js.' },
      { qEs: '¿Qué puedo buscar exactamente?', qEn: 'What can I actually search?',
        aEs: 'El texto completo de las conversaciones: tus mensajes, las respuestas y las llamadas a herramientas. Sirve justo para lo que uno hace a mano y mal: recordar en qué sesión resolviste un problema concreto.',
        aEn: 'The full text of your conversations: your messages, the replies and the tool calls. Exactly what people otherwise do badly by hand: remembering which session solved a given problem.' },
      { qEs: '¿Cuánto cuesta?', qEn: 'How much does it cost?',
        aEs: 'Nada. Es gratis y open source, sin tier de pago ni límite de uso. El código está en GitHub.',
        aEn: 'Nothing. It is free and open source, with no paid tier and no usage limit. The code is on GitHub.' },
    ],
    related: ['lookspan', 'launchpad', 'veredicto'],
    sticky: { href: '#empezar', titleEs: 'ClaudeScope', titleEn: 'ClaudeScope', subEs: 'Gratis y open source', subEn: 'Free and open source', ctaEs: 'Empezar', ctaEn: 'Get started' },
  },

  'inferbench/index.html': {
    dir: 'es',
    tldr: [
      { es: '<b>inferbench</b> descarga, arranca y mide motores de inferencia LLM locales con un solo click.', en: '<b>inferbench</b> downloads, launches and benchmarks local LLM inference engines in one click.' },
      { es: 'Te da números reales de tu máquina: <b>tok/s, TTFT y VRAM</b>, no las cifras de marketing de un modelo.', en: 'It gives you real numbers from your machine: <b>tok/s, TTFT and VRAM</b>, not a model card headline.' },
      { es: 'Responde la única pregunta que importa antes de bajar 40 GB: <b>¿esto cabe y corre en mi GPU?</b>', en: 'It answers the one question that matters before a 40 GB download: <b>will this fit and run on my GPU?</b>' },
      { es: '<b>Gratis y open source</b>, para Windows, macOS y Linux.', en: '<b>Free and open source</b>, for Windows, macOS and Linux.' },
    ],
    tldrCta: { href: '#download', es: 'Descargar gratis', en: 'Download free' },
    faq: [
      { qEs: '¿Qué mide inferbench exactamente?', qEn: 'What does inferbench actually measure?',
        aEs: 'Tokens por segundo, tiempo hasta el primer token (TTFT) y VRAM ocupada, medidos en tu propio equipo con tu propia GPU. Son cifras reproducibles de tu hardware, no estimaciones.',
        aEn: 'Tokens per second, time to first token (TTFT) and VRAM used, measured on your own machine with your own GPU. They are reproducible numbers from your hardware, not estimates.' },
      { qEs: '¿Necesito saber de cuantización o de llama.cpp?', qEn: 'Do I need to know about quantisation or llama.cpp?',
        aEs: 'No. inferbench se encarga de descargar el modelo, elegir el motor y arrancarlo. Tú eliges el modelo del catálogo y lees los resultados.',
        aEn: 'No. inferbench handles downloading the model, picking the engine and starting it. You pick a model from the catalogue and read the results.' },
      { qEs: '¿Los modelos del catálogo son reales?', qEn: 'Are the catalogue models real?',
        aEs: 'Sí, y es una regla dura del proyecto: cada entrada del catálogo apunta a un repositorio GGUF verificado en Hugging Face. No hay modelos inventados ni enlaces muertos.',
        aEn: 'Yes, and it is a hard rule of the project: every catalogue entry points to a GGUF repository verified on Hugging Face. There are no invented models and no dead links.' },
      { qEs: '¿Envía algo a internet aparte de descargar el modelo?', qEn: 'Does it send anything online beyond downloading the model?',
        aEs: 'No. Fuera de la descarga del modelo que tú pides, todo el benchmark corre en local y no se manda telemetría.',
        aEn: 'No. Apart from downloading the model you asked for, the whole benchmark runs locally and no telemetry is sent.' },
    ],
    related: ['lookspan', 'claudescope', 'trace'],
    sticky: { href: '#download', titleEs: 'inferbench', titleEn: 'inferbench', subEs: 'Gratis y open source', subEn: 'Free and open source', ctaEs: 'Descargar', ctaEn: 'Download' },
  },

  'launchpad/index.html': {
    dir: 'es',
    tldr: [
      { es: '<b>Mission Control</b> descubre solo todos los proyectos de una carpeta y los arranca a la vez.', en: '<b>Mission Control</b> discovers every project in a folder on its own and starts them all at once.' },
      { es: 'Asigna <b>puertos sin colisión</b>, así que doce repos conviven sin pelearse por el 3000.', en: 'It assigns <b>non-colliding ports</b>, so a dozen repos coexist without fighting over port 3000.' },
      { es: 'Una pantalla con <b>logs en vivo, estado de git y salud</b> de cada servicio.', en: 'One screen with <b>live logs, git status and health</b> for every service.' },
      { es: '<b>Solo local</b>, gratis y open source. Nada sale de tu máquina.', en: '<b>Local-only</b>, free and open source. Nothing leaves your machine.' },
    ],
    tldrCta: { href: '#start', es: 'Cómo instalarlo', en: 'How to install it' },
    faq: [
      { qEs: '¿Cómo evita los choques de puerto?', qEn: 'How does it avoid port clashes?',
        aEs: 'Reserva a cada proyecto un puerto propio dentro de un rango dedicado y se lo pasa al arrancarlo, en vez de dejar que todos intenten ocupar el 3000. Así puedes tener doce servicios levantados a la vez.',
        aEn: 'It reserves a dedicated port per project inside a dedicated range and passes it in at launch, instead of letting everything grab port 3000. That is how a dozen services can run at once.' },
      { qEs: '¿Tengo que configurar cada repo a mano?', qEn: 'Do I have to configure each repo by hand?',
        aEs: 'No. Escanea la carpeta, reconoce el tipo de proyecto y deduce el comando de arranque. Solo tocas la configuración si quieres cambiar algo concreto.',
        aEn: 'No. It scans the folder, recognises the project type and infers the start command. You only touch the config if you want to change something specific.' },
      { qEs: '¿Sirve para desplegar en producción?', qEn: 'Is it for deploying to production?',
        aEs: 'No, y es deliberado. Es una herramienta de desarrollo local: levanta tu entorno de trabajo en una pantalla. No abre puertos al exterior ni gestiona servidores.',
        aEn: 'No, and that is deliberate. It is a local development tool: it brings your working environment up on one screen. It does not open ports to the outside or manage servers.' },
      { qEs: '¿Cuánto cuesta?', qEn: 'How much does it cost?',
        aEs: 'Nada. Gratis y open source, sin cuenta ni registro.',
        aEn: 'Nothing. Free and open source, with no account and no sign-up.' },
    ],
    related: ['claudescope', 'lookspan', 'pregon'],
    sticky: { href: '#start', titleEs: 'Mission Control', titleEn: 'Mission Control', subEs: 'Gratis y open source', subEn: 'Free and open source', ctaEs: 'Instalar', ctaEn: 'Install' },
  },

  'lookspan/index.html': {
    dir: 'es',
    tldr: [
      { es: '<b>Lookspan</b> captura cada llamada LLM, cada herramienta MCP y cada token de coste de tus agentes.', en: '<b>Lookspan</b> captures every LLM call, every MCP tool and every cost token from your agents.' },
      { es: 'Funciona con <b>LangGraph, CrewAI y cualquier agente MCP</b> — o cualquiera que pueda hacer un POST.', en: 'It works with <b>LangGraph, CrewAI and any MCP agent</b> — or anything that can make a POST.' },
      { es: 'Dashboard <b>local-first</b> en 127.0.0.1:3100 con un comando: <code>npx lookspan</code>.', en: 'A <b>local-first</b> dashboard on 127.0.0.1:3100 with one command: <code>npx lookspan</code>.' },
      { es: 'Sin nube y sin API keys: <b>tus trazas nunca salen de tu máquina</b>. Gratis y open source.', en: 'No cloud and no API keys: <b>your traces never leave your machine</b>. Free and open source.' },
    ],
    tldrCta: { href: '#integraciones', es: 'Instrumentar mi agente', en: 'Instrument my agent' },
    faq: [
      { qEs: '¿Mis trazas se van a algún servicio?', qEn: 'Do my traces go to some service?',
        aEs: 'No. Lookspan levanta el colector y el dashboard en 127.0.0.1 y guarda todo en local. No hay cuenta, no hay API key y no hay servidor al que enviar nada.',
        aEn: 'No. Lookspan runs the collector and dashboard on 127.0.0.1 and stores everything locally. There is no account, no API key and no server to send anything to.' },
      { qEs: '¿Qué frameworks soporta?', qEn: 'Which frameworks does it support?',
        aEs: 'Trae integración directa para LangGraph, CrewAI y agentes MCP. Para cualquier otro, basta con que pueda hacer un POST al colector: el formato está documentado.',
        aEn: 'It ships direct integrations for LangGraph, CrewAI and MCP agents. For anything else, it just needs to be able to POST to the collector: the format is documented.' },
      { qEs: '¿Cuánto código hay que tocar?', qEn: 'How much code do I have to touch?',
        aEs: 'Una línea en el caso habitual. Se instrumenta el agente al importar y a partir de ahí los spans aparecen solos en el dashboard.',
        aEn: 'One line in the usual case. You instrument the agent at import time and from then on spans show up in the dashboard by themselves.' },
      { qEs: '¿Calcula el coste de verdad o lo estima?', qEn: 'Does it compute real cost or estimate it?',
        aEs: 'Cuenta los tokens reales de cada llamada y les aplica el precio del modelo usado, así que sabes qué agente concreto se está comiendo el presupuesto.',
        aEn: 'It counts the real tokens of each call and applies the price of the model used, so you can see which specific agent is eating the budget.' },
    ],
    related: ['inferbench', 'claudescope', 'veredicto'],
    sticky: { href: '#empezar', titleEs: 'Lookspan', titleEn: 'Lookspan', subEs: 'Gratis y open source', subEn: 'Free and open source', ctaEs: 'Empezar', ctaEn: 'Get started' },
  },

  'pregon/index.html': {
    dir: 'es',
    tldr: [
      { es: '<b>Pregón</b> es un cross-poster: compones el mensaje <b>una vez</b> y se publica adaptado a cada plataforma.', en: '<b>Pregón</b> is a cross-poster: you compose the message <b>once</b> and it is published adapted to each platform.' },
      { es: 'Catorce canales, publicados <b>por API</b>, con el hilo y los límites de cada red respetados.', en: 'Fourteen channels, published <b>via API</b>, respecting each network thread format and limits.' },
      { es: 'Incluye <b>tracking de tracción</b>: un hub por proyecto con las cifras reales de npm, PyPI y GitHub.', en: 'It includes <b>traction tracking</b>: a per-project hub with real npm, PyPI and GitHub numbers.' },
      { es: '<b>Gratis y open source</b>, con tus credenciales guardadas en tu propia instalación.', en: '<b>Free and open source</b>, with your credentials stored in your own installation.' },
    ],
    tldrCta: { href: 'https://github.com/JoniMartin27/pregon', es: 'Ver en GitHub', en: 'View on GitHub' },
    faq: [
      { qEs: '¿A qué plataformas publica automáticamente?', qEn: 'Which platforms does it post to automatically?',
        aEs: 'Publica por API a los canales que tengan credenciales conectadas —entre ellos Bluesky, Mastodon y DEV.to—. Para las redes sin API abierta genera el texto adaptado listo para pegar.',
        aEn: 'It posts via API to whichever channels have credentials connected —among them Bluesky, Mastodon and DEV.to—. For networks without an open API it generates the adapted text ready to paste.' },
      { qEs: '¿Publica el mismo texto en todas partes?', qEn: 'Does it post the same text everywhere?',
        aEs: 'No, y ese es el punto. Se escribe un mensaje canónico y Pregón lo adapta al formato, la longitud y las convenciones de cada red antes de publicarlo.',
        aEn: 'No, and that is the point. You write one canonical message and Pregón adapts it to each network format, length and conventions before posting.' },
      { qEs: '¿Dónde se guardan mis credenciales?', qEn: 'Where are my credentials stored?',
        aEs: 'En tu propia instalación. Pregón corre donde tú lo pongas y no hay un servicio central de terceros que las custodie.',
        aEn: 'In your own installation. Pregón runs wherever you put it and there is no central third-party service holding them.' },
      { qEs: '¿Qué mide el tracking de tracción?', qEn: 'What does the traction tracking measure?',
        aEs: 'Cifras reales tiradas de las APIs públicas: descargas de npm y PyPI y estrellas de GitHub, agrupadas por proyecto, para ver si un anuncio movió algo.',
        aEn: 'Real numbers pulled from public APIs: npm and PyPI downloads and GitHub stars, grouped per project, so you can see whether an announcement moved anything.' },
    ],
    related: ['launchpad', 'claudescope', 'home'],
    sticky: { href: 'https://github.com/JoniMartin27/pregon', titleEs: 'Pregón', titleEn: 'Pregón', subEs: 'Gratis y open source', subEn: 'Free and open source', ctaEs: 'GitHub', ctaEn: 'GitHub' },
  },

  'regenta/index.html': {
    dir: 'es',
    tldr: [
      { es: '<b>Regenta</b> es la capa de control para dirigir una <b>flota de agentes de IA</b>, no un agente suelto.', en: '<b>Regenta</b> is the control layer for directing a <b>fleet of AI agents</b>, not a single agent.' },
      { es: 'Orquesta, <b>audita</b> y delega con la disciplina de un equipo de ingeniería: cada acción queda trazada.', en: 'It orchestrates, <b>audits</b> and delegates with the discipline of an engineering team: every action is traced.' },
      { es: 'Pensada para que los proyectos <b>sigan vivos</b> cuando nadie está mirando la pantalla.', en: 'Built so projects <b>stay alive</b> when nobody is watching the screen.' },
      { es: 'Producto comercial de Fervon, <b>en acceso por solicitud</b>.', en: 'A commercial Fervon product, <b>available by request</b>.' },
    ],
    tldrCta: { href: '#waitlist', es: 'Solicitar acceso', en: 'Request access' },
    related: ['lookspan', 'veredicto', 'contacto'],
    sticky: { href: '#waitlist', titleEs: 'Regenta', titleEn: 'Regenta', subEs: 'Acceso por solicitud', subEn: 'Access by request', ctaEs: 'Solicitar', ctaEn: 'Request' },
  },

  'trace/index.html': {
    dir: 'es',
    tldr: [
      { es: '<b>Trace</b> encuentra cualquier cosa que viste, leíste o hiciste en tu ordenador.', en: '<b>Trace</b> finds anything you saw, read or did on your computer.' },
      { es: '<b>Sin grabar la pantalla</b>: usa historial de navegador, ventana activa y portapapeles. Ni vídeo 24/7 ni capturas guardadas.', en: '<b>No screen recording</b>: it uses browser history, active window and clipboard. No 24/7 video, no stored screenshots.' },
      { es: 'Todo <b>en tu máquina</b>: sin nube y sin cuenta. Windows, macOS y Linux.', en: 'Everything <b>on your machine</b>: no cloud, no account. Windows, macOS and Linux.' },
      { es: '<b>Pago único de $39</b>, no suscripción. Es la alternativa independiente a Rewind, Limitless y Microsoft Recall.', en: '<b>$39 once</b>, not a subscription. The independent alternative to Rewind, Limitless and Microsoft Recall.' },
    ],
    tldrCta: { href: '#pricing', es: 'Ver precio', en: 'See pricing' },
    related: ['rewindAI', 'recall', 'noRecording'],
    sticky: { href: '#pricing', titleEs: 'Trace', titleEn: 'Trace', subEs: 'Pago único · $39', subEn: 'Pay once · $39', ctaEs: 'Comprar', ctaEn: 'Buy' },
  },

  'veredicto/index.html': {
    dir: 'es',
    tldr: [
      { es: '<b>Veredicto</b> es un check de CI que pilla los tests de agentes de IA que <b>no prueban nada</b>.', en: '<b>Veredicto</b> is a CI check that catches AI-agent tests that <b>prove nothing</b>.' },
      { es: 'Detecta over-mocking, asserts tautológicos y mocks de justo <b>aquello que se debía testear</b>.', en: 'It flags over-mocking, tautological asserts and mocks of <b>the very thing under test</b>.' },
      { es: 'Es una GitHub Action determinista: <b>sin API key</b> y sin que nada salga de tu runner.', en: 'A deterministic GitHub Action: <b>no API key</b>, and nothing leaves your runner.' },
      { es: '<b>$19 por repositorio</b>, pago único. Sin tier gratis, sin upsell y sin contar ejecuciones.', en: '<b>$19 per repository</b>, one payment. No free tier, no upsell, no usage metering.' },
    ],
    tldrCta: { href: '#pricing', es: 'Comprar licencia', en: 'Buy a licence' },
    related: ['report', 'lookspan', 'claudescope'],
    sticky: { href: '#pricing', titleEs: 'Veredicto', titleEn: 'Veredicto', subEs: '$19 por repositorio', subEn: '$19 per repository', ctaEs: 'Comprar', ctaEn: 'Buy' },
  },

  'veredicto/report.html': {
    dir: 'none',
    afterHero: '    </header>\n',
    tldr: [
      { es: '', en: 'Fast AI agents were asked to write <b>thorough unit tests</b> for 20 modules that each contained a real bug.' },
      { es: '', en: '<b>100% of the suites passed.</b> Every single one went green against buggy code.' },
      { es: '', en: '<b>0% caught the bug</b> they were supposed to guard, and 75% asserted the buggy output as correct.' },
      { es: '', en: 'The method, the seeded modules and the scorers are <b>reproducible</b> — you can run it against your own model.' },
    ],
    tldrCta: { href: '/veredicto/', es: '', en: 'How Veredicto catches this' },
    faq: [
      { qEs: '', qEn: 'How was the experiment run?',
        aEs: '', aEn: 'Twenty modules were seeded with a real, behaviour-changing bug each. Fast AI agents were then asked to write thorough unit tests for every module, without being told a bug was present. The resulting suites were run against the buggy code.' },
      { qEs: '', qEn: 'What does "0% caught the bug" mean exactly?',
        aEs: '', aEn: 'It means no suite produced a failing test that exposed the seeded bug. All twenty went green against code that was known to be wrong.' },
      { qEs: '', qEn: 'Does this mean AI should not write tests?',
        aEs: '', aEn: 'No. It means a green suite written by the same agent that wrote the code is not evidence the code works. The tests still have value as regression scaffolding; they just cannot be the thing that verifies correctness.' },
      { qEs: '', qEn: 'Can I reproduce this myself?',
        aEs: '', aEn: 'Yes. The seeded modules and the scorers are in the public repository, so you can run the same experiment against your own model and compare.' },
      { qEs: '', qEn: 'What catches this in a real pull request?',
        aEs: '', aEn: 'A human reviewer, mutation testing, or a deterministic check like Veredicto that flags the specific patterns — over-mocking, tautological asserts, mocking the unit under test — before the pull request is merged.' },
    ],
    related: ['veredicto', 'lookspan', 'home'],
    sticky: { href: '/veredicto/#pricing', titleEs: '', titleEn: 'Veredicto', subEs: '', subEn: '$19 per repository', ctaEs: '', ctaEn: 'Get a licence' },
  },

  /* ── Páginas de artículo de Trace (inglés principal, data-es secundario) ── */
  'trace/rewind-ai-alternative.html': {
    dir: 'en',
    tldr: [
      { es: 'Rewind AI fue adquirida por Meta y su app de escritorio <b>cerró el 19 de diciembre de 2025</b>.', en: 'Rewind AI was acquired by Meta and its desktop app <b>shut down on 19 December 2025</b>.' },
      { es: '<b>Trace</b> es la sustituta local-first: historial de navegador, ventana activa y portapapeles, sin nube.', en: '<b>Trace</b> is the local-first replacement: browser history, active window and clipboard, with no cloud.' },
      { es: 'A diferencia de Rewind, es <b>multiplataforma</b> (Windows, macOS y Linux), no solo Mac.', en: 'Unlike Rewind, it is <b>cross-platform</b> (Windows, macOS and Linux), not Mac-only.' },
      { es: '<b>Pago único de $39</b> en vez de suscripción, y ninguna empresa puede apagártela.', en: '<b>$39 once</b> instead of a subscription, and no company can switch it off on you.' },
    ],
    tldrCta: { href: '#pricing', es: 'Ver Trace', en: 'See Trace' },
    related: ['rewindWin', 'shutdown', 'trace'],
    sticky: { href: '#pricing', titleEs: 'Trace', titleEn: 'Trace', subEs: 'Pago único · $39', subEn: 'Pay once · $39', ctaEs: 'Comprar', ctaEn: 'Buy' },
  },

  'trace/rewind-alternative-windows.html': {
    dir: 'en',
    tldr: [
      { es: 'Rewind AI <b>solo existía para Mac</b>, y además Meta cerró la app de escritorio.', en: 'Rewind AI was <b>Mac-only</b>, and on top of that Meta shut the desktop app down.' },
      { es: '<b>Trace</b> corre nativamente en <b>Windows</b> (también en macOS y Linux) con la misma idea.', en: '<b>Trace</b> runs natively on <b>Windows</b> (and on macOS and Linux) with the same idea.' },
      { es: 'Busca lo que viste y leíste <b>sin grabar la pantalla</b> y sin subir nada a la nube.', en: 'It searches what you saw and read <b>without recording your screen</b> and without uploading anything.' },
      { es: '<b>Pago único de $39</b>, sin suscripción y sin cuenta.', en: '<b>$39 once</b>, no subscription and no account.' },
    ],
    tldrCta: { href: '#pricing', es: 'Ver Trace', en: 'See Trace' },
    related: ['rewindAI', 'recall', 'trace'],
    sticky: { href: '#pricing', titleEs: 'Trace', titleEn: 'Trace', subEs: 'Pago único · $39', subEn: 'Pay once · $39', ctaEs: 'Comprar', ctaEn: 'Buy' },
  },

  'trace/limitless-alternative.html': {
    dir: 'en',
    tldr: [
      { es: 'Meta compró Limitless (antes Rewind) y cerró la app de escritorio: no quedó ninguna opción local.', en: 'Meta bought Limitless (formerly Rewind) and shut the desktop app down, leaving no local option.' },
      { es: '<b>Trace</b> es la alternativa <b>independiente</b>: local-first, sin nube y sin cuenta.', en: '<b>Trace</b> is the <b>independent</b> alternative: local-first, no cloud, no account.' },
      { es: 'Tus recuerdos no cambian de dueño con una adquisición porque <b>nunca salen de tu máquina</b>.', en: 'Your memory does not change owner in an acquisition because it <b>never leaves your machine</b>.' },
      { es: '<b>Pago único de $39</b>. Windows, macOS y Linux.', en: '<b>$39 once</b>. Windows, macOS and Linux.' },
    ],
    tldrCta: { href: '#pricing', es: 'Ver Trace', en: 'See Trace' },
    related: ['rewindAI', 'shutdown', 'trace'],
    sticky: { href: '#pricing', titleEs: 'Trace', titleEn: 'Trace', subEs: 'Pago único · $39', subEn: 'Pay once · $39', ctaEs: 'Comprar', ctaEn: 'Buy' },
  },

  'trace/microsoft-recall-alternative.html': {
    dir: 'en',
    tldr: [
      { es: 'Microsoft Recall exige un <b>PC Copilot+</b> y guarda capturas continuas de tu pantalla.', en: 'Microsoft Recall requires a <b>Copilot+ PC</b> and keeps continuous screenshots of your screen.' },
      { es: '<b>Trace</b> da la misma memoria buscable en <b>cualquier PC</b>, también en macOS y Linux.', en: '<b>Trace</b> gives the same searchable memory on <b>any PC</b>, plus macOS and Linux.' },
      { es: 'No hace capturas: usa historial de navegador, ventana activa y portapapeles. <b>Menos superficie de riesgo</b>.', en: 'It takes no screenshots: it uses browser history, active window and clipboard. <b>A much smaller risk surface</b>.' },
      { es: 'Todo <b>en el dispositivo</b> y <b>pago único de $39</b>.', en: 'Fully <b>on-device</b>, and <b>$39 once</b>.' },
    ],
    tldrCta: { href: '#pricing', es: 'Ver Trace', en: 'See Trace' },
    related: ['noRecording', 'rewindWin', 'trace'],
    sticky: { href: '#pricing', titleEs: 'Trace', titleEn: 'Trace', subEs: 'Pago único · $39', subEn: 'Pay once · $39', ctaEs: 'Comprar', ctaEn: 'Buy' },
  },

  'trace/screenpipe-alternative.html': {
    dir: 'en',
    tldr: [
      { es: 'Screenpipe tiene buena idea, pero pesa mucho en la máquina y su nube va por suscripción.', en: 'Screenpipe has the right idea, but it is heavy on the machine and its cloud is a subscription.' },
      { es: '<b>Trace</b> es la versión ligera: sin grabación continua de pantalla y con mucho menos consumo.', en: '<b>Trace</b> is the lightweight take: no continuous screen capture and a far smaller footprint.' },
      { es: '<b>Sin nube</b>: todo queda en local, sin cuenta y sin API key.', en: '<b>No cloud</b>: everything stays local, with no account and no API key.' },
      { es: '<b>Pago único de $39</b> en lugar de una cuota mensual.', en: '<b>$39 once</b> instead of a monthly fee.' },
    ],
    tldrCta: { href: '#pricing', es: 'Ver Trace', en: 'See Trace' },
    related: ['noRecording', 'rewindAI', 'trace'],
    sticky: { href: '#pricing', titleEs: 'Trace', titleEn: 'Trace', subEs: 'Pago único · $39', subEn: 'Pay once · $39', ctaEs: 'Comprar', ctaEn: 'Buy' },
  },

  'trace/rewind-shut-down-what-to-use.html': {
    dir: 'en',
    tldr: [
      { es: 'La app de escritorio de Rewind <b>cerró el 19 de diciembre de 2025</b> tras la compra por Meta.', en: 'Rewind desktop app <b>shut down on 19 December 2025</b> after the Meta acquisition.' },
      { es: 'Las opciones que quedaron: Microsoft Recall (solo PCs Copilot+), Screenpipe (pesado, nube de pago) y <b>Trace</b>.', en: 'What survived: Microsoft Recall (Copilot+ PCs only), Screenpipe (heavy, paid cloud) and <b>Trace</b>.' },
      { es: '<b>Trace</b> es la independiente y local-first: sin grabar pantalla, sin nube y multiplataforma.', en: '<b>Trace</b> is the independent, local-first one: no screen recording, no cloud, cross-platform.' },
      { es: '<b>Pago único de $39</b> — nadie puede apagarla desde fuera.', en: '<b>$39 once</b> — nobody can switch it off from the outside.' },
    ],
    tldrCta: { href: '#pricing', es: 'Ver Trace', en: 'See Trace' },
    related: ['rewindAI', 'limitless', 'recall'],
    sticky: { href: '#pricing', titleEs: 'Trace', titleEn: 'Trace', subEs: 'Pago único · $39', subEn: 'Pay once · $39', ctaEs: 'Comprar', ctaEn: 'Buy' },
  },

  'trace/personal-memory-tool-without-screen-recording.html': {
    dir: 'en',
    tldr: [
      { es: 'Casi todas las apps de memoria personal graban tu pantalla en vídeo o en capturas continuas.', en: 'Almost every personal-memory app records your screen as video or continuous screenshots.' },
      { es: '<b>Trace</b> no graba nada: usa <b>historial de navegador, ventana activa y portapapeles</b>.', en: '<b>Trace</b> records none of it: it uses <b>browser history, active window and clipboard</b>.' },
      { es: 'Sin vídeo 24/7 ni capturas almacenadas, el riesgo si te roban el portátil <b>cae en picado</b>.', en: 'With no 24/7 video and no stored screenshots, the risk if your laptop is stolen <b>drops sharply</b>.' },
      { es: 'Local-first, multiplataforma y de <b>pago único, $39</b>.', en: 'Local-first, cross-platform, and <b>$39 once</b>.' },
    ],
    tldrCta: { href: '#pricing', es: 'Ver Trace', en: 'See Trace' },
    related: ['recall', 'screenpipe', 'trace'],
    sticky: { href: '#pricing', titleEs: 'Trace', titleEn: 'Trace', subEs: 'Pago único · $39', subEn: 'Pay once · $39', ctaEs: 'Comprar', ctaEn: 'Buy' },
  },
};

/* ── Aplicación ─────────────────────────────────────────────────────────── */
let changed = 0;
const report = [];

for (const [rel, cfg] of Object.entries(PAGES)) {
  let html = read(rel);
  const before = html;
  const did = [];

  /* 1. TL;DR justo después del hero (intención de búsqueda primero). */
  if (!html.includes('<!-- seo:tldr -->')) {
    const block = tldrBlock(cfg.dir, cfg.tldr, cfg.tldrCta);
    if (cfg.afterHero) {
      if (!html.includes(cfg.afterHero)) throw new Error(`${rel}: no encuentro el ancla afterHero`);
      html = html.replace(cfg.afterHero, cfg.afterHero + block);
    } else {
      // Páginas de producto y de Trace: antes de la primera <section class="sec">.
      const m = html.match(/\n( *)<section class="sec/);
      if (!m) throw new Error(`${rel}: no encuentro la primera <section class="sec">`);
      html = html.replace(m[0], '\n' + block + m[0].slice(1));
    }
    did.push('tldr');
  }

  /* 2. FAQ visible + schema, sólo donde falta. */
  if (cfg.faq && !html.includes('<!-- seo:faq -->')) {
    const endMain = cfg.beforeEnd || '  </main>\n';
    if (!html.includes(endMain)) throw new Error(`${rel}: no encuentro el cierre de <main>`);
    html = html.replace(endMain, faqBlock(cfg.dir, cfg.faq) + endMain);
    did.push('faq');
  }

  /* 3. Schema FAQPage. Puede venir de un FAQ nuevo o de uno que ya existía en
        la página sin marcado (caso de /contacto/). */
  const qas = cfg.faq || cfg.schemaOnlyFaq;
  if (qas && !/"@type":\s*"FAQPage"/.test(html)) {
    const anchor = '  <link rel="stylesheet"';
    if (!html.includes(anchor)) throw new Error(`${rel}: no encuentro dónde colgar el schema`);
    html = html.replace(anchor, faqSchema(cfg.dir, qas) + '\n' + anchor);
    did.push('faq-schema');
  }

  /* 4. Clúster de enlaces internos + botón de compartir. */
  if (!html.includes('<!-- seo:related -->')) {
    const endMain = cfg.beforeEnd || '  </main>\n';
    html = html.replace(endMain, relatedBlock(cfg.dir, cfg.related, true) + endMain);
    did.push('related+share');
  }

  /* 5. CTA fijo en móvil, fuera de <main> para que no entre en el flujo. */
  if (!html.includes('<!-- seo:sticky -->')) {
    const anchor = '  <footer';
    if (!html.includes(anchor)) throw new Error(`${rel}: no encuentro <footer>`);
    html = html.replace(anchor, stickyBlock(cfg.dir, cfg.sticky) + '\n' + anchor);
    did.push('sticky');
  }

  if (html !== before) { write(rel, html); changed++; }
  report.push(`${did.length ? '✔' : '·'} ${rel.padEnd(58)} ${did.join(', ') || 'sin cambios'}`);
}

console.log(report.join('\n'));
console.log(`\n${changed} página(s) modificadas de ${Object.keys(PAGES).length}.`);
