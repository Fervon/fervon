#!/usr/bin/env node
/* ============================================================================
   scripts/fix-pie-landings-trace.mjs
   ----------------------------------------------------------------------------
   Repara el pie de las 14 landings de Trace (7 EN en /trace/<slug> + 7 ES en
   /es/trace/<slug>) y sus 7 fuentes en src-i18n/trace/.

   QUÉ PASÓ. En la fuente, el pie guarda la traducción española dentro de un
   atributo `data-es="…"` con el HTML escapado (&lt; &gt; &quot;). El escapado
   se cortó a mitad, justo en `&lt;img src="` :

     <span data-es="Trace es un proyecto de &lt;a href=&quot;…&quot;&gt;&lt;img
                    src="/assets/logo-icon.svg" height="17" …

   Ese `"` literal CIERRA el atributo antes de tiempo. Todo lo que va detrás lo
   parsea el navegador como atributos nuevos del <span> —de ahí el
   `<span assets="" logo-icon.svg"="">` del HTML publicado— y el resto del
   payload se derrama al documento como TEXTO VISIBLE. Consecuencias medidas en
   producción el 2026-08-19:

     · las 7 páginas EN (las que rankean) enseñaban castellano derramado:
       `fervon · Forjado al rojo vivo">Trace is a project by fervon …`
     · las 7 páginas ES perdían el logo y su enlace a fervon.dev se quedaba sin
       texto de ancla: `<a href="https://fervon.dev"></a>`

   CÓMO SE REPARA. El contenido inglés del <span> sí está bien formado, así que
   es la fuente de verdad: de él se deriva el español traduciendo las dos únicas
   frases variables, y se vuelve a escapar el payload ENTERO.

   Idempotente: ejecutarlo dos veces deja el mismo resultado byte a byte.
   Uso:  node scripts/fix-pie-landings-trace.mjs [--check]
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* El <span> del pie, roto o ya sano, en la FUENTE.
   El ancla `· Forjado al rojo vivo">` aparece una sola vez, así que el
   no-greedy no puede pasarse de largo. */
const SPAN_FUENTE = /<span data-es="Trace es un proyecto de[\s\S]*?· Forjado al rojo vivo">([\s\S]*?)<\/span>/;

/* El <span> en las páginas GENERADAS, corrompido (`<span assets=""…`) o ya sano
   — hace falta reconocer ambos para poder re-normalizarlo sin recorromperlo.

   `[^<]*` entre el `>` y el texto NO es cosmético: es lo que impide que la
   alternativa vacía de `(?: assets=""…)?` enganche el primer <span> del
   documento y `[\s\S]*?` se trague el cuerpo entero hasta el pie. Con `[\s\S]*?`
   ahí, esta misma regex borró el contenido de las 14 landings. */
const SPAN_SALIDA_EN = /<span(?: assets=""[^>]*)?>[^<]*Trace is a project [\s\S]*?<\/span>/;
const SPAN_SALIDA_ES = /<span(?: assets=""[^>]*)?>[^<]*Trace es un proyecto [\s\S]*?<\/span>/;

/* Segunda red, independiente de la regex: el pie mide ~250 caracteres. Si una
   sustitución fuera a tocar mucho más, es que el patrón se desbordó. Abortar. */
const MAX_TRAMO = 700;

/* El pie llegó con dos variantes que no debería tener: «fervon» en minúscula
   (2 de 14) y «project of» (1 de 14). La marca es «Fervon» —así está en el
   JSON-LD y en el pie de las páginas sanas— y la preposición correcta es «by». */
function normalizar(en) {
  return en
    .replace(/^Trace is a project of /, 'Trace is a project by ')
    .replace(/> fervon<\/a>/, '> Fervon</a>');
}

/** Del contenido inglés (bien formado) deriva el español. */
function traducir(en) {
  const es = en
    .replace(/^Trace is a project (?:by|of) /, 'Trace es un proyecto de ')
    .replace(/ · Forged red-hot$/, ' · Forjado al rojo vivo');
  if (es === en || !es.startsWith('Trace es un proyecto de ') || !es.endsWith(' · Forjado al rojo vivo')) {
    throw new Error('el pie inglés no tiene la forma esperada: ' + JSON.stringify(en.slice(0, 120)));
  }
  return es;
}

const slugs = fs.readdirSync(path.join(ROOT, 'src-i18n/trace'))
  .filter((f) => f.endsWith('.html') && f !== 'index.html');

let tocados = 0, yaSanas = 0;
const problemas = [];

for (const slug of slugs) {
  const fuente = path.join(ROOT, 'src-i18n/trace', slug);
  const html = fs.readFileSync(fuente, 'utf8');
  const m = html.match(SPAN_FUENTE);
  if (!m) { problemas.push('sin pie reconocible: src-i18n/trace/' + slug); continue; }

  const en = normalizar(m[1].trim());
  const es = traducir(en);

  // Los tres ficheros que salen de esta fuente, con el <span> que le toca a cada uno.
  const objetivos = [
    { file: fuente,                            re: SPAN_FUENTE,    nuevo: `<span data-es="${esc(es)}">${en}</span>` },
    { file: path.join(ROOT, 'trace', slug),    re: SPAN_SALIDA_EN, nuevo: `<span>${en}</span>` },
    { file: path.join(ROOT, 'es/trace', slug), re: SPAN_SALIDA_ES, nuevo: `<span>${es}</span>` },
  ];

  for (const { file, re, nuevo } of objetivos) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    if (!fs.existsSync(file)) { problemas.push('no existe: ' + rel); continue; }
    const actual = fs.readFileSync(file, 'utf8');
    const hit = actual.match(re);
    if (!hit) { yaSanas++; continue; }
    if (hit[0].length > MAX_TRAMO) {
      console.error(`\n✗ ${rel}: el patrón casó ${hit[0].length} caracteres (máx ${MAX_TRAMO}). ` +
        `Se ha desbordado fuera del pie — no se toca el fichero.`);
      process.exit(1);
    }
    const salida = actual.replace(re, nuevo);
    if (salida === actual) { yaSanas++; continue; }
    if (!CHECK) fs.writeFileSync(file, salida, 'utf8');
    console.log((CHECK ? 'REPARARÍA  ' : 'reparado   ') + rel);
    tocados++;
  }
}

/* Red de seguridad: ni un solo resto del derrame puede quedar publicado. */
const RESTOS = [/<span assets=""/, /Forjado al rojo vivo"&gt;/, /<a href="https:\/\/fervon\.dev"><\/a>/];
const sucias = [];
for (const dir of ['trace', 'es/trace', 'src-i18n/trace']) {
  for (const f of fs.readdirSync(path.join(ROOT, dir)).filter((x) => x.endsWith('.html'))) {
    const p = path.join(ROOT, dir, f);
    const h = fs.readFileSync(p, 'utf8');
    if (RESTOS.some((r) => r.test(h))) sucias.push(dir + '/' + f);
  }
}

console.log('\n' + (CHECK ? 'a reparar' : 'reparados') + ': ' + tocados + '  ·  ya sanos: ' + yaSanas);
for (const p of problemas) console.log('AVISO  ' + p);
// En --check no se ha escrito nada, así que los restos son los que ya había.
if (sucias.length && !CHECK) {
  console.log('\nQUEDAN RESTOS DEL DERRAME en:\n  ' + sucias.join('\n  '));
  process.exit(1);
}
console.log(CHECK ? '\nsin restos del derrame.' : '\nsin restos del derrame. OK.');
