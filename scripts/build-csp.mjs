#!/usr/bin/env node
/**
 * Extracts inline <style> and non-JSON-LD <script> blocks to external files,
 * computes sha256 hashes of every remaining inline <script> (JSON-LD),
 * and prints the final strict CSP value ready for the Cloudflare Transform Rule.
 *
 * Usage: node scripts/build-csp.mjs
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename, extname, relative } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    if (f === 'node_modules' || f === '.git' || f === '.wrangler' || f === 'scripts') continue;
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
      // hash and keep inline
      const hash = createHash('sha256').update(body, 'utf8').digest('base64');
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

// Cloudflare Web Analytics beacon (script + connect-back).
const CF_INSIGHTS_SCRIPT = 'https://static.cloudflareinsights.com';
const CF_INSIGHTS_CONNECT = 'https://cloudflareinsights.com';

const hashesArr = [...jsonLdHashes].sort();
// Mirrors the live CSP served by the Cloudflare Transform Rule on fervon.dev.
// style-src-attr 'unsafe-inline' was dropped — there are no inline style=""
// attributes left in the HTML (all moved to utility classes), so the policy
// is now fully strict. Paste the output below into the Cloudflare rule.
const csp = [
  "default-src 'none'",
  `script-src 'self' ${hashesArr.join(' ')} ${CF_INSIGHTS_SCRIPT}`.replace(/\s+/g, ' ').trim(),
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self' https://formspree.io ${CF_INSIGHTS_CONNECT}`,
  "form-action 'self' https://formspree.io",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

console.log('\n=== Summary ===');
for (const s of summary) console.log('  ' + s);
console.log(`\nJSON-LD hashes: ${hashesArr.length}`);
console.log('\n=== CSP value for Cloudflare Transform Rule ===\n');
console.log(csp);
console.log();
