#!/usr/bin/env node
/**
 * Replaces every style="..." attribute across HTML files with a deterministic
 * utility class (.s-<8-char-hash>), and appends the class definitions to the
 * page's companion .css file. Lets us drop `style-src-attr 'unsafe-inline'`
 * from the CSP without losing any styling.
 *
 * Idempotent: rerunning produces the same hashes and skips classes already
 * present in the CSS.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
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

// Match an opening tag, capturing the bit before `style="..."`, the style value,
// and the bit after. Only matches double-quoted style attrs (we verified there
// are no single-quoted ones in this codebase).
const TAG_WITH_STYLE = /<([a-zA-Z][\w-]*)\b([^>]*?)\sstyle="([^"]*)"([^>]*)>/g;

const summary = [];
let totalReplacements = 0;

for (const file of walk(ROOT)) {
  let html = readFileSync(file, 'utf8');
  const cssPath = file.replace(/\.html$/, '.css');
  if (!existsSync(cssPath)) {
    writeFileSync(cssPath, '/* styles for ' + relative(ROOT, file).replace(/\\/g, '/') + ' */\n', 'utf8');
  }

  const newClasses = new Map(); // className -> declaration
  let fileReplacements = 0;

  // Loop multiple times because a single tag can have several attrs — our
  // regex eats one style="..." per match; we keep going until none remain.
  let prev;
  do {
    prev = html;
    html = html.replace(TAG_WITH_STYLE, (m, tag, pre, decl, post) => {
      const trimmed = decl.trim();
      if (!trimmed) {
        // empty style="" → just strip it
        fileReplacements++;
        return `<${tag}${pre}${post}>`;
      }
      const cls = hashClass(trimmed);
      newClasses.set(cls, trimmed);
      fileReplacements++;

      // Find an existing class attribute in pre or post
      const combined = pre + ' ' + post;
      const cm = combined.match(/\sclass="([^"]*)"/);
      if (cm) {
        const existing = cm[1].split(/\s+/).filter(Boolean);
        if (!existing.includes(cls)) existing.push(cls);
        const newClassAttr = ` class="${existing.join(' ')}"`;
        // Replace the existing class attr in whichever side held it
        const newPre = pre.replace(/\sclass="[^"]*"/, '');
        const newPost = post.replace(/\sclass="[^"]*"/, '');
        // Put the class attr back in pre (consistent position)
        return `<${tag}${newPre}${newClassAttr}${newPost}>`;
      } else {
        return `<${tag}${pre} class="${cls}"${post}>`;
      }
    });
  } while (html !== prev);

  if (fileReplacements > 0) {
    // Append new class definitions to the CSS file (skip ones already there)
    let css = readFileSync(cssPath, 'utf8');
    const newDefs = [];
    for (const [cls, decl] of newClasses) {
      const marker = `.${cls}{`;
      if (!css.includes(marker)) {
        newDefs.push(`.${cls}{${decl}}`);
      }
    }
    if (newDefs.length) {
      const block = `\n/* === utility classes extracted from style="" attributes === */\n${newDefs.join('\n')}\n`;
      css = css.replace(/\s*$/, '') + block;
      writeFileSync(cssPath, css, 'utf8');
    }
    writeFileSync(file, html, 'utf8');
    summary.push(`${relative(ROOT, file).replace(/\\/g, '/')}: ${fileReplacements} style="" → ${newClasses.size} unique classes (${newDefs.length} new in CSS)`);
    totalReplacements += fileReplacements;
  }
}

console.log('\n=== Summary ===');
for (const s of summary) console.log('  ' + s);
console.log(`\nTotal style="" attributes replaced: ${totalReplacements}`);
