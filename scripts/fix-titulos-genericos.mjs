#!/usr/bin/env node
/* ============================================================================
   scripts/fix-titulos-genericos.mjs
   ----------------------------------------------------------------------------
   Cuatro páginas gastaban 13-17 caracteres de los ~60 que Google muestra en un
   resultado, y los gastaban en no decir nada: «News · Fervon», «Contacto ·
   Fervon». El resto del sitio tiene títulos de 40-60 con la propuesta dentro.
   El h1 de /blog/ ya decía «Noticias. Qué sale del taller.» — eso sí es un
   título; el <title> no se había enterado.

   De paso, la description de /about/ medía 173 caracteres y se cortaba a media
   frase.

   El español vive en las fuentes de src-i18n; el inglés, en i18n-meta.json.
   Después hay que pasar `npm run i18n:build` para propagarlo.

   Idempotente. Uso:  node scripts/fix-titulos-genericos.mjs [--check]
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

/* Cada entrada: la fuente española y su gemela inglesa en i18n-meta.json. */
const CAMBIOS = [
  {
    fuente: 'src-i18n/blog/index.html',
    clave: '/blog/',
    es: {
      title: 'Noticias de agentes de IA y software autónomo | Fervon',
      ogTitle: 'Noticias. Qué sale del taller.',
    },
    en: {
      title: 'News on AI agents and autonomous software | Fervon',
      ogTitle: 'News. What comes out of the workshop.',
    },
  },
  {
    fuente: 'src-i18n/contacto/index.html',
    clave: '/contacto/',
    es: {
      title: 'Contacto · Desarrollo a medida con agentes de IA | Fervon',
      ogTitle: 'Construyamos algo. Forjado al rojo vivo.',
    },
    en: {
      title: 'Contact · Bespoke development with AI agents | Fervon',
      ogTitle: "Let's build something. Forged red-hot.",
    },
  },
  {
    fuente: 'src-i18n/about/index.html',
    clave: '/about/',
    es: {
      desc: 'El estudio de software autónomo de Jonathan Martín: una persona dirigiendo flotas de agentes de IA que hacen productos local-first y open source.',
    },
    en: {},
  },
];

/** Sustituye el contenido de una meta o del <title> en el HTML fuente. */
function poner(html, campo, valor) {
  const patrones = {
    title: [/(<title>)([\s\S]*?)(<\/title>)/, (m, a, _v, b) => a + valor + b],
    desc: [/(<meta name="description" content=")([^"]*)(")/, (m, a, _v, b) => a + valor + b],
    ogTitle: [/(<meta property="og:title" content=")([^"]*)(")/, (m, a, _v, b) => a + valor + b],
  };
  const [re, fn] = patrones[campo];
  if (!re.test(html)) throw new Error('no encuentro ' + campo);
  return html.replace(re, fn);
}

let tocados = 0;
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/i18n-meta.json'), 'utf8'));
let metaCambiada = false;

for (const c of CAMBIOS) {
  // --- español: en la fuente ---
  const abs = path.join(ROOT, c.fuente);
  const antes = fs.readFileSync(abs, 'utf8');
  let html = antes;
  for (const [campo, valor] of Object.entries(c.es)) html = poner(html, campo, valor);
  if (html !== antes) {
    if (!CHECK) fs.writeFileSync(abs, html, 'utf8');
    for (const [campo, valor] of Object.entries(c.es)) {
      console.log(`  ${c.fuente}  ${campo} → "${valor}" (${valor.length})`);
    }
    tocados++;
  }

  // --- inglés: en i18n-meta.json ---
  meta[c.clave] = meta[c.clave] || {};
  meta[c.clave].en = meta[c.clave].en || {};
  for (const [campo, valor] of Object.entries(c.en)) {
    if (meta[c.clave].en[campo] === valor) continue;
    meta[c.clave].en[campo] = valor;
    metaCambiada = true;
    console.log(`  i18n-meta ${c.clave}  en.${campo} → "${valor}" (${valor.length})`);
  }
}

if (metaCambiada && !CHECK) {
  const orden = Object.fromEntries(Object.keys(meta).sort().map((k) => [k, meta[k]]));
  fs.writeFileSync(path.join(ROOT, 'scripts/i18n-meta.json'), JSON.stringify(orden, null, 2) + '\n', 'utf8');
}

if (!tocados && !metaCambiada) console.log('  nada que cambiar: ya estaban puestos');
else console.log('\n' + (CHECK ? 'Se cambiarían' : 'Cambiados') + '. Ahora: npm run i18n:build');
