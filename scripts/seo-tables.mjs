/* ============================================================================
   scripts/seo-tables.mjs
   ----------------------------------------------------------------------------
   Punto 11 del checklist SEO ("usa tablas y listas"). Las listas ya las cubre
   el TL;DR y el FAQ que inserta seo-blocks.mjs; faltaba una TABLA en las cinco
   páginas que no tenían ninguna: home, ClaudeScope, Lookspan, Regenta y el
   informe de Veredicto.

   Regla que se ha seguido: la tabla sólo repite datos que YA están en la propia
   página o en su JSON-LD (precio, licencia, sistemas operativos, comando de
   arranque, cifras del experimento). No se inventa ni una celda.

   Idempotente: marca `<!-- seo:table -->`.

   Uso:  node scripts/seo-tables.mjs
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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
const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const bi = (dir, es, en) =>
  dir === 'es' ? ` data-en="${attr(en)}">${es}` : dir === 'en' ? ` data-es="${attr(es)}">${en}` : `>${en}`;

/* Construye la sección con la tabla. `head` son las celdas de cabecera y `rows`
   las filas; cada celda es [es, en] o una cadena si no se traduce (cifras). */
function tableSection(dir, id, eyeEs, eyeEn, h2Es, h2En, capEs, capEn, head, rows) {
  const cell = (c, tag) =>
    Array.isArray(c) ? `<${tag}${bi(dir, c[0], c[1])}</${tag}>` : `<${tag}>${c}</${tag}>`;
  const thead = `          <tr>${head.map((c) => cell(c, 'th')).join('')}</tr>`;
  const tbody = rows
    .map((r) => `          <tr>${r.map((c, i) => cell(c, i === 0 ? 'th' : 'td')).join('')}</tr>`)
    .join('\n');
  return `
    <!-- seo:table -->
    <section class="sec seosec" id="${id}" aria-labelledby="${id}-h">
      <div class="wrap">
        <div class="center reveal">
          <span class="eye"${bi(dir, eyeEs, eyeEn)}</span>
          <h2 id="${id}-h"${bi(dir, h2Es, h2En)}</h2>
        </div>
        <div class="tablewrap reveal">
          <table class="seotable">
            <caption class="vh"${bi(dir, capEs, capEn)}</caption>
            <thead>
${thead}
            </thead>
            <tbody>
${tbody}
            </tbody>
          </table>
        </div>
      </div>
    </section>
`;
}

