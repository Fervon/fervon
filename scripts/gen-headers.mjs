#!/usr/bin/env node
/**
 * scripts/gen-headers.mjs
 * ────────────────────────────────────────────────────────────────────────────
 * Escribe `_headers` (formato de Cloudflare Pages) a partir de
 * `scripts/site-headers.mjs`, que es la fuente única.
 *
 * MIENTRAS EL DOMINIO SIGA EN GITHUB PAGES ESTE FICHERO NO HACE NADA: GitHub
 * Pages ignora `_headers`. Por eso `.github/workflows/pages.yml` lo excluye de
 * la publicación — si no, se serviría como un .txt cualquiera en /_headers.
 *
 * Uso:  node scripts/gen-headers.mjs [--check]
 *       --check no escribe: sale 1 si `_headers` no coincide con lo generado.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSP, SEGURIDAD, CACHE } from './site-headers.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(ROOT, '_headers');
const soloComprobar = process.argv.includes('--check');

const lineas = [
  '# GENERADO por scripts/gen-headers.mjs — no editar a mano.',
  '# Fuente: scripts/site-headers.mjs · regenerar con `npm run headers:build`.',
  '#',
  '# Sólo lo lee Cloudflare Pages. Con el dominio en GitHub Pages es inerte.',
  '# Al mover el dominio a Pages hay que BORRAR la Transform Rule de la CSP en',
  '# el panel: dos cabeceras CSP se aplican como intersección y bloquean cosas',
  '# en silencio.',
  '',
];

/* El orden importa: en Pages, cuando dos reglas casan con la misma petición y
   ponen la misma cabecera, gana la última. `/*` casa también con /assets/…, así
   que va primero y las reglas de assets lo pisan después. */
const primera = CACHE[0];
lineas.push(primera.ruta);
for (const [k, v] of Object.entries(SEGURIDAD)) lineas.push(`  ${k}: ${v}`);
for (const [k, v] of Object.entries(primera.cabeceras)) lineas.push(`  ${k}: ${v}`);
lineas.push('');

for (const regla of CACHE.slice(1)) {
  lineas.push(regla.ruta);
  for (const [k, v] of Object.entries(regla.cabeceras)) lineas.push(`  ${k}: ${v}`);
  lineas.push('');
}

const salida = lineas.join('\n').replace(/\n+$/, '\n');

if (soloComprobar) {
  const actual = existsSync(DESTINO) ? readFileSync(DESTINO, 'utf8') : '';
  if (actual.replace(/\r\n/g, '\n') !== salida) {
    console.error('✗ _headers no coincide con scripts/site-headers.mjs. Corre `npm run headers:build`.');
    process.exit(1);
  }
  console.log('✔ _headers al día');
  process.exit(0);
}

writeFileSync(DESTINO, salida, 'utf8');
console.log(`✔ _headers escrito (${salida.length} bytes, CSP de ${CSP.length} chars)`);
console.log(salida);
