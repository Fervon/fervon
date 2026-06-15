#!/usr/bin/env node
/**
 * Companion to inline-styles-to-classes.mjs.
 *
 * That script removed every literal style="" attribute from the RENDERED HTML.
 * But the bilingual toggle stores the other language's markup inside
 * data-en="…" / data-es="…" attributes, HTML-entity-encoded (style=&quot;…&quot;).
 * Those payloads are injected via innerHTML when the user switches language, so
 * any inline style="" they contain still needs `style-src-attr 'unsafe-inline'`
 * in the CSP. This pass migrates them to the SAME deterministic utility classes
 * (.s-<8-char-hash>) used by their rendered counterparts, letting us drop
 * style-src-attr entirely.
 *
 * Decodes only the three structural entities (&lt; &gt; &quot;) and re-encodes
 * exactly those — &amp; and numeric entities are never touched, so text like
 * "IA local &amp; agentes" round-trips byte-for-byte. Idempotent.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
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

function hashClass(decl) {
  const h = createHash('sha256').update(decl).digest('base64url').slice(0, 8);
  return `s-${h}`;
}

// Same matcher as inline-styles-to-classes.mjs, run on the DECODED payload.
const TAG_WITH_STYLE = /<([a-zA-Z][\w-]*)\b([^>]*?)\sstyle="([^"]*)"([^>]*)>/g;

// Decode/encode ONLY the structural entities. Order matters on decode so we
// don't double-process; &amp; is deliberately left alone.
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
const encode = (s) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// data-en / data-es attribute values (never contain a literal " — it's &quot;).
const DATA_ATTR = /\b(data-(?:en|es))="([^"]*)"/g;

const summary = [];
let totalReplacements = 0;

for (const file of walk(ROOT)) {
  let html = readFileSync(file, 'utf8');
  const cssPath = file.replace(/\.html$/, '.css');
  const newClasses = new Map(); // className -> declaration
  let fileReplacements = 0;

  html = html.replace(DATA_ATTR, (whole, attr, encVal) => {
    let payload = decode(encVal);
    let prev;
    do {
      prev = payload;
      payload = payload.replace(TAG_WITH_STYLE, (m, tag, pre, decl, post) => {
        const trimmed = decl.trim();
        if (!trimmed) {
          fileReplacements++;
          return `<${tag}${pre}${post}>`;
        }
        const cls = hashClass(trimmed);
        newClasses.set(cls, trimmed);
        fileReplacements++;
        const combined = pre + ' ' + post;
        const cm = combined.match(/\sclass="([^"]*)"/);
        if (cm) {
          const existing = cm[1].split(/\s+/).filter(Boolean);
          if (!existing.includes(cls)) existing.push(cls);
          const newPre = pre.replace(/\sclass="[^"]*"/, '');
          const newPost = post.replace(/\sclass="[^"]*"/, '');
          return `<${tag}${newPre} class="${existing.join(' ')}"${newPost}>`;
        }
        return `<${tag}${pre} class="${cls}"${post}>`;
      });
    } while (payload !== prev);
    return `${attr}="${encode(payload)}"`;
  });

  if (fileReplacements > 0) {
    if (!existsSync(cssPath)) {
      writeFileSync(cssPath, '/* styles for ' + relative(ROOT, file).replace(/\\/g, '/') + ' */\n', 'utf8');
    }
    let css = readFileSync(cssPath, 'utf8');
    const newDefs = [];
    for (const [cls, decl] of newClasses) {
      if (!css.includes(`.${cls}{`)) newDefs.push(`.${cls}{${decl}}`);
    }
    if (newDefs.length) {
      const block = `\n/* === utility classes extracted from data-* style="" payloads === */\n${newDefs.join('\n')}\n`;
      css = css.replace(/\s*$/, '') + block;
      writeFileSync(cssPath, css, 'utf8');
    }
    writeFileSync(file, html, 'utf8');
    summary.push(`${relative(ROOT, file).replace(/\\/g, '/')}: ${fileReplacements} style="" in data-* → ${newClasses.size} classes (${newDefs.length} new in CSS)`);
    totalReplacements += fileReplacements;
  }
}

console.log('\n=== Summary ===');
for (const s of summary) console.log('  ' + s);
console.log(`\nTotal data-* style="" attributes replaced: ${totalReplacements}`);
