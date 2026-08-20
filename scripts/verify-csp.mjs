#!/usr/bin/env node
/**
 * Checks the CSP that fervon.dev actually serves against the pages it actually
 * serves: fetches every URL in the live sitemap, hashes every inline script the
 * origin sends, and reports the ones the policy does not cover.
 *
 * Hashing the local working copy is not enough — a Windows checkout has CRLF
 * while the origin serves the LF blob, which silently shifts every digest.
 * This talks to production, so what it says is what a browser sees.
 *
 * Cloudflare injects its own per-request inline script (challenge platform /
 * JS detections) whose body changes on every response. It can never be hashed;
 * it is reported apart so a real regression is not lost in the noise.
 *
 * Usage: node scripts/verify-csp.mjs
 * Exit code 1 if a page-owned inline script is not covered.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const ORIGIN = process.env.ORIGIN ?? 'https://fervon.dev';
const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const CF_INJECTED = /__CF\$cv\$params|\/cdn-cgi\//;

const bust = () => `cb=${Math.random().toString(36).slice(2)}`;

async function get(url) {
  const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}${bust()}`, {
    headers: { 'user-agent': 'fervon-csp-verifier' },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return { body: await res.text(), headers: res.headers };
}

// Defaults to the policy Cloudflare serves. Point CSP_FILE at a candidate
// (`node scripts/build-csp.mjs > /tmp/csp`) to check it before pasting it in.
const home = await get(`${ORIGIN}/`);
const csp = process.env.CSP_FILE
  ? readFileSync(process.env.CSP_FILE, 'utf8')
  : home.headers.get('content-security-policy');
if (!csp) {
  console.error('No Content-Security-Policy header served. Nothing to verify.');
  process.exit(1);
}

const { body: sitemap } = await get(`${ORIGIN}/sitemap.xml`);
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.log(`CSP: ${csp.length} chars · sitemap: ${urls.length} URLs\n`);

let missing = 0;
let cfInjected = 0;
let jsonLd = 0;

for (const url of urls) {
  let html;
  try {
    ({ body: html } = await get(url));
  } catch (err) {
    console.log(`  !! ${url} — ${err.message}`);
    missing++;
    continue;
  }
  for (const [, attrs, body] of html.matchAll(SCRIPT_RE)) {
    if (/\ssrc\s*=/i.test(attrs)) continue; // external, covered by 'self'
    const hash = `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`;
    if (csp.includes(hash)) continue;
    if (CF_INJECTED.test(body)) {
      cfInjected++;
      continue;
    }
    /* Los <script type="application/ld+json"> son bloques de DATOS, no código:
       el navegador no tiene nada que ejecutar, así que no hay ejecución que
       `script-src` pueda bloquear y no necesitan hash. build-csp.mjs lo dice
       explícitamente («NO se hashean») y este verificador los contaba igual, así
       que declaraba 104 fallos sobre una política CORRECTA — es decir, decía que
       no pegaras una CSP que estaba bien.

       MEDIDO el 2026-08-20 antes de cambiar esto: sirviendo el sitio real con la
       política candidata, 10 páginas con 2-3 bloques ld+json cada una dieron
       CERO violaciones en la consola de Chrome, y los datos estructurados
       seguían presentes y siendo JSON válido en el DOM. Se informan aparte para
       que se vean, pero no cuentan como fallo. */
    if (/ld\+json/i.test(attrs)) {
      jsonLd++;
      continue;
    }
    missing++;
    console.log(`  MISSING  ${url}\n           inline JS, ${body.length} bytes → ${hash}`);
  }
}

if (jsonLd) {
  console.log(`\n${jsonLd} bloque(s) JSON-LD: son datos, no código — no necesitan hash y no cuentan como fallo.`);
}

if (cfInjected) {
  console.log(
    `\n${cfInjected} Cloudflare-injected inline script(s) blocked — per-request body, not hashable.` +
      '\nTurn off JS Detections / Bot Fight Mode in Cloudflare to silence them.'
  );
}

console.log(missing ? `\n${missing} uncovered inline script(s).` : '\nEvery inline script is covered.');
process.exit(missing ? 1 : 0);
