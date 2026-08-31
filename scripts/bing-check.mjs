/* ============================================================================
   scripts/bing-check.mjs
   ----------------------------------------------------------------------------
   Audita fervon.dev contra las Bing Webmaster Guidelines (las 21 de
   https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a, leídas el
   2026-08-25). Solo se comprueba lo que se puede MEDIR; lo que depende de un
   juicio editorial se deja fuera a propósito en vez de fingir un verde.

   Bing pesa cosas que Google no: el «grounding» —que te citen en Copilot— y la
   eficiencia de rastreo. Por eso aquí hay puntos que en un checklist de Google
   no salen: NOARCHIVE/NOCACHE, ETag, y que el contenido se entienda sin
   contexto externo.

   Uso:  node scripts/bing-check.mjs          contra producción
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://fervon.dev';
const UA_BING = 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)';
const cb = () => '?cb=' + Math.random();

const filas = [];
const anota = (n, titulo, ok, detalle) => filas.push({ n, titulo, ok, detalle });

const pedir = async (ruta, opts = {}) => {
  const r = await fetch(ORIGIN + ruta + cb(), { headers: { 'user-agent': UA_BING }, redirect: 'manual', ...opts });
  return { r, texto: opts.method === 'HEAD' ? '' : await r.text() };
};

/* ── 2 y 4. Descubrimiento: sitemap, IndexNow, enlaces internos ──────────── */
{
  const { r: rs, texto: sm } = await pedir('/sitemap.xml');
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const robots = (await pedir('/robots.txt')).texto;
  anota(2, 'sitemap XML descubrible desde robots.txt',
    rs.status === 200 && /Sitemap:\s*https:\/\/fervon\.dev\/sitemap\.xml/.test(robots),
    `${urls.length} URLs · robots.txt lo declara`);

  const clave = fs.readdirSync(ROOT).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  const rk = clave ? await fetch(`${ORIGIN}/${clave}${cb()}`) : null;
  anota(4, 'IndexNow montado (clave servida)', !!rk && rk.status === 200,
    clave ? `${clave} → ${rk.status}` : 'no hay fichero de clave');
}

