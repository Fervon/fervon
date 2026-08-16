/* ============================================================================
   scripts/seo-metas.mjs
   ----------------------------------------------------------------------------
   Ajusta <title> y <meta name="description"> a lo que Google llega a MOSTRAR.

   Medido el 2026-08-14 en vivo: 13 de 18 títulos pasaban de 60 caracteres y 16
   de 18 descripciones de 160, así que salían cortados en el SERP — varios
   perdían el nombre de marca y alguno la propuesta de valor entera (Pregón
   tenía una descripción de 428 caracteres, casi el triple de lo que se ve).

   Criterio de reescritura:
     · La palabra clave va DELANTE, porque lo que se corta es el final.
     · El significado no cambia: no se promete nada que la página no cumpla.
     · Se respeta el idioma de cada página (las de Trace van en inglés).
     · Sólo se tocan <title> y description; los og:* pueden ser más largos
       porque las tarjetas sociales sí los muestran enteros.

   Uso:  node scripts/seo-metas.mjs
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const META = {
  'index.html': {
    d: 'Estudio de software autónomo de Jonathan Martín: Trace, Veredicto y herramientas open source local-first, hechas con flotas de agentes de IA.',
  },
  'contacto/index.html': {},
  'claudescope/index.html': {
    t: 'ClaudeScope · Busca en tus sesiones de Claude Code | Fervon',
    d: 'Búsqueda full-text en cada sesión de Claude Code, más el panel de uso que tu suscripción no enseña. Un comando, 100% local. Gratis y open source.',
  },
  'inferbench/index.html': {
    t: 'inferbench · Benchmark de LLM locales en tu GPU | Fervon',
    d: 'Descarga, arranca y benchmarkea motores LLM locales con un click. tok/s, TTFT y VRAM reales de tu GPU. 100% local. Gratis y open source.',
  },
  'launchpad/index.html': {
    t: 'Mission Control · Arranca tus repos sin choques de puerto',
    d: 'Descubre los proyectos de una carpeta y los arranca a la vez en puertos sin colisión, con logs, git y salud. Local-only. Gratis y open source.',
  },
  'lookspan/index.html': {
    t: 'Lookspan · Observabilidad local-first de agentes IA | Fervon',
    d: 'Captura cada llamada LLM, herramienta MCP y token de coste de tus agentes LangGraph, CrewAI y MCP. Dashboard local con npx lookspan. Gratis.',
  },
  'pregon/index.html': {
    d: 'Cross-poster open source: compón un mensaje una vez y publícalo adaptado a 14 canales, con tracción real de npm, PyPI y GitHub. Self-host y gratis.',
  },
  'regenta/index.html': {
    d: 'La capa de control agentic: orquesta, audita y delega una flota de agentes de IA con la disciplina de un equipo de ingeniería. Producto de Fervon.',
  },
  'trace/index.html': {
    d: 'Encuentra cualquier cosa que viste, leíste o hiciste, sin grabar la pantalla ni subir nada a la nube. Alternativa a Rewind y Recall. Pago único $39.',
  },
  'veredicto/index.html': {
    t: 'Veredicto · El check de CI que pilla tests amañados | Fervon',
    d: 'El check de CI que detecta tests de agentes que no prueban nada: over-mocking, asserts vacuos y .skip. Determinista, en el PR y sin API key.',
  },
  'veredicto/report.html': {
    t: 'AI wrote tests for 20 buggy modules. None caught the bug',
    d: 'A reproducible experiment: AI agents wrote tests for 20 modules with real bugs. All 20 suites passed; none caught the bug. Data and method inside.',
  },
  'trace/limitless-alternative.html': {
    t: 'Limitless alternative, local-first | Trace by Fervon',
    d: 'Meta bought Limitless and shut the desktop app down. Trace is the independent, on-device alternative: no wearable, no cloud, pay once.',
  },
  'trace/microsoft-recall-alternative.html': {
    t: 'Microsoft Recall alternative for any PC | Trace by Fervon',
    d: 'Recall searchable memory without the Copilot+ PC lock-in or the privacy risk. Fully on-device on Windows, Mac and Linux. Pay once, $39.',
  },
  'trace/personal-memory-tool-without-screen-recording.html': {
    t: 'Personal memory app, no screen recording | Trace by Fervon',
    d: 'Browser history, active window and clipboard — no 24/7 video, no stored screenshots. Local-first memory for Windows, Mac and Linux. Pay once, $39.',
  },
  'trace/rewind-ai-alternative.html': {
    t: 'Rewind AI alternative, local and pay-once | Trace by Fervon',
    d: 'Rewind AI shut down after the Meta acquisition. Trace is the local-first alternative: browser, window and clipboard search. No cloud, pay once.',
  },
  'trace/rewind-alternative-windows.html': {
    t: 'Rewind alternative for Windows | Trace by Fervon',
    d: 'Rewind was Mac-only and Meta shut it down. Trace is the local-first, pay-once Rewind alternative for Windows. No screen recording, no cloud.',
  },
  'trace/rewind-shut-down-what-to-use.html': {
    d: 'Rewind desktop app closed on 19 Dec 2025. An honest roundup of the options left, and why Trace is the independent local-first replacement.',
  },
  'trace/screenpipe-alternative.html': {
    t: 'Screenpipe alternative: lighter, no cloud | Trace by Fervon',
    d: 'The Screenpipe idea without the heavy footprint or the subscription cloud. Light signals instead of 24/7 video, truly local, one-time $39.',
  },
};

let changed = 0;
const problemas = [];
for (const [rel, m] of Object.entries(META)) {
  const file = path.join(ROOT, rel);
  const raw = fs.readFileSync(file, 'utf8');
  const crlf = /\r\n/.test(raw);
  let h = raw.replace(/\r\n/g, '\n');
  const before = h;

  if (m.t) {
    if (m.t.length > 60) problemas.push(`${rel}: título propuesto de ${m.t.length} car.`);
    h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${m.t}</title>`);
  }
  if (m.d) {
    if (m.d.length > 160) problemas.push(`${rel}: descripción propuesta de ${m.d.length} car.`);
    h = h.replace(/(<meta name="description" content=")[\s\S]*?("\s*\/?>)/, `$1${m.d}$2`);
  }

  if (h !== before) {
    fs.writeFileSync(file, crlf ? h.replace(/\n/g, '\r\n') : h);
    changed++;
    const t = (h.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
    const d = (h.match(/<meta name="description" content="([\s\S]*?)"\s*\/?>/) || [])[1] || '';
    console.log(`✔ ${rel.padEnd(56)} título ${String(t.length).padStart(3)}  desc ${String(d.length).padStart(3)}`);
  }
}
if (problemas.length) { console.error('\nPROPUESTAS QUE SE PASAN DE LARGO:'); problemas.forEach((p) => console.error('  ' + p)); process.exit(1); }
console.log(`\n${changed} página(s) actualizadas.`);