const JOBS = {
  /* Home: el portfolio de un vistazo. Precios y licencias son los que ya
     declara el JSON-LD de cada página de producto. */
  'index.html': tableSection(
    'es', 'comparativa', 'De un vistazo', 'At a glance',
    'Todo el portfolio, comparado', 'The whole portfolio, compared',
    'Productos y herramientas de Fervon con su precio, licencia y plataformas.',
    'Fervon products and tools with their price, licence and platforms.',
    [['Producto', 'Product'], ['Para qué', 'What for'], ['Precio', 'Price'], ['Licencia', 'Licence'], ['Plataformas', 'Platforms']],
    [
      [['<a href="/trace/">Trace</a>', '<a href="/trace/">Trace</a>'], ['Memoria personal buscable', 'Searchable personal memory'], ['$39 pago único', '$39 once'], ['Comercial', 'Commercial'], 'Windows · macOS · Linux'],
      [['<a href="/veredicto/">Veredicto</a>', '<a href="/veredicto/">Veredicto</a>'], ['Pillar tests amañados en CI', 'Catch gamed tests in CI'], ['$19 por repo', '$19 per repo'], ['Comercial', 'Commercial'], 'GitHub Actions'],
      [['<a href="/inferbench/">inferbench</a>', '<a href="/inferbench/">inferbench</a>'], ['Benchmark de LLM locales', 'Local LLM benchmarking'], ['Gratis', 'Free'], 'MIT', 'Windows · macOS · Linux'],
      [['<a href="/lookspan/">Lookspan</a>', '<a href="/lookspan/">Lookspan</a>'], ['Observabilidad de agentes', 'Agent observability'], ['Gratis', 'Free'], 'MIT', 'Windows · macOS · Linux'],
      [['<a href="/claudescope/">ClaudeScope</a>', '<a href="/claudescope/">ClaudeScope</a>'], ['Buscar sesiones de Claude Code', 'Search Claude Code sessions'], ['Gratis', 'Free'], 'MIT', 'Windows · macOS · Linux'],
      [['<a href="/launchpad/">Mission Control</a>', '<a href="/launchpad/">Mission Control</a>'], ['Arrancar todos tus repos', 'Start every repo at once'], ['Gratis', 'Free'], 'MIT', 'Windows · macOS · Linux'],
      [['<a href="/pregon/">Pregón</a>', '<a href="/pregon/">Pregón</a>'], ['Publicar en 14 canales', 'Post to 14 channels'], ['Gratis', 'Free'], 'MIT', ['Web (autoalojado)', 'Web (self-hosted)']],
      [['<a href="/regenta/">Regenta</a>', '<a href="/regenta/">Regenta</a>'], ['Gobernar flotas de agentes', 'Govern agent fleets'], ['Por solicitud', 'By request'], ['Comercial', 'Commercial'], 'Web'],
    ],
  ),

  /* Contacto: las condiciones de un encargo, tal y como las dice su propio FAQ. */
  'contacto/index.html': tableSection(
    'es', 'condiciones', 'Condiciones', 'Terms',
    'Cómo es trabajar conmigo', 'What working with me looks like',
    'Condiciones de un encargo de desarrollo a medida con Fervon.',
    'Terms for a bespoke development engagement with Fervon.',
    [['Concepto', 'Item'], ['Cómo funciona', 'How it works']],
    [
      [['Precio', 'Pricing'], ['Por proyecto, cerrado antes de empezar. Nunca por horas.', 'Per project, closed before we start. Never by the hour.']],
      [['Alcance', 'Scope'], ['Acordado por escrito antes de que arranque nada', 'Agreed in writing before any work begins']],
      [['Propiedad del código', 'Code ownership'], ['Tuya. Documentado y traspasado, sin dependencia de mí ni de ninguna plataforma.', 'Yours. Documented and handed over, with no lock-in to me or any platform.']],
      [['Con quién hablas', 'Who you talk to'], ['Conmigo, directamente. No hay intermediarios ni comerciales.', 'With me, directly. No middlemen, no salespeople.']],
      [['Dónde estoy', 'Where I am'], ['Remoto desde España (CET), con clientes en cualquier huso horario', 'Remote from Spain (CET), with clients in any timezone']],
      [['Forma de trabajo', 'Working style'], ['Asíncrono por defecto; llamadas cuando ayudan', 'Async by default; calls when they help']],
      [['Stack', 'Stack'], 'TypeScript/Node · React · Python · SQLite/Postgres · LLM (Claude + llama.cpp)'],
      [['Idiomas', 'Languages'], ['Español e inglés', 'Spanish and English']],
    ],
  ),

  'claudescope/index.html': tableSection(
    'es', 'ficha', 'Ficha', 'Spec sheet',
    'ClaudeScope de un vistazo', 'ClaudeScope at a glance',
    'Precio, licencia, requisitos y tratamiento de datos de ClaudeScope.',
    'ClaudeScope price, licence, requirements and data handling.',
    [['Dato', 'Item'], ['Valor', 'Value']],
    [
      [['Precio', 'Price'], ['Gratis, sin tier de pago', 'Free, with no paid tier']],
      [['Licencia', 'Licence'], 'MIT (open source)'],
      [['Cómo se ejecuta', 'How you run it'], '<code>npx claudescope-cli</code>'],
      [['Requisitos', 'Requirements'], 'Node.js'],
      [['Plataformas', 'Platforms'], 'Windows · macOS · Linux'],
      [['Dónde corre', 'Where it runs'], ['En tu máquina, sobre los ficheros de sesión de tu disco', 'On your machine, over the session files on your disk']],
      [['Cuenta o API key', 'Account or API key'], ['No hace falta ninguna', 'Neither is needed']],
      [['Telemetría', 'Telemetry'], ['Ninguna: no sube nada', 'None: nothing is uploaded']],
    ],
  ),

  'lookspan/index.html': tableSection(
    'es', 'ficha', 'Ficha', 'Spec sheet',
    'Lookspan de un vistazo', 'Lookspan at a glance',
    'Precio, licencia, integraciones y tratamiento de datos de Lookspan.',
    'Lookspan price, licence, integrations and data handling.',
    [['Dato', 'Item'], ['Valor', 'Value']],
    [
      [['Precio', 'Price'], ['Gratis, sin tier de pago', 'Free, with no paid tier']],
      [['Licencia', 'Licence'], 'MIT (open source)'],
      [['Cómo se ejecuta', 'How you run it'], '<code>npx lookspan</code>'],
      [['Dashboard', 'Dashboard'], '127.0.0.1:3100'],
      [['Plataformas', 'Platforms'], 'Windows · macOS · Linux'],
      [['Integraciones', 'Integrations'], ['LangGraph, CrewAI, agentes MCP y cualquiera que pueda hacer un POST', 'LangGraph, CrewAI, MCP agents, and anything that can POST']],
      [['Qué captura', 'What it captures'], ['Llamadas LLM, herramientas MCP y coste por tokens', 'LLM calls, MCP tools and per-token cost']],
      [['Cuenta o API key', 'Account or API key'], ['No hace falta ninguna', 'Neither is needed']],
      [['Tus trazas', 'Your traces'], ['Nunca salen de tu máquina', 'Never leave your machine']],
    ],
  ),

  'regenta/index.html': tableSection(
    'es', 'ficha', 'Ficha', 'Spec sheet',
    'Regenta de un vistazo', 'Regenta at a glance',
    'Qué es Regenta, para quién es y cómo se accede.',
    'What Regenta is, who it is for and how to get access.',
    [['Dato', 'Item'], ['Valor', 'Value']],
    [
      [['Qué es', 'What it is'], ['La capa de control para dirigir una flota de agentes, no un agente suelto', 'The control layer for directing a fleet of agents, not a single agent']],
      [['No es', 'What it is not'], ['Un chatbot: es una sala de mando con objetivos y alcances', 'A chatbot: it is a command room with goals and scopes']],
      [['Qué aporta', 'What it adds'], ['Orquestación, auditoría y delegación con cada acción trazada', 'Orchestration, auditing and delegation with every action traced']],
      [['Plataforma', 'Platform'], 'Web'],
      [['Modelo', 'Model'], ['Producto comercial de Fervon', 'A commercial Fervon product']],
      [['Acceso', 'Access'], ['Por solicitud', 'By request']],
    ],
  ),

  'veredicto/report.html': tableSection(
    'none', 'numbers', '', 'The numbers',
    '', 'The experiment in one table',
    '', 'Setup and results of the AI-written test experiment.',
    ['Measure', 'Result'],
    [
      ['Modules under test', '20, each seeded with one real bug'],
      ['Test suites written by AI agents', '20'],
      ['Suites that passed against buggy code', '<b>100%</b>'],
      ['Suites that caught the seeded bug', '<b>0%</b>'],
      ['Suites that asserted the buggy output as correct', '<b>75%</b>'],
      ['Reproducible', 'Yes — seeded modules and scorers are in the public repo'],
    ],
  ),
};

let n = 0;
for (const [rel, block] of Object.entries(JOBS)) {
  let html = read(rel);
  if (html.includes('<!-- seo:table -->')) { console.log(`· ${rel} — ya tenía tabla`); continue; }
  const anchor = '\n    <!-- seo:related -->';
  if (!html.includes(anchor)) throw new Error(`${rel}: falta el ancla seo:related`);
  html = html.replace(anchor, '\n' + block + anchor);
  write(rel, html);
  console.log(`✔ ${rel}`);
  n++;
}
console.log(`\n${n} tabla(s) insertada(s).`);