/* ── 3. El sitemap: solo canónicas, con lastmod, y freshness por ETag ─────── */
{
  const sm = (await pedir('/sitemap.xml')).texto;
  const bloques = [...sm.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  const sinLastmod = bloques.filter((b) => !/<lastmod>/.test(b)).length;
  anota(3, 'sitemap con lastmod en todas', sinLastmod === 0, `${bloques.length - sinLastmod}/${bloques.length}`);

  /* Bing nombra el ETag como señal de frescura. GitHub Pages lo sirve; conviene
     saberlo porque al migrar a otro alojamiento puede desaparecer. */
  const { r } = await pedir('/', { method: 'HEAD' });
  anota(3, 'ETag / Last-Modified en el HTML', !!(r.headers.get('etag') || r.headers.get('last-modified')),
    `etag:${r.headers.get('etag') ? 'sí' : 'no'} last-modified:${r.headers.get('last-modified') ? 'sí' : 'no'}`);
}

/* ── 8. Bingbot puede rastrear y renderizar ──────────────────────────────── */
{
  const { r, texto } = await pedir('/');
  const robots = (await pedir('/robots.txt')).texto;
  anota(8, 'bingbot NO bloqueado (robots.txt ni borde)',
    r.status === 200 && !/User-agent:\s*bingbot[\s\S]*?Disallow:\s*\//i.test(robots),
    `home → ${r.status}`);
  /* «Hiding critical content behind client-side rendering»: el texto tiene que
     estar en el HTML servido, no aparecer luego por JavaScript. */
  const visible = texto.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  anota(8, 'contenido en el HTML, no tras JavaScript', visible > 300, `${visible} palabras en el HTML servido`);
}

/* ── 10. Directivas que ESTORBAN a Copilot ───────────────────────────────── */
{
  const malas = [];
  for (const ruta of ['/', '/veredicto/', '/blog/', '/trace/', '/about/']) {
    const { texto } = await pedir(ruta);
    for (const d of ['noarchive', 'nocache', 'nosnippet', 'data-nosnippet']) {
      if (new RegExp(`(name="robots"[^>]*content="[^"]*${d}|${d}=)`, 'i').test(texto)) malas.push(`${ruta}:${d}`);
    }
  }
  anota(10, 'sin NOARCHIVE / NOCACHE / NOSNIPPET (limitan la cita en Copilot)',
    malas.length === 0, malas.length ? malas.join(', ') : 'ninguna de las 5 páginas los usa');
}

/* ── 6 y 21. Duplicados y desperdicio de rastreo ─────────────────────────── */
{
  const dup = [];
  for (const [limpia, sucia] of [['/lookspan/', '/lookspan/index.html'], ['/trace/rewind-ai-alternative', '/trace/rewind-ai-alternative.html']]) {
    const a = await fetch(ORIGIN + limpia + cb(), { method: 'HEAD', headers: { 'user-agent': UA_BING }, redirect: 'manual' });
    const b = await fetch(ORIGIN + sucia + cb(), { method: 'HEAD', headers: { 'user-agent': UA_BING }, redirect: 'manual' });
    if (a.status === 200 && b.status === 200) dup.push(`${sucia} da 200 en vez de 301`);
  }
  anota(6, 'una sola URL por contenido (301 en las variantes)', dup.length === 0,
    dup.length ? dup.join(' · ') : 'sin duplicados servidos');
}

/* ── 13. Estructura HTML: title y description, ni cortos ni duplicados ───── */
{
  const sm = (await pedir('/sitemap.xml')).texto;
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const titulos = new Map(), descs = new Map();
  let cortos = 0, sinDesc = 0;
  for (const u of urls) {
    const r = await fetch(u + cb(), { headers: { 'user-agent': UA_BING } });
    const t = await r.text();
    const ti = (t.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1].trim();
    const de = (t.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/) || [, ''])[1];
    if (ti.length < 30) cortos++;
    if (!de) sinDesc++;
    titulos.set(ti, (titulos.get(ti) || 0) + 1);
    descs.set(de, (descs.get(de) || 0) + 1);
  }
  const tDup = [...titulos.values()].filter((n) => n > 1).length;
  const dDup = [...descs.values()].filter((n) => n > 1).length;
  anota(13, 'títulos y descripciones únicos y no cortos',
    cortos === 0 && sinDesc === 0 && tDup === 0 && dDup === 0,
    `${urls.length} URLs · cortos:${cortos} sin desc:${sinDesc} títulos dup:${tDup} descs dup:${dDup}`);
}

/* ── 16. Entidades: nombre y UBICACIÓN, que Bing nombra explícitamente ───── */
{
  const { texto } = await pedir('/about/');
  const ld = [...texto.matchAll(/<script[^>]+ld\+json[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  let org = null;
  for (const raw of ld) {
    try {
      const rec = (o) => {
        if (Array.isArray(o)) return o.forEach(rec);
        if (!o || typeof o !== 'object') return;
        if (/Organization|ProfessionalService/.test([].concat(o['@type'] || []).join())) org = { ...org, ...o };
        if (o['@graph']) rec(o['@graph']);
      };
      rec(JSON.parse(raw));
    } catch {}
  }
  const tieneSitio = !!(org && (org.address || org.areaServed || org.location));
  anota(16, 'entidad con ubicación declarada (address / areaServed)', tieneSitio,
    org ? `address:${org.address ? 'sí' : 'NO'} areaServed:${org.areaServed ? JSON.stringify(org.areaServed).slice(0, 40) : 'NO'}` : 'sin Organization en /about/');
}

/* ── salida ──────────────────────────────────────────────────────────────── */
const mal = filas.filter((f) => !f.ok);
console.log(`\nBing Webmaster Guidelines — ${filas.length} puntos medibles comprobados en producción\n`);
for (const f of filas) console.log(`${f.ok ? '✔' : '✗'} [${String(f.n).padStart(2)}] ${f.titulo.padEnd(52)} ${f.detalle}`);
console.log(mal.length ? `\n✗ ${mal.length} punto(s) sin cumplir.` : '\n✔ Todos los puntos medibles cumplen.');
console.log('\nNO se comprueban aquí, porque son juicio editorial y no una medida:');
console.log('  11 contenido útil · 15 verificable sin contexto · 17 un tema por URL · 18 lo clave arriba · 19 actualizado');
process.exit(mal.length ? 1 : 0);
