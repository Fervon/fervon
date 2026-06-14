// Interim vector OG for /regenta — matches Fervon forge palette.
// Motif: one bright "regent" command ingot holding a controlled arc of
// smaller subordinate ingots by disciplined filaments of light (a fleet
// under command). Replace with the Flux.1 photo (prompt #16) when ready.
//
// Usage: node scripts/gen-og-regenta.mjs  (needs @resvg/resvg-js installed)
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const W = 1200, H = 630;

// Brand palette
const CARBON = '#0E0B0A', CARBON2 = '#16110E';
const BRASA = '#E0480F', EMBER = '#FF6A00', AMBER = '#FFB02E', GOLD = '#FFD37A';

// Command ingot (the "regent") — a long molten bar
const cx = 812, cy = 300, cw = 232, ch = 30;

// Subordinate ingots: shorter molten bars held in a loose arc below-right
const subs = [
  { x: 648, y: 432, w: 132, h: 17, b: 0.78 },
  { x: 772, y: 476, w: 150, h: 17, b: 0.66 },
  { x: 905, y: 452, w: 132, h: 17, b: 0.72 },
  { x: 980, y: 392, w: 118, h: 17, b: 0.60 },
  { x: 928, y: 230, w: 120, h: 17, b: 0.70 },
];

const ingotGlow = (x, y, w, h, rx, op) =>
  `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w * rx}" ry="${h * 3.4}" fill="url(#emberGlow)" opacity="${op}"/>`;

// A molten bar: heat gradient base + bright incandescent core line that
// fades at the ends (reads as glowing metal, not a flat UI card).
const ingot = (x, y, w, h, bright) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="url(#heat)"/>
  <rect x="${x + w * 0.08}" y="${y + h * 0.30}" width="${w * 0.84}" height="${h * 0.34}" rx="${h * 0.17}" fill="url(#core)" opacity="${0.9 * bright}"/>`;

// Filaments: faint organic light-tethers (low opacity, no hard connector look)
const filaments = subs.map((s) => {
  const x1 = cx, y1 = cy + ch / 2;
  const x2 = s.x + s.w / 2, y2 = s.y + s.h / 2;
  const mx = (x1 + x2) / 2 + 18, my = (y1 + y2) / 2 + 30;
  return `
  <path d="M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}" fill="none" stroke="url(#fil)" stroke-width="6" opacity="0.10" stroke-linecap="round"/>
  <path d="M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}" fill="none" stroke="url(#fil)" stroke-width="1.1" opacity="0.34" stroke-linecap="round"/>`;
}).join('');

// Rising sparks (deterministic)
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
let sparks = '';
for (let i = 0; i < 46; i++) {
  const x = 560 + rnd() * 620;
  const y = 70 + rnd() * 460;
  const r = 0.8 + rnd() * 2.6;
  const op = 0.18 + rnd() * 0.6;
  sparks += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="url(#spark)" opacity="${op.toFixed(2)}"/>`;
}

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${CARBON2}"/>
      <stop offset="1" stop-color="${CARBON}"/>
    </linearGradient>
    <radialGradient id="emberGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="${EMBER}" stop-opacity="0.9"/>
      <stop offset="0.45" stop-color="${BRASA}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${BRASA}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="sceneGlow" cx="63%" cy="50%" r="58%">
      <stop offset="0" stop-color="${EMBER}" stop-opacity="0.28"/>
      <stop offset="0.5" stop-color="${BRASA}" stop-opacity="0.10"/>
      <stop offset="1" stop-color="${CARBON}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="heat" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${BRASA}"/>
      <stop offset="0.4" stop-color="${EMBER}"/>
      <stop offset="0.8" stop-color="${AMBER}"/>
      <stop offset="1" stop-color="${GOLD}"/>
    </linearGradient>
    <linearGradient id="core" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${GOLD}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#FFF1D6"/>
      <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fil" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${GOLD}"/>
      <stop offset="1" stop-color="${BRASA}"/>
    </linearGradient>
    <radialGradient id="spark" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="${GOLD}"/>
      <stop offset="1" stop-color="${EMBER}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vig" cx="58%" cy="48%" r="70%">
      <stop offset="0" stop-color="${CARBON}" stop-opacity="0"/>
      <stop offset="0.7" stop-color="${CARBON}" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.72"/>
    </radialGradient>
    <linearGradient id="leftdark" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${CARBON}" stop-opacity="0.92"/>
      <stop offset="0.32" stop-color="${CARBON}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#sceneGlow)"/>

  <!-- command ingot glow + filaments behind ingots -->
  ${ingotGlow(cx - cw / 2, cy, cw, ch, 1.6, 0.9)}
  ${filaments}

  <!-- subordinate ingots -->
  ${subs.map((s) => ingotGlow(s.x, s.y, s.w, s.h, 1.5, 0.55 * s.b) + ingot(s.x, s.y, s.w, s.h, s.b)).join('')}

  <!-- the regent: command ingot -->
  ${ingot(cx - cw / 2, cy, cw, ch, 1)}

  ${sparks}

  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <rect width="${W}" height="${H}" fill="url(#leftdark)"/>
</svg>`;

const resvg = new Resvg(svg, { background: CARBON, fitTo: { mode: 'width', value: W } });
const png = resvg.render().asPng();
const out = join(ROOT, 'assets', 'og-regenta.png');
writeFileSync(out, png);
console.log(`wrote ${out} (${(png.length / 1024).toFixed(1)} KB)`);
