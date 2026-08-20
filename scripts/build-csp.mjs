#!/usr/bin/env node
/**
 * Extrae los <style> y los <script> ejecutables inline a ficheros externos, y
 * escribe la CSP lista para la Transform Rule de Cloudflare.
 *
 * ═══ LOS HASHES DE JSON-LD NO HACEN FALTA (medido el 2026-08-14) ═══
 *
 * Durante meses este script generó un hash sha256 por cada bloque
 * <script type="application/ld+json"> — llegaron a ser 88 — y cada cambio de
 * contenido obligaba a volver a pegar a mano una cabecera de 5 KB en
 * Cloudflare. Todo ese trabajo era innecesario.
 *
 * Un <script> con un tipo que no es JavaScript es un DATA BLOCK: el navegador
 * nunca lo "prepara" como script, así que la comprobación de CSP ni siquiera
 * llega a ejecutarse sobre él. COMPROBADO en Chrome con tres políticas
 * (`script-src 'self'` sin hashes, `default-src 'none'` a secas, y sin CSP):
 * en las tres el JSON-LD seguía en el DOM y se parseaba entero, y las únicas
 * violaciones eran de JavaScript ejecutable de verdad. Verificado después
 * sirviendo las 35 páginas reales con la política corta: CSS aplicado,
 * JSON-LD válido, canvas y selector de idioma funcionando, cero errores.
 *
 * Condición para que esto siga siendo cierto: que NO haya JavaScript inline
 * ejecutable. Este script lo comprueba y avisa si aparece alguno.
 *
 * Resultado: la CSP pasa de 5.085 a 333 caracteres y deja de necesitar
 * mantenimiento cada vez que cambia el contenido.
 *
 * Usage: node scripts/build-csp.mjs
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename, extname, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { CSP } from './site-headers.mjs';

const ROOT = process.cwd();

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    if (f === 'node_modules' || f === '.git' || f === '.wrangler' || f === 'scripts' || f === 'src-i18n' || f === '.claude') continue;
    const p = join(dir, f);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}

const STYLE_RE = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

function isJsonLd(attrs) {
  return /type\s*=\s*["']application\/ld\+json["']/i.test(attrs);
}
function hasSrc(attrs) {
  return /\ssrc\s*=/i.test(attrs);
}

const jsonLdHashes = new Set();
const summary = [];

for (const file of walk(ROOT)) {
  let html = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const base = file.slice(0, -extname(file).length); // .../foo (sin .html)
  const baseName = basename(base);
  const baseDir = dirname(file);

  // ---- styles ----
  const styles = [];
  html = html.replace(STYLE_RE, (m, body) => {
    styles.push(body);
    return '<!--__STYLE_PLACEHOLDER__-->';
  });
  if (styles.length) {
    const cssPath = `${base}.css`;
    writeFileSync(cssPath, styles.join('\n\n').trim() + '\n', 'utf8');
    const cssHref = `${baseName}.css`;
    let replaced = false;
    html = html.replace('<!--__STYLE_PLACEHOLDER__-->', () => {
      replaced = true;
      return `<link rel="stylesheet" href="${cssHref}" />`;
    });
    // remove additional placeholders if there were multiple <style> blocks
    html = html.replace(/<!--__STYLE_PLACEHOLDER__-->/g, '');
    summary.push(`${rel}: extracted ${styles.length} <style> → ${relative(ROOT, cssPath).replace(/\\/g, '/')}`);
  }

  // ---- scripts ----
  const scripts = [];
  html = html.replace(SCRIPT_RE, (m, attrs, body) => {
    if (hasSrc(attrs)) return m; // external <script src=...>, leave alone
    if (isJsonLd(attrs)) {
      // Hash and keep inline. The bytes must match what the origin serves, and
      // that is the LF blob from git: a Windows checkout has CRLF, so hashing
      // the working copy verbatim yields a hash the browser never matches and
      // the block gets refused in production. Normalise before digesting.
      const hash = createHash('sha256')
        .update(body.replace(/\r\n/g, '\n'), 'utf8')
        .digest('base64');
      jsonLdHashes.add(`'sha256-${hash}'`);
      return m;
    }
    // inline executable JS → extract
    scripts.push(body);
    return '<!--__SCRIPT_PLACEHOLDER__-->';
  });
  if (scripts.length) {
    const jsPath = `${base}.client.js`;
    writeFileSync(jsPath, scripts.join('\n\n').trim() + '\n', 'utf8');
    const jsHref = `${baseName}.client.js`;
    let replaced = false;
    html = html.replace('<!--__SCRIPT_PLACEHOLDER__-->', () => {
      replaced = true;
      return `<script src="${jsHref}" defer></script>`;
    });
    html = html.replace(/<!--__SCRIPT_PLACEHOLDER__-->/g, '');
    summary.push(`${rel}: extracted ${scripts.length} <script> → ${relative(ROOT, jsPath).replace(/\\/g, '/')}`);
  }

  writeFileSync(file, html, 'utf8');
}

/* Salvaguarda: la política corta sólo es válida mientras no haya JavaScript
   inline ejecutable. Si aparece alguno, hay que externalizarlo o hashearlo. */
let inlineJsRestante = 0;
for (const f of walk(ROOT)) {
  const h = readFileSync(f, 'utf8');
  for (const m of h.matchAll(SCRIPT_RE)) {
    if (hasSrc(m[1]) || isJsonLd(m[1])) continue;
    if (m[2].trim()) inlineJsRestante++;
  }
}

const hashesArr = [...jsonLdHashes].sort();

/* La CSP vive en scripts/site-headers.mjs: es la MISMA que consume
   gen-headers.mjs para escribir el `_headers` de Cloudflare Pages. Antes estaba
   escrita aquí y pegada a mano en el panel, es decir, en dos sitios que no se
   avisan cuando uno cambia. */
const csp = CSP;

console.log('\n=== Summary ===');
for (const s of summary) console.log('  ' + s);
console.log(`\nBloques JSON-LD encontrados: ${hashesArr.length} — NO se hashean (son data blocks; la CSP no los evalúa).`);
if (inlineJsRestante) {
  console.error(`\n⚠ HAY ${inlineJsRestante} SCRIPT(S) INLINE EJECUTABLES. Eso SÍ necesita hash o hay que externalizarlo.`);
}
console.log('\n=== CSP value for Cloudflare Transform Rule ===\n');
console.log(csp);
console.log();
